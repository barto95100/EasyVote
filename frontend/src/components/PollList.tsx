import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { pollApi } from '../api/api';
import { formatTimeRemaining } from '../utils/dateUtils';
import {
  ShareIcon,
  TrashIcon,
  ClockIcon,
  StopIcon
} from '@heroicons/react/24/outline';
import MetaData from './MetaData';

interface Poll {
  id: number;
  title: string;
  share_id: string;
  expires_at: string;
  is_active: boolean;
  total_votes: number;
}

const PollList: React.FC = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemainingMap, setTimeRemainingMap] = useState<Record<string, string>>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalAction, setPasswordModalAction] = useState<'stop' | 'delete' | null>(null);
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      const response = await pollApi.getPolls();
      setPolls(response.data);
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la récupération des sondages');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const updateTimeRemaining = useCallback(() => {
    const newTimeMap: Record<string, string> = {};
    polls.forEach(poll => {
      if (!poll.is_active) {
        newTimeMap[poll.share_id] = "Expiré";
      } else {
        const timeRemaining = formatTimeRemaining(poll.expires_at);
        if (timeRemaining === "Expiré") {
          // Si le temps est expiré mais que le sondage est toujours actif,
          // forcer un rafraîchissement pour mettre à jour l'état
          fetchPolls();
        }
        newTimeMap[poll.share_id] = timeRemaining;
      }
    });
    setTimeRemainingMap(newTimeMap);
  }, [polls, fetchPolls]);

  useEffect(() => {
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000); // Mise à jour chaque seconde
    return () => clearInterval(interval);
  }, [updateTimeRemaining]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchPolls();
    }, 30000); // Rafraîchir toutes les 30 secondes
    return () => clearInterval(interval);
  }, [fetchPolls]);

  const handlePasswordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isValidatingPassword) {
      e.preventDefault();
      handlePasswordAction();
    }
  };

  const handlePasswordAction = async () => {
    if (!password.trim() || !selectedPollId) {
      setPasswordError('Le mot de passe est requis');
      return;
    }

    setIsValidatingPassword(true);
    try {
      if (passwordModalAction === 'stop') {
        await pollApi.stopPoll(selectedPollId, password);
      } else if (passwordModalAction === 'delete') {
        await pollApi.deletePoll(selectedPollId, password);
      }
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError(null);
      await fetchPolls();
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Mot de passe incorrect');
    } finally {
      setIsValidatingPassword(false);
    }
  };

  const handleStopPoll = (shareId: string) => {
    setSelectedPollId(shareId);
    setPasswordModalAction('stop');
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError(null);
  };

  const handleDeletePoll = (shareId: string) => {
    setSelectedPollId(shareId);
    setPasswordModalAction('delete');
    setShowPasswordModal(true);
    setPassword('');
    setPasswordError(null);
  };

  const handleShare = async (shareId: string) => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/poll/${shareId}`);
      // On pourrait ajouter un toast ou une notification ici
    } catch (error: any) {
      setError('Erreur lors de la copie du lien');
    }
  };

  const copyShareLink = (shareId: string) => {
    const link = `${window.location.origin}/poll/${shareId}`;
    navigator.clipboard.writeText(link);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <>
      <MetaData 
        title="Mes Sondages - EasyVote"
        description="Gérez vos sondages EasyVote. Consultez, partagez et suivez les résultats de tous vos sondages actifs."
        keywords="liste sondages, gestion votes, résultats sondage, HACF, sondages actifs"
      />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Mes Sondages</h1>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 shadow-sm rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Titre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temps Restant</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Votes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">État</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {polls.map(poll => (
                <tr key={poll.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link 
                      to={`/poll/${poll.share_id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {poll.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 mr-1 text-gray-500" />
                      <span className={!poll.is_active || timeRemainingMap[poll.share_id] === "Expiré" 
                        ? "text-red-600" 
                        : "text-green-600"
                      }>
                        {timeRemainingMap[poll.share_id] || formatTimeRemaining(poll.expires_at)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">{poll.total_votes}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      !poll.is_active || timeRemainingMap[poll.share_id] === "Expiré"
                        ? 'bg-red-100 text-red-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {!poll.is_active || timeRemainingMap[poll.share_id] === "Expiré" ? 'Expiré' : 'Actif'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShare(poll.share_id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Partager"
                      >
                        <ShareIcon className="h-5 w-5" />
                      </button>
                      {poll.is_active && timeRemainingMap[poll.share_id] !== "Expiré" && (
                        <button
                          onClick={() => handleStopPoll(poll.share_id)}
                          className="text-yellow-600 hover:text-yellow-800"
                          title="Arrêter"
                        >
                          <StopIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePoll(poll.share_id)}
                        className="text-red-600 hover:text-red-800"
                        title="Supprimer"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {passwordModalAction === 'stop' ? 'Arrêter le sondage' : 'Supprimer le sondage'}
                </h2>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className={`mb-6 p-4 border-l-4 ${
                passwordModalAction === 'stop' 
                  ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                  : 'bg-red-50 border-red-400 text-red-700'
              }`}>
                <p className="text-sm">
                  {passwordModalAction === 'stop'
                    ? 'Cette action arrêtera le sondage. Plus aucun vote ne sera accepté.'
                    : 'Cette action supprimera définitivement le sondage et tous ses votes.'
                  }
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe de confirmation
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Entrez le mot de passe"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm ${
                      passwordError 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError(null);
                    }}
                    onKeyPress={handlePasswordKeyPress}
                    disabled={isValidatingPassword}
                    autoFocus
                  />
                  {passwordError && (
                    <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <button
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={isValidatingPassword}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handlePasswordAction}
                    disabled={isValidatingPassword}
                    className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                      passwordModalAction === 'stop'
                        ? 'bg-yellow-600 hover:bg-yellow-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } ${isValidatingPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isValidatingPassword ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Validation...
                      </span>
                    ) : (
                      passwordModalAction === 'stop' ? 'Arrêter le sondage' : 'Supprimer le sondage'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PollList;
