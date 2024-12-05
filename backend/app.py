from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import uuid
import pytz
from werkzeug.security import generate_password_hash, check_password_hash
import logging
from logging.handlers import RotatingFileHandler
import os
import hashlib
import json

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///polls.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configuration CORS pour permettre l'accès depuis n'importe quelle origine
CORS(app, resources={
    r"/api/*": {
        "origins": "*",  # Permet toutes les origines
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type"],
        "expose_headers": ["Content-Type"],
        "supports_credentials": True
    }
})

# Générer une clé secrète aléatoire si elle n'existe pas
if not app.config.get('SECRET_KEY'):
    # Générer une clé de 32 octets (256 bits)
    app.config['SECRET_KEY'] = os.urandom(32).hex()
    app.logger.info('Nouvelle SECRET_KEY générée')

# Configuration du logging
if not os.path.exists('logs'):
    os.makedirs('logs')

file_handler = RotatingFileHandler('logs/vote_app.log', maxBytes=1024 * 1024, backupCount=10)
file_handler.setFormatter(logging.Formatter(
    '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
))
file_handler.setLevel(logging.INFO)
app.logger.addHandler(file_handler)
app.logger.setLevel(logging.INFO)
app.logger.info('Vote App startup')

# Initialiser SQLAlchemy
db = SQLAlchemy(app)

