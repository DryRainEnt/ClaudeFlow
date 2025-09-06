import React, { useState, useRef } from 'react';
import TerminalComponent from './Terminal';

const TerminalTabs = ({ className = '' }) => {
  const [tabs, setTabs] = useState([
    { id: 1, name: 'Terminal 1', status: 'ready' }
  ]);
  const [activeTab, setActiveTab] = useState(1);
  const terminalRefs = useRef({});
  const nextId = useRef(2);

  // 새 터미널 탭 추가
  const addTab = () => {
    const newId = nextId.current++;
    const newTab = {
      id: newId,
      name: `Terminal ${newId}`,
      status: 'ready'
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(newId);
  };

  // 터미널 탭 제거
  const removeTab = (tabId) => {
    if (tabs.length <= 1) return; // 최소 1개 탭 유지
    
    setTabs(prev => prev.filter(tab => tab.id !== tabId));
    
    // 활성 탭이 제거되는 경우 다른 탭으로 전환
    if (activeTab === tabId) {
      const remainingTabs = tabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTab(remainingTabs[0].id);
      }
    }
    
    // 터미널 레퍼런스 제거
    delete terminalRefs.current[tabId];
  };

  // 터미널 준비 완료 핸들러
  const handleTerminalReady = (terminalId, terminal) => {
    terminalRefs.current[terminalId] = terminal;
    
    // 터미널 상태 업데이트
    setTabs(prev => prev.map(tab => 
      tab.id === terminalId 
        ? { ...tab, status: 'active' }
        : tab
    ));
  };

  // 터미널 상태에 따른 색상 반환
  const getTabStatusColor = (status) => {
    switch (status) {
      case 'ready': return 'bg-gray-100 text-gray-700';
      case 'active': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // 터미널 상태 아이콘
  const getStatusIcon = (status) => {
    switch (status) {
      case 'ready': return '⚪';
      case 'active': return '🟢';
      case 'running': return '🔵';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className={`terminal-tabs-container h-full flex flex-col ${className}`}>
      {/* 탭 헤더 */}
      <div className="tab-header flex bg-gray-200 border-b border-gray-300">
        <div className="flex flex-1 overflow-x-auto">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`
                tab-item flex items-center px-4 py-2 cursor-pointer border-r border-gray-300 min-w-0 whitespace-nowrap
                ${activeTab === tab.id ? 'bg-white border-b-2 border-blue-500' : 'hover:bg-gray-100'}
                ${getTabStatusColor(tab.status)}
              `}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="mr-2 text-sm">{getStatusIcon(tab.status)}</span>
              <span className="truncate text-sm font-medium">{tab.name}</span>
              {tabs.length > 1 && (
                <button
                  className="ml-2 text-gray-500 hover:text-red-600 text-lg leading-none"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.id);
                  }}
                  title="Close terminal"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        
        {/* 새 탭 추가 버튼 */}
        <button
          className="add-tab-btn px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 border-l border-gray-300"
          onClick={addTab}
          title="Add new terminal"
        >
          +
        </button>
      </div>

      {/* 터미널 컨텐츠 영역 */}
      <div className="terminal-content flex-1 relative">
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`terminal-pane h-full ${
              activeTab === tab.id ? 'block' : 'hidden'
            }`}
          >
            <TerminalComponent
              terminalId={tab.id}
              onTerminalReady={handleTerminalReady}
              className="h-full"
            />
          </div>
        ))}
      </div>

      {/* 하단 상태 바 */}
      <div className="status-bar bg-gray-800 text-white text-xs px-4 py-1 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span>Active Terminals: {tabs.length}</span>
          <span>Current: {tabs.find(tab => tab.id === activeTab)?.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Ready for ClaudeCode sessions</span>
        </div>
      </div>
    </div>
  );
};

export default TerminalTabs;