import React, { useState, useEffect } from 'react';
import { createTerminal, executeCommand, terminateTerminal, openSystemTerminal } from '../utils/tauri';
import PtyTerminal from './PtyTerminal';

const SessionTerminal = ({ sessionId, sessionType = 'manager' }) => {
  const [terminalId] = useState(sessionId + 1000); // 유니크한 터미널 ID
  const [isCreated, setIsCreated] = useState(false);
  const [output, setOutput] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [usePtyMode, setUsePtyMode] = useState(true); // PTY 모드 기본 활성화

  useEffect(() => {
    // 컴포넌트 마운트 시 터미널 생성
    const initTerminal = async () => {
      setIsLoading(true);
      try {
        const result = await createTerminal(terminalId);
        if (result.success) {
          setIsCreated(true);
          addOutput('시스템', `${sessionType} 세션용 터미널이 생성되었습니다.`);
          addOutput('시스템', `터미널 ID: ${terminalId}`);
          
          // Claude 환경 확인
          await checkClaudeEnvironment();
        } else {
          addOutput('에러', `터미널 생성 실패: ${result.error}`);
        }
      } catch (error) {
        addOutput('에러', `터미널 초기화 에러: ${error.message}`);
      }
      setIsLoading(false);
    };

    initTerminal();

    // 컴포넌트 언마운트 시 터미널 정리
    return () => {
      terminateTerminal(terminalId);
    };
  }, [terminalId, sessionType]);

  const checkClaudeEnvironment = async () => {
    const commands = [
      'echo $SHELL',
      'which claude',
      'claude --version'
    ];

    for (const cmd of commands) {
      try {
        const result = await executeCommand(terminalId, cmd);
        if (result.success) {
          addOutput(`$ ${cmd}`, result.message);
        } else {
          addOutput(`$ ${cmd}`, `Error: ${result.error}`);
        }
      } catch (error) {
        addOutput(`$ ${cmd}`, `Error: ${error.message}`);
      }
    }
  };

  const addOutput = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setOutput(prev => [...prev, { type, message, timestamp }]);
  };

  const handleCommand = async (e) => {
    e.preventDefault();
    if (!input.trim() || !isCreated) return;

    const command = input.trim();
    setInput('');
    addOutput('입력', `$ ${command}`);

    try {
      const result = await executeCommand(terminalId, command);
      if (result.success) {
        addOutput('출력', result.message);
      } else {
        addOutput('에러', result.error);
      }
    } catch (error) {
      addOutput('에러', error.message);
    }
  };

  const handleOpenSystemTerminal = async () => {
    try {
      const result = await openSystemTerminal();
      if (result.success) {
        addOutput('시스템', '외부 터미널이 열렸습니다: ' + result.message);
      } else {
        addOutput('에러', '외부 터미널 열기 실패: ' + result.error);
      }
    } catch (error) {
      addOutput('에러', '터미널 열기 에러: ' + error.message);
    }
  };

  const getSessionIcon = () => {
    switch (sessionType) {
      case 'manager': return '👔';
      case 'supervisor': return '👷';
      case 'worker': return '🔧';
      default: return '💻';
    }
  };

  const getSessionColor = () => {
    switch (sessionType) {
      case 'manager': return 'border-blue-200 bg-blue-50';
      case 'supervisor': return 'border-green-200 bg-green-50';
      case 'worker': return 'border-orange-200 bg-orange-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getSessionColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          {getSessionIcon()} {sessionType.toUpperCase()} 터미널 (ID: {sessionId})
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setUsePtyMode(!usePtyMode)}
            className={`px-3 py-1 text-white text-xs rounded ${
              usePtyMode ? 'bg-purple-500 hover:bg-purple-600' : 'bg-gray-500 hover:bg-gray-600'
            }`}
          >
            {usePtyMode ? '🔄 PTY 모드' : '📝 레거시 모드'}
          </button>
          <button
            onClick={handleOpenSystemTerminal}
            className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded"
          >
            🖥️ 시스템 터미널
          </button>
          {!usePtyMode && (
            <button
              onClick={checkClaudeEnvironment}
              disabled={!isCreated || isLoading}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-xs rounded"
            >
              🔍 환경 확인
            </button>
          )}
        </div>
      </div>

      {/* 터미널 표시 영역 */}
      {usePtyMode ? (
        // PTY 모드: xterm.js 기반 완전한 터미널
        <PtyTerminal 
          sessionId={sessionId} 
          sessionType={sessionType}
          className="mb-3"
        />
      ) : (
        // 레거시 모드: 기존 명령어 기반 터미널
        <>
          <div className="bg-black text-green-400 p-3 rounded text-sm font-mono h-48 overflow-y-auto mb-3">
            {isLoading && (
              <div className="text-yellow-400">터미널 초기화 중...</div>
            )}
            {output.map((line, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500">[{line.timestamp}]</span>
                <span className={`ml-2 ${
                  line.type === '에러' ? 'text-red-400' :
                  line.type === '시스템' ? 'text-cyan-400' :
                  line.type === '입력' ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {line.type === '에러' ? '❌' : 
                   line.type === '시스템' ? 'ℹ️' :
                   line.type === '입력' ? '▶' : '✓'} {line.message}
                </span>
              </div>
            ))}
          </div>

          {/* 명령어 입력 */}
          <form onSubmit={handleCommand} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="명령어 입력... (예: claude auth status)"
              disabled={!isCreated || isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!isCreated || isLoading || !input.trim()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm rounded"
            >
              실행
            </button>
          </form>
        </>
      )}

      {!isCreated && !isLoading && (
        <div className="mt-2 text-red-600 text-sm">
          ⚠️ 터미널이 생성되지 않았습니다. 다시 시도해주세요.
        </div>
      )}
    </div>
  );
};

export default SessionTerminal;