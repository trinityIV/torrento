#!/usr/bin/env node

const WebTorrent = require('webtorrent');
const yargs = require('yargs');
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;
const DOWNLOAD_DIR = './downloads';

const client = new WebTorrent();

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

app.use(express.urlencoded({ extended: true }));

const downloads = {}; // Pour suivre la progression par id

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now();
}

app.use(express.json());
app.use('/downloads', express.static(path.resolve(DOWNLOAD_DIR)));

// Page web Trinity style hacking avec options
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Trinity - Hack Memory Torrent</title>
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
      <style>
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        body {
          min-height: 100vh;
          background: #0f2027;
          background: linear-gradient(135deg, #0f2027 0%, #2c5364 100%);
          overflow: hidden;
          position: relative;
        }
        /* Animated cyber grid background */
        .cyber-bg {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          z-index: 0;
          pointer-events: none;
        }
        .cyber-bg canvas {
          width: 100vw;
          height: 100vh;
          display: block;
        }
        /* Container */
        .container {
          position: relative;
          z-index: 2;
          max-width: 480px;
          margin: 70px auto 0 auto;
          background: rgba(10, 20, 30, 0.92);
          border: 2.5px solid #00fff7;
          border-radius: 18px;
          box-shadow: 0 0 40px #00fff7cc, 0 0 120px #ff00cc33 inset;
          padding: 38px 32px 28px 32px;
          backdrop-filter: blur(2px);
          animation: neon-flicker 2.5s infinite alternate;
        }
        @keyframes neon-flicker {
          0% { box-shadow: 0 0 40px #00fff7cc, 0 0 120px #ff00cc33 inset; }
          50% { box-shadow: 0 0 60px #00fff7, 0 0 180px #ff00cc55 inset; }
          100% { box-shadow: 0 0 40px #00fff7cc, 0 0 120px #ff00cc33 inset; }
        }
        /* Glitch effect for title */
        .glitch {
          color: #00fff7;
          font-family: 'Share Tech Mono', monospace;
          font-size: 2.7em;
          letter-spacing: 3px;
          text-align: center;
          position: relative;
          margin-bottom: 8px;
          text-shadow: 0 0 8px #00fff7, 0 0 24px #ff00cc;
          animation: glitch 1.2s infinite linear alternate-reverse;
        }
        .glitch:before, .glitch:after {
          content: attr(data-text);
          position: absolute;
          left: 0; width: 100%; top: 0;
          opacity: 0.7;
        }
        .glitch:before {
          color: #ff00cc;
          z-index: -1;
          animation: glitchTop 1.2s infinite linear alternate-reverse;
        }
        .glitch:after {
          color: #00fff7;
          z-index: -2;
          animation: glitchBot 1.2s infinite linear alternate-reverse;
        }
        @keyframes glitch {
          0% { transform: none; }
          20% { transform: skewX(8deg); }
          40% { transform: skewX(-5deg); }
          60% { transform: skewX(3deg); }
          80% { transform: skewX(-2deg); }
          100% { transform: none; }
        }
        @keyframes glitchTop {
          0% { clip-path: inset(0 0 80% 0); transform: translate(-2px, -2px);}
          50% { clip-path: inset(0 0 60% 0); transform: translate(2px, 2px);}
          100% { clip-path: inset(0 0 80% 0); transform: translate(-2px, -2px);}
        }
        @keyframes glitchBot {
          0% { clip-path: inset(80% 0 0 0); transform: translate(2px, 2px);}
          50% { clip-path: inset(60% 0 0 0); transform: translate(-2px, -2px);}
          100% { clip-path: inset(80% 0 0 0); transform: translate(2px, 2px);}
        }
        .subtitle {
          text-align: center;
          color: #fff;
          margin-bottom: 32px;
          font-size: 1.15em;
          letter-spacing: 1px;
          text-shadow: 0 0 8px #00fff7cc;
          font-family: 'Share Tech Mono', monospace;
        }
        label, input, button, select {
          font-family: 'Share Tech Mono', monospace;
          font-size: 1em;
        }
        input[type="text"], input[type="file"], select {
          background: #181c1f;
          color: #00fff7;
          border: 1.5px solid #ff00cc;
          border-radius: 6px;
          padding: 10px;
          width: 100%;
          margin-bottom: 18px;
          outline: none;
          box-shadow: 0 0 8px #00fff722;
          transition: border 0.2s, box-shadow 0.2s;
        }
        input[type="text"]:focus, input[type="file"]:focus, select:focus {
          border-color: #00fff7;
          box-shadow: 0 0 16px #00fff7cc;
        }
        button {
          background: linear-gradient(90deg, #00fff7 0%, #ff00cc 100%);
          color: #181c1f;
          border: none;
          border-radius: 6px;
          padding: 10px 22px;
          cursor: pointer;
          font-weight: bold;
          letter-spacing: 1px;
          box-shadow: 0 0 16px #00fff7cc;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s;
          margin-top: 4px;
          text-shadow: 0 0 4px #ff00cc;
          animation: btn-glow 2s infinite alternate;
        }
        button:hover {
          background: linear-gradient(90deg, #ff00cc 0%, #00fff7 100%);
          color: #fff;
          box-shadow: 0 0 32px #ff00cc99;
        }
        @keyframes btn-glow {
          0% { box-shadow: 0 0 16px #00fff7cc; }
          100% { box-shadow: 0 0 32px #ff00cc99; }
        }
        form {
          margin-bottom: 22px;
        }
        .footer {
          text-align: center;
          color: #fff;
          margin-top: 22px;
          font-size: 1.05em;
          opacity: 0.8;
          letter-spacing: 1px;
          text-shadow: 0 0 8px #00fff7cc;
        }
        ::selection {
          background: #ff00cc;
          color: #fff;
        }
        /* Terminal animation */
        .terminal {
          background: #181c1f;
          color: #00fff7;
          border: 1.5px solid #00fff7;
          border-radius: 6px;
          padding: 14px 18px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 1.05em;
          margin-bottom: 18px;
          box-shadow: 0 0 12px #00fff744;
          min-height: 32px;
          animation: terminal-blink 1.2s infinite steps(2, start);
        }
        @keyframes terminal-blink {
          0%, 100% { border-color: #00fff7; }
          50% { border-color: #ff00cc; }
        }
        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; background: #181c1f; }
        ::-webkit-scrollbar-thumb { background: #00fff7; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="cyber-bg"><canvas id="cyberCanvas"></canvas></div>
      <div class="container">
        <div class="glitch" data-text="Trinity">Trinity</div>
        <div class="subtitle">Game Hacking Crack Loader<br><span style="color:#ff00cc;">Hack Memory Edition</span></div>
        <form method="POST" action="/add-magnet">
          <label for="magnet">Lien magnet :</label>
          <input type="text" name="magnet" id="magnet" placeholder="magnet:?xt=..." required>
          <label for="dest">Répertoire de destination :</label>
          <input type="text" name="dest" id="dest" placeholder="downloads (défaut)" />
          <label for="mode">Mode :</label>
          <select name="mode" id="mode">
            <option value="server">Télécharger sur ce serveur</option>
            <option value="client">Préparer un lien de téléchargement direct</option>
          </select>
          <button type="submit">&#x1F50E; Injecter Magnet</button>
        </form>
        <form method="POST" action="/upload-torrent" enctype="multipart/form-data">
          <label for="torrentfile">Fichier .torrent :</label>
          <input type="file" name="torrentfile" id="torrentfile" accept=".torrent" required>
          <label for="dest2">Répertoire de destination :</label>
          <input type="text" name="dest" id="dest2" placeholder="downloads (défaut)" />
          <label for="mode2">Mode :</label>
          <select name="mode" id="mode2">
            <option value="server">Télécharger sur ce serveur</option>
            <option value="client">Préparer un lien de téléchargement direct</option>
          </select>
          <button type="submit">&#128187; Uploader .torrent</button>
        </form>
        <div class="terminal" id="terminal">
          <span id="terminal-text">[TRINITY] Ready for injection...</span>
        </div>
        <div class="footer">
          <span>&#x1F916; Trinity &mdash; Game Hacking Crack UI</span>
        </div>
      </div>
      <script>
        // Animated cyber grid background
        const canvas = document.getElementById('cyberCanvas');
        const ctx = canvas.getContext('2d');
        function resize() {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();
        let t = 0;
        function drawGrid() {
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.save();
          ctx.globalAlpha = 0.16;
          ctx.strokeStyle = '#00fff7';
          ctx.lineWidth = 1.2;
          let spacing = 38;
          let offset = (t*2)%spacing;
          for(let x=0;x<canvas.width;x+=spacing) {
            ctx.beginPath();
            ctx.moveTo(x+offset,0);
            ctx.lineTo(x+offset,canvas.height);
            ctx.stroke();
          }
          for(let y=0;y<canvas.height;y+=spacing) {
            ctx.beginPath();
            ctx.moveTo(0,y+offset);
            ctx.lineTo(canvas.width,y+offset);
            ctx.stroke();
          }
          ctx.restore();
        }
        function animate() {
          t+=0.5;
          drawGrid();
          requestAnimationFrame(animate);
        }
        animate();

        // Terminal typing animation
        const terminalText = document.getElementById('terminal-text');
        const messages = [
          "[TRINITY] Ready for injection...",
          "[TRINITY] Awaiting magnet or .torrent...",
          "[TRINITY] Hack the planet!",
          "[TRINITY] Crack in progress...",
          "[TRINITY] Memory patch loaded.",
          "[TRINITY] Game hack initialized.",
          "[TRINITY] Injection complete."
        ];
        let msgIdx = 0;
        function typeMsg(msg, cb) {
          terminalText.textContent = "";
          let i = 0;
          function type() {
            if(i < msg.length) {
              terminalText.textContent += msg[i++];
              setTimeout(type, 28 + Math.random()*40);
            } else if(cb) {
              setTimeout(cb, 1200);
            }
          }
          type();
        }
        function loopTerminal() {
          typeMsg(messages[msgIdx], () => {
            msgIdx = (msgIdx+1)%messages.length;
            loopTerminal();
          });
        }
        loopTerminal();
      </script>
    </body>
    </html>
  `);
});

// Ajout via magnet
app.post('/add-magnet', (req, res) => {
  const magnet = req.body.magnet;
  const dest = req.body.dest && req.body.dest.trim() ? req.body.dest.trim() : 'downloads';
  const mode = req.body.mode || 'server';
  if (!magnet) return res.send('Lien magnet manquant.');
  handleTorrent(magnet, dest, mode, res);
});

// Ajout via upload .torrent
app.post('/upload-torrent', upload.single('torrentfile'), (req, res) => {
  if (!req.file) return res.send('Fichier manquant.');
  const dest = req.body.dest && req.body.dest.trim() ? req.body.dest.trim() : 'downloads';
  const mode = req.body.mode || 'server';
  const torrentPath = req.file.path;
  handleTorrent(fs.readFileSync(torrentPath), dest, mode, res, () => fs.unlinkSync(torrentPath));
});

function handleTorrent(source, dest, mode, res, cb) {
  const absDest = path.resolve(dest);
  if (!fs.existsSync(absDest)) fs.mkdirSync(absDest, { recursive: true });
  const id = generateId();
  downloads[id] = { progress: 0, name: '', done: false, files: [] };

  client.add(source, { path: absDest }, torrent => {
    downloads[id].name = torrent.name;
    downloads[id].files = torrent.files.map(f => f.path);
    torrent.on('download', () => {
      downloads[id].progress = torrent.progress;
    });
    torrent.on('done', () => {
      downloads[id].progress = 1;
      downloads[id].done = true;
    });

    let msg = `Téléchargement lancé pour : ${torrent.name}<br>`;
    msg += `<a class="progress-link" href="/progress/${id}" target="_blank">Suivre la progression</a><br>`;
    if (mode === 'client') {
      // Propose un lien de téléchargement pour chaque fichier à la fin
      torrent.on('done', () => {
        let links = torrent.files.map(f =>
          `<a href="/download/${id}/${encodeURIComponent(f.path)}" download>${f.name}</a>`
        ).join('<br>');
        downloads[id].downloadLinks = links;
      });
      msg += `<span>Un lien de téléchargement direct sera proposé à la fin.</span>`;
    } else {
      msg += `<span>Le fichier sera stocké sur le serveur dans : ${absDest}</span>`;
    }
    msg += `<br><a href="/">Retour</a>`;
    res.send(msg);
    if (cb) cb();
  });
}

// Suivi de progression
app.get('/progress/:id', (req, res) => {
  const id = req.params.id;
  const d = downloads[id];
  if (!d) return res.send('Aucun téléchargement trouvé.');
  let percent = (d.progress * 100).toFixed(2);
  let html = `<h2>Progression pour : ${d.name}</h2>`;
  html += `<div style="font-size:1.2em;">${percent}%</div>`;
  if (d.done && d.downloadLinks) {
    html += `<div><b>Téléchargement terminé !</b><br>${d.downloadLinks}</div>`;
  } else if (d.done) {
    html += `<div><b>Téléchargement terminé !</b></div>`;
  } else {
    html += `<meta http-equiv="refresh" content="2">`;
  }
  html += `<br><a href="/">Retour</a>`;
  res.send(html);
});

// Téléchargement direct d'un fichier torrent téléchargé
app.get('/download/:id/:file(*)', (req, res) => {
  const id = req.params.id;
  const file = req.params.file;
  const d = downloads[id];
  if (!d || !d.done) return res.status(404).send('Fichier non disponible.');
  const filePath = d.files.find(f => f === file);
  if (!filePath) return res.status(404).send('Fichier introuvable.');
  const absPath = path.resolve(filePath);
  res.download(absPath);
});

app.listen(PORT, () => {
  console.log(`Serveur Torrento lancé sur http://localhost:${PORT}`);
});

// Mode CLI uniquement si des arguments sont fournis
if (require.main === module && process.argv.length > 2) {
  const argv = yargs
    .usage('Usage: $0 --torrent <fichier.torrent|magnet> [--output <dossier>]')
    .option('torrent', {
      alias: 't',
      describe: 'Chemin du fichier .torrent ou lien magnet',
      demandOption: true,
      type: 'string'
    })
    .option('output', {
      alias: 'o',
      describe: 'Dossier de destination',
      default: './downloads',
      type: 'string'
    })
    .help()
    .argv;

  if (!fs.existsSync(argv.output)) {
    fs.mkdirSync(argv.output, { recursive: true });
  }

  console.log('Ajout du torrent...');
  client.add(argv.torrent, { path: path.resolve(argv.output) }, torrent => {
    console.log(`Téléchargement de: ${torrent.name}`);
    torrent.on('download', () => {
      const percent = (torrent.progress * 100).toFixed(2);
      process.stdout.write(`Progression: ${percent}%\r`);
    });
    torrent.on('done', () => {
      console.log('\nTéléchargement terminé!');
      client.destroy();
    });
  });
}
