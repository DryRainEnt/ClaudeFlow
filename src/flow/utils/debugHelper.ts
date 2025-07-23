// Debug helper for Windows issues

export const debugLog = (component: string, action: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [${component}] ${action}`;
  
  console.log(message, data || '');
  
  // Also try to display in UI for debugging
  if (typeof window !== 'undefined') {
    // Store debug messages in window for inspection
    if (!window.__DEBUG_LOGS__) {
      window.__DEBUG_LOGS__ = [];
    }
    window.__DEBUG_LOGS__.push({ timestamp, component, action, data });
  }
};

// Add to window for debugging
declare global {
  interface Window {
    __DEBUG_LOGS__?: Array<{
      timestamp: string;
      component: string;
      action: string;
      data?: any;
    }>;
  }
}

// Helper to check if we're in Tauri environment
export const checkEnvironment = () => {
  const info = {
    isTauri: typeof window !== 'undefined' && window.__TAURI__ !== undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    windowObject: typeof window !== 'undefined',
    tauriObject: typeof window !== 'undefined' ? window.__TAURI__ : undefined
  };
  
  debugLog('Environment', 'Check', info);
  return info;
};