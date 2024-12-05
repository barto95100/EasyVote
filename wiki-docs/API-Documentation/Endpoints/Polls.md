# Endpoints des Sondages

## Liste des sondages

### GET /api/polls

Récupère la liste de tous les sondages actifs.

#### Paramètres
Aucun

#### Réponse
```json
[
  {
    "id": "string",
    "title": "string",
    "share_id": "uuid",
    "expires_at": "datetime",
    "is_active": "boolean",
    "options": [
      {
        "id": "integer",
        "text": "string",
        "votes": "integer"
      }
    ],
    "total_votes": "integer"
  }
]
```

#### Codes de réponse
- `200` : Succès
- `500` : Erreur serveur

## Créer un sondage

### POST /api/polls

Crée un nouveau sondage.

#### Corps de la requête
```json
{
  "title": "string",
  "options": ["string"],
  "expires_in_days": "integer",
  "delete_password": "string"
}
```

#### Exemple
```json
{
  "title": "Meilleur langage de programmation ?",
  "options": ["Python", "JavaScript", "Java"],
  "expires_in_days": 7,
  "delete_password": "secret123"
}
```

#### Réponse
```json
{
  "id": "string",
  "title": "string",
  "share_id": "uuid",
  "expires_at": "datetime",
  "is_active": true,
  "options": [
    {
      "id": "integer",
      "text": "string",
      "votes": 0
    }
  ],
  "total_votes": 0
}
```

#### Codes de réponse
- `201` : Sondage créé
- `400` : Requête invalide
- `500` : Erreur serveur

## Obtenir un sondage

### GET /api/polls/{share_id}

Récupère les détails d'un sondage spécifique.

#### Paramètres URL
- `share_id` : UUID du sondage

#### Réponse
```json
{
  "id": "string",
  "title": "string",
  "share_id": "uuid",
  "expires_at": "datetime",
  "is_active": "boolean",
  "options": [
    {
      "id": "integer",
      "text": "string",
      "votes": "integer"
    }
  ],
  "total_votes": "integer"
}
```

#### Codes de réponse
- `200` : Succès
- `404` : Sondage non trouvé
- `500` : Erreur serveur

## Exemples d'utilisation

### JavaScript (Fetch)
```javascript
// Créer un sondage
const createPoll = async (pollData) => {
  const response = await fetch('http://localhost:5001/api/polls', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(pollData),
  });
  return response.json();
};

// Obtenir un sondage
const getPoll = async (shareId) => {
  const response = await fetch(`http://localhost:5001/api/polls/${shareId}`);
  return response.json();
};
```

### Python (Requests)
```python
import requests

# Créer un sondage
poll_data = {
    "title": "Meilleur langage de programmation ?",
    "options": ["Python", "JavaScript", "Java"],
    "expires_in_days": 7,
    "delete_password": "secret123"
}
response = requests.post('http://localhost:5001/api/polls', json=poll_data)
poll = response.json()

# Obtenir un sondage
share_id = poll['share_id']
response = requests.get(f'http://localhost:5001/api/polls/{share_id}')
poll_details = response.json()
```