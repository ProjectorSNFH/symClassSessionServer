// server.js
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');
const students = require('./students');

const app = express();
const PORT = process.env.PORT || 3000;

// server.js 안에서만 사용
const cors = require('cors');

app.use(cors({
  origin: 'https://symclasswebstatic.onrender.com', // 네 사이트 주소
  credentials: true
}));

// 로그 파일 경로
const logFile = path.join(__dirname, 'sessionLogs.txt');

// 미들웨어
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
  secret: 'symClassSecretKey',  // 보안을 위해 .env 파일로 추출 가능
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 15 * 60 * 1000 }  // 15분
}));

// 로그 저장 함수
function writeLog(message) {
  const timestamp = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const fullMessage = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, fullMessage);
  console.log(fullMessage.trim());
}

// 🔐 로그인 엔드포인트
app.post('/login', (req, res) => {
  const { id, password } = req.body;
  const sessionId = req.sessionID;

  const user = students.find(u => u.id === id && u.password === password);

  // 로그에 세션ID, 입력된 ID/PW, 로그인 성공 여부 기록
  writeLog(
    `🔐 로그인 시도: 세션=${sessionId}, 입력 ID=${id}, PW=${password}, 결과=${user ? '✅ 성공' : '❌ 실패'}`
  );

  if (user) {
    req.session.user = {
      id: user.id,
      name: user.name,
      number: user.number,
      role: user.role
    };
    res.status(200).json({ success: true, user: req.session.user });
  } else {
    res.status(401).send({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
  }
});

// 🔓 로그아웃 엔드포인트
app.post('/logout', (req, res) => {
  if (req.session.user) {
    writeLog(`🔓 로그아웃: ${req.session.user.name} (${req.session.user.id})`);
  }
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.send({ success: true });
  });
});

// 🧾 로그 보기 엔드포인트
app.get('/log', (req, res) => {
  try {
    const logs = fs.readFileSync(logFile, 'utf-8');
    res.type('text').send(logs);
  } catch (err) {
    res.status(500).send('로그를 불러올 수 없습니다.');
  }
});

// 🔍 로그인된 사용자 정보 가져오기
app.get('/me', (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
});

app.listen(PORT, () => {
  console.log(`✅ SessionServer 실행 중 (PORT: ${PORT})`);
  writeLog(`🟢 SessionServer 시작됨`);
});