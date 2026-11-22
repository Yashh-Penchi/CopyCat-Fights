// CopyCat Fights - tiny server: serves the game and relays room messages between 2 players.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html'); // optional: if present, the server also serves the game
const rooms = new Map(); // roomName -> Map(id -> {ws, presence})
let nextId = 1;

const server = http.createServer((req, res) => {
  if (req.url === '/health') { res.writeHead(200); return res.end('ok'); }
  fs.readFile(INDEX, (err, data) => {
    if (err) { res.writeHead(200); return res.end('CopyCat Fights server is running.'); }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 16 * 1024 });

function send(ws, obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }

wss.on('connection', (ws) => {
  let room = null, id = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (raw) => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (m.t === 'join' && !room) {
      const name = String(m.room || '').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 48);
      if (!name) return ws.close();
      const r = rooms.get(name) || new Map();
      if (r.size >= 3) { send(ws, { t: 'full' }); return ws.close(); }
      rooms.set(name, r);
      room = name; id = 'p' + (nextId++);
      const peers = {};
      for (const [pid, p] of r) peers[pid] = p.presence;
      r.set(id, { ws, presence: {} });
      send(ws, { t: 'init', id, peers });
      for (const [pid, p] of r) if (pid !== id) send(p.ws, { t: 'p', id, presence: {} });
    } else if (m.t === 'pres' && room) {
      const r = rooms.get(room); if (!r || !r.has(id)) return;
      r.get(id).presence = m.presence || {};
      for (const [pid, p] of r) if (pid !== id) send(p.ws, { t: 'p', id, presence: m.presence });
    }
  });

  ws.on('close', () => {
    if (!room) return;
    const r = rooms.get(room); if (!r) return;
    r.delete(id);
    for (const [, p] of r) send(p.ws, { t: 'bye', id });
    if (r.size === 0) rooms.delete(room);
  });
});

// keep connections alive on hosts that close idle sockets, and drop dead ones
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.isAlive) { ws.terminate(); continue; }
    ws.isAlive = false; ws.ping();
  }
}, 25000);

server.listen(PORT, '0.0.0.0', () => {
  const nets = require('os').networkInterfaces();
  console.log('CopyCat Fights is running.');
  console.log('  On this computer:  http://localhost:' + PORT);
  for (const n of Object.values(nets)) for (const a of n)
    if (a.family === 'IPv4' && !a.internal) console.log('  On your WiFi:      http://' + a.address + ':' + PORT + '   <- open this on phones');
});
