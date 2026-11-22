# CopyCat Fights online - how to deploy

Two parts:
1. `frontend/`  = the game page (static). Host on Vercel (free).
2. `server/`    = a tiny WebSocket server that passes messages between the two players (no database, rooms live in memory). Host on Render / Railway / Fly.io (free tiers). Vercel cannot run it, because Vercel does not keep WebSocket connections open.

## Step 1: deploy the server (Render, free)
1. Put the `server` folder in a GitHub repo (the folder must contain server.js and package.json at its top level).
2. render.com > New > Web Service > pick the repo.
   - Build command: `npm install`
   - Start command: `npm start`
   - Region: Singapore (good for India)
3. After deploy you get an address like `copycat-server.onrender.com`. Opening it should show "CopyCat Fights server is running."
   (Free plan sleeps when idle. The first connection after a break can take ~30 seconds.)

## Step 2: point the game at the server
Open `frontend/index.html`, find this line near the bottom (search for CC_SERVER):

    window.CC_SERVER='';

and put your Render address in it:

    window.CC_SERVER='copycat-server.onrender.com';

## Step 3: deploy the game on Vercel
Put the `frontend` folder in a GitHub repo (or run `npx vercel` inside it). Framework preset: "Other". No build command, no environment variables. You get `https://your-game.vercel.app`.

## Play
Player 1 opens the Vercel link > Play a friend online > Create room > Invite on WhatsApp (or share the 4-letter code).
Player 2 opens the link (or the invite link) > Join room > code.
Landscape works best on phones.

## Same WiFi only (no hosting)
Run the server on your PC: in `server`, copy `frontend/index.html` next to server.js, then `npm install` and `npm start`. It prints an address for your WiFi; open it on both phones.
