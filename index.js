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

// Page web Trinity style hacking
app.get('/', (req, res) => {
  res.send(`
    <html>
    <head>
      <title>Trinity - Hack Memory Torrent</title>
      <style>
        body {
          background: #181c1f;
          color: #00ff41;
          font-family: 'Fira Mono', 'Consolas', monospace;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 420px;
          margin: 60px auto;
          background: rgba(20,24,20,0.92);
          border: 2px solid #00ff41;
          border-radius: 10px;
          box-shadow: 0 0 24px #00ff4144;
          padding: 32px 28px 24px 28px;
        }
        h1 {
          font-size: 2.2em;
          letter-spacing: 2px;
          text-align: center;
          margin-bottom: 10px;
          color: #00ff41;
          text-shadow: 0 0 8px #00ff41cc;
        }
        .subtitle {
          text-align: center;
          color: #baffc9;
          margin-bottom: 28px;
          font-size: 1.1em;
        }
        label, input, button {
          font-family: inherit;
          font-size: 1em;
        }
        input[type="text"], input[type="file"] {
          background: #222;
          color: #00ff41;
          border: 1px solid #00ff41;
          border-radius: 4px;
          padding: 8px;
          width: 100%;
          margin-bottom: 14px;
          outline: none;
        }
        input[type="text"]:focus, input[type="file"]:focus {
          border-color: #baffc9;
        }
        button {
          background: #181c1f;
          color: #00ff41;
          border: 1.5px solid #00ff41;
          border-radius: 4px;
          padding: 8px 18px;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          margin-top: 4px;
        }
        button:hover {
          background: #00ff41;
          color: #181c1f;
        }
        form {
          margin-bottom: 18px;
        }
        .footer {
          text-align: center;
          color: #baffc9;
          margin-top: 18px;
          font-size: 0.95em;
          opacity: 0.7;
        }
        ::selection {
          background: #00ff41;
          color: #181c1f;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Trinity</h1>
        <div class="subtitle">Hack Memory Torrent Loader</div>
        <form method="POST" action="/add-magnet">
          <label for="magnet">Lien magnet :</label>
          <input type="text" name="magnet" id="magnet" placeholder="magnet:?xt=..." required>
          <button type="submit">&#x1F50E; Injecter Magnet</button>
        </form>
        <form method="POST" action="/upload-torrent" enctype="multipart/form-data">
          <label for="torrentfile">Fichier .torrent :</label>
          <input type="file" name="torrentfile" id="torrentfile" accept=".torrent" required>
          <button type="submit">&#128187; Uploader .torrent</button>
        </form>
        <div class="footer">
          <span>&#x1F916; Trinity &mdash; Hack Memory UI</span>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Ajout via magnet
app.post('/add-magnet', (req, res) => {
  const magnet = req.body.magnet;
  if (!magnet) return res.send('Lien magnet manquant.');
  addTorrent(magnet, res);
});

// Ajout via upload .torrent
app.post('/upload-torrent', upload.single('torrentfile'), (req, res) => {
  if (!req.file) return res.send('Fichier manquant.');
  const torrentPath = req.file.path;
  addTorrent(fs.readFileSync(torrentPath), res, () => fs.unlinkSync(torrentPath));
});

function addTorrent(source, res, cb) {
  client.add(source, { path: DOWNLOAD_DIR }, torrent => {
    res.send(`Téléchargement lancé pour : ${torrent.name}<br><a href="/">Retour</a>`);
    torrent.on('download', () => {
      process.stdout.write(`Progression ${torrent.name}: ${(torrent.progress * 100).toFixed(2)}%\r`);
    });
    torrent.on('done', () => {
      console.log(`\nTéléchargement terminé: ${torrent.name}`);
    });
    if (cb) cb();
  });
}

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
