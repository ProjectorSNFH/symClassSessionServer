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
  const { id, password } = req.body;

  // 예시 유저 (실제로는 DB에서 조회)
  const users = [
    { id: "sym03", password: "1234", name: "이재원", role: "NAS" }
  ];

  const user = users.find(u => u.id === id && u.password === password);

  if (user) {
    res.json({
      success: true,
      name: user.name,
      role: user.role
    });
  } else {
    res.status(401).json({
      success: false,
      message: "아이디 또는 비밀번호가 틀렸습니다."
    });
  }
});