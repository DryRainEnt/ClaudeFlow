import React, { useEffect, useState } from 'react';
import useAppStore from './store/appStore';
import TerminalManager from './components/TerminalManager';
import WorkflowManager from './components/WorkflowManager';
import VerificationHelper from './components/VerificationHelper';
import QuickTest from './components/QuickTest';
import { openSystemTerminal } from './utils/tauri';

function App() {
  const { 
    status, 
    activeSessions, 
    isInitialized,
    projectPath,
    initializeApp,
    addSession
  } = useAppStore();

  const [activeTab, setActiveTab] = useState('workflow'); // 'workflow' 또는 'legacy'

  // 컴포넌트 마운트 시 앱 초기화
  useEffect(() => {
    if (!isInitialized) {
      initializeApp();
    }
  }, [isInitialized, initializeApp]);

  const handleInitialize = () => {
    // 더미 세션 추가 (테스트용)
    addSession({
      id: Date.now(),
      type: 'manager',
      status: 'active',
      name: 'Manager Session'
    });
  };

  const handleOpenSystemTerminal = async () => {
    try {
      const result = await openSystemTerminal();
      if (result.success) {
        console.log('System terminal opened:', result.message);
      } else {
        console.error('Failed to open system terminal:', result.error);
      }
    } catch (error) {
      console.error('Error opening system terminal:', error);
    }
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

  return (
    <div className="w-full h-screen bg-gray-100 flex">
      {/* Left Panel - 메인 작업 영역 (75%) */}
      <div className="w-3/4 bg-white border-r border-gray-300 flex flex-col">
        {/* 탭 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-800">ClaudeFlow</h2>
              <p className="text-sm text-gray-600">M1-M3 완료 - AI 워크플로우 자동화 도구</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('workflow')}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  activeTab === 'workflow' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🔄 워크플로우 매니저
              </button>
              <button
                onClick={() => setActiveTab('legacy')}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  activeTab === 'legacy' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                💻 기존 터미널
              </button>
            </div>
          </div>
        </div>
        
        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'workflow' ? (
            <WorkflowManager />
          ) : (
            <TerminalManager />
          )}
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
          
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <h3 className="font-semibold text-gray-700 mb-2">Directories</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div>.flow/ ✓</div>
              <div>.flow/sessions/ ✓</div>
              <div>.flow/cache/ ✓</div>
              <div>outputs/ ✓</div>
            </div>
          </div>
          
          <button 
            onClick={handleInitialize}
            disabled={status === 'initializing'}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors mb-2"
          >
            {status === 'initializing' ? 'Initializing...' : 'Add Session'}
          </button>

          <button 
            onClick={handleOpenSystemTerminal}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            🖥️ 시스템 터미널 열기
          </button>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h3 className="font-semibold text-green-700 mb-2">마일스톤 완료 현황</h3>
            <p className="text-xs text-green-600">M1: 스탠드얼론 앱 구축 ✅</p>
            <p className="text-xs text-green-600">M2: 복수 터미널 실행 ✅</p>
            <p className="text-xs text-green-600">M3: ClaudeCode 세션 실행 ✅</p>
            <p className="text-xs text-blue-600">🚀 다음: M4 세션 상태 시각화</p>
          </div>
          
          <QuickTest />
          
          <VerificationHelper />
        </div>
      </div>
    </div>
  );
}

export default App;