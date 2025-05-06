#!/bin/bash

echo "[Torrento] Vérification de Node.js..."

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js n'est pas installé."
  echo "Pour l'installer sur Debian/Ubuntu :"
  echo "  sudo apt update && sudo apt install nodejs npm"
  exit 1
fi

echo "Node.js est installé."
echo "[Torrento] Installation des dépendances npm..."
npm install

if [ $? -ne 0 ]; then
  echo "Une erreur est survenue lors de l'installation des dépendances."
  exit 1
fi

# Ajout : installation de archiver si non présent
if ! npm list archiver >/dev/null 2>&1; then
  echo "[Torrento] Installation de la dépendance archiver..."
  npm install archiver
fi

echo
echo "[Torrento] Installation terminée avec succès !"
echo "Pour lancer l'application, utilisez :"
echo "  node index.js --torrent chemin/vers/fichier.torrent"
