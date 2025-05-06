FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Création des dossiers persistants
RUN mkdir -p /app/downloads /app/uploads

EXPOSE 3000

# Permet de passer PUBLIC_URL à l'exécution
ENV PUBLIC_URL=${PUBLIC_URL}

CMD ["node", "index.js"]
