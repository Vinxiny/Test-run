# Abyss Clover – Descent (Upgraded)

**Co-op anime-style action adventure into Hell.**  
Retrieve the Absolute Grimoire with friends over local Wi-Fi.

### Upgrade Notes (v1.1)
- Fixed invisible powers — every skill now shows bright glowing projectiles + cast flash
- Atmospheric Abyss environment (darker + dramatic but fully readable)
- Stronger emissive crystals, rising embers, better contrast so powers pop
- Character run / idle animation (arm swing + bob)
- Overall visual feedback and “game feel” heavily improved

## Features

- 1–5 players, pure local Wi-Fi (WebRTC DataChannels, no paid servers)
- Anime-style characters with floating name tags
- Unique magic attributes + **power synergies** when allies are near
- Speed differences per magic (Lightning & Wind are fastest)
- Designated Healer role
- Captain Ryo (Yami-inspired) guides and assists
- Boastful enemies that summon minions
- Difficulty ramps deeper into the underworld
- Full team wipe = restart
- Dual camera (Isometric / Third-person) – switch anytime
- Cool SFX + enemy/Ryo taunt lines
- Real installable PWA (iPhone + Android)
- Completely free

## Project Structure (GitHub ready)

```
abyss-clover/
├── index.html          ← main entry
├── manifest.json       ← PWA manifest
├── sw.js               ← service worker (offline)
├── README.md
├── css/
│   └── style.css
├── js/
│   ├── main.js         ← UI, lobby, input
│   ├── game.js         ← Three.js renderer + camera
│   ├── entities.js     ← Player, Enemy, Ryo, Projectiles
│   ├── world.js        ← levels, spawning, waves
│   ├── magics.js       ← all magic definitions + synergies
│   ├── network.js      ← WebRTC host/join + state sync
│   └── audio.js        ← Web Audio SFX + voice patterns
└── assets/
    ├── icon-192.png
    └── icon-512.png
```

## How multi-device “see each other” works

1. Host clicks **CREATE CONNECTION CODE** → long code appears.
2. Host copies the code and sends it to friends (WhatsApp, AirDrop, etc.).
3. Friend pastes the code and clicks **I HAVE A CODE – GENERATE ANSWER**.
4. Friend copies the new answer code and sends it back to Host.
5. Host pastes the answer and clicks **ACCEPT ANSWER**.
6. Both appear in the lobby with name tags. When the game starts you see each other moving live.

(Same Wi-Fi required. No internet needed after the page has loaded.)

You can also use **ADD AI TEAMMATE** to instantly feel multiplayer on one device.

---

## Mistake-free GitHub + Vercel Deploy Guide

### 1. Create the GitHub repository

1. Go to https://github.com/new
2. Repository name: `abyss-clover` (or any name)
3. Leave it **Public**
4. **Do NOT** check “Add a README” (we already have one)
5. Click **Create repository**

### 2. Upload the files

**Easiest method (no Git knowledge needed):**

1. On the new empty repo page click **uploading an existing file**
2. Drag the **entire contents** of the `abyss-clover` folder  
   (index.html, css/, js/, assets/, manifest.json, sw.js, README.md)
3. Commit message: `Initial commit – Abyss Clover`
4. Click **Commit changes**

**Or with Git (if you prefer):**

```bash
cd abyss-clover
git init
git add .
git commit -m "Initial commit – Abyss Clover"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/abyss-clover.git
git push -u origin main
```

### 3. Deploy on Vercel (free)

1. Go to https://vercel.com and sign in with your **GitHub** account
2. Click **Add New… → Project**
3. Import the `abyss-clover` repository
4. Leave all settings default (Framework Preset: Other / no build command needed)
5. Click **Deploy**
6. Wait ~30 seconds → you get a live URL like `https://abyss-clover.vercel.app`

### 4. Play on phones

1. Open the Vercel URL on every phone
2. On iPhone: Share → **Add to Home Screen**
3. On Android: Menu → **Install app** / Add to Home Screen
4. One person Hosts, others Join with the connection codes as described above

### Common mistakes to avoid

- Do **not** put the files inside another folder on GitHub (index.html must be at the root of the repo)
- Do **not** change the folder names (css, js, assets)
- After first deploy, wait 10–20 seconds before testing the PWA install
- All players must be on the **same Wi-Fi** for the WebRTC connection

That’s it. Completely free forever.

---

Enjoy the descent.  
Use your synergies. Stay alive. Retrieve the Absolute Grimoire.