# Définition des modèles
class Poll(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    share_id = db.Column(db.String(36), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(pytz.UTC))
    expires_at = db.Column(db.DateTime, nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    delete_password = db.Column(db.String(100), nullable=False)
    options = db.relationship('Option', backref='poll', lazy=True, cascade='all, delete-orphan')
    votes = db.relationship('Vote', backref='poll', lazy=True, cascade='all, delete-orphan')

class Option(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    votes = db.relationship('Vote', backref='option', lazy=True, cascade='all, delete-orphan')

class Vote(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    poll_id = db.Column(db.Integer, db.ForeignKey('poll.id'), nullable=False)
    option_id = db.Column(db.Integer, db.ForeignKey('option.id'), nullable=False)
    voter_hash = db.Column(db.String(128), nullable=False)
    fingerprint_components = db.Column(db.Text, nullable=False)  # Stockage JSON des composants
    created_at = db.Column(db.DateTime, default=datetime.now(pytz.UTC))
    
    def __init__(self, poll_id, option_id, voter_hash, fingerprint_components):
        self.poll_id = poll_id
        self.option_id = option_id
        self.voter_hash = voter_hash
        self.fingerprint_components = json.dumps(fingerprint_components)

# Créer toutes les tables au démarrage
with app.app_context():
    db.create_all()
    app.logger.info('Base de données initialisée')

def get_utc_now():
    """Retourne la date actuelle en UTC"""
    return datetime.now(pytz.UTC)

def check_poll_expiration(poll):
    """Vérifie si un sondage est expiré"""
    now = get_utc_now()
    
    # S'assurer que expires_at a un timezone
    if poll.expires_at.tzinfo is None:
        expires_at = pytz.UTC.localize(poll.expires_at)
    else:
        expires_at = poll.expires_at
    
    time_diff = expires_at - now
    diff_hours = time_diff.total_seconds() / 3600
    
    if poll.is_active and diff_hours <= 0:
        app.logger.info(f'Sondage {poll.id} marqué comme expiré (différence: {diff_hours:.6f} heures)')
        poll.is_active = False
        db.session.commit()
    
    return poll

def cleanup_expired_polls():
    """Nettoie les sondages expirés au démarrage du serveur"""
    try:
        active_polls = Poll.query.filter_by(is_active=True).all()
        expired_count = 0
        now = get_utc_now()
        
        app.logger.info(f'Début du nettoyage des sondages expirés. {len(active_polls)} sondages actifs trouvés')
        
        for poll in active_polls:
            expires_at = pytz.UTC.localize(poll.expires_at) if poll.expires_at.tzinfo is None else poll.expires_at
            time_diff = expires_at - now
            
            if time_diff.total_seconds() <= 0:
                poll.is_active = False
                expired_count += 1
        
        if expired_count > 0:
            db.session.commit()
            app.logger.info(f'Nettoyage terminé: {expired_count} sondage(s) marqué(s) comme expiré(s)')
            
    except Exception as e:
        app.logger.error(f'Erreur lors du nettoyage des sondages expirés: {str(e)}')
        db.session.rollback()

def generate_voter_hash(poll_id: int, fingerprint: str) -> str:
    """Génère un hash unique pour un vote."""
    if not fingerprint or len(fingerprint) < 32:
        raise ValueError("Fingerprint invalide")

    # Utiliser le sel unique de l'application et l'ID du sondage
    data = f"{fingerprint}:{poll_id}:{app.config['SECRET_KEY']}"
    return hashlib.sha3_512(data.encode()).hexdigest()

@app.route('/api/polls', methods=['GET'])
def get_polls():
    polls = Poll.query.order_by(Poll.created_at.desc()).all()
    return jsonify([{
        'id': poll.id,
        'title': poll.title,
        'share_id': poll.share_id,
        'expires_at': poll.expires_at.isoformat(),
        'is_active': check_poll_expiration(poll).is_active,
        'options': [{
            'id': option.id,
            'text': option.text,
            'votes': len(option.votes)
        } for option in poll.options],
        'total_votes': sum(len(option.votes) for option in poll.options)
    } for poll in polls])

@app.route('/api/polls', methods=['POST'])
def create_poll():
    try:
        data = request.json
        if not data or not data.get('title') or not data.get('options') or not data.get('deletePassword'):
            return jsonify({'error': 'Données invalides'}), 400

        title = data['title'].strip()
        options = [opt.strip() for opt in data['options'] if opt.strip()]
        delete_password = data['deletePassword'].strip()
        expires_in = float(data.get('expiresIn', 24))

        if expires_in <= 0:
            return jsonify({'error': 'La durée doit être supérieure à 0'}), 400

        now = get_utc_now()
        expires_at = now + timedelta(hours=expires_in)

        poll = Poll(
            title=title,
            share_id=str(uuid.uuid4()),
            expires_at=expires_at,
            delete_password=generate_password_hash(delete_password)
        )
        
        for text in options:
            option = Option(text=text)
            poll.options.append(option)
        
        db.session.add(poll)
        db.session.commit()
        
        response_data = {
            'id': poll.id,
            'share_id': poll.share_id,
            'title': poll.title,
            'expires_at': poll.expires_at.isoformat(),
            'is_active': poll.is_active,
            'options': [{'id': opt.id, 'text': opt.text} for opt in poll.options]
        }
        
        app.logger.info(f'Nouveau sondage créé: ID={poll.id}, Titre="{title}", Expire le={expires_at.isoformat()}')
        return jsonify(response_data)

    except Exception as e:
        app.logger.error(f'Erreur lors de la création du sondage: {str(e)}')
        return jsonify({'error': 'Une erreur est survenue lors de la création du sondage'}), 500

@app.route('/api/polls/<share_id>', methods=['GET'])
def get_poll(share_id):
    try:
        poll = Poll.query.filter_by(share_id=share_id).first()
        if not poll:
            return jsonify({'error': 'Sondage non trouvé'}), 404

        poll = check_poll_expiration(poll)
        
        return jsonify({
            'id': poll.id,
            'title': poll.title,
            'share_id': poll.share_id,
            'expires_at': poll.expires_at.isoformat(),
            'is_active': poll.is_active,
            'options': [{
                'id': option.id,
                'text': option.text,
                'votes': len(option.votes)
            } for option in poll.options],
            'total_votes': sum(len(option.votes) for option in poll.options)
        })
    except Exception as e:
        app.logger.error(f'Erreur lors de la récupération du sondage: {str(e)}')
        return jsonify({'error': 'Une erreur est survenue lors de la récupération du sondage'}), 500

@app.route('/api/polls/<share_id>/vote', methods=['POST'])
def vote(share_id):
    try:
        data = request.json
        if not data or 'optionId' not in data or 'fingerprint' not in data:
            app.logger.warning(f"""
Tentative de vote invalide - Données manquantes:
- Share ID: {share_id}
- Data reçues: {data}
""")
            return jsonify({'error': 'Données invalides'}), 400

        # Vérifier et parser le fingerprint
        try:
            if isinstance(data['fingerprint'], str):
                fingerprint_data = json.loads(data['fingerprint'])
            else:
                fingerprint_data = data['fingerprint']

            if 'components' not in fingerprint_data:
                raise ValueError("Format de fingerprint invalide")

            # Stocker les composants au format JSON
            fingerprint_components = json.dumps(fingerprint_data['components'])
        except (json.JSONDecodeError, ValueError) as e:
            app.logger.warning(f"""
Fingerprint invalide détecté:
- Share ID: {share_id}
- Erreur: {str(e)}
""")
            return jsonify({'error': 'Fingerprint invalide'}), 400

        # Vérifier les votes existants
        poll = Poll.query.filter_by(share_id=share_id).first()
        if not poll:
            return jsonify({'error': 'Sondage introuvable'}), 404

        # Générer le hash du votant
        voter_hash = generate_voter_hash(poll.id, json.dumps(fingerprint_data))

        # Vérifier les votes similaires
        existing_votes = Vote.query.filter_by(poll_id=poll.id).all()
        for vote in existing_votes:
            try:
                stored_components = json.loads(vote.fingerprint_components)
                similarity = calculate_fingerprint_similarity(
                    stored_components,
                    fingerprint_data['components']
                )
                if similarity >= 0.5:  # Si 50% ou plus de similarité
                    app.logger.warning(f"""
Vote multiple détecté (similarité: {similarity}):
- Sondage ID: {poll.id}
- Share ID: {share_id}
- Premier vote: {vote.created_at.isoformat()}
- Nouvelle tentative: {datetime.now(pytz.UTC).isoformat()}
""")
                    return jsonify({'error': 'Vous avez déjà voté pour ce sondage'}), 400
            except json.JSONDecodeError as e:
                app.logger.error(f"Erreur lors du décodage du fingerprint stocké: {str(e)}")
                continue

        # Créer le nouveau vote
        new_vote = Vote(
            poll_id=poll.id,
            option_id=data['optionId'],
            voter_hash=voter_hash,
            fingerprint_components=fingerprint_components
        )
        
        db.session.add(new_vote)
        db.session.commit()

        app.logger.info(f"""
Vote enregistré avec succès:
- Sondage ID: {poll.id}
- Hash: {voter_hash[:8]}...
- Timestamp: {datetime.now(pytz.UTC).isoformat()}
""")

        return jsonify({'success': True})

    except Exception as e:
        app.logger.error(f"Erreur inattendue lors du vote: {str(e)}")
        return jsonify({'error': 'Erreur inattendue'}), 500

def calculate_fingerprint_similarity(fp1: dict, fp2: dict) -> float:
    """Calcule la similarité entre deux fingerprints."""
    try:
        # S'assurer que les fingerprints sont des dictionnaires
        if isinstance(fp1, str):
            fp1 = json.loads(fp1)
        if isinstance(fp2, str):
            fp2 = json.loads(fp2)

        # Extraire les composants
        components1 = fp1.get('components', fp1)
        components2 = fp2.get('components', fp2)

        # Définir les composants critiques qui doivent correspondre
        critical_components = {
            'deviceId',  # Identifiant unique du dispositif
            'hardwareConcurrency',  # Nombre de cœurs CPU
            'deviceMemory',  # Mémoire RAM
            'platform',  # Plateforme (OS)
            'canvas'  # Empreinte du rendu canvas
        }
        
        # Vérifier les composants critiques
        critical_matches = sum(1 for key in critical_components 
                             if key in components1 and key in components2 
                             and str(components1[key]) == str(components2[key]))
        
        # Si deviceId correspond OU si 3+ composants critiques correspondent
        if (('deviceId' in components1 and 'deviceId' in components2 and 
             components1['deviceId'] == components2['deviceId']) or
            critical_matches >= 3):
            similarity = 1.0  # Considérer comme le même appareil
        else:
            # Calculer la similarité globale pour les autres composants
            common_keys = set(components1.keys()) & set(components2.keys())
            if not common_keys:
                return 0.0

            matches = sum(1 for key in common_keys if str(components1[key]) == str(components2[key]))
            similarity = matches / len(common_keys)

        app.logger.info(f"""
Calcul de similarité:
- deviceId identique: {components1.get('deviceId') == components2.get('deviceId')}
- Composants critiques correspondants: {critical_matches}/{len(critical_components)}
- Similarité globale: {similarity}
""")

        return similarity
    except Exception as e:
        app.logger.error(f"Erreur lors du calcul de similarité: {str(e)}")
        return 0.0

@app.route('/api/polls/<share_id>/stop', methods=['POST'])
def stop_poll(share_id):
    try:
        data = request.get_json()
        if not data or 'deletePassword' not in data:
            return jsonify({'error': 'Mot de passe requis'}), 400

        poll = Poll.query.filter_by(share_id=share_id).first()
        if not poll:
            return jsonify({'error': 'Sondage non trouvé'}), 404
        
        if not poll.is_active:
            return jsonify({'error': 'Le sondage est déjà arrêté'}), 400
        
        if not check_password_hash(poll.delete_password, data['deletePassword']):
            return jsonify({'error': 'Mot de passe incorrect'}), 403

        poll.is_active = False
        db.session.commit()
        return jsonify({'message': 'Sondage arrêté avec succès'})
    except Exception as e:
        app.logger.error(f'Erreur lors de l\'arrêt du sondage {share_id}: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Erreur lors de l\'arrêt du sondage'}), 500

@app.route('/api/polls/<share_id>', methods=['DELETE'])
def delete_poll(share_id):
    try:
        data = request.json
        if not data or 'deletePassword' not in data:
            return jsonify({'error': 'Mot de passe requis'}), 400

        poll = Poll.query.filter_by(share_id=share_id).first()
        if not poll:
            return jsonify({'error': 'Sondage non trouvé'}), 404

        if not check_password_hash(poll.delete_password, data['deletePassword']):
            return jsonify({'error': 'Mot de passe incorrect'}), 403

        db.session.delete(poll)
        db.session.commit()
        return jsonify({'message': 'Sondage supprimé avec succès'})

    except Exception as e:
        app.logger.error(f'Erreur lors de la suppression: {str(e)}')
        db.session.rollback()
        return jsonify({'error': 'Erreur lors de la suppression'}), 500

if __name__ == '__main__':
    with app.app_context():
        cleanup_expired_polls()
    app.run(host='0.0.0.0', port=5001, debug=True)  # host='0.0.0.0' permet l'accès depuis l'extérieur
