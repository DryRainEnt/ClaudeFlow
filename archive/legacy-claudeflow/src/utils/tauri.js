import { invoke } from '@tauri-apps/api/core';

// Tauri 초기화 확인 함수
const waitForTauri = async () => {
  const maxRetries = 50;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      if (window.__TAURI_INTERNALS__) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
  }
  throw new Error('Tauri not initialized after 5 seconds');
};

// 안전한 invoke 래퍼
const safeInvoke = async (command, args = {}) => {
  await waitForTauri();
  return invoke(command, args);
};

// 디렉토리 초기화
export const initializeDirectories = async () => {
  try {
    const result = await safeInvoke('initialize_directories');
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// 현재 작업 디렉토리 가져오기
export const getCurrentDirectory = async () => {
  try {
    const result = await safeInvoke('get_current_directory');
    return { success: true, directory: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// 새 터미널 프로세스 생성
export const createTerminal = async (terminalId, workingDirectory = null) => {
  try {
    const result = await safeInvoke('create_terminal', {
      terminalId: terminalId,
      workingDirectory: workingDirectory
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// 터미널에서 명령어 실행
export const executeCommand = async (terminalId, command) => {
  try {
    const result = await safeInvoke('execute_command', {
      terminalId: terminalId,
      command: command
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// 터미널 프로세스 종료
export const terminateTerminal = async (terminalId) => {
  try {
    const result = await safeInvoke('terminate_terminal', {
      terminalId: terminalId
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// 활성 터미널 목록 가져오기
export const listTerminals = async () => {
  try {
    const result = await safeInvoke('list_terminals');
    return { success: true, terminals: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// ClaudeCode CLI 설치 상태 확인
export const checkClaudeCli = async () => {
  try {
    const result = await safeInvoke('check_claude_cli');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// Claude 인증 상태 확인
export const checkClaudeAuth = async () => {
  try {
    const result = await safeInvoke('check_claude_auth');
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// Claude 세션 시작
export const startClaudeSession = async (terminalId, sessionArgs = null) => {
  try {
    const result = await safeInvoke('start_claude_session', {
      terminalId: terminalId,
      sessionArgs: sessionArgs
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// Claude 메시지 전송
export const sendClaudeMessage = async (terminalId, message) => {
  try {
    const result = await safeInvoke('send_claude_message', {
      terminalId: terminalId,
      message: message
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// Claude 세션 종료
export const stopClaudeSession = async (terminalId) => {
  try {
    const result = await safeInvoke('stop_claude_session', {
      terminalId: terminalId
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// 검증 결과 로깅
export const logVerificationResult = async (testType, results) => {
  try {
    const result = await safeInvoke('log_verification_result', {
      testType: testType,
      results: results
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// 시스템 터미널 열기 (사용자의 실제 터미널 환경)
export const openSystemTerminal = async (workingDirectory = null) => {
  try {
    const result = await safeInvoke('open_system_terminal', {
      workingDirectory: workingDirectory
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// ========== PTY 터미널 함수들 ==========

// PTY 터미널 생성
export const createPtyTerminal = async (terminalId, workingDirectory = null) => {
  try {
    const result = await safeInvoke('create_pty_terminal', {
      terminalId: terminalId,
      workingDirectory: workingDirectory
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// PTY 터미널 데이터 읽기
export const readPtyTerminal = async (terminalId) => {
  try {
    const result = await safeInvoke('read_pty_terminal', {
      terminalId: terminalId
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// PTY 터미널 데이터 쓰기
export const writePtyTerminal = async (terminalId, data) => {
  try {
    const result = await safeInvoke('write_pty_terminal', {
      terminalId: terminalId,
      data: data
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// PTY 터미널 크기 조정
export const resizePtyTerminal = async (terminalId, rows, cols) => {
  try {
    const result = await safeInvoke('resize_pty_terminal', {
      terminalId: terminalId,
      rows: rows,
      cols: cols
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};

// PTY 터미널 종료
export const destroyPtyTerminal = async (terminalId) => {
  try {
    const result = await safeInvoke('destroy_pty_terminal', {
      terminalId: terminalId
    });
    return { success: true, message: result };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
};