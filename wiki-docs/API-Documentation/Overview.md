# Vue d'ensemble de l'API EasyVote

## Introduction
L'API EasyVote est une API RESTful qui permet de créer et gérer des sondages en ligne. Elle utilise JSON pour les formats de requête et de réponse.

## Base URL
- Production : `https://api.easyvote.com/api`
- Développement : `http://localhost:5001/api`

## Caractéristiques principales
- API RESTful
- Format JSON
- Protection contre les votes multiples
- Gestion des sondages avec date d'expiration
- Support multi-plateforme

## Configuration requise
### Headers
Toutes les requêtes doivent inclure :
```http
Content-Type: application/json
```

### CORS
L'API supporte CORS (Cross-Origin Resource Sharing) avec les configurations suivantes :
- Origines autorisées : `*`
- Méthodes : `GET`, `POST`, `DELETE`, `OPTIONS`
- Headers : `Content-Type`

## Sécurité
- Protection contre les votes multiples via fingerprinting
- Mot de passe requis pour les opérations d'administration
- Validation des données côté serveur
- Sanitization des entrées utilisateur

## Rate Limiting
- 100 requêtes par minute par IP
- Headers de réponse incluant :
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`

## Versions
- Version actuelle : v1
- Schéma URL : `/api/v1/`
- Rétrocompatibilité garantie

## Structure des données

### Sondage (Poll)
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

### Vote
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

## Navigation
- [Endpoints des sondages](./Endpoints/Polls)
- [Endpoints des votes](./Endpoints/Votes)
- [Endpoints d'administration](./Endpoints/Administration)
- [Codes d'erreur](./Error-Codes)

## Support
Pour toute question ou problème :
1. Consultez les [guides](../Guides/Getting-Started)
2. Ouvrez une [issue](https://github.com/[username]/vote-app/issues)
3. Contactez l'équipe de support