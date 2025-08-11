const express = require("express");
const session = require("express-session");
const cors = require("cors");
const students = require("./students");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// 로그 기록용 배열
const logs = [];

// 현재 로그인 사용자 추적용 Map (userId -> { name, sessionID })
const userSessions = new Map();

function log(message, sessionID = "") {
  const timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const sessionTag = sessionID ? ` [Session: ${sessionID}]` : "";
  const entry = `[${timestamp}]${sessionTag} ${message}`;
  logs.push(entry);
  console.log(entry);
}

// 세션 설정
// 프록시(예: Render) 뒤에서 동작할 경우 secure 쿠키가 올바르게 설정되게 함
app.set('trust proxy', 1);
app.use(session({
  secret: "sym-class-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 15 * 60 * 1000, // 15분
    sameSite: 'none',
    secure: true
  }
}));

// CORS 설정 (프론트엔드 도메인 허용)
app.use(cors({
  origin: "https://symclassg1c5.onrender.com",
  credentials: true
}));


app.use(express.json());

// 요청마다 세션 갱신
app.use((req, res, next) => {
  if (req.session) {
    req.session._garbage = Date();
    req.session.touch();
  }
  next();
});

// 정기적으로 userSessions 정리 (세션이 없어진 사용자 제거 - 보조용)
setInterval(() => {
  // 이 메커니즘은 단순한 체크이며, production에서는 store-based session 관리 권장
  // 필요하면 sessionStore를 조회해서 userSessions를 정리하도록 확장 가능
}, 60000); // 1분 주기 (비워둠)

// 로그인 API
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = students.find(s => s.id === username && s.password === password);
  if (!user) {
    log(`로그인 시도 : I(${username}) P(${password}) isAccess= False`, req.sessionID);
    return res.status(401).json({ message: "아이디 또는 비밀번호가 틀립니다." });
  }

  if (userSessions.has(user.id)) {
    const old = userSessions.get(user.id);
    const oldSessionID = old.sessionID;
    log(`중복 로그인 시도: ${user.name} (${user.id})`, req.sessionID);

    // 기존 세션을 서버에서 강제 삭제 (비동기)
    if (req.sessionStore && typeof req.sessionStore.destroy === 'function') {
      req.sessionStore.destroy(oldSessionID, (err) => {
        if (err) {
          log(`기존 세션 삭제 실패: ${oldSessionID} (${user.id}) - ${err}`, req.sessionID);
        } else {
          log(`기존 세션 강제 로그아웃: ${user.name} (${user.id})`, oldSessionID);
        }
      });
    }

    userSessions.delete(user.id);
    return res.status(403).json({ blocked: true });
  }

  req.session.user = {
    name: user.name,
    number: user.number,
    role: user.role,
    id: user.id,
  };
  // 로그인 시 userSessions에 추가 (userId -> { name, sessionID })
  userSessions.set(user.id, { name: user.name, sessionID: req.sessionID });

  log(`로그인 시도 : I(${username}) P(${password}) isAccess= True`, req.sessionID);
  res.json({ success: true, name: user.name, number: user.number, role: user.role });
});

// 로그아웃 API
app.post("/logout", (req, res) => {
  if (req.session.user) {
    // 로그아웃 시 userSessions에서 제거
    userSessions.delete(req.session.user.id);
    log(`로그아웃: ${req.session.user.name} (${req.session.user.id})`, req.sessionID);
  }
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// 현재 로그인된 사용자 정보
app.get("/me", (req, res) => {
  if (req.session && req.session.user) {
    // 서버 재시작 등으로 userSessions에 항목이 없을 수 있으므로 복구해 둠
    if (!userSessions.has(req.session.user.id)) {
      userSessions.set(req.session.user.id, { name: req.session.user.name, sessionID: req.sessionID });
      log(`세션 복구: ${req.session.user.name} (${req.session.user.id})`, req.sessionID);
    }
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// 로그 출력
app.get("/log", (req, res) => {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.send(logs.join("\n"));
});

// 관리자용 루트 페이지 제공
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>SessionServer 관리자 도구</title>
      <style>
        body { font-family: sans-serif; padding: 2em; }
        input[type="text"] { width: 200px; padding: 5px; font-size: 1em; }
        pre { margin-top: 1em; background: #f0f0f0; padding: 1em; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h2>관리자 명령어 실행</h2>
      <input type="text" id="cmdInput" placeholder="명령어 입력 후 Enter" />
      <pre id="output"></pre>

      <script>
        const input = document.getElementById('cmdInput');
        const output = document.getElementById('output');

        input.addEventListener('keydown', async (e) => {
          if (e.key === 'Enter') {
            const command = input.value.trim().toLowerCase();
            input.value = '';
            if (command === 'users') {
              const res = await fetch('/current-users');
              const text = await res.text();
              output.textContent = text;
            } else if (command === 'log') {
              output.textContent = '로그 준비 중입니다.';
            }  else {
              output.textContent = '지원하지 않는 명령어입니다.';
            }
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.get("/current-users", (req, res) => {
  if (userSessions.size === 0) {
    res.send("현재 로그인한 사용자가 없습니다.");
  } else {
    const list = Array.from(userSessions.entries())
      .map(([id, info]) => `• ${info.name} (${id}) [Session: ${info.sessionID}]`)
      .join("\n");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.send("현재 로그인 사용자 목록:\n" + list);
  }
});

app.listen(PORT, () => {
  console.log(`SessionServer is running on port ${PORT}`);
  log("서버 시작됨");
});