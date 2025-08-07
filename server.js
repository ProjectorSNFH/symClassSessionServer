const express = require("express");
const session = require("express-session");
const cors = require("cors");
const students = require("./students");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

// 로그 기록용 배열
const logs = [];

function log(message) {
  const timestamp = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  const entry = `[${timestamp}] ${message}`;
  logs.push(entry);
  console.log(entry);
}

// 세션 설정
app.use(session({
  secret: "sym-class-secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 15 * 60 * 1000, // 15분
  }
}));

// CORS 설정 (프론트엔드 도메인 허용)
app.use(cors({
  origin: "https://symclassg1c5.onrender.com",
  credentials: true
}));

app.use(express.json());

// 로그인 API
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const user = students.find(s => s.id === username && s.password === password);
  if (!user) {
    log(`로그인 실패 (ID: ${username})`);
    return res.status(401).json({ message: "아이디 또는 비밀번호가 틀립니다." });
  }

  req.session.user = {
    name: user.name,
    number: user.number,
    role: user.role,
    id: user.id,
  };

  log(`로그인 성공: ${user.name} (${user.id})`);
  res.json({ success: true, name: user.name, number: user.number, role: user.role });
});

// 로그아웃 API
app.post("/logout", (req, res) => {
  if (req.session.user) {
    log(`로그아웃: ${req.session.user.name} (${req.session.user.id})`);
  }
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// 현재 로그인된 사용자 정보
app.get("/me", (req, res) => {
  if (req.session.user) {
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

app.listen(PORT, () => {
  console.log(`SessionServer is running on port ${PORT}`);
  log("서버 시작됨");
});