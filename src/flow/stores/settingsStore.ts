import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface ApiUsage {
  totalTokens: number;
  totalCost: number;
  lastResetDate: string;
}

interface RateLimitSettings {
  maxRequestsPerMinute: number;
  maxTokensPerDay: number;
  warningThreshold: number; // percentage
}

interface ApiSettings {
  apiKey: string;
  endpoint: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

interface SettingsStore {
  // State
  apiSettings: ApiSettings;
  rateLimits: RateLimitSettings;
  apiUsage: ApiUsage;
  isConnected: boolean;
  connectionError: string | null;
  
  // Actions
  updateApiSettings: (settings: Partial<ApiSettings>) => void;
  updateRateLimits: (limits: Partial<RateLimitSettings>) => void;
  updateApiUsage: (tokens: number, cost: number) => void;
  resetApiUsage: () => void;
  setConnectionStatus: (connected: boolean, error?: string) => void;
  validateApiKey: (key: string) => boolean;
  clearSettings: () => void;
}

const DEFAULT_API_SETTINGS: ApiSettings = {
  apiKey: '',
  endpoint: 'https://api.anthropic.com/v1/messages',
  model: 'claude-3-opus-20240229',
  maxTokens: 4096,
  temperature: 0.7,
};

const DEFAULT_RATE_LIMITS: RateLimitSettings = {
  maxRequestsPerMinute: 50,
  maxTokensPerDay: 1000000,
  warningThreshold: 80,
};

const DEFAULT_API_USAGE: ApiUsage = {
  totalTokens: 0,
  totalCost: 0,
  lastResetDate: new Date().toISOString().split('T')[0],
};

export const useSettingsStore = create<SettingsStore>()(
  devtools(
    persist(
      (set) => ({
        apiSettings: DEFAULT_API_SETTINGS,
        rateLimits: DEFAULT_RATE_LIMITS,
        apiUsage: DEFAULT_API_USAGE,
        isConnected: false,
        connectionError: null,

        updateApiSettings: (settings) => {
          set((state) => ({
            apiSettings: { ...state.apiSettings, ...settings },
          }));
        },

        updateRateLimits: (limits) => {
          set((state) => ({
            rateLimits: { ...state.rateLimits, ...limits },
          }));
        },

        updateApiUsage: (tokens, cost) => {
          const today = new Date().toISOString().split('T')[0];
          set((state) => {
            // Reset if it's a new day
            if (state.apiUsage.lastResetDate !== today) {
              return {
                apiUsage: {
                  totalTokens: tokens,
                  totalCost: cost,
                  lastResetDate: today,
                },
              };
            }
            
            return {
              apiUsage: {
                totalTokens: state.apiUsage.totalTokens + tokens,
                totalCost: state.apiUsage.totalCost + cost,
                lastResetDate: state.apiUsage.lastResetDate,
              },
            };
          });
        },

        resetApiUsage: () => {
          set({
            apiUsage: {
              totalTokens: 0,
              totalCost: 0,
              lastResetDate: new Date().toISOString().split('T')[0],
            },
          });
        },

        setConnectionStatus: (connected, error) => {
          set({
            isConnected: connected,
            connectionError: error || null,
          });
        },

        validateApiKey: (key) => {
          // Claude API keys start with 'sk-ant-' and are 95+ characters long
          const apiKeyPattern = /^sk-ant-[a-zA-Z0-9-_]{86,}$/;
          return apiKeyPattern.test(key);
        },

        clearSettings: () => {
          set({
            apiSettings: DEFAULT_API_SETTINGS,
            rateLimits: DEFAULT_RATE_LIMITS,
            apiUsage: DEFAULT_API_USAGE,
            isConnected: false,
            connectionError: null,
          });
        },
      }),
      {
        name: 'settings-store',
        partialize: (state) => ({
          apiSettings: {
            ...state.apiSettings,
            apiKey: '', // Don't persist API key in browser storage
          },
          rateLimits: state.rateLimits,
          apiUsage: state.apiUsage,
        }),
      }
    ),
    {
      name: 'settings-store',
    }
  )
);