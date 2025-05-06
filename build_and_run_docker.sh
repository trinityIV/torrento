#!/bin/bash

set -e

IMAGE_NAME="trinity-torrent"
CONTAINER_NAME="trinity"
HOST_DOWNLOADS="$(pwd)/downloads"
HOST_UPLOADS="$(pwd)/uploads"

# Vérification de la dépendance archiver dans package.json
if ! grep -q '"archiver"' package.json; then
  echo "[Trinity] Ajout de la dépendance archiver dans package.json..."
  npm install archiver
fi

# Fonction pour arrêter et supprimer l'ancien conteneur si présent
cleanup_container() {
  if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
    echo "[Trinity] Arrêt de l'ancien conteneur..."
    docker stop $CONTAINER_NAME || true
    echo "[Trinity] Suppression de l'ancien conteneur..."
    docker rm $CONTAINER_NAME || true
  fi
}

echo "[Trinity] Création des dossiers de téléchargements et uploads..."
mkdir -p "$HOST_DOWNLOADS" "$HOST_UPLOADS"

echo "[Trinity] Construction de l'image Docker..."
docker build -t $IMAGE_NAME .

cleanup_container

# Détection automatique de l'IP locale pour PUBLIC_URL si non fourni
if [ -z "$PUBLIC_URL" ]; then
  IP=$(hostname -I | awk '{print $1}')
  PUBLIC_URL="http://$IP:3000"
fi

echo "[Trinity] Lancement du conteneur avec PUBLIC_URL=$PUBLIC_URL ..."
docker run -d \
  -p 3000:3000 \
  -v "$HOST_DOWNLOADS":/app/downloads \
  -v "$HOST_UPLOADS":/app/uploads \
  -e PUBLIC_URL="$PUBLIC_URL" \
  -e DOCKER=1 \
  --restart unless-stopped \
  --name $CONTAINER_NAME \
  $IMAGE_NAME

echo
echo "[Trinity] L'application est disponible sur : $PUBLIC_URL"
echo "[Trinity] Les téléchargements seront stockés dans : $HOST_DOWNLOADS"
