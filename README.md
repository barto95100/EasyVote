# EasyVote - Application de Sondages Moderne

[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.15-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow?logo=python)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-2.0+-green?logo=flask)](https://flask.palletsprojects.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3-blue?logo=sqlite)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-Non%20Commercial-red.svg)](LICENSE)

## 📝 Description
EasyVote est une application web moderne permettant de créer et gérer des sondages de manière simple et efficace. Elle offre une interface utilisateur intuitive et réactive, avec une protection contre les votes multiples grâce à une empreinte digitale du navigateur.

## 🚀 Fonctionnalités
- ✨ Création de sondages personnalisés
- 📊 Visualisation des résultats en temps réel
- 🔒 Protection contre les votes multiples
- 📱 Interface responsive (mobile et desktop)
- 🔗 Partage facile des sondages via URL

## 🛠 Technologies Utilisées
### Frontend
- React 18 avec TypeScript
- Vite comme bundler
- React Router pour la navigation
- Tailwind CSS pour le styling
- Heroicons pour les icônes
- FingerprintJS pour la prévention des votes multiples

### Backend
- Python Flask
- SQLite pour la base de données
- Flask-SQLAlchemy pour l'ORM
- Flask-CORS pour la gestion des CORS

## 🏗 Structure du Projet
```
easyvote/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
└── backend/
    ├── app.py
    ├── requirements.txt
    ├── migrate_db.py
    ├── models/
    ├── routes/
    ├── config/
    ├── instance/
    │   └── polls.db
    └── logs/
```
## 📦 Images Docker
Les images Docker sont disponibles sur Docker Hub :

### Frontend : 
barto95100/easyvote-frontend -> [Ici](https://hub.docker.com/r/barto95100/easyvote-frontend)
### Backend : 
barto95100/easyvote-backend -> [Ici](https://hub.docker.com/r/barto95100/easyvote-backend)
### Support multi-architecture :
* linux/amd64
* linux/arm64

## 💻 Installation
## Manuel
#### Frontend
```bash
cd frontend
pnpm install
pnpm start
```
#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Docker
```yaml
services:
  frontend:
    image: barto95100/easyvote-frontend:latest
    # Alternative: build depuis les sources
    # build:
    #   context: ./frontend
    #   dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - VITE_API_URL=http://localhost:5001
    depends_on:
      - backend
    networks:
      - easyvote_network
    restart: unless-stopped

  backend:
    image: barto95100/easyvote-backend:latest
    # Alternative: build depuis les sources
    # build:
    #   context: ./backend
    #   dockerfile: Dockerfile
    ports:
      - "5001:5001"
    volumes:
      - easyvote_data:/app/data
      - easyvote_logs:/app/logs
    environment:
      - FLASK_ENV=production
      - FLASK_APP=app.py
      - CORS_ORIGINS=http://localhost:3000
    networks:
      - easyvote_network
    restart: unless-stopped

volumes:
  easyvote_data:
    name: easyvote_data
  easyvote_logs:
    name: easyvote_logs

networks:
  easyvote_network:
    name: easyvote_network
    driver: bridge
```
### 🌐 Utilisation

1. Lancez le backend (http://localhost:5001)
2. Lancez le frontend (http://localhost:3000)
3. Créez un nouveau sondage ou consultez les sondages existants
4. Partagez l'URL du sondage avec vos participants

### 🔒 Sécurité

Protection contre les votes multiples:

* Validation des données côté serveur
* Protection CSRF
* Sanitization des entrées utilisateur

### 🎯 Optimisations

Bundle size optimisé avec Vite

* Lazy loading des composants
* Mise en cache des résultats
* Compression des assets

### 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Fork le projet
2. Créer une branche (git checkout -b feature/AmazingFeature)
3. Commit vos changements (git commit -m 'Add some AmazingFeature')
4. Push sur la branche (git push origin feature/AmazingFeature)
5. Ouvrir une Pull Request

### 📝 License

Ce projet est sous licence personnalisée non commerciale et non entreprise. Cette licence :
- ✅ Autorise l'utilisation personnelle et éducative
- ✅ Permet les contributions open source
- ❌ Interdit STRICTEMENT toute utilisation commerciale
- ❌ Interdit STRICTEMENT l'utilisation par des entreprises

Voir le fichier [LICENSE](LICENSE) pour plus de détails.

### 👥 Auteurs
Barto_95 - Développeur principal - @barto95100

### 🙏 Remerciements
* React pour le framework frontend
* Flask pour le framework backend
* Docker pour la conteneurisation

👀 Tous les contributeurs/utilisateurs qui participent et/ou utilisent ce projet ! 🤗