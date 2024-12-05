# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Installation des dépendances avec --legacy-peer-deps
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copie des sources
COPY . .

# Exposition du port
EXPOSE 3000

# Démarrage avec la bonne commande
CMD ["npm", "run", "start", "--", "--host"]