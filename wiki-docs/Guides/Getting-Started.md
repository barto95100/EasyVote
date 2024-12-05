# Guide de démarrage

## Introduction
Ce guide vous aidera à démarrer rapidement avec EasyVote, que vous souhaitiez déployer l'application complète ou utiliser uniquement l'API.

## Table des matières
1. [Prérequis](#prérequis)
2. [Installation rapide avec Docker](#installation-rapide-avec-docker)
3. [Installation manuelle](#installation-manuelle)
4. [Premier sondage](#premier-sondage)
5. [Prochaines étapes](#prochaines-étapes)

## Prérequis

### Pour Docker
- Docker Engine 20.10+
- Docker Compose v2.0+
- 1GB RAM minimum
- 1GB espace disque

### Pour installation manuelle
#### Frontend
- Node.js 18+
- pnpm 8+

#### Backend
- Python 3.9+
- pip
- venv ou virtualenv

## Installation rapide avec Docker

1. Cloner le repository
```bash
git clone https://github.com/[username]/vote-app.git
cd vote-app
```

2. Lancer avec Docker Compose
```bash
docker-compose up -d
```

3. Vérifier l'installation
- Frontend : http://localhost:3000
- Backend : http://localhost:5001/api/polls

## Installation manuelle

### Backend

1. Créer et activer l'environnement virtuel
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
```

2. Installer les dépendances
```bash
pip install -r requirements.txt
```

3. Lancer le serveur
```bash
python app.py
```

### Frontend

1. Installer les dépendances
```bash
cd frontend
pnpm install
```

2. Configurer les variables d'environnement
```bash
cp .env.example .env
```
Éditer `.env` :
```
VITE_API_URL=http://localhost:5001
```

3. Lancer le serveur de développement
```bash
pnpm dev
```

## Premier sondage

### Via l'interface web
1. Accéder à http://localhost:3000
2. Cliquer sur "Nouveau sondage"
3. Remplir le formulaire :
   - Titre
   - Options (minimum 2)
   - Durée
   - Mot de passe de suppression
4. Cliquer sur "Créer"

### Via l'API
```bash
curl -X POST http://localhost:5001/api/polls \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Meilleur langage de programmation ?",
    "options": ["Python", "JavaScript", "Java"],
    "expires_in_days": 7,
    "delete_password": "secret123"
  }'
```

## Prochaines étapes

### Pour les développeurs Frontend
1. [Guide d'intégration Frontend](./Frontend-Integration)
2. [Documentation API](../API-Documentation/Overview)
3. [Exemples de code](https://github.com/[username]/vote-app/tree/main/examples)

### Pour les développeurs Backend
1. [Vue d'ensemble de l'API](../API-Documentation/Overview)
2. [Guide d'intégration Backend](./Backend-Integration)
3. [Codes d'erreur](../API-Documentation/Error-Codes)

### Pour les administrateurs
1. [Guide de déploiement](./Deployment)
2. [Configuration avancée](./Advanced-Configuration)
3. [Monitoring](./Monitoring)

## Support

### Ressources utiles
- [Documentation complète](https://github.com/[username]/vote-app/wiki)
- [FAQ](./FAQ)
- [Dépannage](./Troubleshooting)

### Obtenir de l'aide
- [Ouvrir une issue](https://github.com/[username]/vote-app/issues)
- [Discussions](https://github.com/[username]/vote-app/discussions)
- [Contact support](mailto:support@easyvote.com)