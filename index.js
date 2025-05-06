#!/usr/bin/env node

const WebTorrent = require('webtorrent');
const yargs = require('yargs');
const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const os = require('os');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = process.env.PORT || 3000;
const DOWNLOAD_DIR = './downloads';

// Création automatique des dossiers nécessaires
[DOWNLOAD_DIR, './uploads'].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Détection automatique de l'URL publique en Docker si non définie
function getDockerHostIP() {
  // Cherche une IP locale non loopback (pour usage interne Docker)
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}
const PUBLIC_URL = process.env.PUBLIC_URL ||
  (process.env.DOCKER && `http://${getDockerHostIP()}:${PORT}`) ||
  `http://localhost:${PORT}`;

const client = new WebTorrent();
const downloads = {};

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now();
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/downloads', express.static(path.resolve(DOWNLOAD_DIR)));
app.use('/static', express.static(path.join(__dirname, 'static')));

// Page principale
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Trinity - Torrent Loader</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
      <style>
        html, body { height: 100%; margin: 0; padding: 0; }
        body {
          min-height: 100vh;
          background: #181c1f;
          font-family: 'Share Tech Mono', monospace;
          overflow: hidden;
        }
        .spider-bg {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 0; pointer-events: none;
        }
        .container {
          position: relative; z-index: 2;
          max-width: 440px; margin: 60px auto 0 auto;
          background: rgba(20,24,28,0.97);
          border: 2px solid #3ad29f;
          border-radius: 14px;
          box-shadow: 0 0 24px #3ad29f33;
          padding: 32px 28px 24px 28px;
        }
        h1 {
          font-size: 2em;
          letter-spacing: 2px;
          text-align: center;
          margin-bottom: 10px;
          color: #3ad29f;
          text-shadow: 0 0 8px #3ad29f44;
        }
        .subtitle {
          text-align: center;
          color: #baffc9;
          margin-bottom: 28px;
          font-size: 1.1em;
        }
        label, input, button, select {
          font-family: inherit;
          font-size: 1em;
        }
        input[type="text"], input[type="file"], select {
          background: #222;
          color: #3ad29f;
          border: 1px solid #3ad29f;
          border-radius: 4px;
          padding: 8px;
          width: 100%;
          margin-bottom: 14px;
          outline: none;
        }
        input[type="text"]:focus, input[type="file"]:focus, select:focus {
          border-color: #baffc9;
        }
        button {
          background: #181c1f;
          color: #3ad29f;
          border: 1.5px solid #3ad29f;
          border-radius: 4px;
          padding: 8px 18px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          margin-top: 4px;
        }
        button:hover {
          background: #3ad29f;
          color: #181c1f;
        }
        form { margin-bottom: 18px; }
        .footer {
          text-align: center;
          color: #baffc9;
          margin-top: 18px;
          font-size: 0.95em;
          opacity: 0.7;
        }
        ::selection { background: #3ad29f; color: #181c1f; }
        .progress-link { color: #baffc9; font-size: 0.98em; }
      </style>
    </head>
    <body>
      <div class="spider-bg"><canvas id="spiderCanvas"></canvas></div>
      <div class="container">
        <h1>Trinity</h1>
        <div class="subtitle">Torrent Loader - Game Hacking Edition</div>
        <form method="POST" action="/add-magnet">
          <label for="magnet">Lien magnet :</label>
          <input type="text" name="magnet" id="magnet" placeholder="magnet:?xt=..." required>
          <label for="dest">Répertoire de destination :</label>
          <input type="text" name="dest" id="dest" placeholder="downloads (défaut)" />
          <button type="submit">&#x1F50E; Télécharger sur le serveur</button>
        </form>
        <form method="POST" action="/upload-torrent" enctype="multipart/form-data">
          <label for="torrentfile">Fichier .torrent :</label>
          <input type="file" name="torrentfile" id="torrentfile" accept=".torrent" required>
          <label for="dest2">Répertoire de destination :</label>
          <input type="text" name="dest" id="dest2" placeholder="downloads (défaut)" />
          <button type="submit">&#128187; Télécharger sur le serveur</button>
        </form>
        <form id="direct-dl-form" onsubmit="return handleDirectDownload(event)">
          <label for="magnet2">Lien magnet :</label>
          <input type="text" name="magnet2" id="magnet2" placeholder="magnet:?xt=..." required>
          <button type="submit">&#x2B07; Télécharger sur ce PC</button>
        </form>
        <div class="footer">
          <span>&#x1F916; Trinity &mdash; Game Hacking UI</span>
        </div>
      </div>
      <script>
        // Spider web animation
        const canvas = document.getElementById('spiderCanvas');
        const ctx = canvas.getContext('2d');
        let w = window.innerWidth, h = window.innerHeight;
        function resize() { w = window.innerWidth; h = window.innerHeight; canvas.width = w; canvas.height = h; }
        window.addEventListener('resize', resize); resize();
        // Web points and lines
        let points = [];
        for(let i=0;i<24;i++) points.push({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-0.5)*0.7,vy:(Math.random()-0.5)*0.7});
        function drawWeb() {
          ctx.clearRect(0,0,w,h);
          for(let i=0;i<points.length;i++) {
            let p = points[i];
            p.x += p.vx; p.y += p.vy;
            if(p.x<0||p.x>w) p.vx*=-1;
            if(p.y<0||p.y>h) p.vy*=-1;
            for(let j=i+1;j<points.length;j++) {
              let q = points[j];
              let dx = p.x-q.x, dy = p.y-q.y, dist = Math.sqrt(dx*dx+dy*dy);
              if(dist<180) {
                ctx.strokeStyle = "rgba(58,210,159,"+(1-dist/180)+")";
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
              }
            }
            ctx.fillStyle = "#3ad29f";
            ctx.beginPath(); ctx.arc(p.x,p.y,2,0,2*Math.PI); ctx.fill();
          }
        }
        function animate() { drawWeb(); requestAnimationFrame(animate);}
        animate();

        // Direct download handler
        function handleDirectDownload(e) {
          e.preventDefault();
          const magnet = document.getElementById('magnet2').value;
          fetch('/direct-download', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({magnet})
          })
          .then(r=>r.json())
          .then(data=>{
            if(data.error) alert(data.error);
            else window.location = data.url;
          });
          return false;
        }
      </script>
    </body>
    </html>
  `);
});

// Ajout via magnet
app.post('/add-magnet', (req, res) => {
  const magnet = req.body.magnet;
  const dest = req.body.dest && req.body.dest.trim() ? req.body.dest.trim() : 'downloads';
  if (!magnet) return res.send('Lien magnet manquant.');
  handleTorrent(magnet, dest, res);
});

// Ajout via upload .torrent
app.post('/upload-torrent', upload.single('torrentfile'), (req, res) => {
  if (!req.file) return res.send('Fichier manquant.');
  const dest = req.body.dest && req.body.dest.trim() ? req.body.dest.trim() : 'downloads';
  const torrentPath = req.file.path;
  handleTorrent(fs.readFileSync(torrentPath), dest, res, () => fs.unlinkSync(torrentPath));
});

// Téléchargement direct sur le PC client (après download sur serveur)
app.post('/direct-download', async (req, res) => {
  const { magnet } = req.body;
  if (!magnet) return res.json({ error: 'Lien magnet manquant.' });
  const id = generateId();
  const absDest = path.resolve(DOWNLOAD_DIR, id);
  if (!fs.existsSync(absDest)) fs.mkdirSync(absDest, { recursive: true });
  client.add(magnet, { path: absDest }, torrent => {
    torrent.on('done', () => {
      // On propose le premier fichier du torrent en téléchargement direct
      const file = torrent.files[0];
      const url = `${PUBLIC_URL}/downloads/${id}/${encodeURIComponent(file.name)}`;
      res.json({ url });
    });
  });
});

// Gestion du téléchargement
function handleTorrent(source, dest, res, cb) {
  const absDest = path.resolve(dest);
  if (!fs.existsSync(absDest)) fs.mkdirSync(absDest, { recursive: true });
  const id = generateId();
  downloads[id] = { progress: 0, name: '', done: false, files: [] };

  client.add(source, { path: absDest }, torrent => {
    downloads[id].name = torrent.name;
    downloads[id].files = torrent.files.map(f => path.join(absDest, f.name));
    torrent.on('download', () => {
      downloads[id].progress = torrent.progress;
    });
    torrent.on('done', () => {
      downloads[id].progress = 1;
      downloads[id].done = true;
    });

    res.redirect(`/progress/${id}`);
    if (cb) cb();
  });
}

// Page de suivi de progression (JS dynamique)
app.get('/progress/:id', (req, res) => {
  const id = req.params.id;
  res.send(`
    <html>
    <head>
      <title>Trinity - Suivi du téléchargement</title>
      <meta name="viewport" content="width=device-width,initial-scale=1">
      <style>
        body { background: #181c1f; color: #3ad29f; font-family: 'Share Tech Mono', monospace; text-align: center; }
        .box { margin: 80px auto 0 auto; background: #23272b; border-radius: 10px; padding: 32px 24px; max-width: 420px; box-shadow: 0 0 24px #3ad29f33; }
        .bar { width: 100%; background: #222; border-radius: 6px; margin: 18px 0; height: 22px; }
        .fill { background: #3ad29f; height: 100%; border-radius: 6px; transition: width 0.3s; }
        .done { color: #baffc9; font-size: 1.2em; margin-top: 18px; }
        a { color: #3ad29f; }
      </style>
    </head>
    <body>
      <div class="box">
        <h2 id="name">Téléchargement...</h2>
        <div class="bar"><div class="fill" id="fill" style="width:0%"></div></div>
        <div id="percent">0%</div>
        <div id="done"></div>
        <a href="/">Retour</a>
      </div>
      <script>
        function update() {
          fetch('/api/progress/${id}')
            .then(r=>r.json())
            .then(d=>{
              document.getElementById('name').textContent = d.name || "Téléchargement...";
              document.getElementById('fill').style.width = (d.progress*100).toFixed(2) + "%";
              document.getElementById('percent').textContent = (d.progress*100).toFixed(2) + "%";
              if(d.done) {
                document.getElementById('done').innerHTML = '<div class="done">Téléchargement terminé !<br>' +
                  d.files.map(f=>'<a href="'+f.url+'" download>'+f.name+'</a>').join('<br>')+'</div>';
              } else {
                setTimeout(update, 1200);
              }
            });
        }
        update();
      </script>
    </body>
    </html>
  `);
});

// API progression
app.get('/api/progress/:id', (req, res) => {
  const id = req.params.id;
  const d = downloads[id];
  if (!d) return res.json({ progress: 0, name: '', done: false, files: [] });
  res.json({
    progress: d.progress,
    name: d.name,
    done: d.done,
    files: d.done ? d.files.map(f => ({
      name: path.basename(f),
      url: `/downloads/${path.basename(path.dirname(f))}/${encodeURIComponent(path.basename(f))}`
    })) : []
  });
});

// Sert le fichier .env pour Cloudflare Pages (optionnel, sécurité à adapter si besoin)
app.get('/.env', (req, res) => {
  if (fs.existsSync('.env')) {
    res.type('text/plain').send(fs.readFileSync('.env'));
  } else {
    res.type('text/plain').send(`PUBLIC_URL=${PUBLIC_URL}`);
  }
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

// Lancer le serveur Express si ce n'est pas le mode CLI
if (require.main === module && process.argv.length <= 2) {
  app.listen(PORT, () => {
    console.log(`Trinity Web UI disponible sur http://0.0.0.0:${PORT}`);
  });
}
