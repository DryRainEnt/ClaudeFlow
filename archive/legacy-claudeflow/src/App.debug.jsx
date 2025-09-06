import React, { useEffect } from 'react';
import useAppStore from './store/appStore';

function App() {
  console.log('App component rendering...');
  
  const { 
    status, 
    activeSessions, 
    isInitialized,
    projectPath,
    initializeApp,
    addSession
  } = useAppStore();

  console.log('Store state:', { status, activeSessions, isInitialized, projectPath });

  // 컴포넌트 마운트 시 앱 초기화
  useEffect(() => {
    console.log('useEffect running...', { isInitialized });
    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized, initializeApp]);

  const handleInitialize = () => {
    console.log('Add session clicked...');
    // 더미 세션 추가 (테스트용)
    addSession({
      id: Date.now(),
      type: 'manager',
      status: 'active',
      name: 'Manager Session'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'initializing': return 'text-yellow-600';
      case 'running': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  console.log('About to render UI...');

  return (
    <div className="w-full h-screen bg-gray-100 flex">
      {/* Left Panel - Basic Terminal Area (70%) */}
      <div className="w-3/4 bg-white border-r border-gray-300 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">ClaudeFlow Debug</h2>
          <p className="text-sm text-gray-600 mt-1">기본 UI 테스트 중</p>
        </div>
        <div className="flex-1 p-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">터미널 영역 (xterm.js 제외)</p>
            <p className="text-sm text-blue-600 mt-2">Status: {status}</p>
          </div>
        </div>
      </div>

      {/* Right Panel - Control & Info (30%) */}
      <div className="w-1/4 bg-gray-50 p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Control Panel</h2>
        
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
            <p className={`text-sm ${getStatusColor(status)} capitalize`}>
              {status}
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-2">Project Path</h3>
            <p className="text-xs text-gray-600 break-all">
              {projectPath || 'Not set'}
            </p>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-2">Sessions</h3>
            <p className="text-sm text-gray-600">{activeSessions} active</p>
          </div>
          
          <button 
            onClick={handleInitialize}
            disabled={status === 'initializing'}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {status === 'initializing' ? 'Initializing...' : 'Add Session'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;