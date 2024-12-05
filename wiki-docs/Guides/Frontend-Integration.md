# Guide d'intégration Frontend

## Introduction
Ce guide explique comment intégrer l'API EasyVote dans votre application frontend, avec des exemples en React, Vue.js et JavaScript vanilla.

## Table des matières
1. [Configuration](#configuration)
2. [Exemples d'intégration](#exemples-dintégration)
3. [Bonnes pratiques](#bonnes-pratiques)
4. [Composants réutilisables](#composants-réutilisables)

## Configuration

### Variables d'environnement
```env
VITE_API_URL=http://localhost:5001
```

### Client API
```typescript
// src/api/client.ts
const API_URL = import.meta.env.VITE_API_URL;

export class ApiClient {
  static async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error('API Error');
    return response.json();
  }

  static async post(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  }
}
```

## Exemples d'intégration

### React avec TypeScript

#### Types
```typescript
// src/types/poll.ts
interface Option {
  id: number;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  title: string;
  share_id: string;
  expires_at: string;
  is_active: boolean;
  options: Option[];
  total_votes: number;
}
```

#### Hook personnalisé
```typescript
// src/hooks/usePoll.ts
import { useState, useEffect } from 'react';
import { ApiClient } from '../api/client';

export function usePoll(shareId: string) {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const data = await ApiClient.get(`/polls/${shareId}`);
        setPoll(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchPoll();
  }, [shareId]);

  return { poll, loading, error };
}
```

#### Composant
```typescript
// src/components/PollDetail.tsx
import React from 'react';
import { usePoll } from '../hooks/usePoll';

interface Props {
  shareId: string;
}

export function PollDetail({ shareId }: Props) {
  const { poll, loading, error } = usePoll(shareId);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;
  if (!poll) return null;

  return (
    <div className="poll-detail">
      <h1>{poll.title}</h1>
      <div className="options">
        {poll.options.map(option => (
          <div key={option.id} className="option">
            <span>{option.text}</span>
            <span>{option.votes} votes</span>
          </div>
        ))}
      </div>
      <div className="total">
        Total: {poll.total_votes} votes
      </div>
    </div>
  );
}
```

### Vue.js 3 avec Composition API

#### Store
```typescript
// src/stores/polls.ts
import { defineStore } from 'pinia';
import { ApiClient } from '../api/client';

export const usePollsStore = defineStore('polls', {
  state: () => ({
    polls: [],
    currentPoll: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchPoll(shareId: string) {
      this.loading = true;
      try {
        const poll = await ApiClient.get(`/polls/${shareId}`);
        this.currentPoll = poll;
      } catch (error) {
        this.error = error;
      } finally {
        this.loading = false;
      }
    },

    async vote(shareId: string, optionId: number) {
      const fingerprint = await this.getFingerprint();
      return ApiClient.post(`/polls/${shareId}/vote`, {
        option_id: optionId,
        fingerprint,
      });
    },
  },
});
```

#### Composant
```vue
<!-- src/components/PollVoting.vue -->
<template>
  <div class="poll-voting">
    <div v-if="loading">Chargement...</div>
    <div v-else-if="error">{{ error }}</div>
    <div v-else-if="poll">
      <h2>{{ poll.title }}</h2>
      <div class="options">
        <button
          v-for="option in poll.options"
          :key="option.id"
          @click="vote(option.id)"
          :disabled="hasVoted"
        >
          {{ option.text }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { usePollsStore } from '../stores/polls';

const props = defineProps({
  shareId: String,
});

const store = usePollsStore();
const hasVoted = ref(false);

onMounted(() => {
  store.fetchPoll(props.shareId);
});

async function vote(optionId) {
  try {
    await store.vote(props.shareId, optionId);
    hasVoted.value = true;
  } catch (error) {
    console.error('Erreur de vote:', error);
  }
}
</script>
```

## Bonnes pratiques

### Gestion des erreurs
```typescript
// src/utils/errorHandling.ts
export function handleApiError(error: any) {
  if (error.response) {
    switch (error.response.status) {
      case 404:
        return 'Sondage non trouvé';
      case 409:
        return 'Vous avez déjà voté';
      case 410:
        return 'Ce sondage est expiré';
      default:
        return 'Une erreur est survenue';
    }
  }
  return 'Erreur de connexion';
}
```

### Protection contre les votes multiples
```typescript
// src/utils/fingerprint.ts
import FingerprintJS from '@fingerprintjs/fingerprintjs';

export async function getFingerprint() {
  const fp = await FingerprintJS.load();
  const result = await fp.get();
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    visitorId: result.visitorId,
  };
}
```

## Composants réutilisables

### Barre de progression
```typescript
// src/components/VoteProgress.tsx
interface Props {
  votes: number;
  total: number;
}

export function VoteProgress({ votes, total }: Props) {
  const percentage = total > 0 ? (votes / total) * 100 : 0;
  
  return (
    <div className="progress-bar">
      <div 
        className="progress"
        style={{ width: `${percentage}%` }}
      />
      <span>{percentage.toFixed(1)}%</span>
    </div>
  );
}
```

### Minuteur d'expiration
```typescript
// src/components/ExpirationTimer.tsx
interface Props {
  expiresAt: string;
}

export function ExpirationTimer({ expiresAt }: Props) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const expiration = new Date(expiresAt);
      const diff = expiration.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('Expiré');
        clearInterval(timer);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setTimeLeft(`${days}j ${hours}h`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  return <div className="expiration-timer">{timeLeft}</div>;
}