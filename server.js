// server.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("symClass Node 서버 작동 중!");
});

// 앞으로 여기에 /login, /getBoard, /getData 등 API 추가

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 예: DB에서 사용자 검증 (지금은 하드코딩 예시)
  if (username === 'sym03' && password === '1234') {
    // 로그인 성공: 대시보드로 리디렉션
    res.redirect('/Dashboard.html');
  } else {
    // 로그인 실패: 다시 로그인 화면으로
    res.redirect('/Locked.html');
  }
});