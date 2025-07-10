const express = require("express");
const cors = require("cors");
const session = require("express-session");
const app = express();
const PORT = process.env.PORT || 3000;

const students = require("./students"); // 학생 DB 불러오기

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: "symclass-secret-key",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 60 * 1000 // 30분
  }
}));

app.get("/", (req, res) => {
  res.send("symClass Node 서버 작동 중!");
});

// 로그인
app.post("/login", (req, res) => {
  const { id, password } = req.body;
  const user = students.find(u => u.id === id && u.password === password);

  if (user) {
    req.session.user = {
      name: user.name,
      role: user.role,
      number: user.number,
      id: user.id
    };
    res.json({
      success: true,
      name: user.name,
      role: user.role,
      number: user.number
    });
  } else {
    res.status(401).json({
      success: false,
      message: "아이디 또는 비밀번호가 틀렸습니다."
    });
  }
});

// 로그인 상태 확인
app.get("/me", (req, res) => {
  if (req.session.user) {
    res.json({
      loggedIn: true,
      user: req.session.user
    });
  } else {
    res.status(401).json({
      loggedIn: false,
      message: "로그인 필요"
    });
  }
});

// 로그아웃
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});