# Torrento

Application CLI de téléchargement de fichiers torrent pour Windows et Linux (Debian).

## Installation

1. Installez [Node.js](https://nodejs.org/) (version 16+ recommandée).
2. Clonez ce dépôt ou copiez les fichiers.
3. Dans le dossier du projet, exécutez :

```bash
npm install
```

## Utilisation

Pour télécharger un torrent :

```bash
node index.js --torrent chemin/vers/fichier.torrent
```
ou avec un lien magnet :

```bash
node index.js --torrent "magnet:?xt=..."
```

Pour changer le dossier de destination :

```bash
node index.js --torrent fichier.torrent --output /chemin/vers/dossier
```

## Mode serveur web (contrôle à distance)

Pour lancer le serveur web :

```bash
node index.js
```

Accédez à l’interface depuis un navigateur :  
http://localhost:3000

Vous pouvez ajouter un lien magnet ou uploader un fichier `.torrent` depuis n’importe quel appareil du réseau (remplacez `localhost` par l’IP du serveur si besoin).

## Utilisation avec Docker

### Construction de l'image

```bash
docker build -t trinity-torrent .
```

### Lancement du conteneur

```bash
docker run -d -p 3000:3000 -v /chemin/vers/telechargements:/app/downloads --name trinity trinity-torrent
```

- Accédez à l’interface sur http://localhost:3000
- Les fichiers téléchargés seront dans `/chemin/vers/telechargements` sur votre machine.

## Compatibilité

- Windows
- Linux Debian

## Dépendances

- [webtorrent](https://www.npmjs.com/package/webtorrent)
- [yargs](https://www.npmjs.com/package/yargs)

## Dépendances supplémentaires

- [express](https://www.npmjs.com/package/express)
- [multer](https://www.npmjs.com/package/multer)
