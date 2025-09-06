import React, { useEffect, useState } from 'react';
import { createTerminal, executeCommand, terminateTerminal, listTerminals, checkClaudeCli, checkClaudeAuth, startClaudeSession, sendClaudeMessage, stopClaudeSession } from '../utils/tauri';

const TerminalTestHelper = () => {
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, timestamp: new Date().toLocaleTimeString() }]);
  };

  const runM3Tests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // M3 Test 1: ClaudeCode CLI 설치 확인
      addResult('CLI 설치 확인', false, 'ClaudeCode CLI 설치 상태 확인 중...');
      const cliResult = await checkClaudeCli();
      const isCliInstalled = cliResult.success && cliResult.data?.isInstalled;
      addResult('CLI 설치 확인', isCliInstalled, 
        isCliInstalled ? 
          `✅ CLI 설치됨: ${cliResult.data.path} (${cliResult.data.version})` : 
          `❌ CLI 설치되지 않음: ${cliResult.data?.debugInfo || cliResult.error || '원인 불명'}`);

      // M3 Test 2: Claude 인증 상태 확인
      addResult('인증 상태 확인', false, 'Claude 인증 상태 확인 중...');
      const authResult = await checkClaudeAuth();
      const isAuthenticated = authResult.success && authResult.data?.isAuthenticated;
      addResult('인증 상태 확인', isAuthenticated,
        isAuthenticated ? 
          `✅ 인증 성공: ${authResult.data.statusMessage}` : 
          `❌ 인증 필요: ${authResult.data?.statusMessage || '인증 상태 확인 실패'}`);

      if (isCliInstalled && isAuthenticated) {
        // M3 Test 3: Claude 세션용 터미널 생성
        addResult('Claude 터미널 생성', false, 'Claude 세션용 터미널 생성 중...');
        const claudeTerminalResult = await createTerminal(1001);
        addResult('Claude 터미널 생성', claudeTerminalResult.success,
          claudeTerminalResult.success ? '✅ Claude 터미널 생성 성공' : `❌ 실패: ${claudeTerminalResult.error}`);

        if (claudeTerminalResult.success) {
          // M3 Test 4: Claude 버전 확인
          addResult('Claude 버전 확인', false, 'claude --version 실행 중...');
          const versionResult = await executeCommand(1001, 'claude --version');
          addResult('Claude 버전 확인', versionResult.success,
            versionResult.success ? `✅ 버전: ${versionResult.message}` : `❌ 실패: ${versionResult.error}`);

          // M3 Test 5: Claude 도움말
          addResult('Claude 도움말', false, 'claude --help 실행 중...');
          const helpResult = await executeCommand(1001, 'claude --help');
          addResult('Claude 도움말', helpResult.success,
            helpResult.success ? '✅ 도움말 표시 성공' : `❌ 실패: ${helpResult.error}`);

          // M3 Test 6: Claude 세션 시작 테스트
          addResult('Claude 세션 시작', false, 'Claude 대화형 세션 시작 중...');
          const sessionStartResult = await startClaudeSession(1001);
          addResult('Claude 세션 시작', sessionStartResult.success,
            sessionStartResult.success ? '✅ Claude 세션 시작 성공' : `❌ 실패: ${sessionStartResult.error}`);

          if (sessionStartResult.success) {
            // M3 Test 7: Claude에 메시지 전송 테스트
            addResult('Claude 메시지 전송', false, '테스트 메시지 전송 중...');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Claude 세션이 시작될 시간 대기
            const messageResult = await sendClaudeMessage(1001, 'Hello, what is 2+2?');
            addResult('Claude 메시지 전송', messageResult.success,
              messageResult.success ? '✅ 메시지 전송 성공' : `❌ 실패: ${messageResult.error}`);

            // M3 Test 8: Claude 세션 종료 테스트
            addResult('Claude 세션 종료', false, 'Claude 세션 종료 중...');
            await new Promise(resolve => setTimeout(resolve, 1000)); // 응답 대기
            const sessionStopResult = await stopClaudeSession(1001);
            addResult('Claude 세션 종료', sessionStopResult.success,
              sessionStopResult.success ? '✅ Claude 세션 종료 성공' : `❌ 실패: ${sessionStopResult.error}`);
          } else {
            const skipTests = ['Claude 메시지 전송', 'Claude 세션 종료'];
            skipTests.forEach(test => {
              addResult(test, false, '❌ Claude 세션 시작 실패로 건너뜀');
            });
          }

          // M3 Test 9: Claude 터미널 정리
          addResult('Claude 터미널 정리', false, 'Claude 터미널 종료 중...');
          const cleanupResult = await terminateTerminal(1001);
          addResult('Claude 터미널 정리', cleanupResult.success,
            cleanupResult.success ? '✅ 터미널 정상 종료' : `❌ 실패: ${cleanupResult.error}`);
        } else {
          const skipTests = ['Claude 버전 확인', 'Claude 도움말', 'Claude 세션 시작', 'Claude 메시지 전송', 'Claude 세션 종료', 'Claude 터미널 정리'];
          skipTests.forEach(test => {
            addResult(test, false, '❌ 터미널 생성 실패로 건너뜀');
          });
        }
      } else {
        const skipTests = ['Claude 터미널 생성', 'Claude 버전 확인', 'Claude 도움말', 'Claude 세션 시작', 'Claude 메시지 전송', 'Claude 세션 종료', 'Claude 터미널 정리'];
        skipTests.forEach(test => {
          addResult(test, false, '❌ CLI 설치 또는 인증 실패로 건너뜀');
        });
      }

      // 최종 결과 계산
      const actualTests = testResults.filter(r => 
        !r.message.includes('중...') &&
        !r.message.includes('시작...')
      );
      
      const successCount = actualTests.filter(r => r.success).length;
      const totalTests = 9; // M3의 실제 테스트 개수 (CLI확인, 인증확인, 터미널생성, 버전확인, 도움말, 세션시작, 메시지전송, 세션종료, 터미널정리)
      
      addResult('M3 최종 결과', successCount >= totalTests * 0.8, 
        `총 ${totalTests}개 테스트 중 ${successCount}개 성공 (${Math.round(successCount/totalTests*100)}%)`);

    } catch (error) {
      addResult('M3 전체 테스트', false, `오류 발생: ${error.message}`);
    }

    setIsRunning(false);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    try {
      // Test 1: Terminal 생성 테스트
      addResult('터미널 생성', false, '백엔드 터미널 생성 중...');
      const createResult = await createTerminal(999, null);
      addResult('터미널 생성', createResult.success, 
        createResult.success ? '✅ 터미널 생성 성공' : `❌ 실패: ${createResult.error}`);

      if (createResult.success) {
        // Test 2: pwd 명령어 실행 테스트
        addResult('명령어 실행', false, 'pwd 명령어 실행 중...');
        const execResult = await executeCommand(999, 'pwd');
        addResult('명령어 실행', execResult.success, 
          execResult.success ? '✅ 명령어 실행 성공' : `❌ 실패: ${execResult.error}`);

        // Test 3: ls 명령어 실행 테스트
        addResult('추가 명령어', false, 'ls 명령어 실행 중...');
        const lsResult = await executeCommand(999, 'ls');
        addResult('추가 명령어', lsResult.success,
          lsResult.success ? '✅ ls 명령어 성공' : `❌ 실패: ${lsResult.error}`);

        // Test 4: 환경 변수 테스트
        addResult('환경 변수', false, 'echo $HOME 명령어 실행 중...');
        const envResult = await executeCommand(999, 'echo $HOME');
        addResult('환경 변수', envResult.success,
          envResult.success ? '✅ 환경 변수 성공' : `❌ 실패: ${envResult.error}`);

        // Test 5: date 명령어 테스트
        addResult('시스템 명령어', false, 'date 명령어 실행 중...');
        const dateResult = await executeCommand(999, 'date');
        addResult('시스템 명령어', dateResult.success,
          dateResult.success ? '✅ 시스템 명령어 성공' : `❌ 실패: ${dateResult.error}`);

        // Test 6: whoami 테스트
        addResult('사용자 정보', false, 'whoami 명령어 실행 중...');
        const userResult = await executeCommand(999, 'whoami');
        addResult('사용자 정보', userResult.success,
          userResult.success ? '✅ 사용자 정보 성공' : `❌ 실패: ${userResult.error}`);

        // Test 7: ls -la 테스트
        addResult('상세 목록', false, 'ls -la 명령어 실행 중...');
        const detailResult = await executeCommand(999, 'ls -la');
        addResult('상세 목록', detailResult.success,
          detailResult.success ? '✅ 상세 목록 성공' : `❌ 실패: ${detailResult.error}`);

        // Test 8: 터미널 목록 조회
        addResult('터미널 목록', false, '활성 터미널 목록 조회 중...');
        const listResult = await listTerminals();
        addResult('터미널 목록', listResult.success, 
          listResult.success ? `✅ 활성 터미널: [${listResult.terminals.join(', ')}]` : `❌ 실패: ${listResult.error}`);

        // Test 9: 다중 터미널 생성
        addResult('다중 터미널', false, '추가 터미널 생성 중...');
        const createResult2 = await createTerminal(998);
        addResult('다중 터미널', createResult2.success,
          createResult2.success ? '✅ 다중 터미널 성공' : `❌ 실패: ${createResult2.error}`);

        // Test 10: 다중 터미널 목록 확인
        if (createResult2.success) {
          addResult('다중 목록 확인', false, '다중 터미널 목록 확인 중...');
          const multiListResult = await listTerminals();
          const hasMultiple = multiListResult.success && multiListResult.terminals.length >= 2;
          addResult('다중 목록 확인', hasMultiple,
            hasMultiple ? `✅ 다중 터미널 확인: [${multiListResult.terminals.join(', ')}]` : `❌ 실패: 다중 터미널 미확인`);
        } else {
          addResult('다중 목록 확인', false, '❌ 다중 터미널 생성 실패로 건너뜀');
        }

        // Test 11: 두 번째 터미널 종료
        if (createResult2.success) {
          addResult('두번째 터미널 종료', false, '두 번째 터미널 종료 중...');
          const terminate2Result = await terminateTerminal(998);
          addResult('두번째 터미널 종료', terminate2Result.success,
            terminate2Result.success ? '✅ 두 번째 터미널 종료 성공' : `❌ 실패: ${terminate2Result.error}`);
        } else {  
          addResult('두번째 터미널 종료', false, '❌ 두 번째 터미널이 없어 건너뜀');
        }

        // Test 12: 첫 번째 터미널 종료
        addResult('터미널 종료', false, '첫 번째 터미널 종료 중...');
        const terminateResult = await terminateTerminal(999);
        addResult('터미널 종료', terminateResult.success, 
          terminateResult.success ? '✅ 터미널 정상 종료' : `❌ 실패: ${terminateResult.error}`);

      } else {
        // 터미널 생성 실패 시 모든 후속 테스트를 실패로 처리
        const failedTests = [
          '명령어 실행', '추가 명령어', '환경 변수', '시스템 명령어', 
          '사용자 정보', '상세 목록', '터미널 목록', '다중 터미널',
          '다중 목록 확인', '두번째 터미널 종료', '터미널 종료'
        ];
        
        failedTests.forEach(test => {
          addResult(test, false, '❌ 터미널 생성 실패로 건너뜀');
        });
      }

      // 최종 결과 계산 (진행 상태 메시지는 제외하고 실제 결과만 카운트)
      const actualTests = testResults.filter(r => 
        !r.message.includes('중...') &&  // 진행 중 메시지 제외
        !r.message.includes('시작...')   // 시작 메시지 제외
      );
      
      const successCount = actualTests.filter(r => r.success).length;
      const totalTests = 12; // 실제 테스트 개수는 12개로 고정
      
      addResult('최종 결과', successCount >= totalTests * 0.8, 
        `총 ${totalTests}개 테스트 중 ${successCount}개 성공 (${Math.round(successCount/totalTests*100)}%)`);

    } catch (error) {
      addResult('전체 테스트', false, `오류 발생: ${error.message}`);
    }

    setIsRunning(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-700">백엔드 검증 (개발자용)</h3>
        <div className="space-x-2">
          <button 
            onClick={runTests}
            disabled={isRunning}
            className="px-3 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded text-sm"
          >
            {isRunning ? '테스트 중...' : 'M2 상세'}
          </button>
          <button 
            onClick={runM3Tests}
            disabled={isRunning}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white rounded text-sm"
          >
            {isRunning ? '테스트 중...' : 'M3 상세'}
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {testResults.map((result, index) => (
          <div key={index} className="flex items-center text-sm">
            <span className={`w-4 h-4 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span className="font-medium text-gray-700 mr-2">[{result.timestamp}]</span>
            <span className="font-medium text-gray-800 mr-2">{result.test}:</span>
            <span className={result.success ? 'text-green-700' : 'text-red-700'}>{result.message}</span>
          </div>
        ))}
        
        {testResults.length === 0 && !isRunning && (
          <p className="text-gray-500 text-sm">개발자용 상세 검증 - 일반 사용자는 위의 '빠른검증' 또는 '실제 사용검증'을 권장합니다.</p>
        )}
      </div>
    </div>
  );
};

export default TerminalTestHelper;