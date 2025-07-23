import React from 'react';
import { useSettingsStore } from '../stores/settingsStore';

interface ApiStatusIndicatorProps {
  onSettingsClick: () => void;
}

const ApiStatusIndicator: React.FC<ApiStatusIndicatorProps> = ({ onSettingsClick }) => {
  const {
    apiSettings,
    apiUsage,
    rateLimits,
    isConnected,
    connectionError,
  } = useSettingsStore();

  const getUsagePercentage = () => {
    return (apiUsage.totalTokens / rateLimits.maxTokensPerDay) * 100;
  };

  const getStatusColor = () => {
    if (!isConnected) return 'bg-red-500';
    const usage = getUsagePercentage();
    if (usage >= rateLimits.warningThreshold) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isConnected) return connectionError || 'Not Connected';
    const usage = getUsagePercentage();
    if (usage >= 100) return 'Rate Limit Exceeded';
    if (usage >= rateLimits.warningThreshold) return `${usage.toFixed(0)}% Usage Warning`;
    return 'Connected';
  };

  const formatTokenUsage = () => {
    const totalTokens = apiUsage.totalTokens;
    if (totalTokens < 1000) return `${totalTokens} tokens`;
    if (totalTokens < 1000000) return `${(totalTokens / 1000).toFixed(1)}K tokens`;
    return `${(totalTokens / 1000000).toFixed(2)}M tokens`;
  };

  return (
    <div className="flex items-center gap-3">
      {/* Token Usage */}
      {isConnected && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">{formatTokenUsage()}</span>
          <span className="mx-1">/</span>
          <span>{(rateLimits.maxTokensPerDay / 1000000).toFixed(1)}M daily</span>
        </div>
      )}

      {/* Status Indicator */}
      <button
        onClick={onSettingsClick}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title={getStatusText()}
      >
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {apiSettings.apiKey ? 'API' : 'Setup Required'}
        </span>
        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Usage Bar (Compact) */}
      {isConnected && getUsagePercentage() > 0 && (
        <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              getUsagePercentage() >= rateLimits.warningThreshold
                ? 'bg-orange-500'
                : 'bg-blue-500'
            }`}
            style={{ width: `${Math.min(getUsagePercentage(), 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ApiStatusIndicator;