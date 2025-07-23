import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { invoke } from '../utils/tauriProxy';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isFirstRun?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, isFirstRun = false }) => {
  const {
    apiSettings,
    rateLimits,
    apiUsage,
    isConnected,
    connectionError,
    updateApiSettings,
    updateRateLimits,
    validateApiKey,
    setConnectionStatus,
  } = useSettingsStore();

  const [localApiKey, setLocalApiKey] = useState('');
  const [localEndpoint, setLocalEndpoint] = useState(apiSettings.endpoint);
  const [localModel, setLocalModel] = useState(apiSettings.model);
  const [localMaxTokens, setLocalMaxTokens] = useState(apiSettings.maxTokens);
  const [localTemperature, setLocalTemperature] = useState(apiSettings.temperature);
  const [localRateLimits, setLocalRateLimits] = useState(rateLimits);
  
  const [isValidating, setIsValidating] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    // Load API key from secure storage when modal opens
    if (isOpen) {
      loadApiKey();
    }
  }, [isOpen]);

  const loadApiKey = async () => {
    try {
      const key = await invoke<string>('get_api_key');
      if (key) {
        setLocalApiKey(key);
      }
    } catch (error) {
      console.error('Failed to load API key:', error);
    }
  };

  const handleSave = async () => {
    if (!localApiKey) {
      setConnectionStatus(false, 'API key is required');
      return;
    }

    if (!validateApiKey(localApiKey)) {
      setConnectionStatus(false, 'Invalid API key format. Claude API keys start with "sk-ant-"');
      return;
    }

    setIsValidating(true);

    try {
      // Save API key securely
      await invoke('save_api_key', { apiKey: localApiKey });

      // Update settings
      updateApiSettings({
        endpoint: localEndpoint,
        model: localModel,
        maxTokens: localMaxTokens,
        temperature: localTemperature,
      });

      updateRateLimits(localRateLimits);

      // Test the API connection
      const isValid = await invoke<boolean>('validate_api_connection', {
        apiKey: localApiKey,
        endpoint: localEndpoint,
      });

      if (isValid) {
        setConnectionStatus(true);
        setHasUnsavedChanges(false);
        if (!isFirstRun) {
          onClose();
        }
      } else {
        setConnectionStatus(false, 'Failed to connect to Claude API. Please check your API key.');
      }
    } catch (error) {
      setConnectionStatus(false, `Error: ${error}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    
    if (!isFirstRun) {
      onClose();
    }
  };

  const handleInputChange = () => {
    setHasUnsavedChanges(true);
  };

  const getUsagePercentage = () => {
    return (apiUsage.totalTokens / rateLimits.maxTokensPerDay) * 100;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity" onClick={!isFirstRun ? handleCancel : undefined} />

        <div className="relative inline-block w-full max-w-2xl p-6 my-8 text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {isFirstRun ? 'Welcome to ClaudeFlow' : 'Settings'}
            </h2>
            {!isFirstRun && (
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {isFirstRun && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200">
                To get started with ClaudeFlow, you need to configure your Claude API key. 
                You can get an API key from{' '}
                <a
                  href="https://console.anthropic.com/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:text-blue-600"
                >
                  console.anthropic.com
                </a>
              </p>
            </div>
          )}

          {/* Connection Status */}
          {!isFirstRun && (
            <div className="mb-6">
              <div className={`p-3 rounded-lg flex items-center gap-3 ${
                isConnected 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                  : connectionError
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                <div className={`w-3 h-3 rounded-full ${
                  isConnected ? 'bg-green-500' : connectionError ? 'bg-red-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm font-medium">
                  {isConnected ? 'Connected to Claude API' : connectionError || 'Not connected'}
                </span>
              </div>
            </div>
          )}

          {/* API Configuration */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                API Configuration
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={localApiKey}
                      onChange={(e) => {
                        setLocalApiKey(e.target.value);
                        handleInputChange();
                      }}
                      placeholder="sk-ant-..."
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute inset-y-0 right-0 px-3 flex items-center"
                    >
                      {showApiKey ? (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Your API key is stored securely and never sent to our servers
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    API Endpoint
                  </label>
                  <input
                    type="url"
                    value={localEndpoint}
                    onChange={(e) => {
                      setLocalEndpoint(e.target.value);
                      handleInputChange();
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Model
                    </label>
                    <select
                      value={localModel}
                      onChange={(e) => {
                        setLocalModel(e.target.value);
                        handleInputChange();
                      }}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    >
                      <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                      <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Max Tokens
                    </label>
                    <input
                      type="number"
                      value={localMaxTokens}
                      onChange={(e) => {
                        setLocalMaxTokens(parseInt(e.target.value) || 0);
                        handleInputChange();
                      }}
                      min="1"
                      max="100000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Temperature ({localTemperature})
                  </label>
                  <input
                    type="range"
                    value={localTemperature}
                    onChange={(e) => {
                      setLocalTemperature(parseFloat(e.target.value));
                      handleInputChange();
                    }}
                    min="0"
                    max="1"
                    step="0.1"
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Limits */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Rate Limits
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Requests/Minute
                  </label>
                  <input
                    type="number"
                    value={localRateLimits.maxRequestsPerMinute}
                    onChange={(e) => {
                      setLocalRateLimits({
                        ...localRateLimits,
                        maxRequestsPerMinute: parseInt(e.target.value) || 0,
                      });
                      handleInputChange();
                    }}
                    min="1"
                    max="1000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Max Tokens/Day
                  </label>
                  <input
                    type="number"
                    value={localRateLimits.maxTokensPerDay}
                    onChange={(e) => {
                      setLocalRateLimits({
                        ...localRateLimits,
                        maxTokensPerDay: parseInt(e.target.value) || 0,
                      });
                      handleInputChange();
                    }}
                    min="1000"
                    max="10000000"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Warning Threshold ({localRateLimits.warningThreshold}%)
                </label>
                <input
                  type="range"
                  value={localRateLimits.warningThreshold}
                  onChange={(e) => {
                    setLocalRateLimits({
                      ...localRateLimits,
                      warningThreshold: parseInt(e.target.value),
                    });
                    handleInputChange();
                  }}
                  min="50"
                  max="95"
                  step="5"
                  className="w-full"
                />
              </div>
            </div>

            {/* Usage Statistics */}
            {!isFirstRun && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Usage Statistics
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-300">Daily Token Usage</span>
                      <span className="text-gray-900 dark:text-gray-100">
                        {apiUsage.totalTokens.toLocaleString()} / {rateLimits.maxTokensPerDay.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          getUsagePercentage() >= rateLimits.warningThreshold
                            ? 'bg-orange-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Estimated Cost Today</span>
                    <span className="text-gray-900 dark:text-gray-100">{formatCost(apiUsage.totalCost)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Last Reset</span>
                    <span className="text-gray-900 dark:text-gray-100">{apiUsage.lastResetDate}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3">
            {!isFirstRun && (
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isValidating || !localApiKey}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                isValidating || !localApiKey
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isValidating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Validating...
                </span>
              ) : isFirstRun ? (
                'Get Started'
              ) : (
                'Save Settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;