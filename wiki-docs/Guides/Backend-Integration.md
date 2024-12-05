# Guide d'intégration Backend

## Introduction
Ce guide explique comment intégrer EasyVote dans votre backend existant ou comment créer un nouveau backend compatible.

## Table des matières
1. [Architecture](#architecture)
2. [Base de données](#base-de-données)
3. [Exemples d'implémentation](#exemples-dimplémentation)
4. [Sécurité](#sécurité)
5. [Tests](#tests)

## Architecture

### Structure recommandée
```
backend/
├── app/
│   ├── __init__.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── poll.py
│   │   └── vote.py
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── polls.py
│   │   └── votes.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── fingerprint.py
│   │   └── poll_service.py
│   └── utils/
│       ├── __init__.py
│       └── validators.py
├── config/
│   ├── __init__.py
│   ├── development.py
│   └── production.py
├── tests/
│   ├── __init__.py
│   ├── test_models.py
│   └── test_routes.py
├── app.py
└── requirements.txt
```

## Base de données

### Modèle de données SQLAlchemy
```python
# app/models/poll.py
from datetime import datetime
import pytz
from app import db

class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    share_id = db.Column(db.String(36), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.UTC))
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    delete_password = db.Column(db.String(100), nullable=False)
    options = db.relationship('Option', backref='poll', lazy=True, 
                            cascade='all, delete-orphan')
    votes = db.relationship('Vote', backref='poll', lazy=True, 
                           cascade='all, delete-orphan')

class Option(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    votes = db.relationship('Vote', backref='option', lazy=True, 
                          cascade='all, delete-orphan')

class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey('option.id'), nullable=False)
    voter_hash = db.Column(db.String(128), nullable=False)
    fingerprint_components = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now(pytz.UTC))
```

## Exemples d'implémentation

### Configuration Flask
```python
# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os

db = SQLAlchemy()

def create_app(config_name='development'):
    app = Flask(__name__)
    
    # Configuration
    if config_name == 'production':
        app.config.from_object('config.production.Config')
    else:
        app.config.from_object('config.development.Config')
    
    # CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": "*",
            "methods": ["GET", "POST", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type"],
            "expose_headers": ["Content-Type"],
            "supports_credentials": True
        }
    })
    
    # Extensions
    db.init_app(app)
    
    return app
```

### Service Layer
```python
# app/services/poll_service.py
from datetime import datetime, timedelta
import uuid
from werkzeug.security import generate_password_hash
from app.models import Poll, Option
from app import db

class PollService:
    @staticmethod
    def create_poll(title, options, expires_in_days, delete_password):
        poll = Poll(
            title=title,
            share_id=str(uuid.uuid4()),
            expires_at=datetime.now() + timedelta(days=expires_in_days),
            delete_password=generate_password_hash(delete_password)
        )
        
        for option_text in options:
            option = Option(text=option_text)
            poll.options.append(option)
        
        db.session.add(poll)
        db.session.commit()
        return poll
    
    @staticmethod
    def get_poll(share_id):
        return Poll.query.filter_by(share_id=share_id).first()
```

### Routes
```python
# app/routes/polls.py
from flask import Blueprint, request, jsonify
from app.services.poll_service import PollService
from app.utils.validators import validate_poll_data

bp = Blueprint('polls', __name__)

@bp.route('/api/polls', methods=['POST'])
def create_poll():
    data = request.get_json()
    
    # Validation
    errors = validate_poll_data(data)
    if errors:
        return jsonify({"errors": errors}), 400
    
    try:
        poll = PollService.create_poll(
            title=data['title'],
            options=data['options'],
            expires_in_days=data['expires_in_days'],
            delete_password=data['delete_password']
        )
        return jsonify(poll.to_dict()), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500
```

## Sécurité

### Protection contre les votes multiples
```python
# app/services/fingerprint.py
import hashlib
import json

class FingerprintService:
    @staticmethod
    def calculate_similarity(fp1, fp2):
        """Calcule la similarité entre deux empreintes."""
        score = 0
        total = 0
        
        for key in ['userAgent', 'language', 'platform', 'timezone']:
            if key in fp1 and key in fp2:
                if fp1[key] == fp2[key]:
                    score += 1
                total += 1
        
        return score / total if total > 0 else 0
    
    @staticmethod
    def generate_voter_hash(poll_id, fingerprint):
        """Génère un hash unique pour un vote."""
        data = f"{poll_id}:{json.dumps(fingerprint, sort_keys=True)}"
        return hashlib.sha256(data.encode()).hexdigest()
```

## Tests

### Tests unitaires
```python
# tests/test_models.py
import unittest
from datetime import datetime, timedelta
from app import create_app, db
from app.models import Poll, Option, Vote

class TestPoll(unittest.TestCase):
    def setUp(self):
        self.app = create_app('testing')
        self.client = self.app.test_client()
        self.ctx = self.app.app_context()
        self.ctx.push()
        db.create_all()
    
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.ctx.pop()
    
    def test_create_poll(self):
        poll = Poll(
            title="Test Poll",
            share_id="test-123",
            expires_at=datetime.now() + timedelta(days=7),
            delete_password="hash123"
        )
        db.session.add(poll)
        db.session.commit()
        
        self.assertIsNotNone(poll.id)
        self.assertEqual(poll.title, "Test Poll")
```

### Tests d'intégration
```python
# tests/test_routes.py
def test_create_poll_route():
    response = self.client.post('/api/polls', json={
        'title': 'Test Poll',
        'options': ['Option 1', 'Option 2'],
        'expires_in_days': 7,
        'delete_password': 'secret123'
    })
    
    self.assertEqual(response.status_code, 201)
    data = response.get_json()
    self.assertIn('share_id', data)
    self.assertEqual(data['title'], 'Test Poll')
```

## Bonnes pratiques

1. **Validation des données**
   - Valider toutes les entrées utilisateur
   - Utiliser des schémas de validation (ex: marshmallow)
   - Sanitiser les données sensibles

2. **Gestion des erreurs**
   - Utiliser des exceptions personnalisées
   - Logger les erreurs
   - Retourner des messages d'erreur appropriés

3. **Performance**
   - Mettre en cache les résultats fréquemment accédés
   - Optimiser les requêtes de base de données
   - Utiliser des index appropriés

4. **Sécurité**
   - Hasher les mots de passe
   - Valider les fingerprints
   - Implémenter le rate limiting