import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pollApi } from '../api/api';
import { generateVoteFingerprint, hasVotedForPoll, markPollAsVoted } from '../utils/fingerprint';
import { formatTimeRemaining, isPollExpired } from '../utils/dateUtils';
import MetaData from './MetaData';

interface Poll {
  id: number;
  title: string;
  share_id: string;
  expires_at: string;
  is_active: boolean;
  options: {
    id: number;
    text: string;
    votes: number;
  }[];
  total_votes: number;
}

export default function SharedPoll() {
  const { shareId = '' } = useParams<{ shareId: string }>();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [voting, setVoting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalAction, setPasswordModalAction] = useState<'stop' | 'delete' | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);

  useEffect(() => {
    const fetchPoll = async () => {
      if (!shareId) {
        setError('Identifiant de sondage invalide');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await pollApi.getPoll(shareId);
        setPoll(response.data);
        
        // Vérifier si l'utilisateur a déjà voté
        const userHasVoted = hasVotedForPoll(shareId);
        setHasVoted(userHasVoted);
        if (userHasVoted) {
          setError('Vous avez déjà voté pour ce sondage');
        }
        
        // Vérifier si le sondage est expiré
        const pollExpired = !response.data.is_active || isPollExpired(response.data.expires_at);
        setIsExpired(pollExpired);
        
        if (response.data.is_active) {
          setTimeRemaining(formatTimeRemaining(response.data.expires_at));
        } else {
          setIsExpired(true);
          setTimeRemaining("Expiré");
        }
        
        setLoading(false);
      } catch (err) {
        setError('Erreur lors du chargement du sondage');
        setLoading(false);
      }
    };

    fetchPoll();
  }, [shareId]);

  useEffect(() => {
    if (poll?.expires_at && !isExpired) {
      const timer = setInterval(() => {
        if (isPollExpired(poll.expires_at)) {
          setIsExpired(true);
          setTimeRemaining("Expiré");
          clearInterval(timer);
        } else {
          setTimeRemaining(formatTimeRemaining(poll.expires_at));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [poll?.expires_at, isExpired]);

  const handleVote = async () => {
    if (!poll || !selectedOption || voting || isExpired) {
      return;
    }

    try {
      setVoting(true);
      const fingerprint = await generateVoteFingerprint(shareId);
      
      const response = await pollApi.vote(poll.share_id, {
        optionId: selectedOption,
        fingerprint: fingerprint
      });

      if (response.data.success) {
        // Marquer le sondage comme voté dans les cookies
        markPollAsVoted(shareId);
        setHasVoted(true);
        
        // Mettre à jour les résultats du sondage
        const updatedPoll = await pollApi.getPoll(shareId);
        setPoll(updatedPoll.data);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Erreur lors du vote (Votre avis compte, mais une seule fois !)');
    } finally {
      setVoting(false);
    }
  };

  const handlePasswordAction = async () => {
    if (!password.trim()) {
      setPasswordError('Le mot de passe est requis');
      return;
    }

    setIsValidatingPassword(true);
    try {
      if (passwordModalAction === 'stop') {
        await pollApi.stopPoll(shareId, password);
        setPoll(prev => prev ? { ...prev, is_active: false } : null);
      } else if (passwordModalAction === 'delete') {
        await pollApi.deletePoll(shareId, password);
        // Rediriger vers la page d'accueil
        window.location.href = '/';
      }
      setShowPasswordModal(false);
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Mot de passe incorrect');
    } finally {
      setIsValidatingPassword(false);
    }
  };

  const handlePasswordKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isValidatingPassword) {
      e.preventDefault();
      handlePasswordAction();
    }
  };

  // Fonction pour calculer le pourcentage de votes
  const calculatePercentage = (votes: number) => {
    if (!poll || poll.total_votes === 0) return 0;
    return Math.round((votes / poll.total_votes) * 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="text-center p-4">
        <p className="text-red-500">{error || 'Sondage non trouvé'}</p>
      </div>
    );
  }

  return (
    <>
      <MetaData 
        title={`${poll?.title || 'Sondage'} - EasyVote`}
        description={`Participez au sondage : ${poll?.title || 'Chargement...'} - Votez et partagez votre opinion !`}
        keywords="vote, sondage partagé, participation, HACF, opinion"
        ogTitle={`Sondage : ${poll?.title || 'Participez au vote !'}`}
        ogDescription={`Votre avis compte ! Participez au sondage : ${poll?.title || 'Chargement...'}`}
      />
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">{poll.title}</h1>
            {poll.is_active && (
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setPasswordModalAction('stop');
                    setShowPasswordModal(true);
                    setPassword('');
                    setPasswordError(null);
                  }}
                  className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                >
                  Arrêter
                </button>
                <button
                  onClick={() => {
                    setPasswordModalAction('delete');
                    setShowPasswordModal(true);
                    setPassword('');
                    setPasswordError(null);
                  }}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                >
                  Supprimer
                </button>
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {isExpired ? (
                <span className="text-red-500">Sondage terminé</span>
              ) : (
                <>Temps restant : <span className="font-medium">{timeRemaining}</span></>
              )}
            </p>
            {error && <p className="text-red-500 mt-2">{error}</p>}
          </div>

          <div className="space-y-4">
            {poll.options.map((option) => (
              <div key={option.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center space-x-3">
                    <input
                      type="radio"
                      name="option"
                      value={option.id}
                      onChange={() => setSelectedOption(option.id)}
                      disabled={isExpired || hasVoted}
                      className="form-radio h-5 w-5 text-blue-600"
                    />
                    <span className="text-lg">{option.text}</span>
                  </label>
                  {(hasVoted || isExpired) && (
                    <span className="text-sm font-medium">
                      {calculatePercentage(option.votes)}%
                    </span>
                  )}
                </div>
                {(hasVoted || isExpired) && (
                  <div className="relative pt-1">
                    <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                      <div
                        style={{ width: `${calculatePercentage(option.votes)}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                      />
                    </div>
                    <div className="text-right mt-1">
                      <span className="text-sm text-gray-600">
                        {option.votes} vote{option.votes !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!isExpired && !hasVoted && (
            <button
              onClick={handleVote}
              disabled={!selectedOption || voting}
              className={`mt-6 w-full py-2 px-4 rounded-md ${
                !selectedOption || voting
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
            >
              {voting ? 'Vote en cours...' : 'Voter'}
            </button>
          )}

          {(hasVoted || isExpired) && (
            <div className="mt-4 text-center text-sm text-gray-600">
              Total des votes : {poll.total_votes}
            </div>
          )}
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
}
