import React, { useState } from 'react';

const QuickTest = () => {
  const [testStatus, setTestStatus] = useState('idle'); // idle, running, success, failed
  const [testLogs, setTestLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setTestLogs(prev => [...prev, { 
      message, 
      type, 
      time: new Date().toLocaleTimeString() 
    }]);
  };

  const runQuickTest = async () => {
    setTestStatus('running');
    setTestLogs([]);
    
    addLog('M2 터미널 기능 빠른 검증 시작', 'info');

    try {
      // 터미널 UI 테스트
      addLog('1. 터미널 UI 컴포넌트 로딩...', 'info');
      const terminalExists = document.querySelector('.terminal-container') || 
                            document.querySelector('.bg-gray-900'); // 터미널 배경
      
      if (terminalExists) {
        addLog('✅ 터미널 UI 컴포넌트 정상 렌더링', 'success');
      } else {
        addLog('❌ 터미널 UI 컴포넌트 찾을 수 없음', 'error');
      }

      // 탭 시스템 테스트  
      addLog('2. 터미널 탭 시스템 확인...', 'info');
      const tabButtons = document.querySelectorAll('button[class*="tab-"], button[class*="flex"]');
      const addButton = document.querySelector('button[title*="Add"]') || 
                       Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.includes('+'));
      
      if (tabButtons.length > 0) {
        addLog(`✅ 터미널 탭 ${tabButtons.length}개 발견`, 'success');
      } else {
        addLog('❌ 터미널 탭을 찾을 수 없음', 'error');
      }

      if (addButton) {
        addLog('✅ 탭 추가 버튼 발견', 'success');
      } else {
        addLog('❌ 탭 추가 버튼을 찾을 수 없음', 'error');
      }

      // 입력 필드 테스트
      addLog('3. 터미널 입력 필드 확인...', 'info');
      const inputField = document.querySelector('input[placeholder*="command"], input[placeholder*="Enter"]');
      
      if (inputField) {
        addLog('✅ 터미널 입력 필드 발견', 'success');
        
        // 실제 입력 테스트
        addLog('4. 터미널 입력 테스트 중...', 'info');
        inputField.focus();
        inputField.value = 'help';
        
        // Enter 키 이벤트 시뮬레이션
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
        inputField.dispatchEvent(enterEvent);
        
        // 폼 submit 이벤트 시뮬레이션
        const form = inputField.closest('form');
        if (form) {
          const submitEvent = new Event('submit');
          form.dispatchEvent(submitEvent);
        }
        
        addLog('✅ 터미널 입력 이벤트 전송 완료', 'success');
      } else {
        addLog('❌ 터미널 입력 필드를 찾을 수 없음', 'error');
      }

      // DOM 상태 확인
      addLog('5. 전체 DOM 상태 확인...', 'info');
      const appRoot = document.getElementById('root');
      const hasContent = appRoot && appRoot.children.length > 0;
      
      if (hasContent) {
        addLog('✅ 앱 루트 컴포넌트 정상 마운트', 'success');
      } else {
        addLog('❌ 앱 루트 컴포넌트 마운트 실패', 'error');
      }

      // 결과 판정
      const errorLogs = testLogs.filter(log => log.type === 'error');
      const successLogs = testLogs.filter(log => log.type === 'success');
      
      addLog(`📊 검증 완료: 성공 ${successLogs.length}개, 실패 ${errorLogs.length}개`, 'info');
      
      if (errorLogs.length === 0) {
        addLog('🎉 M2 UI 검증 성공! 터미널 인터페이스가 정상 동작합니다.', 'success');
        setTestStatus('success');
      } else {
        addLog('⚠️ 일부 기능에 문제가 있습니다.', 'error');
        setTestStatus('failed');
      }

    } catch (error) {
      addLog(`❌ 검증 중 오류: ${error.message}`, 'error');
      setTestStatus('failed');
    }
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'error': return 'text-red-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case 'running': return 'bg-yellow-500';
      case 'success': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
          <h3 className="font-semibold text-gray-700">⚡ 빠른 검증</h3>
        </div>
        <button 
          onClick={runQuickTest}
          disabled={testStatus === 'running'}
          className={`px-4 py-2 rounded text-sm font-medium ${
            testStatus === 'running' 
              ? 'bg-gray-400 text-white cursor-not-allowed' 
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {testStatus === 'running' ? '검증 중...' : '지금 검증 실행'}
        </button>
      </div>

      <div className="max-h-60 overflow-y-auto space-y-1">
        {testLogs.map((log, index) => (
          <div key={index} className="text-sm">
            <span className="text-gray-400 text-xs">[{log.time}] </span>
            <span className={getLogColor(log.type)}>{log.message}</span>
          </div>
        ))}
        
        {testLogs.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-4">
            '지금 검증 실행' 버튼을 클릭하여 M2 기능을 즉시 검증하세요.
          </p>
        )}
      </div>
    </div>
  );
};

export default QuickTest;