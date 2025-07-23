import { useSettingsStore } from '../stores/settingsStore';

interface RateLimitInfo {
  canProceed: boolean;
  waitTime?: number; // milliseconds
  reason?: string;
}

class RateLimiter {
  private requestTimestamps: number[] = [];
  private lastResetDate: string = '';

  constructor() {
    // Load existing timestamps from localStorage if available
    const saved = localStorage.getItem('rateLimiter');
    if (saved) {
      const data = JSON.parse(saved);
      this.requestTimestamps = data.timestamps || [];
      this.lastResetDate = data.lastResetDate || '';
    }

    // Check if we need to reset for a new day
    this.checkDailyReset();
  }

  private checkDailyReset(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.lastResetDate !== today) {
      this.requestTimestamps = [];
      this.lastResetDate = today;
      this.save();
    }
  }

  private save(): void {
    localStorage.setItem('rateLimiter', JSON.stringify({
      timestamps: this.requestTimestamps,
      lastResetDate: this.lastResetDate,
    }));
  }

  checkRateLimit(): RateLimitInfo {
    const { rateLimits, apiUsage } = useSettingsStore.getState();
    const now = Date.now();

    // Check daily reset
    this.checkDailyReset();

    // Check daily token limit
    if (apiUsage.totalTokens >= rateLimits.maxTokensPerDay) {
      return {
        canProceed: false,
        reason: 'Daily token limit exceeded',
      };
    }

    // Check if approaching daily limit (warning threshold)
    const usagePercentage = (apiUsage.totalTokens / rateLimits.maxTokensPerDay) * 100;
    if (usagePercentage >= rateLimits.warningThreshold) {
      console.warn(`API usage at ${usagePercentage.toFixed(1)}% of daily limit`);
    }

    // Clean up old timestamps (older than 1 minute)
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );

    // Check requests per minute limit
    if (this.requestTimestamps.length >= rateLimits.maxRequestsPerMinute) {
      const oldestTimestamp = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestTimestamp);
      
      return {
        canProceed: false,
        waitTime,
        reason: `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds.`,
      };
    }

    return { canProceed: true };
  }

  recordRequest(): void {
    this.requestTimestamps.push(Date.now());
    this.save();
  }

  async waitForRateLimit(): Promise<void> {
    const check = this.checkRateLimit();
    
    if (!check.canProceed && check.waitTime) {
      await new Promise(resolve => setTimeout(resolve, check.waitTime));
    }
  }

  getRemainingRequests(): number {
    const { rateLimits } = useSettingsStore.getState();
    const now = Date.now();
    
    // Clean up old timestamps
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );

    return Math.max(0, rateLimits.maxRequestsPerMinute - this.requestTimestamps.length);
  }

  getRemainingTokens(): number {
    const { rateLimits, apiUsage } = useSettingsStore.getState();
    return Math.max(0, rateLimits.maxTokensPerDay - apiUsage.totalTokens);
  }
}

export const rateLimiter = new RateLimiter();