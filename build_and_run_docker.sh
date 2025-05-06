#!/bin/bash

set -e

IMAGE_NAME="trinity-torrent"
CONTAINER_NAME="trinity"
HOST_DOWNLOADS="$(pwd)/downloads"

echo "[Trinity] Création du dossier de téléchargements..."
mkdir -p "$HOST_DOWNLOADS"

echo "[Trinity] Construction de l'image Docker..."
docker build -t $IMAGE_NAME .

echo "[Trinity] Arrêt et suppression de l'ancien conteneur (si présent)..."
docker rm -f $CONTAINER_NAME 2>/dev/null || true

echo "[Trinity] Lancement du conteneur..."
docker run -d \
  -p 3000:3000 \
  -v "$HOST_DOWNLOADS":/app/downloads \
  --name $CONTAINER_NAME \
  $IMAGE_NAME

echo
echo "[Trinity] L'application est disponible sur : http://localhost:3000"
echo "[Trinity] Les téléchargements seront stockés dans : $HOST_DOWNLOADS"
