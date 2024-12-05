// Utiliser l'URL actuelle du navigateur pour l'API
const getApiUrl = () => {
  const hostname = window.location.hostname;
  return `http://${hostname}:5001`;
};

export const API_URL = getApiUrl();
