import axios from 'axios';

// Utiliser l'URL de base relative pour que le proxy de Vite fonctionne
const API_BASE_URL = '/api';

interface VoteData {
  optionId: number;
  fingerprint: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  response => response,
  error => {
    try {
      if (error.response) {
        // La requête a été faite et le serveur a répondu avec un code d'erreur
        return Promise.reject(error.response.data);
      } else if (error.request) {
        // La requête a été faite mais aucune réponse n'a été reçue
        return Promise.reject({ error: 'Erreur de connexion au serveur' });
      } else {
        // Une erreur s'est produite lors de la configuration de la requête
        return Promise.reject({ error: 'Une erreur est survenue' });
      }
    } catch (error: any) {
      if (error.response) {
        throw error;
      } else if (error.request) {
        throw new Error('Erreur réseau: Impossible de contacter le serveur');
      } else {
        throw error;
      }
    }
  }
);

export const pollApi = {
  createPoll: (data: any) => api.post('/polls', data),
  getPoll: (shareId: string) => api.get(`/polls/${shareId}`),
  getPolls: () => api.get('/polls'),
  vote: (shareId: string, data: VoteData) => api.post(`/polls/${shareId}/vote`, data),
  deletePoll: (shareId: string, password: string) => 
    api.delete(`/polls/${shareId}`, { data: { deletePassword: password } }),
  stopPoll: (shareId: string, password: string) => 
    api.post(`/polls/${shareId}/stop`, { deletePassword: password }),
};
