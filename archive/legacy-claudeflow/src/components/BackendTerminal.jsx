import React, { useState, useRef, useEffect } from 'react';
import { createTerminal, executeCommand, terminateTerminal } from '../utils/tauri';

const BackendTerminal = ({ terminalId, onCommand, onStatusChange }) => {
  const [output, setOutput] = useState([
    { type: 'system', text: `ClaudeFlow Terminal ${terminalId}` },
    { type: 'system', text: 'Connecting to backend...' }
  ]);
  const [input, setInput] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const outputRef = useRef(null);

  // 터미널 초기화
  useEffect(() => {
    initializeTerminal();
    return () => {
      // 컴포넌트 언마운트 시 터미널 정리
      if (isConnected) {
        terminateTerminal(terminalId);
      }
    };
  }, [terminalId]);

  // 스크롤을 맨 아래로
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const initializeTerminal = async () => {
    try {
      setIsLoading(true);
      const result = await createTerminal(terminalId);
      
      if (result.success) {
        addOutput('system', 'Backend terminal connected ✅');
        addOutput('system', result.message);
        setIsConnected(true);
        if (onStatusChange) onStatusChange(terminalId, 'connected');
      } else {
        addOutput('error', `Connection failed: ${result.error}`);
        addOutput('system', 'Falling back to local mode...');
        if (onStatusChange) onStatusChange(terminalId, 'error');
      }
    } catch (error) {
      addOutput('error', `Initialization error: ${error.message}`);
      if (onStatusChange) onStatusChange(terminalId, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const addOutput = (type, text) => {
    setOutput(prev => [...prev, { 
      type, 
      text, 
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const command = input.trim();
    addOutput('input', `$ ${command}`);
    setInput('');
    setIsLoading(true);

    if (onStatusChange) onStatusChange(terminalId, 'running');

    // 로컬 명령어 처리
    if (handleLocalCommand(command)) {
      setIsLoading(false);
      if (onStatusChange) onStatusChange(terminalId, 'ready');
      return;
    }

    // 백엔드 명령어 실행
    if (isConnected) {
      try {
        const result = await executeCommand(terminalId, command);
        if (result.success) {
          addOutput('output', result.message || 'Command executed');
        } else {
          addOutput('error', result.error || 'Command failed');
        }
      } catch (error) {
        addOutput('error', `Execution error: ${error.message}`);
      }
    } else {
      addOutput('error', 'Backend not connected, command not executed');
    }

    setIsLoading(false);
    if (onStatusChange) onStatusChange(terminalId, 'ready');
    if (onCommand) onCommand(terminalId, command);
  };

  const handleLocalCommand = (command) => {
    switch (command.toLowerCase()) {
      case 'clear':
        setOutput([{ type: 'system', text: 'Terminal cleared' }]);
        return true;
      case 'help':
        addOutput('output', 'Available commands:');
        addOutput('output', '  clear - Clear terminal');
        addOutput('output', '  help - Show this help');
        addOutput('output', '  status - Show connection status');
        addOutput('output', '  reconnect - Reconnect to backend');
        addOutput('output', '  pwd, ls, date - System commands (requires backend)');
        return true;
      case 'status':
        addOutput('output', `Connection: ${isConnected ? 'Connected ✅' : 'Disconnected ❌'}`);
        addOutput('output', `Terminal ID: ${terminalId}`);
        addOutput('output', `Loading: ${isLoading ? 'Yes' : 'No'}`);
        return true;
      case 'reconnect':
        addOutput('system', 'Reconnecting to backend...');
        initializeTerminal();
        return true;
      default:
        return false; // 백엔드로 전달
    }
  };

  const getOutputStyle = (type) => {
    switch (type) {
      case 'system':
        return 'text-blue-400';
      case 'input':
        return 'text-green-400 font-medium';
      case 'output':
        return 'text-gray-200';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-gray-200';
    }
  };

  const getConnectionStatus = () => {
    if (isLoading) return { color: 'bg-yellow-500', text: 'Connecting...' };
    if (isConnected) return { color: 'bg-green-500', text: 'Connected' };
    return { color: 'bg-red-500', text: 'Disconnected' };
  };

  const status = getConnectionStatus();

  return (
    <div className="h-full bg-gray-900 text-gray-200 font-mono text-sm flex flex-col">
      {/* 터미널 헤더 */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
          <span className="text-gray-400 text-xs">{status.text}</span>
          <span className="text-gray-500 text-xs">Terminal {terminalId}</span>
        </div>
      </div>

      {/* 출력 영역 */}
      <div 
        ref={outputRef}
        className="flex-1 p-4 overflow-y-auto space-y-1"
      >
        {output.map((line, index) => (
          <div key={index} className={`${getOutputStyle(line.type)} leading-relaxed`}>
            {line.text}
          </div>
        ))}
      </div>

      {/* 입력 영역 */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 bg-transparent text-gray-200 outline-none disabled:opacity-50"
            placeholder={isLoading ? "Executing..." : "Enter command..."}
            autoFocus
          />
          {isLoading && (
            <div className="ml-2 text-yellow-400 animate-spin">⟳</div>
          )}
        </div>
      </form>
    </div>
  );
};

export default BackendTerminal;