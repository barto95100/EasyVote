FROM python:3.9-slim

WORKDIR /app

# Installation des dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie des sources
COPY . .

# Port utilisé par l'application
EXPOSE 5001

# Démarrage avec Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5001", "app:app", "--workers", "4"]