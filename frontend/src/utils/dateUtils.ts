export function formatTimeRemaining(expiresAt: string): string {
  // Convertir les dates en UTC
  const now = new Date();
  const expiration = new Date(expiresAt + 'Z'); // Forcer l'interprétation en UTC
  
  // Calculer la différence en millisecondes
  const diffInMilliseconds = expiration.getTime() - now.getTime();
  const diffInSeconds = Math.floor(diffInMilliseconds / 1000);

  if (diffInSeconds <= 0) {
    return "Expiré";
  }

  const hours = Math.floor(diffInSeconds / 3600);
  const minutes = Math.floor((diffInSeconds % 3600) / 60);
  const seconds = diffInSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

// Helper function to check if a poll is expired
export function isPollExpired(expiresAt: string): boolean {
  const now = new Date();
  const expiration = new Date(expiresAt + 'Z'); // Forcer l'interprétation en UTC
  const diffInMilliseconds = expiration.getTime() - now.getTime();
  return diffInMilliseconds <= 0;
}