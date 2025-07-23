import React, { useState, useEffect } from 'react';
import { isTauri } from '../utils/tauriProxy';
import { debugLog } from '../utils/debugHelper';

export const DebugPanel: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  const [tauriStatus, setTauriStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Check Tauri environment
    const checkTauri = () => {
      try {
        const isInTauri = isTauri();
        setTauriStatus(isInTauri ? 'Running in Tauri' : 'Not in Tauri');
        
        // Log window object
        if (typeof window !== 'undefined') {
          console.log('Window object:', window);
          console.log('Window.__TAURI__:', window.__TAURI__);
        }
      } catch (err) {
        setError(String(err));
      }
    };

    checkTauri();
  }, []);

  const handleBasicClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    debugLog('DebugPanel', 'Basic button clicked', { count: newCount });
    
    // Try alert as most basic test
    try {
      alert(`Button clicked ${newCount} times!`);
    } catch (err) {
      console.error('Alert failed:', err);
    }
  };

  const handleInlineClick = () => {
    debugLog('DebugPanel', 'Inline click handler triggered');
    console.log('Inline handler working!');
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      right: 20,
      background: 'white',
      border: '2px solid red',
      padding: 20,
      zIndex: 9999,
      maxWidth: 300
    }}>
      <h3>Debug Panel</h3>
      <p>Tauri Status: {tauriStatus}</p>
      <p>Click Count: {clickCount}</p>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      
      <div style={{ marginTop: 10 }}>
        <button 
          onClick={handleBasicClick}
          style={{
            padding: '10px',
            background: 'blue',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            marginRight: 10
          }}
        >
          Test Click
        </button>
        
        <button
          onMouseDown={() => console.log('MouseDown!')}
          onMouseUp={() => console.log('MouseUp!')}
          onClick={handleInlineClick}
          style={{
            padding: '10px',
            background: 'green',
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Inline Test
        </button>
      </div>
      
      <div style={{ marginTop: 10, fontSize: 12 }}>
        <p>User Agent: {navigator.userAgent}</p>
      </div>
    </div>
  );
};