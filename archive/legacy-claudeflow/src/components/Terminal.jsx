import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

const TerminalComponent = ({ 
  terminalId, 
  onTerminalReady, 
  onTerminalClose,
  className = '' 
}) => {
  const terminalRef = useRef(null);
  const terminalInstance = useRef(null);
  const fitAddon = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Terminal 인스턴스 생성
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: 'Monaco, "Lucida Console", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#ffffff',
        selection: '#264f78',
        black: '#000000',
        red: '#f14c4c',
        green: '#23d18b',
        yellow: '#f5f543',
        blue: '#3b8eea',
        magenta: '#d670d6',
        cyan: '#29b8db',
        white: '#e5e5e5'
      },
      allowTransparency: true,
      convertEol: true,
      scrollback: 1000
    });

    // Addons 설정
    fitAddon.current = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    
    term.loadAddon(fitAddon.current);
    term.loadAddon(webLinksAddon);

    // DOM에 터미널 연결
    if (terminalRef.current) {
      term.open(terminalRef.current);
      fitAddon.current.fit();
      
      // 환영 메시지 출력
      term.writeln('\x1b[32mClaudeFlow Terminal Ready\x1b[0m');
      term.writeln('Terminal ID: ' + terminalId);
      term.write('$ ');
      
      terminalInstance.current = term;
      setIsReady(true);
      
      // 부모 컴포넌트에 준비 완료 알림
      if (onTerminalReady) {
        onTerminalReady(terminalId, term);
      }
    }

    // 리사이즈 이벤트 핸들링
    const handleResize = () => {
      if (fitAddon.current && terminalInstance.current) {
        fitAddon.current.fit();
      }
    };

    window.addEventListener('resize', handleResize);

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize);
      if (terminalInstance.current) {
        terminalInstance.current.dispose();
      }
    };
  }, [terminalId, onTerminalReady]);

  // 터미널 크기 조정
  const fitTerminal = () => {
    if (fitAddon.current) {
      fitAddon.current.fit();
    }
  };

  // 터미널에 텍스트 쓰기
  const writeToTerminal = (text) => {
    if (terminalInstance.current) {
      terminalInstance.current.write(text);
    }
  };

  // 터미널 클리어
  const clearTerminal = () => {
    if (terminalInstance.current) {
      terminalInstance.current.clear();
    }
  };

  // 상위 컴포넌트에서 사용할 수 있는 메서드들 노출
  React.useImperativeHandle(onTerminalReady, () => ({
    fit: fitTerminal,
    write: writeToTerminal,
    clear: clearTerminal,
    terminal: terminalInstance.current
  }), []);

  return (
    <div className={`terminal-container h-full ${className}`}>
      <div 
        ref={terminalRef} 
        className="terminal-wrapper h-full"
        style={{ minHeight: '200px' }}
      />
    </div>
  );
};

export default TerminalComponent;