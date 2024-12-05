# Codes d'erreur

## Vue d'ensemble
L'API EasyVote utilise les codes d'état HTTP standard ainsi que des messages d'erreur détaillés pour communiquer les problèmes aux clients.

## Format des erreurs
Toutes les erreurs suivent le format suivant :
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

## Codes HTTP

### 2xx Succès
| Code | Description | Exemple d'utilisation |
|------|-------------|----------------------|
| 200  | OK | Requête réussie |
| 201  | Created | Création d'un nouveau sondage |

### 4xx Erreurs Client
| Code | Description | Exemple d'utilisation |
|------|-------------|----------------------|
| 400  | Bad Request | Données de requête invalides |
| 401  | Unauthorized | Mot de passe incorrect |
| 404  | Not Found | Sondage non trouvé |
| 409  | Conflict | Vote en double détecté |
| 410  | Gone | Sondage expiré |
| 429  | Too Many Requests | Rate limit dépassé |

### 5xx Erreurs Serveur
| Code | Description | Exemple d'utilisation |
|------|-------------|----------------------|
| 500  | Internal Server Error | Erreur inattendue |
| 503  | Service Unavailable | Maintenance |

## Codes d'erreur spécifiques

### Erreurs de sondage (POLL_*)
| Code | Message | Description |
|------|---------|-------------|
| POLL_NOT_FOUND | "Sondage non trouvé" | Le share_id spécifié n'existe pas |
| POLL_EXPIRED | "Sondage expiré" | Le sondage a dépassé sa date d'expiration |
| POLL_INACTIVE | "Sondage inactif" | Le sondage a été arrêté manuellement |
| POLL_INVALID_PASSWORD | "Mot de passe incorrect" | Le mot de passe fourni est invalide |

### Erreurs de vote (VOTE_*)
| Code | Message | Description |
|------|---------|-------------|
| VOTE_DUPLICATE | "Vote en double détecté" | L'utilisateur a déjà voté |
| VOTE_INVALID_OPTION | "Option de vote invalide" | L'option_id spécifié n'existe pas |
| VOTE_MISSING_FINGERPRINT | "Empreinte manquante" | Les données de fingerprint sont incomplètes |

### Erreurs de validation (VALIDATION_*)
| Code | Message | Description |
|------|---------|-------------|
| VALIDATION_TITLE_REQUIRED | "Titre requis" | Le titre du sondage est manquant |
| VALIDATION_OPTIONS_MIN | "Minimum 2 options requises" | Pas assez d'options de vote |
| VALIDATION_OPTIONS_MAX | "Maximum 10 options autorisées" | Trop d'options de vote |

### Erreurs de rate limit (RATE_*)
| Code | Message | Description |
|------|---------|-------------|
| RATE_LIMIT_EXCEEDED | "Trop de requêtes" | Rate limit dépassé |

## Gestion des erreurs

### JavaScript
```javascript
try {
  const response = await fetch('/api/polls/...');
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error.message);
  }
  
  return data;
} catch (error) {
  console.error('Erreur:', error.message);
  // Gérer l'erreur de manière appropriée
}
```

### Python
```python
try:
    response = requests.post('/api/polls/...')
    response.raise_for_status()  # Lève une exception pour les codes 4xx/5xx
    data = response.json()
except requests.exceptions.HTTPError as e:
    error_data = e.response.json()
    print(f"Erreur: {error_data['error']['message']}")
    # Gérer l'erreur de manière appropriée
```

## Bonnes pratiques
1. Toujours vérifier le code de statut HTTP
2. Parser le corps de la réponse pour les détails de l'erreur
3. Implémenter une gestion d'erreur appropriée
4. Afficher des messages d'erreur conviviaux aux utilisateurs
5. Logger les erreurs côté client pour le débogage