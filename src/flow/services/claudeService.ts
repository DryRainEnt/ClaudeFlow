import { useSettingsStore } from '../stores/settingsStore';
// @ts-ignore - Tauri API types are not available in test environment
import { invoke } from '@tauri-apps/api/core';
import { rateLimiter } from '../utils/rateLimiter';

interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ClaudeResponse {
  id: string;
  model: string;
  role: string;
  content: Array<{
    type: string;
    text?: string;
  }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

interface ClaudeError {
  error: {
    type: string;
    message: string;
  };
}

class ClaudeService {
  private async getApiKey(): Promise<string> {
    try {
      return await invoke<string>('get_api_key');
    } catch (error) {
      throw new Error('API key not configured');
    }
  }

  async sendMessage(messages: ClaudeMessage[]): Promise<string> {
    const { apiSettings, updateApiUsage, setConnectionStatus } = useSettingsStore.getState();
    
    // Check rate limit
    const rateCheck = rateLimiter.checkRateLimit();
    if (!rateCheck.canProceed) {
      throw new Error(rateCheck.reason || 'Rate limit exceeded');
    }
    
    try {
      const apiKey = await this.getApiKey();
      
      // Record the request
      rateLimiter.recordRequest();
      
      const response = await fetch(apiSettings.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: apiSettings.model,
          messages,
          max_tokens: apiSettings.maxTokens,
          temperature: apiSettings.temperature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ClaudeError;
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json() as ClaudeResponse;
      
      // Update usage statistics
      if (data.usage) {
        const { input_tokens, output_tokens } = data.usage;
        const totalTokens = input_tokens + output_tokens;
        
        // Calculate cost (example rates - adjust based on actual pricing)
        const costPerToken = {
          'claude-3-opus-20240229': 0.000015,
          'claude-3-sonnet-20240229': 0.000003,
          'claude-3-haiku-20240307': 0.0000004,
        };
        
        const cost = totalTokens * (costPerToken[apiSettings.model as keyof typeof costPerToken] || 0.000015);
        updateApiUsage(totalTokens, cost);
      }

      setConnectionStatus(true);
      
      // Extract text content from response
      const textContent = data.content
        .filter(block => block.type === 'text')
        .map(block => block.text || '')
        .join('\n');

      return textContent;
    } catch (error) {
      setConnectionStatus(false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  async streamMessage(
    messages: ClaudeMessage[],
    onChunk: (chunk: string) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): Promise<void> {
    const { apiSettings, updateApiUsage, setConnectionStatus } = useSettingsStore.getState();
    
    // Check rate limit
    const rateCheck = rateLimiter.checkRateLimit();
    if (!rateCheck.canProceed) {
      onError(new Error(rateCheck.reason || 'Rate limit exceeded'));
      return;
    }
    
    try {
      const apiKey = await this.getApiKey();
      
      // Record the request
      rateLimiter.recordRequest();
      
      const response = await fetch(apiSettings.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: apiSettings.model,
          messages,
          max_tokens: apiSettings.maxTokens,
          temperature: apiSettings.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json() as ClaudeError;
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let totalTokens = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              onComplete();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                onChunk(parsed.delta.text);
              } else if (parsed.type === 'message_start' && parsed.message?.usage) {
                totalTokens += parsed.message.usage.input_tokens || 0;
              } else if (parsed.type === 'message_delta' && parsed.usage) {
                totalTokens += parsed.usage.output_tokens || 0;
                
                // Update usage statistics for streaming
                const costPerToken = {
                  'claude-3-opus-20240229': 0.000015,
                  'claude-3-sonnet-20240229': 0.000003,
                  'claude-3-haiku-20240307': 0.0000004,
                };
                
                const cost = totalTokens * (costPerToken[apiSettings.model as keyof typeof costPerToken] || 0.000015);
                updateApiUsage(totalTokens, cost);
              }
            } catch (e) {
              console.error('Failed to parse stream chunk:', e);
            }
          }
        }
      }
      
      setConnectionStatus(true);
    } catch (error) {
      setConnectionStatus(false, error instanceof Error ? error.message : 'Unknown error');
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey();
      const { apiSettings } = useSettingsStore.getState();
      
      return await invoke<boolean>('validate_api_connection', {
        apiKey,
        endpoint: apiSettings.endpoint,
      });
    } catch {
      return false;
    }
  }
}

export const claudeService = new ClaudeService();