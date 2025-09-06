import React, { useState, useRef, useEffect } from 'react';

const SimpleTerminal = ({ terminalId, onCommand }) => {
  const [output, setOutput] = useState([
    { type: 'system', text: `ClaudeFlow Terminal ${terminalId}` },
    { type: 'system', text: 'Ready for commands...' }
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const outputRef = useRef(null);

  // 스크롤을 맨 아래로
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  const addOutput = (type, text) => {
    setOutput(prev => [...prev, { 
      type, 
      text, 
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // 입력 명령어를 출력에 추가
    addOutput('input', `$ ${input}`);

    // 히스토리에 추가
    setHistory(prev => [...prev, input]);
    setHistoryIndex(-1);

    // 간단한 명령어 처리
    handleCommand(input.trim());

    // 입력 필드 초기화
    setInput('');
  };

  const handleCommand = (command) => {
    switch (command.toLowerCase()) {
      case 'clear':
        setOutput([{ type: 'system', text: 'Terminal cleared' }]);
        break;
      case 'help':
        addOutput('output', 'Available commands: clear, help, pwd, ls, date');
        break;
      case 'pwd':
        addOutput('output', '/Users/dryrain/DevRoom/ClaudeFlow');
        break;
      case 'ls':
        addOutput('output', 'DESIGN-DOCUMENT.md  package.json  src/  dist/');
        break;
      case 'date':
        addOutput('output', new Date().toString());
        break;
      default:
        if (command.startsWith('echo ')) {
          addOutput('output', command.substring(5));
        } else {
          addOutput('error', `Command not found: ${command}`);
          addOutput('output', 'Type "help" for available commands');
        }
    }

    // 부모 컴포넌트에 명령어 전달
    if (onCommand) {
      onCommand(terminalId, command);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
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

  return (
    <div className="h-full bg-gray-900 text-gray-200 font-mono text-sm flex flex-col">
      {/* 터미널 헤더 */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        </div>
        <span className="text-gray-400 text-xs">Terminal {terminalId}</span>
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
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-gray-200 outline-none"
            placeholder="Enter command..."
            autoFocus
          />
        </div>
      </form>
    </div>
  );
};

export default SimpleTerminal;