# Endpoints des Votes

## Voter pour une option

### POST /api/polls/{share_id}/vote

Enregistre un vote pour une option dans un sondage spécifique.

#### Paramètres URL
- `share_id` : UUID du sondage

#### Corps de la requête
```json
{
  "option_id": "integer",
  "fingerprint": {
    "userAgent": "string",
    "language": "string",
    "platform": "string",
    "timezone": "string"
  }
}
```

#### Exemple
```json
{
  "option_id": 1,
  "fingerprint": {
    "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "language": "fr-FR",
    "platform": "MacIntel",
    "timezone": "Europe/Paris"
  }
}
```

#### Réponse
```json
{
  "success": true,
  "message": "Vote enregistré avec succès",
  "poll": {
    "id": "string",
    "title": "string",
    "share_id": "uuid",
    "options": [
      {
        "id": "integer",
        "text": "string",
        "votes": "integer"
      }
    ],
    "total_votes": "integer"
  }
}
```

#### Codes de réponse
- `200` : Vote enregistré avec succès
- `400` : Requête invalide
- `404` : Sondage non trouvé
- `409` : Vote en double détecté
- `410` : Sondage expiré ou inactif
- `500` : Erreur serveur

## Protection contre les votes multiples

### Fingerprinting
Le système utilise une combinaison de facteurs pour créer une empreinte unique du votant :
- User Agent du navigateur
- Langue préférée
- Plateforme
- Fuseau horaire

### Algorithme de similarité
- Compare les empreintes des votants
- Seuil de similarité configurable
- Détection des tentatives de contournement

## Exemples d'utilisation

### JavaScript (Fetch)
```javascript
const submitVote = async (shareId, voteData) => {
  try {
    const response = await fetch(`http://localhost:5001/api/polls/${shareId}/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(voteData),
    });
    
    if (response.status === 409) {
      throw new Error('Vous avez déjà voté pour ce sondage');
    }
    
    return response.json();
  } catch (error) {
    console.error('Erreur lors du vote:', error);
    throw error;
  }
};
```

### Python (Requests)
```python
import requests

def submit_vote(share_id, option_id, fingerprint):
    vote_data = {
        "option_id": option_id,
        "fingerprint": fingerprint
    }
    
    response = requests.post(
        f'http://localhost:5001/api/polls/{share_id}/vote',
        json=vote_data
    )
    
    if response.status_code == 409:
        raise Exception("Vote en double détecté")
        
    return response.json()
```

## Bonnes pratiques
1. Toujours inclure une empreinte complète
2. Gérer les erreurs de vote en double
3. Vérifier l'état du sondage avant de voter
4. Mettre à jour l'interface utilisateur après un vote réussi