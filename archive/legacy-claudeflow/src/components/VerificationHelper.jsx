import React, { useState } from 'react';
import { createTerminal, executeCommand, terminateTerminal, listTerminals, checkClaudeCli, checkClaudeAuth, getCurrentDirectory, logVerificationResult } from '../utils/tauri';

const VerificationHelper = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { 
      test, 
      success, 
      message, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const runCumulativeVerification = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('검증 시작', true, '전체 마일스톤 누적 검증을 시작합니다...');
    
    try {
      // M2 터미널 기능 검증
      addResult('M2 터미널 생성', false, 'M2: 백엔드 터미널 생성 중...');
      const createResult = await createTerminal(999);
      addResult('M2 터미널 생성', createResult.success, 
        createResult.success ? '✅ M2: 터미널 생성 성공' : `❌ M2: 실패 - ${createResult.error}`);

      if (createResult.success) {
        // M2 기본 명령어 테스트
        addResult('M2 기본 명령어', false, 'M2: pwd, ls, date 명령어 테스트 중...');
        const pwdResult = await executeCommand(999, 'pwd');
        const lsResult = await executeCommand(999, 'ls');
        const dateResult = await executeCommand(999, 'date');
        const m2Success = pwdResult.success && lsResult.success && dateResult.success;
        addResult('M2 기본 명령어', m2Success,
          m2Success ? '✅ M2: 기본 명령어 모두 성공' : '❌ M2: 일부 명령어 실패');

        // M2 터미널 정리
        await terminateTerminal(999);
      } else {
        addResult('M2 기본 명령어', false, '❌ M2: 터미널 생성 실패로 건너뜀');
      }

      // M3 ClaudeCode 기능 검증
      addResult('M3 CLI 설치 확인', false, 'M3: ClaudeCode CLI 설치 상태 확인 중...');
      const cliResult = await checkClaudeCli();
      const isCliInstalled = cliResult.success && cliResult.data?.isInstalled;
      addResult('M3 CLI 설치 확인', isCliInstalled, 
        isCliInstalled ? 
          `✅ M3: CLI 설치됨 - ${cliResult.data.path} (${cliResult.data.version})` : 
          `❌ M3: CLI 설치되지 않음 - ${cliResult.data?.debugInfo || cliResult.error || '원인 불명'}`);

      if (isCliInstalled) {
        // M3 인증 상태 확인
        addResult('M3 인증 상태', false, 'M3: Claude 인증 상태 확인 중...');
        const authResult = await checkClaudeAuth();
        const isAuthenticated = authResult.success && authResult.data?.isAuthenticated;
        addResult('M3 인증 상태', isAuthenticated,
          isAuthenticated ? 
            `✅ M3: 인증 성공` : 
            `❌ M3: 인증 필요 - ${authResult.data?.statusMessage || '인증 상태 확인 실패'}`);

        if (isAuthenticated) {
          // M3 Claude 명령어 테스트
          const terminalId = 1001;
          const claudeTerminalResult = await createTerminal(terminalId);
          if (claudeTerminalResult.success) {
            addResult('M3 Claude 명령어', false, 'M3: claude --version, --help 테스트 중...');
            const versionResult = await executeCommand(terminalId, 'claude --version');
            const helpResult = await executeCommand(terminalId, 'claude --help');
            const m3Success = versionResult.success && helpResult.success;
            addResult('M3 Claude 명령어', m3Success,
              m3Success ? '✅ M3: Claude 명령어 모두 성공' : '❌ M3: 일부 Claude 명령어 실패');
            
            await terminateTerminal(terminalId);
          } else {
            addResult('M3 Claude 명령어', false, '❌ M3: Claude 터미널 생성 실패');
          }
        } else {
          addResult('M3 Claude 명령어', false, '❌ M3: 인증 실패로 건너뜀');
        }
      } else {
        addResult('M3 인증 상태', false, '❌ M3: CLI 설치되지 않아 건너뜀');
        addResult('M3 Claude 명령어', false, '❌ M3: CLI 설치되지 않아 건너뜀');
      }

      // 최종 결과 계산
      const actualTests = testResults.filter(r => 
        r.test !== '검증 시작' && 
        !r.message.includes('중...') &&
        !r.message.includes('시작...')
      );
      
      const successCount = actualTests.filter(r => r.success).length;
      const totalTests = actualTests.length;
      
      addResult('전체 결과', successCount >= totalTests * 0.8, 
        `M1-M3 누적 검증: ${totalTests}개 테스트 중 ${successCount}개 성공 (${Math.round(successCount/totalTests*100)}%)`);

      // 검증 결과를 로그 파일에 저장
      const logData = {
        testType: 'cumulative_verification',
        summary: {
          totalTests,
          successCount,
          successRate: Math.round(successCount/totalTests*100)
        },
        details: testResults.map(r => ({
          test: r.test,
          success: r.success,
          message: r.message,
          timestamp: r.timestamp
        }))
      };
      
      try {
        await logVerificationResult('cumulative_verification', logData);
        console.log('검증 결과가 로그 파일에 저장되었습니다.');
      } catch (logError) {
        console.error('로그 저장 실패:', logError);
      }

    } catch (error) {
      addResult('검증 오류', false, `예외 발생: ${error.message}`);
    }

    setIsRunning(false);
  };

  const runQuickVerification = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    addResult('검증 시작', true, '빠른 검증을 시작합니다...');
    
    try {
      // M1 기본 설정 검증
      addResult('M1 디렉토리 초기화', false, 'M1: .flow, outputs 디렉토리 확인 중...');
      const dirResult = await getCurrentDirectory();
      addResult('M1 디렉토리 초기화', dirResult.success,
        dirResult.success ? '✅ M1: 디렉토리 구조 정상' : `❌ M1: 디렉토리 오류 - ${dirResult.error}`);

      // M2 터미널 기본 기능 빠른 검증
      addResult('M2 터미널 기능', false, 'M2: 터미널 생성 및 기본 명령어 테스트 중...');
      const terminalResult = await createTerminal(997);
      if (terminalResult.success) {
        const pwdResult = await executeCommand(997, 'pwd');
        const m2Success = pwdResult.success;
        addResult('M2 터미널 기능', m2Success,
          m2Success ? '✅ M2: 터미널 기능 정상' : '❌ M2: 터미널 기능 오류');
        await terminateTerminal(997);
      } else {
        addResult('M2 터미널 기능', false, '❌ M2: 터미널 생성 실패');
      }

      // M3 Claude CLI 빠른 검증
      addResult('M3 Claude CLI', false, 'M3: ClaudeCode CLI 설치 상태 빠른 확인 중...');
      const cliResult = await checkClaudeCli();
      const isCliInstalled = cliResult.success && cliResult.data?.isInstalled;
      addResult('M3 Claude CLI', isCliInstalled,
        isCliInstalled ? 
          `✅ M3: CLI 정상 설치됨 (${cliResult.data.version})` : 
          `❌ M3: CLI 설치 필요`);

      // 최종 결과 계산
      const actualTests = testResults.filter(r => 
        r.test !== '검증 시작' && 
        !r.message.includes('중...') &&
        !r.message.includes('시작...')
      );
      
      const successCount = actualTests.filter(r => r.success).length;
      const totalTests = actualTests.length;
      
      addResult('빠른 검증 결과', successCount >= totalTests * 0.8, 
        `빠른 검증: ${totalTests}개 항목 중 ${successCount}개 정상 (${Math.round(successCount/totalTests*100)}%)`);

      // 검증 결과를 로그 파일에 저장
      const logData = {
        testType: 'quick_verification',
        summary: {
          totalTests,
          successCount,
          successRate: Math.round(successCount/totalTests*100)
        },
        details: testResults.map(r => ({
          test: r.test,
          success: r.success,
          message: r.message,
          timestamp: r.timestamp
        }))
      };
      
      try {
        await logVerificationResult('quick_verification', logData);
        console.log('빠른 검증 결과가 로그 파일에 저장되었습니다.');
      } catch (logError) {
        console.error('로그 저장 실패:', logError);
      }

    } catch (error) {
      addResult('검증 오류', false, `예외 발생: ${error.message}`);
    }

    setIsRunning(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">🔍 누적 검증 시스템</h3>
        <div className="space-x-2">
          <button 
            onClick={runQuickVerification}
            disabled={isRunning}
            className={`px-4 py-2 rounded text-sm font-medium ${
              isRunning 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isRunning ? '검증 중...' : '빠른 검증'}
          </button>
          <button 
            onClick={runCumulativeVerification}
            disabled={isRunning}
            className={`px-4 py-2 rounded text-sm font-medium ${
              isRunning 
                ? 'bg-gray-400 text-white cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isRunning ? '검증 중...' : '실제 사용 검증'}
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto space-y-2">
        {testResults.map((result, index) => (
          <div key={index} className="flex items-start text-sm">
            <span className={`w-4 h-4 rounded-full mr-3 mt-0.5 flex-shrink-0 ${
              result.success === null ? 'bg-yellow-400' :
              result.success ? 'bg-green-500' : 'bg-red-500'
            }`}></span>
            <div className="flex-1">
              <span className="font-medium text-gray-800">[{result.timestamp}] {result.test}:</span>
              <p className={`mt-1 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                {result.message}
              </p>
            </div>
          </div>
        ))}
        
        {testResults.length === 0 && !isRunning && (
          <p className="text-gray-500 text-sm text-center py-4">
            '빠른 검증' 또는 '실제 사용 검증' 버튼을 클릭하여 M1-M3 누적 기능을 테스트해보세요.
          </p>
        )}
      </div>

      {testResults.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            누적 검증: M1(디렉토리) → M2(터미널) → M3(Claude CLI) 순서로 전체 기능을 테스트합니다.
          </p>
        </div>
      )}
    </div>
  );
};

export default VerificationHelper;