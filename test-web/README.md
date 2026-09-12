# 🎵 Listen-X Stream — Futuristic 320kbps Online Music Player & Smart Radio

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Render-Deploy%20Ready-46E3B7?style=for-the-badge&logo=render&logoColor=black" alt="Render" />
  <img src="https://img.shields.io/badge/Audio-320_kbps_HD-00f0ff?style=for-the-badge&logo=soundcharts&logoColor=black" alt="320kbps" />
  <img src="https://img.shields.io/badge/Dependencies-Zero-purple?style=for-the-badge" alt="Zero Dependencies" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
</p>

---

## 🌟 Overview

**Listen-X Stream** ek high-performance, lightweight aur futuristic online music streaming web player hai. Ye **80+ Million songs** (Bollywood, Punjabi, Haryanvi, Pop, Indie, International) ko **320 kbps High-Definition audio** me stream aur download karne ki facility deta hai — wo bhi **bina kisi external npm package ya paid API ke (Zero External Dependencies)**!

Built with **Pure Vanilla Node.js**, **Pure JavaScript DES Decryption**, aur **Glassmorphic Cyberpunk UI**.

---

## ✨ Features Highlight

- 🎨 **Smart Taste Onboarding**:
  - First-time user onboarding modal jisme user apni favorite languages (Hindi, Haryanvi, Punjabi, English, Bhojpuri, South) select karta hai.
  - Languages select karte hi **favorite singers dynamic load** hote hain.
  - Preferences `localStorage` me save ho jati hain aur home screen par **"✨ Made For You"** customized feed create karti hain.
- 🧠 **Context-Aware Smart Autoplay (Song Radio)**:
  - Gaana khatam hone par agla gaana usi **vibe, artist aur language** ka auto-play hota hai (e.g. Masoom Sharma ke baad Haryanvi hit, Arijit ke baad soulful romantic track).
  - Player bar me 1-click **"🧠 Smart: ON / OFF"** toggle switch.
- ⚡ **True 320 kbps High-Bitrate Audio**:
  - Direct high-speed CDN audio streaming with real-time bitrate switcher (320 kbps HD / 160 kbps / 96 kbps).
- ⬇️ **Direct 1-Click Audio Downloads**:
  - Har song card par aur player bar me direct download button.
  - Automatic clean filename: `[Title] - [Artist].m4a` straight to Downloads folder.
- 📜 **Endless Infinite Scroll**:
  - Scroll down karte hi agle 24-24 tracks background me smoothly append ho jate hain bina current audio playback roke.
- 🔀 **Dynamic Smart Shuffle**:
  - Har refresh aur "🔀 Shuffle Mix" tap karne par randomized seed queries aur Fisher-Yates array shuffling se naye gaane load hote hain.
- ❤️ **Liked Songs Playlist**:
  - 1-tap heart button jo user ke favorited tracks ko save karke alag dedicated playlist banata hai.
- 🔍 **API Inspector Modal**:
  - Har track ka live JSON data inspect karein taaki ise Android app (ExoPlayer) me add karna asaan ho.

---

## 🚀 How to Deploy on Render.com (100% Free)

Ye project **Render.com** ke liye completely pre-configured hai (includes `render.yaml` Blueprint).

### Step-by-Step Deployment:

1. **GitHub par Repository Banayein**:
   - Is `test-web` folder ke contents ko apne GitHub account par naye repo me push karein (e.g. `listen-x-web`).
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Listen-X Stream"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/listen-x-web.git
   git push -u origin main
   ```

2. **Render.com par Jayein**:
   - [Render Dashboard](https://dashboard.render.com/) me login karein.
   - Top right me **"New +"** par click karein aur **"Web Service"** choose karein.

3. **GitHub Repository Connect Karein**:
   - Apne GitHub repo (`listen-x-web`) ko select karein aur **"Connect"** dabayein.

4. **Service Settings Verify Karein**:
   - Render automatically `render.yaml` detect kar lega. Agar manual set karna ho:
     - **Name**: `listen-x-stream`
     - **Region**: Singapore ya Frankfurt (or nearest)
     - **Branch**: `main`
     - **Runtime**: `Node`
     - **Build Command**: `npm install` *(kuch install nahi hota, 2 second me build hoga)*
     - **Start Command**: `npm start` *(or `node server.js`)*
     - **Instance Type**: `Free`

5. **Deploy Karein**:
   - **"Create Web Service"** par click karein.
   - 1 minute ke andar Render aapko ek live HTTPS link de dega:
     👉 **`https://listen-x-stream.onrender.com`**

---

## 💻 Run Locally (Local Machine par Kaise Chalayein)

### Prerequisites:
- Node.js (v18 ya v20+) installed hona chahiye.

### Quick Start:
1. Terminal me folder open karein:
   ```bash
   cd test-web
   npm start
   ```
   *(Windows user simply `start_test_web.bat` par double-click kar sakte hain).*

2. Browser me open karein:
   ```
   http://localhost:3000
   ```

---

## 📂 Project Structure

```
listen-x-web/
├── public/
│   ├── index.html        # Futuristic Glassmorphic UI & Modals
│   ├── style.css         # Neon Cyan Cyberpunk Dark Glass Theme
│   ├── app.js            # Core Player Engine, Taste Learner & Smart Radio
│   └── _redirects        # Optional Netlify/Cloudflare route handler
├── netlify/
│   └── functions/
│       └── api.js        # Optional Netlify Serverless adapter
├── server.js             # High-Speed Standalone Node Server & DES Decryptor
├── render.yaml           # Render.com Infrastructure Blueprint
├── vercel.json           # Vercel Serverless Routing Config
├── package.json          # Node Manifest & Start Script
├── .gitignore            # Git exclusion rules
├── start_test_web.bat    # 1-Click Windows Launcher
└── README.md             # Project Documentation
```

---

## 📱 Android Integration Note (Listen-X App)

Is website me use hone wala JSON response direct Android me pass hota hai:
```kotlin
// Android ExoPlayer direct streaming:
val mediaItem = MediaItem.fromUri(song.stream_url_320)
exoPlayer.setMediaItem(mediaItem)
exoPlayer.prepare()
exoPlayer.play()
```

---

## 📜 License
MIT License © Listen-X Team
