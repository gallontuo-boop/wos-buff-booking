# ⚔️ 寒霜啟示錄 State 483 — 準備週 BUFF 預約系統

## 功能說明
- 玩家輸入 FID，自動驗證是否為 State 483 玩家，顯示名字與頭像
- 建築 / 研發 / 練兵 三種 BUFF，同一時段各限一人
- 每天 00:00–24:00，共 48 個 30 分鐘時段，3 天
- 玩家只能預約，**不能刪除他人預約**
- 管理員可登入後台取消任何預約

---

## 🚀 快速啟動（本機測試）

```bash
# 1. 進入專案資料夾
cd wos-buff-booking

# 2. 安裝依賴
npm install

# 3. 修改管理員密碼（見下方說明）

# 4. 啟動伺服器
npm start
```

打開瀏覽器：
- 玩家預約頁：http://localhost:3000
- 管理後台：http://localhost:3000/admin.html

---

## 🔑 修改管理員帳號密碼

打開 `server.js`，找到這段：

```js
const ADMIN_ACCOUNTS = {
  admin1: hashPassword('YourPassword1'),
  admin2: hashPassword('YourPassword2'),
};
```

把 `admin1` / `admin2` 改成你要的帳號名稱，
把 `YourPassword1` / `YourPassword2` 改成你要的密碼。

例如：
```js
const ADMIN_ACCOUNTS = {
  GreatLord: hashPassword('MySecretPass888'),
  CoLeader: hashPassword('CoLeaderPass999'),
};
```

---

## ☁️ 部署到伺服器（推薦：Railway 免費方案）

### 方法一：Railway（最簡單，免費）

1. 前往 https://railway.app 註冊帳號
2. 點 **New Project → Deploy from GitHub repo**
3. 上傳或連結此專案資料夾
4. Railway 會自動偵測 Node.js 並部署
5. 部署完成後會給你一個網址（例如 `https://wos-buff.railway.app`）

### 方法二：Render（免費）

1. 前往 https://render.com 註冊
2. New → Web Service → 連結 GitHub repo
3. Build Command: `npm install`
4. Start Command: `npm start`
5. 部署完成後得到網址

### 方法三：自己的 VPS（Linux）

```bash
# 安裝 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 複製專案到伺服器
scp -r wos-buff-booking user@your-server:/home/user/

# 安裝 PM2（讓服務持續運作）
npm install -g pm2

# 啟動
cd wos-buff-booking
npm install
pm2 start server.js --name wos-buff
pm2 save
pm2 startup
```

---

## 📁 檔案結構

```
wos-buff-booking/
├── server.js          ← 後端伺服器（API + 代理）
├── package.json       ← Node.js 設定
├── data/
│   ├── bookings.json  ← 預約資料（自動產生）
│   └── sessions.json  ← 登入 session（自動產生）
└── public/
    ├── index.html     ← 玩家預約頁面
    └── admin.html     ← 管理員後台
```

---

## ⚠️ 注意事項

- `data/` 資料夾內的 `bookings.json` 就是所有預約資料，部署前確保這個資料夾存在
- 如果要重置預約，直接刪除 `data/bookings.json` 即可
- 密碼修改後需要重新啟動伺服器才生效
# wos-buff-booking
