#!/bin/bash

set -e

IMAGE_NAME="trinity-torrent"
CONTAINER_NAME="trinity"
HOST_DOWNLOADS="$(pwd)/downloads"

# Fonction pour arrêter et supprimer l'ancien conteneur si présent
cleanup_container() {
  if docker ps -a --format '{{.Names}}' | grep -Eq "^${CONTAINER_NAME}\$"; then
    echo "[Trinity] Arrêt de l'ancien conteneur..."
    docker stop $CONTAINER_NAME || true
    echo "[Trinity] Suppression de l'ancien conteneur..."
    docker rm $CONTAINER_NAME || true
  fi
}

echo "[Trinity] Création du dossier de téléchargements..."
mkdir -p "$HOST_DOWNLOADS"

echo "[Trinity] Construction de l'image Docker..."
docker build -t $IMAGE_NAME .

cleanup_container

echo "[Trinity] Lancement du conteneur..."
docker run -d \
  -p 3000:3000 \
  -v "$HOST_DOWNLOADS":/app/downloads \
  --name $CONTAINER_NAME \
  $IMAGE_NAME

echo
echo "[Trinity] L'application est disponible sur : http://localhost:3000"
echo "[Trinity] Les téléchargements seront stockés dans : $HOST_DOWNLOADS"
