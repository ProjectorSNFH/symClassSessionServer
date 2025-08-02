const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const students = require("./students");

const app = express();
const PORT = process.env.PORT || 3001;

// 로그 파일 경로
const LOG_FILE = path.join(__dirname, "log.txt");

// 로그 함수
function writeLog(message) {
  const time = new Date().toLocaleString("ko-KR");
  fs.appendFileSync(LOG_FILE, `[${time}] ${message}\n`);
}

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: "sym-class-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 15 * 60 * 1000 } // 15분
}));

// CORS 허용 (클라이언트가 다른 포트에서 접근 시 필요)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // 필요시 '*' 대신 origin 제한
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  next();
});


// ✅ 로그인 처리
app.post("/login", (req, res) => {
  const { id, password } = req.body;

  const student = students.find(s => s.id === id && s.password === password);
  if (!student) {
    writeLog(`❌ 로그인 실패: ID=${id}`);
    return res.status(401).json({ success: false, message: "아이디 또는 비밀번호가 틀립니다." });
  }

  // 세션에 사용자 정보 저장
  req.session.user = {
    number: student.number,
    name: student.name,
    role: student.role,
    id: student.id
  };

  writeLog(`✅ 로그인 성공: ${student.name} (${student.id})`);
  res.json({ success: true, message: "로그인 성공", user: req.session.user });
});

// ✅ 로그아웃 처리
app.post("/logout", (req, res) => {
  if (req.session.user) {
    writeLog(`👋 로그아웃: ${req.session.user.name} (${req.session.user.id})`);
  }

  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true, message: "로그아웃 완료" });
  });
});

// ✅ 세션 확인
app.get("/session", (req, res) => {
  if (req.session.user) {
    res.json({ loggedIn: true, user: req.session.user });
  } else {
    res.json({ loggedIn: false });
  }
});

// ✅ 로그 확인
app.get("/log", (req, res) => {
  if (!fs.existsSync(LOG_FILE)) {
    return res.send("로그 파일 없음");
  }
  const content = fs.readFileSync(LOG_FILE, "utf-8");
  res.send(`<pre>${content}</pre>`);
});

// ✅ 기본 페이지 (테스트용)
app.get("/", (req, res) => {
  res.send("symClass 서버가 실행 중입니다.");
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${PORT}`);
});