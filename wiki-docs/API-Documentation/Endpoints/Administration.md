# Endpoints d'Administration

## Arrêter un sondage

### POST /api/polls/{share_id}/stop

Arrête un sondage en cours, empêchant tout nouveau vote.

#### Paramètres URL
- `share_id` : UUID du sondage

#### Corps de la requête
```json
{
  "delete_password": "string"
}
```

#### Exemple
```json
{
  "delete_password": "secret123"
}
```

#### Réponse
```json
{
  "success": true,
  "message": "Sondage arrêté avec succès",
  "poll": {
    "id": "string",
    "title": "string",
    "share_id": "uuid",
    "is_active": false,
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
- `200` : Sondage arrêté avec succès
- `400` : Requête invalide
- `401` : Mot de passe incorrect
- `404` : Sondage non trouvé
- `500` : Erreur serveur

## Supprimer un sondage

### DELETE /api/polls/{share_id}

Supprime définitivement un sondage et toutes ses données associées.

#### Paramètres URL
- `share_id` : UUID du sondage

#### Corps de la requête
```json
{
  "delete_password": "string"
}
```

#### Exemple
```json
{
  "delete_password": "secret123"
}
```

#### Réponse
```json
{
  "success": true,
  "message": "Sondage supprimé avec succès"
}
```

#### Codes de réponse
- `200` : Sondage supprimé avec succès
- `400` : Requête invalide
- `401` : Mot de passe incorrect
- `404` : Sondage non trouvé
- `500` : Erreur serveur

## Exemples d'utilisation

### JavaScript (Fetch)
```javascript
// Arrêter un sondage
const stopPoll = async (shareId, password) => {
  try {
    const response = await fetch(`http://localhost:5001/api/polls/${shareId}/stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ delete_password: password }),
    });
    
    if (response.status === 401) {
      throw new Error('Mot de passe incorrect');
    }
    
    return response.json();
  } catch (error) {
    console.error('Erreur lors de l\'arrêt du sondage:', error);
    throw error;
  }
};

// Supprimer un sondage
const deletePoll = async (shareId, password) => {
  try {
    const response = await fetch(`http://localhost:5001/api/polls/${shareId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ delete_password: password }),
    });
    
    if (response.status === 401) {
      throw new Error('Mot de passe incorrect');
    }
    
    return response.json();
  } catch (error) {
    console.error('Erreur lors de la suppression du sondage:', error);
    throw error;
  }
};
```

### Python (Requests)
```python
import requests

def stop_poll(share_id, password):
    response = requests.post(
        f'http://localhost:5001/api/polls/{share_id}/stop',
        json={"delete_password": password}
    )
    
    if response.status_code == 401:
        raise Exception("Mot de passe incorrect")
        
    return response.json()

def delete_poll(share_id, password):
    response = requests.delete(
        f'http://localhost:5001/api/polls/{share_id}',
        json={"delete_password": password}
    )
    
    if response.status_code == 401:
        raise Exception("Mot de passe incorrect")
        
    return response.json()
```

## Bonnes pratiques
1. Stocker le mot de passe de manière sécurisée
2. Confirmer les actions destructives
3. Informer les utilisateurs des conséquences
4. Gérer correctement les erreurs d'authentification