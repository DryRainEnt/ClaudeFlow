import React, { useState, useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

import { 
  createPtyTerminal, 
  readPtyTerminal, 
  writePtyTerminal, 
  resizePtyTerminal, 
  destroyPtyTerminal 
} from '../utils/tauri';

const PtyTerminal = ({ sessionId, sessionType = 'manager', className = '' }) => {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const [terminalId] = useState(`pty-${sessionId}-${Date.now()}`);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const fitAddonRef = useRef(null);
  const readIntervalRef = useRef(null);

  useEffect(() => {
    initializeTerminal();

    // 컴포넌트 언마운트 시 정리
    return () => {
      cleanup();
    };
  }, []);

  const initializeTerminal = async () => {
    try {
      console.log(`[PTY] Initializing terminal: ${terminalId}`);
      
      // xterm.js Terminal 인스턴스 생성
      const terminal = new Terminal({
        cursorBlink: true,
        cursorStyle: 'block',
        fontFamily: 'Monaco, Menlo, "DejaVu Sans Mono", "Lucida Console", monospace',
        fontSize: 12,
        lineHeight: 1.2,
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
          cursor: '#ffffff',
          selection: '#ffffff40',
          black: '#000000',
          red: '#ff0000',
          green: '#00ff00',
          yellow: '#ffff00',
          blue: '#0000ff',
          magenta: '#ff00ff',
          cyan: '#00ffff',
          white: '#ffffff',
          brightBlack: '#808080',
          brightRed: '#ff8080',
          brightGreen: '#80ff80',
          brightYellow: '#ffff80',
          brightBlue: '#8080ff',
          brightMagenta: '#ff80ff',
          brightCyan: '#80ffff',
          brightWhite: '#ffffff'
        },
        allowTransparency: true,
        macOptionIsMeta: true,
        scrollback: 10000
      });

      // 애드온 추가
      const fitAddon = new FitAddon();
      const webLinksAddon = new WebLinksAddon();
      
      terminal.loadAddon(fitAddon);
      terminal.loadAddon(webLinksAddon);

      // DOM에 연결
      if (terminalRef.current) {
        terminal.open(terminalRef.current);
        fitAddon.fit();
      }

      // 참조 저장
      xtermRef.current = terminal;
      fitAddonRef.current = fitAddon;

      // PTY 백엔드 생성
      const result = await createPtyTerminal(terminalId);
      
      if (result.success) {
        console.log(`[PTY] Backend created successfully:`, result.data);
        
        // 터미널 프로필 적용
        if (result.data.profile) {
          const profile = result.data.profile;
          terminal.options.fontFamily = profile.font_family;
          terminal.options.fontSize = profile.font_size;
          
          // 테마 업데이트
          terminal.options.theme = {
            ...terminal.options.theme,
            background: profile.background_color,
            foreground: profile.foreground_color,
            cursor: profile.cursor_color
          };
        }

        // 키보드 입력 처리
        terminal.onData((data) => {
          writePtyTerminal(terminalId, data);
        });

        // 리사이즈 처리
        terminal.onResize(({ rows, cols }) => {
          resizePtyTerminal(terminalId, rows, cols);
        });

        // 데이터 읽기 시작
        startReading();
        
        setIsInitialized(true);
        
        // 환영 메시지
        terminal.writeln(`\x1b[32m✓ ${sessionType.toUpperCase()} 세션 터미널이 시작되었습니다.\x1b[0m`);
        terminal.writeln(`\x1b[90mTerminal ID: ${terminalId}\x1b[0m`);
        terminal.writeln(`\x1b[90mClaude Code 인증 상태를 확인하려면: claude --version\x1b[0m`);
        terminal.writeln('');

      } else {
        throw new Error(result.error || 'Failed to create PTY terminal');
      }

    } catch (error) {
      console.error(`[PTY] Initialization failed:`, error);
      setError(error.message);
      
      if (xtermRef.current) {
        xtermRef.current.writeln(`\x1b[31m❌ 터미널 초기화 실패: ${error.message}\x1b[0m`);
      }
    }
  };

  const startReading = () => {
    // 정기적으로 PTY에서 데이터 읽기
    readIntervalRef.current = setInterval(async () => {
      if (!xtermRef.current || !isInitialized) return;

      try {
        const result = await readPtyTerminal(terminalId);
        
        if (result.success && result.data) {
          xtermRef.current.write(result.data);
        }
      } catch (error) {
        console.error(`[PTY] Read error:`, error);
      }
    }, 50); // 20fps로 읽기
  };

  const cleanup = async () => {
    console.log(`[PTY] Cleaning up terminal: ${terminalId}`);
    
    // 읽기 인터벌 정리
    if (readIntervalRef.current) {
      clearInterval(readIntervalRef.current);
      readIntervalRef.current = null;
    }

    // xterm.js 정리
    if (xtermRef.current) {
      xtermRef.current.dispose();
      xtermRef.current = null;
    }

    // PTY 백엔드 정리
    try {
      await destroyPtyTerminal(terminalId);
      console.log(`[PTY] Backend destroyed: ${terminalId}`);
    } catch (error) {
      console.error(`[PTY] Cleanup error:`, error);
    }
  };

  // 윈도우 리사이즈 처리
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        setTimeout(() => {
          fitAddonRef.current.fit();
        }, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`pty-terminal-container ${className}`}>
      <div className="flex justify-between items-center p-2 bg-gray-800 text-white text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="ml-4">ClaudeFlow - {sessionType.toUpperCase()} Terminal</span>
        </div>
        <div className="text-xs text-gray-400">
          {isInitialized ? (
            <span className="text-green-400">● 연결됨</span>
          ) : error ? (
            <span className="text-red-400">● 오류</span>
          ) : (
            <span className="text-yellow-400">● 연결 중...</span>
          )}
        </div>
      </div>
      
      <div 
        ref={terminalRef} 
        className="terminal-content"
        style={{ 
          height: '400px', 
          width: '100%',
          backgroundColor: '#1e1e1e'
        }}
      />
      
      {error && (
        <div className="error-display p-2 bg-red-900 text-red-100 text-sm">
          <strong>터미널 오류:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default PtyTerminal;