const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

const students = require("./students"); // 학생 DB 불러오기

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("symClass Node 서버 작동 중!");
});

app.post("/login", (req, res) => {
  const { id, password } = req.body;

  const user = students.find(u => u.id === id && u.password === password);

  if (user) {
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

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});