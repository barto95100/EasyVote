from app import db
from flask import Flask
from sqlalchemy import text

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///polls.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def migrate():
    with app.app_context():
        # Supprimer l'ancienne table VotedIP
        with db.engine.connect() as conn:
            conn.execute(text('DROP TABLE IF EXISTS voted_ip'))
            conn.commit()
        
        # Recréer les tables avec le nouveau schéma
        db.create_all()
        
        print("Migration terminée avec succès!")

if __name__ == '__main__':
    migrate()
