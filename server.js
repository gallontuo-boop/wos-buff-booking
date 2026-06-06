const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const DATA_FILE = path.join(__dirname, 'data', 'bookings.json');
const SESSION_FILE = path.join(__dirname, 'data', 'sessions.json');

// ─── Admin accounts (change passwords before deploying!) ───────────────────
const ADMIN_ACCOUNTS = {
  admin1: hashPassword('UPAGALLON'),
  admin2: hashPassword('UPAHAN'),
};

function hashPassword(pw) {
  return crypto.createHash('sha256').update(pw + 'wos483salt').digest('hex');
}

// ─── Data helpers ────────────────────────────────────────────────────────────
function loadBookings() {
  if (!fs.existsSync(DATA_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch { return {}; }
}
function saveBookings(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function loadSessions() {
  if (!fs.existsSync(SESSION_FILE)) return {};
  try { return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8')); } catch { return {}; }
}
function saveSessions(data) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
}

// ─── Session middleware ──────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ error: '需要管理員登入' });
  const sessions = loadSessions();
  if (!sessions[token]) return res.status(401).json({ error: 'Token 無效或已過期' });
  req.adminUser = sessions[token].username;
  next();
}

// ─── Player lookup (with correct signing) ────────────────────────────────────
app.post('/api/lookup-player', async (req, res) => {
  const { fid } = req.body;
  if (!fid) return res.status(400).json({ error: 'FID 必填' });

  const secret = 'tB87#kPtkxqOS2';
  const ts = String(Math.floor(Date.now() / 1000));
  const data = { fid: String(fid), time: ts };
  const sortedKeys = Object.keys(data).sort();
  const encoded = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
  const sign = crypto.createHash('md5').update(encoded + secret).digest('hex');

  const body = new URLSearchParams({ fid: String(fid), time: ts, sign }).toString();

  try {
    const response = await fetch('https://wos-giftcode-api.centurygame.com/api/player', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'origin': 'https://wos-giftcode.centurygame.com',
        'referer': 'https://wos-giftcode.centurygame.com/',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36'
      },
      body
    });
    const result = await response.json();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: '無法連接遊戲伺服器', detail: err.message });
  }
});

// ─── Get all bookings ────────────────────────────────────────────────────────
app.get('/api/bookings', (req, res) => {
  res.json(loadBookings());
});

// ─── Create booking ──────────────────────────────────────────────────────────
app.post('/api/bookings', (req, res) => {
  const { slot, buff, name, fid, avatar } = req.body;
  if (slot === undefined || !buff || !name || !fid) {
    return res.status(400).json({ error: '資料不完整' });
  }
  const key = `${slot}_${buff}`;
  const bookings = loadBookings();

  // 同一 FID 在同一欄（同一天）只能填一次
  const fidStr = String(fid);
  const duplicateInSameDay = Object.entries(bookings).some(
    ([k, v]) => k.endsWith(`_${buff}`) && v.fid === fidStr
  );
  if (duplicateInSameDay) {
    return res.status(409).json({
      error: 'Each person can only book once per day. If you made a mistake and need to change, please contact Gallon/Han.'
    });
  }

  if (bookings[key]) return res.status(409).json({ error: '此時段已被預約 / Slot already booked' });
  bookings[key] = { name, fid: fidStr, avatar: avatar || '', bookedAt: new Date().toISOString() };
  saveBookings(bookings);
  res.json({ success: true });
});

// ─── Admin: login ────────────────────────────────────────────────────────────
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  const expected = ADMIN_ACCOUNTS[username];
  if (!expected || expected !== hashPassword(password)) {
    return res.status(401).json({ error: '帳號或密碼錯誤' });
  }
  const token = crypto.randomBytes(32).toString('hex');
  const sessions = loadSessions();
  sessions[token] = { username, loginAt: new Date().toISOString() };
  saveSessions(sessions);
  res.json({ token, username });
});

// ─── Admin: logout ───────────────────────────────────────────────────────────
app.post('/api/admin/logout', requireAdmin, (req, res) => {
  const token = req.headers['x-admin-token'];
  const sessions = loadSessions();
  delete sessions[token];
  saveSessions(sessions);
  res.json({ success: true });
});

// ─── Admin: delete booking ───────────────────────────────────────────────────
app.delete('/api/admin/bookings/:key', requireAdmin, (req, res) => {
  const key = req.params.key;
  const bookings = loadBookings();
  if (!bookings[key]) return res.status(404).json({ error: '預約不存在' });
  delete bookings[key];
  saveBookings(bookings);
  res.json({ success: true });
});

// ─── Admin: get all bookings with detail ────────────────────────────────────
app.get('/api/admin/bookings', requireAdmin, (req, res) => {
  res.json(loadBookings());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ WoS BUFF 預約系統 已啟動: http://localhost:${PORT}`);
  console.log(`🔑 後台管理: http://localhost:${PORT}/admin.html`);
});
