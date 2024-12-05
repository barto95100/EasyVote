import React, { useState } from 'react';
import { PlusIcon, XMarkIcon, ShareIcon } from '@heroicons/react/24/outline';
import { pollApi } from '../api/api';
import { useNavigate } from 'react-router-dom';
import MetaData from './MetaData';

interface DurationUnit {
  value: number;
  unit: 'minutes' | 'days';
}

const CreatePoll: React.FC = () => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState([{ id: 1, text: '' }, { id: 2, text: '' }]);
  const [duration, setDuration] = useState<DurationUnit>({ value: 7, unit: 'days' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdPollId, setCreatedPollId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordDialogAction, setPasswordDialogAction] = useState<'stop' | 'delete' | null>(null);
  const [passwordDialogMessage, setPasswordDialogMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  const navigate = useNavigate();

  const handleAddOption = () => {
    if (options.length >= 10) {
      setError('Maximum 10 options autorisées');
      return;
    }
    setOptions([...options, { id: Date.now(), text: '' }]);
    setError(null);
  };

  const handleRemoveOption = (id: number) => {
    if (options.length <= 1) {
      setError('Au moins une option est requise');
      return;
    }
    setOptions(options.filter(opt => opt.id !== id));
    setError(null);
  };

  const handleOptionChange = (id: number, value: string) => {
    setOptions(options.map(opt => 
      opt.id === id ? { ...opt, text: value } : opt
    ));
    setError(null);
  };

  const handleDurationChange = (newValue: number, newUnit: 'minutes' | 'days') => {
    // Pas besoin de conversion, on garde simplement la nouvelle valeur
    setDuration({ value: newValue, unit: newUnit });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!title.trim()) {
      setError("Le titre est requis");
      setLoading(false);
      return;
    }

    const validOptions = options
      .map(opt => opt.text.trim())
      .filter(text => text !== '');

    if (validOptions.length < 2) {
      setError("Au moins deux options valides sont requises");
      setLoading(false);
      return;
    }

    // Convertir la durée en heures pour l'API
    const expiresInHours = duration.unit === 'days'
      ? duration.value * 24  // jours en heures
      : duration.value / 60; // minutes en heures (2 minutes = 2/60 = 0.0333... heures)

    // Ajouter une validation plus stricte pour la durée minimale
    const minimumDurationInHours = 0.0166667; // 1 minute en heures

    console.log('Duration sent to API:', {
      value: duration.value,
      unit: duration.unit,
      convertedHours: expiresInHours,
      originalDuration: duration,
      minimumDuration: minimumDurationInHours
    });

    // Vérifier que la durée est valide et supérieure à 1 minute
    if (expiresInHours < minimumDurationInHours) {
      setError("La durée minimale est de 2 minutes");
      setLoading(false);
      return;
    }

    const pollData = {
      title: title.trim(),
      options: validOptions,
      expiresIn: Number(expiresInHours.toFixed(6)), // Arrondir à 6 décimales
      deletePassword: deletePassword.trim()
    };

    try {
      const response = await pollApi.createPoll(pollData);
      setCreatedPollId(response.data.share_id);
      setShowSuccessModal(true);
      
      // Réinitialiser le formulaire
      setTitle('');
      setOptions([{ id: 1, text: '' }, { id: 2, text: '' }]);
      setDuration({ value: 7, unit: 'days' });
      setDeletePassword('');
    } catch (error: any) {
      console.error('Erreur lors de la création du sondage:', error);
      setError(error.response?.data?.error || 'Erreur lors de la création du sondage');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPoll = () => {
    if (createdPollId) {
      navigate(`/poll/${createdPollId}`);
    }
  };

  const handleCopyLink = () => {
    const pollUrl = `${window.location.origin}/poll/${createdPollId}`;
    navigator.clipboard.writeText(pollUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset après 2 secondes
    });
  };

  const showPasswordPrompt = (action: 'stop' | 'delete') => {
    setPasswordDialogAction(action);
    setPasswordDialogMessage(
      action === 'stop' 
        ? 'Entrez le mot de passe pour arrêter le sondage'
        : 'Entrez le mot de passe pour supprimer le sondage'
    );
    setShowPasswordDialog(true);
  };

  const handlePasswordAction = async () => {
    setPasswordError(null);
    setIsValidatingPassword(true);
    
    try {
      if (!deletePassword.trim()) {
        setPasswordError('Le mot de passe est requis');
        return;
      }
      
      // Implémenter la logique pour arrêter/supprimer le sondage
      setShowPasswordDialog(false);
      setDeletePassword('');
    } catch (error: any) {
      setPasswordError(error.message || 'Une erreur est survenue');
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

  return (
    <>
      <MetaData 
        title="Créer un sondage - EasyVote"
        description="Créez facilement un nouveau sondage avec EasyVote. Définissez vos options, la durée et partagez-le avec votre communauté."
        keywords="création sondage, nouveau vote, options de vote, durée sondage, HACF"
      />
      <div className="min-h-screen bg-gray-50 py-6 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow-lg rounded-lg p-4 sm:p-6 md:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">Créer un nouveau sondage</h1>
            
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Titre du sondage
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Entrez le titre du sondage"
                  required
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options du sondage
                </label>
                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={option.text}
                        onChange={(e) => handleOptionChange(option.id, e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder={`Option ${index + 1}`}
                        required
                        disabled={loading}
                        autoComplete="off"
                      />
                      {options.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(option.id)}
                          className="p-2 text-red-600 hover:text-red-800 focus:outline-none"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Ajouter une option
                </button>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Durée du sondage (minimum: 2 minutes)
                </label>
                <div className="mt-1 flex space-x-2">
                  <input
                    type="number"
                    min="1"
                    value={duration.value}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 1, duration.unit)}
                    className="block w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <select
                    value={duration.unit}
                    onChange={(e) => handleDurationChange(duration.value, e.target.value as 'minutes' | 'days')}
                    className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="days">Jours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe de suppression
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Entrez le mot de passe de suppression"
                  disabled={loading}
                  autoComplete="off"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  className="w-full sm:w-auto flex-1 bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  {loading ? 'Création...' : 'Créer le sondage'}
                </button>
              </div>
            </form>
          </div>

          {/* Modal de partage */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4">Sondage créé avec succès !</h2>
                <div className="space-y-4">
                  <p>Votre sondage a été créé avec succès ! Que souhaitez-vous faire ?</p>
                  
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/poll/${createdPollId}`}
                      className="flex-1 bg-transparent text-sm text-gray-600 focus:outline-none"
                    />
                    <button
                      onClick={handleCopyLink}
                      className="flex items-center px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
                    >
                      <ShareIcon className="h-4 w-4 mr-1" />
                      {copied ? (
                        <span className="text-green-600">Copié !</span>
                      ) : (
                        'Copier'
                      )}
                    </button>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowSuccessModal(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      Créer un nouveau sondage
                    </button>
                    <button
                      onClick={handleViewPoll}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Voir le sondage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal mot de passe */}
          {showPasswordDialog && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    {passwordDialogAction === 'stop' ? 'Arrêter le sondage' : 'Supprimer le sondage'}
                  </h2>
                  <button
                    onClick={() => setShowPasswordDialog(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className={`mb-6 p-4 border-l-4 ${
                  passwordDialogAction === 'stop' 
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-700'
                    : 'bg-red-50 border-red-400 text-red-700'
                }`}>
                  <p className="text-sm">
                    {passwordDialogAction === 'stop'
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
                      onChange={(e) => {
                        setDeletePassword(e.target.value);
                        setPasswordError(null);
                      }}
                      onKeyPress={handlePasswordKeyPress}
                      disabled={isValidatingPassword}
                      autoFocus
                    />
                    {passwordError && (
                      <p className="mt-1 text-sm text-red-600">{passwordError}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Entrez le mot de passe que vous avez défini lors de la création du sondage
                    </p>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => setShowPasswordDialog(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      disabled={isValidatingPassword}
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handlePasswordAction}
                      disabled={isValidatingPassword}
                      className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                        passwordDialogAction === 'stop'
                          ? 'bg-yellow-600 hover:bg-yellow-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } ${isValidatingPassword ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {isValidatingPassword ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Validation...
                        </span>
                      ) : (
                        passwordDialogAction === 'stop' ? 'Arrêter le sondage' : 'Supprimer le sondage'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CreatePoll;
