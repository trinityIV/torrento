# Trinity

Application CLI et Web de téléchargement de fichiers torrent pour Windows, Linux (Debian) et Docker, avec interface moderne et suivi dynamique.

## Installation

1. Installez [Node.js](https://nodejs.org/) (version 16+ recommandée) si besoin.
2. Clonez ce dépôt ou copiez les fichiers.
3. Dans le dossier du projet, exécutez :

```bash
npm install
```

## Utilisation

### Mode CLI

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

### Mode serveur web (contrôle à distance)

Pour lancer le serveur web :

```bash
node index.js
```

Accédez à l’interface depuis un navigateur :  
http://localhost:3000

#### Fonctionnalités de l’interface web

- **Choix du dossier de destination** pour chaque téléchargement.
- **Téléchargement direct sur le serveur** ou **préparation d’un lien pour télécharger sur votre PC**.
- **Suivi dynamique de la progression** sur une page dédiée (barre de progression, liens de téléchargement à la fin).
- **Fond animé** façon toile d’araignée, interface moderne et responsive.

### Configuration de l’URL publique

Pour permettre la génération de liens directs accessibles depuis l’extérieur, créez un fichier `.env` :

```env
PUBLIC_URL=http://VOTRE_IP_PUBLIQUE:3000
```

Adaptez l’URL selon votre configuration réseau.

### Utilisation avec Docker

#### Construction de l'image

```bash
./build_and_run_docker.sh
```

- Le script arrête et supprime automatiquement l’ancien conteneur avant de lancer le nouveau.
- Les téléchargements sont stockés dans le dossier `downloads` du projet (monté dans le conteneur).

#### Accès

- Interface web sur http://localhost:3000 (ou l’IP de votre serveur)
- Les fichiers téléchargés sont dans `downloads/`

### Utilisation automatisée avec Docker

Pour tout lancer automatiquement :

```bash
./build_and_run_docker.sh
```

- L’URL publique est détectée automatiquement, ou vous pouvez la forcer :
  ```bash
  PUBLIC_URL="http://votre_ip_publique:3000" ./build_and_run_docker.sh
  ```
- Les dossiers `downloads` et `uploads` sont persistants sur votre machine.
- L’interface web sera accessible sur l’URL affichée à la fin du script.

### Déploiement Cloudflare Pages (accès externe)

- Uploadez le fichier `static/index.html` sur Cloudflare Pages.
- Ce fichier redirige automatiquement vers l’interface Trinity sur votre serveur, en utilisant l’URL définie dans `.env`.

---

## Compatibilité

- Windows
- Linux Debian
- Docker

## Dépendances

- [webtorrent](https://www.npmjs.com/package/webtorrent)
- [yargs](https://www.npmjs.com/package/yargs)
- [express](https://www.npmjs.com/package/express)
- [multer](https://www.npmjs.com/package/multer)
- [dotenv](https://www.npmjs.com/package/dotenv)

---
