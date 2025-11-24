FROM node:18.5

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances npm
RUN npm install

# Installer les outils système pour la démo SSTI
# netcat pour les reverse shells
# python3 pour certains payloads
RUN apt-get update && apt-get install -y \
    netcat-traditional \
    python3 \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Copier le reste de l'application
COPY . .

# Exposer le port
EXPOSE 3000

# Démarrer l'application
CMD ["npm", "start"]