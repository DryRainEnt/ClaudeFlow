import React, { useState } from 'react';
import SimpleTerminal from './SimpleTerminal';
import BackendTerminal from './BackendTerminal';

const TerminalManager = () => {
  const [terminals, setTerminals] = useState([
    { id: 1, name: 'Terminal 1', status: 'active', type: 'backend' }
  ]);
  const [activeTerminal, setActiveTerminal] = useState(1);
  const nextId = React.useRef(2);

  const addTerminal = () => {
    const newId = nextId.current++;
    const newTerminal = {
      id: newId,
      name: `Terminal ${newId}`,
      status: 'ready',
      type: 'backend'
    };
    setTerminals(prev => [...prev, newTerminal]);
    setActiveTerminal(newId);
  };

  const removeTerminal = (terminalId) => {
    if (terminals.length <= 1) return; // 최소 1개 유지

    setTerminals(prev => prev.filter(term => term.id !== terminalId));
    
    // 활성 터미널이 제거되는 경우
    if (activeTerminal === terminalId) {
      const remainingTerminals = terminals.filter(term => term.id !== terminalId);
      if (remainingTerminals.length > 0) {
        setActiveTerminal(remainingTerminals[0].id);
      }
    }
  };

  const handleCommand = (terminalId, command) => {
    console.log(`Terminal ${terminalId} executed: ${command}`);
  };

  const handleStatusChange = (terminalId, status) => {
    setTerminals(prev => prev.map(term => 
      term.id === terminalId 
        ? { ...term, status }
        : term
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'running': return 'bg-blue-500';
      case 'ready': return 'bg-gray-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* 터미널 탭 */}
      <div className="flex bg-gray-200 border-b">
        <div className="flex-1 flex overflow-x-auto">
          {terminals.map(terminal => (
            <button
              key={terminal.id}
              onClick={() => setActiveTerminal(terminal.id)}
              className={`
                flex items-center px-4 py-2 border-r border-gray-300 whitespace-nowrap
                ${activeTerminal === terminal.id 
                  ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
                  : 'hover:bg-gray-100 text-gray-700'
                }
              `}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${getStatusColor(terminal.status)}`}></div>
              <span className="text-sm font-medium">{terminal.name}</span>
              {terminals.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTerminal(terminal.id);
                  }}
                  className="ml-2 text-gray-400 hover:text-red-600"
                >
                  ×
                </button>
              )}
            </button>
          ))}
        </div>
        
        <button
          onClick={addTerminal}
          className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-600 border-l border-gray-300"
          title="Add new terminal"
        >
          +
        </button>
      </div>

      {/* 터미널 컨텐츠 */}
      <div className="flex-1">
        {terminals.map(terminal => (
          <div
            key={terminal.id}
            className={`h-full ${activeTerminal === terminal.id ? 'block' : 'hidden'}`}
          >
            {terminal.type === 'backend' ? (
              <BackendTerminal
                terminalId={terminal.id}
                onCommand={handleCommand}
                onStatusChange={handleStatusChange}
              />
            ) : (
              <SimpleTerminal
                terminalId={terminal.id}
                onCommand={handleCommand}
              />
            )}
          </div>
        ))}
      </div>

      {/* 상태 바 */}
      <div className="bg-gray-800 text-white text-xs px-4 py-1 flex justify-between">
        <span>Terminals: {terminals.length}</span>
        <span>Active: {terminals.find(t => t.id === activeTerminal)?.name}</span>
      </div>
    </div>
  );
};

export default TerminalManager;