const { app, BrowserWindow, screen, Tray, Menu, ipcMain } = require('electron');

// IPC 클로닝 오류 경고 억제
process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.message && reason.message.includes('object could not be cloned')) {
    // IPC 클로닝 관련 오류는 무시 (기능상 문제없음)
    console.log('🔇 IPC 클로닝 경고 억제:', reason.message.substring(0, 50));
    return;
  }
  // 다른 unhandledRejection은 기존 방식대로 처리
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
const path = require('path');
const { spawn } = require('child_process');

// 🧚‍♀️ Fairy Assistant - 메인 프로세스
// 바탕화면 거주형 AI 비서의 핵심 엔진

let fairyWindow;
let houseWindow; 
let tray;
let pythonBridge; // Python Bridge 프로세스
let fairyChatInputWindow = null; // 요정 채팅 입력창
let fairySpeechBubbleWindow = null; // 요정 말풍선 창
let fairyInternalSpeechWindow = null; // 요정 내부 말풍선 창
let fairyThinkingBubbleWindow = null; // 요정 생각중 말풍선 창

// 🏠 집의 고정 위치 (좌측 상단)
const HOUSE_POSITION = { x: 50, y: 50 };
const HOUSE_SIZE = { width: 120, height: 80 };

// 🧚‍♀️ 요정의 돌아다니기 설정 (LUCA 캐릭터용으로 최적화)
const FAIRY_SIZE = { width: 200, height: 220 }; // LUCA 캐릭터 잘림 방지를 위해 캔버스와 동일하게 확장
const FAIRY_CONTENT_OFFSET = { x: 70, y: 80 }; // LUCA 캐릭터 중심 오프셋
const ROAM_RADIUS = 64; // 자기 위치 기준 반경
const MOVE_INTERVAL = 3000; // 3초마다 이동

class FairySystem {
  constructor() {
    this.currentPosition = { ...HOUSE_POSITION };
    this.targetPosition = { ...HOUSE_POSITION };
    this.isMoving = false;
    this.isPaused = false;
    this.roamingTimer = null;
    this.aiActionTimer = null; // AI 기반 능동적 행동 타이머
    this.lastAiDecisionTime = 0;
    this.aiMode = true; // AI 모드 활성화
  }

  // 자기 위치 기준 랜덤 이동 계산
  generateQuarterViewPosition() {
    // 현재 요정 위치를 중심으로 이동
    const centerX = this.currentPosition.x + FAIRY_SIZE.width / 2;
    const centerY = this.currentPosition.y + FAIRY_SIZE.height / 2;
    
    // 완전 랜덤 방향 (360도)
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * ROAM_RADIUS;
    
    const newX = centerX + (Math.cos(angle) * distance) - FAIRY_SIZE.width / 2;
    const newY = centerY + (Math.sin(angle) * distance) - FAIRY_SIZE.height / 2;
    
    // 화면 경계 확인
    const display = screen.getPrimaryDisplay();
    const bounds = display.workArea;
    
    return {
      x: Math.max(-FAIRY_SIZE.width/2, Math.min(newX, bounds.width - FAIRY_SIZE.width/2)),
      y: Math.max(-FAIRY_SIZE.height/2, Math.min(newY, bounds.height - FAIRY_SIZE.height/2))
    };
  }

  // 부드러운 이동 애니메이션
  async moveToPosition(targetPos) {
    if (this.isMoving) return;
    
    this.isMoving = true;
    this.targetPosition = targetPos;
    
    const startPos = { ...this.currentPosition };
    const duration = 2000; // 2초 이동
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // 이징 함수 (부드러운 움직임)
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const currentX = startPos.x + (targetPos.x - startPos.x) * eased;
      const currentY = startPos.y + (targetPos.y - startPos.y) * eased;
      
      this.currentPosition = { x: currentX, y: currentY };
      
      if (fairyWindow && !fairyWindow.isDestroyed()) {
        fairyWindow.setBounds({
          x: Math.floor(currentX),
          y: Math.floor(currentY),
          width: FAIRY_SIZE.width,
          height: FAIRY_SIZE.height
        });
      }
      
      if (progress < 1) {
        setTimeout(animate, 16); // ~60fps
      } else {
        this.isMoving = false;
      }
    };
    
    animate();
  }

  // 주기적 돌아다니기 시작
  startRoaming() {
    if (this.aiMode) {
      this.startAiBasedBehavior();
    } else {
      this.startRandomRoaming();
    }
  }
  
  startRandomRoaming() {
    this.roamingTimer = setInterval(() => {
      if (!this.isMoving && !this.isPaused) {
        const newPos = this.generateQuarterViewPosition();
        this.moveToPosition(newPos);
      }
    }, MOVE_INTERVAL);
  }
  
  async startAiBasedBehavior() {
    if (this.aiActionTimer) return;
    console.log('🧠 AI 기반 능동적 행동 시작!');
    
    const aiLoop = async () => {
      if (this.isPaused) return;
      
      try {
        // Python Bridge에 AI 행동 요청
        const aiDecision = await this.requestAiAction();
        await this.executeAiDecision(aiDecision);
        
        // 다음 AI 판단까지의 간격 (5-15분)
        const nextInterval = Math.random() * 600000 + 300000;
        this.aiActionTimer = setTimeout(aiLoop, nextInterval);
        
      } catch (error) {
        console.error('🚨 AI 행동 처리 오류:', error);
        // 오류 시 3분 후 재시도
        this.aiActionTimer = setTimeout(aiLoop, 180000);
      }
    };
    
    // 첫 AI 행동은 30초 후
    this.aiActionTimer = setTimeout(aiLoop, 30000);
  }
  
  async requestAiAction() {
    try {
      const response = await fetch('http://localhost:8766/api/ai-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_position: this.currentPosition,
          timestamp: Date.now()
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🧠 AI 결정 받음:', result);
        return result;
      } else {
        throw new Error(`AI 행동 요청 실패: ${response.status}`);
      }
    } catch (error) {
      console.error('🚨 AI 행동 요청 오류:', error);
      return null;
    }
  }
  
  async executeAiDecision(aiDecision) {
    if (!aiDecision || !aiDecision.decision) return;
    
    const decision = aiDecision.decision;
    console.log(`🎭 AI 행동 실행: ${decision.action}`);
    
    switch (decision.action) {
      case 'speak':
        if (decision.message) {
          await this.showAiGeneratedSpeech(decision.message);
        }
        break;
        
      case 'move':
        if (decision.target && decision.reason) {
          const targetPos = await this.requestAiMovement();
          if (targetPos) {
            console.log(`🚶‍♀️ AI 이동: ${decision.reason}`);
            await this.moveToPosition(targetPos.movement);
          }
        }
        break;
        
      case 'observe':
        console.log(`👁️ AI 관찰: ${decision.focus || '사용자 활동'}`);
        // 관찰 모드는 특별한 동작 없음
        break;
        
      case 'wait':
        console.log(`⏳ AI 대기: ${decision.reason || '조용히 기다리는 중'}`);
        // 대기 모드는 특별한 동작 없음
        break;
        
      default:
        console.log(`❓ 알 수 없는 AI 행동: ${decision.action}`);
    }
  }
  
  async requestAiMovement() {
    try {
      const response = await fetch('http://localhost:8766/api/ai-movement', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_position: this.currentPosition
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🎯 AI 이동 결정:', result);
        return result;
      }
    } catch (error) {
      console.error('🚨 AI 이동 요청 오류:', error);
    }
    return null;
  }
  
  async showAiGeneratedSpeech(message) {
    console.log(`💬 AI 생성 메시지: ${message}`);
    
    // 기존 내부 말풍선 시스템 사용
    const fairyPos = this.currentPosition;
    const speechX = fairyPos.x + FAIRY_CONTENT_OFFSET.x - 60;
    const speechY = fairyPos.y + FAIRY_CONTENT_OFFSET.y + 20;
    
    createFairyInternalSpeech(speechX, speechY, message);
  }

  // 드래그 중 움직임 일시정지
  pauseMovement() {
    this.isPaused = true;
    console.log('🚫 요정 자동 움직임 일시정지');
  }

  // 움직임 재개
  resumeMovement() {
    this.isPaused = false;
    console.log('✅ 요정 자동 움직임 재개');
  }

  // 드래그 완료 후 새 위치 설정
  setNewPosition(x, y) {
    this.currentPosition = { x, y };
    this.targetPosition = { x, y };
    console.log('📍 요정 새 위치 설정:', x, y);
    
    // 실제 윈도우 이동 처리
    if (fairyWindow && !fairyWindow.isDestroyed()) {
      fairyWindow.setBounds({
        x: Math.floor(x),
        y: Math.floor(y),
        width: FAIRY_SIZE.width,
        height: FAIRY_SIZE.height
      });
    }
  }
}

const fairySystem = new FairySystem();

// Python Bridge 관리
function startPythonBridge() {
  const pythonScript = path.join(__dirname, 'python', 'fairy_bridge.py');
  
  try {
    // 가상환경의 python 실행파일 경로
    const venvPython = path.join(__dirname, 'python', 'venv', 'bin', 'python');
    pythonBridge = spawn(venvPython, [pythonScript], {
      cwd: path.join(__dirname, 'python')
    });
    
    pythonBridge.stdout.on('data', (data) => {
      console.log('🐍 Python Bridge:', data.toString());
    });
    
    pythonBridge.stderr.on('data', (data) => {
      console.error('🚨 Python Bridge 오류:', data.toString());
    });
    
    pythonBridge.on('close', (code) => {
      console.log(`🐍 Python Bridge 종료됨 (코드: ${code})`);
    });
    
    console.log('🚀 Python Bridge 시작됨');
    return true;
    
  } catch (error) {
    console.error('❌ Python Bridge 시작 실패:', error);
    return false;
  }
}

function stopPythonBridge() {
  if (pythonBridge && !pythonBridge.killed) {
    pythonBridge.kill();
    console.log('🛑 Python Bridge 종료');
  }
}

// 🧚‍♀️ 페어리 성격 설정창 생성
function createPersonalitySettingsWindow() {
  const personalityWindow = new BrowserWindow({
    width: 520,
    height: 650,
    center: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true,
    show: false
  });

  personalityWindow.loadFile(path.join(__dirname, 'personality-settings.html'));
  
  personalityWindow.once('ready-to-show', () => {
    personalityWindow.show();
    personalityWindow.focus();
  });
  
  // 개발 모드에서만 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    personalityWindow.webContents.openDevTools();
  }

  console.log('🧚‍♀️ 페어리 성격 설정 창 열림');
  return personalityWindow;
}

// 📁 페어리 성격 설정 파일 저장
async function savePersonalitySettings(settings) {
  const fs = require('fs').promises;
  const os = require('os');
  
  try {
    const configDir = path.join(os.homedir(), '.fairy-assistant');
    const configFile = path.join(configDir, 'personality.json');
    
    // 디렉토리가 없으면 생성
    try {
      await fs.access(configDir);
    } catch {
      await fs.mkdir(configDir, { recursive: true });
      console.log('📁 설정 디렉토리 생성:', configDir);
    }
    
    // 설정 파일 저장
    await fs.writeFile(configFile, JSON.stringify(settings, null, 2), 'utf8');
    console.log('💾 페어리 성격 설정 저장 완료:', configFile);
    return true;
    
  } catch (error) {
    console.error('❌ 페어리 성격 설정 저장 실패:', error);
    return false;
  }
}

// 📁 페어리 성격 설정 파일 로드
async function loadPersonalitySettings() {
  const fs = require('fs').promises;
  const os = require('os');
  
  try {
    const configFile = path.join(os.homedir(), '.fairy-assistant', 'personality.json');
    const data = await fs.readFile(configFile, 'utf8');
    const settings = JSON.parse(data);
    console.log('📋 페어리 성격 설정 로드 완료:', settings);
    return settings;
    
  } catch (error) {
    // 파일이 없으면 기본값 반환
    if (error.code === 'ENOENT') {
      console.log('📋 기본 페어리 설정 사용 (설정 파일 없음)');
      return {
        name: '페어리',
        personality: '친절하고 도움을 주는 것을 좋아하며, 항상 밝고 긍정적인 에너지를 가지고 있습니다.',
        role: '개발과 창작 활동을 도와주는 AI 어시스턴트',
        timestamp: new Date().toISOString()
      };
    }
    
    console.error('❌ 페어리 성격 설정 로드 실패:', error);
    return null;
  }
}

// ⚙️ 메인 설정창 생성
function createMainSettingsWindow() {
  const mainSettingsWindow = new BrowserWindow({
    width: 640,
    height: 750,
    center: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true,
    show: false
  });

  mainSettingsWindow.loadFile(path.join(__dirname, 'main-settings.html'));
  
  mainSettingsWindow.once('ready-to-show', () => {
    mainSettingsWindow.show();
    mainSettingsWindow.focus();
  });
  
  // 개발 모드에서만 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    mainSettingsWindow.webContents.openDevTools();
  }

  console.log('⚙️ 메인 설정 창 열림');
  return mainSettingsWindow;
}

// 📁 메인 설정 파일 저장
async function saveMainSettings(settings) {
  const fs = require('fs').promises;
  const os = require('os');
  
  try {
    const configDir = path.join(os.homedir(), '.fairy-assistant');
    const configFile = path.join(configDir, 'main-settings.json');
    
    // 디렉토리가 없으면 생성
    try {
      await fs.access(configDir);
    } catch {
      await fs.mkdir(configDir, { recursive: true });
      console.log('📁 설정 디렉토리 생성:', configDir);
    }
    
    // 설정 파일 저장
    await fs.writeFile(configFile, JSON.stringify(settings, null, 2), 'utf8');
    console.log('💾 메인 설정 저장 완료:', configFile);
    
    // 설정이 변경되면 실제 시스템에 적용
    applyMainSettings(settings);
    
    return true;
    
  } catch (error) {
    console.error('❌ 메인 설정 저장 실패:', error);
    return false;
  }
}

// 📁 메인 설정 파일 로드
async function loadMainSettings() {
  const fs = require('fs').promises;
  const os = require('os');
  
  try {
    const configFile = path.join(os.homedir(), '.fairy-assistant', 'main-settings.json');
    const data = await fs.readFile(configFile, 'utf8');
    const settings = JSON.parse(data);
    console.log('📋 메인 설정 로드 완료:', settings);
    return settings;
    
  } catch (error) {
    // 파일이 없으면 기본값 반환
    if (error.code === 'ENOENT') {
      console.log('📋 기본 메인 설정 사용 (설정 파일 없음)');
      return {
        autoMove: true,
        moveInterval: 3,
        moveRadius: 64,
        houseFixed: true,
        autoCloseTime: 8,
        bubbleDuration: 10,
        autoResponse: true,
        theme: 'default',
        transparency: 95,
        timestamp: new Date().toISOString()
      };
    }
    
    console.error('❌ 메인 설정 로드 실패:', error);
    return null;
  }
}

// ⚙️ 메인 설정 적용
function applyMainSettings(settings) {
  try {
    console.log('🔧 메인 설정 적용 중:', settings);
    
    // 페어리 이동 관련 설정 적용
    if (fairySystem) {
      if (settings.autoMove) {
        fairySystem.resumeMovement();
        // 이동 간격 업데이트 (현재 구조상 직접 변경 어려움, 추후 개선 필요)
      } else {
        fairySystem.pauseMovement();
      }
    }
    
    // context-menu.html의 자동 닫기 시간은 현재 하드코딩되어 있음 (8초)
    // 필요시 동적으로 변경하는 기능을 추후 추가
    
    console.log('✅ 메인 설정 적용 완료');
    
  } catch (error) {
    console.error('❌ 메인 설정 적용 실패:', error);
  }
}

// 📋 로그 뷰어 창 생성
function createLogViewerWindow() {
  const logViewerWindow = new BrowserWindow({
    width: 900,
    height: 700,
    center: true,
    resizable: true,
    minimizable: false,
    maximizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true,
    show: false
  });

  logViewerWindow.loadFile(path.join(__dirname, 'log-viewer.html'));
  
  logViewerWindow.once('ready-to-show', () => {
    logViewerWindow.show();
    logViewerWindow.focus();
  });
  
  // 개발 모드에서만 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    logViewerWindow.webContents.openDevTools();
  }

  console.log('📋 로그 뷰어 창 열림');
  return logViewerWindow;
}

// 📁 로그 파일들 로드
async function loadLogFiles() {
  const fs = require('fs').promises;
  const os = require('os');
  
  try {
    const logDir = path.join(os.homedir(), '.fairy-assistant', 'logs');
    const logs = [];
    
    // 로그 디렉토리 확인
    try {
      await fs.access(logDir);
    } catch {
      console.log('📁 로그 디렉토리가 없음, 더미 로그 생성');
      return generateDummyLogs();
    }
    
    // 로그 파일들 읽기 (debug.log, session.log, mcp.log 등)
    const logFiles = ['debug.log', 'session.log', 'mcp.log', 'main.log'];
    
    for (const filename of logFiles) {
      const filepath = path.join(logDir, filename);
      try {
        const content = await fs.readFile(filepath, 'utf8');
        const fileLogs = parseLogFile(content, filename);
        logs.push(...fileLogs);
      } catch (error) {
        // 파일이 없으면 건너뛰기
        if (error.code !== 'ENOENT') {
          console.error(`❌ ${filename} 로드 실패:`, error);
        }
      }
    }
    
    // 시간순 정렬
    logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    console.log(`📋 로그 ${logs.length}개 로드 완료`);
    return logs;
    
  } catch (error) {
    console.error('❌ 로그 파일 로드 실패:', error);
    return generateDummyLogs();
  }
}

// 📄 로그 파일 파싱
function parseLogFile(content, filename) {
  const logs = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    try {
      // 간단한 로그 파싱 (타임스탬프, 레벨, 메시지)
      const match = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)?\s*(\w+):?\s*(.+)$/);
      
      if (match) {
        const [, timestamp, level, message] = match;
        logs.push({
          timestamp: timestamp || new Date().toISOString(),
          level: determineLogLevel(level, message),
          message: message.trim(),
          source: filename
        });
      } else {
        // 파싱할 수 없는 라인은 info로 처리
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line.trim(),
          source: filename
        });
      }
    } catch (error) {
      // 파싱 오류 무시
    }
  });
  
  return logs;
}

// 🎯 로그 레벨 결정
function determineLogLevel(level, message) {
  if (level) {
    const lowerLevel = level.toLowerCase();
    if (['error', 'err'].includes(lowerLevel)) return 'error';
    if (['warning', 'warn'].includes(lowerLevel)) return 'warning';
    if (['success', 'ok'].includes(lowerLevel)) return 'success';
    if (['debug', 'dbg'].includes(lowerLevel)) return 'debug';
    return 'info';
  }
  
  // 메시지 내용으로 레벨 추정
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('error') || lowerMessage.includes('fail') || lowerMessage.includes('❌')) return 'error';
  if (lowerMessage.includes('warn') || lowerMessage.includes('⚠️')) return 'warning';
  if (lowerMessage.includes('success') || lowerMessage.includes('완료') || lowerMessage.includes('✅')) return 'success';
  if (lowerMessage.includes('debug') || lowerMessage.includes('🔍')) return 'debug';
  
  return 'info';
}

// 📝 더미 로그 생성 (테스트용)
function generateDummyLogs() {
  const now = new Date();
  const logs = [
    {
      timestamp: new Date(now - 300000).toISOString(),
      level: 'info',
      message: '🧚‍♀️ Fairy Assistant 시작',
      source: 'main.log'
    },
    {
      timestamp: new Date(now - 250000).toISOString(),
      level: 'success',
      message: '✅ Python Bridge 초기화 완료',
      source: 'session.log'
    },
    {
      timestamp: new Date(now - 200000).toISOString(),
      level: 'info',
      message: '🏠 집 윈도우 생성 완료',
      source: 'main.log'
    },
    {
      timestamp: new Date(now - 150000).toISOString(),
      level: 'debug',
      message: '🔍 페어리 이동 시스템 초기화',
      source: 'debug.log'
    },
    {
      timestamp: new Date(now - 100000).toISOString(),
      level: 'warning',
      message: '⚠️ 설정 파일이 없어서 기본값 사용',
      source: 'main.log'
    },
    {
      timestamp: new Date(now - 50000).toISOString(),
      level: 'success',
      message: '✅ MCP 서버 연결 성공',
      source: 'mcp.log'
    },
    {
      timestamp: new Date(now - 10000).toISOString(),
      level: 'error',
      message: '❌ Claude API 호출 실패: 네트워크 오류',
      source: 'session.log'
    },
    {
      timestamp: now.toISOString(),
      level: 'info',
      message: '📋 로그 뷰어 열림',
      source: 'main.log'
    }
  ];
  
  console.log('📝 더미 로그 8개 생성');
  return logs;
}

// 🗑️ 로그 파일들 클리어
async function clearLogFiles() {
  const fs = require('fs').promises;
  const os = require('os');
  
  try {
    const logDir = path.join(os.homedir(), '.fairy-assistant', 'logs');
    const logFiles = ['debug.log', 'session.log', 'mcp.log', 'main.log'];
    
    for (const filename of logFiles) {
      const filepath = path.join(logDir, filename);
      try {
        await fs.writeFile(filepath, '', 'utf8');
        console.log(`🗑️ ${filename} 클리어 완료`);
      } catch (error) {
        // 파일이 없으면 건너뛰기
        if (error.code !== 'ENOENT') {
          console.error(`❌ ${filename} 클리어 실패:`, error);
        }
      }
    }
    
    console.log('✅ 모든 로그 파일 클리어 완료');
    return true;
    
  } catch (error) {
    console.error('❌ 로그 클리어 실패:', error);
    return false;
  }
}

// 💾 로그 내보내기
async function exportLogFiles() {
  const fs = require('fs').promises;
  const os = require('os');
  
  try {
    // 현재 로그들 로드
    const logs = await loadLogFiles();
    
    // 로그를 텍스트로 변환
    let exportContent = `# Fairy Assistant 로그 내보내기\n`;
    exportContent += `# 내보낸 시간: ${new Date().toLocaleString()}\n`;
    exportContent += `# 총 로그 개수: ${logs.length}\n\n`;
    
    logs.forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      exportContent += `[${timestamp}] [${log.level.toUpperCase()}] ${log.message} (${log.source})\n`;
    });
    
    // 바탕화면에 저장
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const filename = `fairy-assistant-logs-${new Date().toISOString().split('T')[0]}.txt`;
    const filepath = path.join(desktopPath, filename);
    
    await fs.writeFile(filepath, exportContent, 'utf8');
    
    console.log(`💾 로그 내보내기 완료: ${filepath}`);
    return { success: true, filepath };
    
  } catch (error) {
    console.error('❌ 로그 내보내기 실패:', error);
    return { success: false, filepath: null };
  }
}

// 💻 시스템 정보 창 생성
function createSystemInfoWindow() {
  const systemInfoWindow = new BrowserWindow({
    width: 750,
    height: 650,
    center: true,
    resizable: true,
    minimizable: false,
    maximizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true,
    show: false
  });

  systemInfoWindow.loadFile(path.join(__dirname, 'system-info.html'));
  
  systemInfoWindow.once('ready-to-show', () => {
    systemInfoWindow.show();
    systemInfoWindow.focus();
  });
  
  // 개발 모드에서만 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    systemInfoWindow.webContents.openDevTools();
  }

  console.log('💻 시스템 정보 창 열림');
  return systemInfoWindow;
}

// 💻 시스템 정보 수집
async function loadSystemInfo() {
  const os = require('os');
  
  try {
    // 기본 시스템 정보
    const platform = os.platform();
    const release = os.release();
    const arch = os.arch();
    const hostname = os.hostname();
    const uptime = os.uptime();
    
    // 메모리 정보
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    // CPU 정보
    const cpus = os.cpus();
    const cpuCount = cpus.length;
    const loadAverage = os.loadavg();
    
    // 프로세스 정보
    const pid = process.pid;
    const processUptime = process.uptime() * 1000; // 밀리초로 변환
    
    // 버전 정보
    const nodeVersion = process.versions.node;
    const electronVersion = process.versions.electron;
    const chromeVersion = process.versions.chrome;
    const v8Version = process.versions.v8;
    
    // Fairy Assistant 특화 정보
    const fairyMovement = fairySystem ? !fairySystem.isPaused : false;
    const pythonBridge = pythonBridge !== null && pythonBridge !== undefined;
    
    const systemInfo = {
      // 시스템 기본 정보
      platform: formatPlatformName(platform),
      release,
      arch,
      hostname,
      uptime,
      
      // 메모리 정보
      totalMemory,
      freeMemory,
      usedMemory,
      memoryUsagePercent,
      
      // CPU 정보
      cpuCount,
      loadAverage,
      cpuModel: cpus[0]?.model || 'Unknown',
      
      // 프로세스 정보
      pid,
      processUptime,
      
      // 버전 정보
      nodeVersion,
      electronVersion,
      chromeVersion,
      v8Version,
      
      // Fairy Assistant 정보
      fairyMovement,
      pythonBridge,
      
      // 수집 시간
      timestamp: new Date().toISOString()
    };
    
    console.log('💻 시스템 정보 수집 완료');
    return systemInfo;
    
  } catch (error) {
    console.error('❌ 시스템 정보 수집 실패:', error);
    return null;
  }
}

// 🖥️ 플랫폼 이름 포맷팅
function formatPlatformName(platform) {
  const platformNames = {
    'darwin': 'macOS',
    'win32': 'Windows',
    'linux': 'Linux',
    'freebsd': 'FreeBSD',
    'openbsd': 'OpenBSD',
    'sunos': 'SunOS',
    'aix': 'AIX'
  };
  
  return platformNames[platform] || platform;
}

// ℹ️ About 창 생성
function createAboutWindow() {
  const aboutWindow = new BrowserWindow({
    width: 560,
    height: 720,
    center: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true,
    show: false
  });

  aboutWindow.loadFile(path.join(__dirname, 'about.html'));
  
  aboutWindow.once('ready-to-show', () => {
    aboutWindow.show();
    aboutWindow.focus();
  });
  
  // 개발 모드에서만 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    aboutWindow.webContents.openDevTools();
  }

  console.log('ℹ️ About 창 열림');
  return aboutWindow;
}

// 🎨 커스터마이징 창 생성
function createCustomizationWindow() {
  const customizationWindow = new BrowserWindow({
    width: 680,
    height: 800,
    center: true,
    resizable: true,
    minimizable: false,
    maximizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true,
    show: false
  });

  customizationWindow.loadFile(path.join(__dirname, 'customization.html'));
  
  customizationWindow.once('ready-to-show', () => {
    customizationWindow.show();
    customizationWindow.focus();
  });
  
  // 개발 모드에서만 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    customizationWindow.webContents.openDevTools();
  }

  console.log('🎨 커스터마이징 창 열림');
  return customizationWindow;
}

function createAuthSettingsWindow() {
  const authWindow = new BrowserWindow({
    width: 600,
    height: 700,
    center: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true
  });

  authWindow.loadFile(path.join(__dirname, 'auth-settings.html'));
  
  // 개발 모드에서만 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    authWindow.webContents.openDevTools();
  }

  console.log('🔑 인증 설정 창 열림');
  return authWindow;
}

function createChatWindow() {
  const chatWindow = new BrowserWindow({
    width: 450,
    height: 600,
    center: true,
    resizable: true,
    minimizable: true,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true
  });

  chatWindow.loadFile(path.join(__dirname, 'chat-window.html'));
  
  // 개발 모드에서만 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    chatWindow.webContents.openDevTools();
  }

  console.log('💬 채팅 창 열림');
  return chatWindow;
}

function createContextMenu(x, y) {
  const contextWindow = new BrowserWindow({
    x: x,
    y: y,
    width: 200,
    height: 250,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  contextWindow.loadFile(path.join(__dirname, 'context-menu.html'));
  
  // 포커스 잃으면 자동으로 닫기
  contextWindow.on('blur', () => {
    if (!contextWindow.isDestroyed()) {
      contextWindow.close();
    }
  });

  console.log('📱 컨텍스트 메뉴 창 열림:', x, y);
  return contextWindow;
}

function createFairyChatInput(fairyX, fairyY) {
  // 기존 채팅 입력창이 있으면 닫기
  if (fairyChatInputWindow && !fairyChatInputWindow.isDestroyed()) {
    fairyChatInputWindow.close();
    fairyChatInputWindow = null;
    // fairy.html에 채팅창 닫힘 알림
    if (fairyWindow && !fairyWindow.isDestroyed()) {
      fairyWindow.webContents.send('chat-input-closed');
    }
    return;
  }

  // 요정 발 아래 위치 계산 (요정 중앙 하단)
  const inputX = fairyX + (FAIRY_SIZE.width / 2) - 175; // 입력창 중앙 정렬
  const inputY = fairyY + FAIRY_SIZE.height + 10; // 요정 바로 아래

  fairyChatInputWindow = new BrowserWindow({
    x: inputX,
    y: inputY,
    width: 350,
    height: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  fairyChatInputWindow.loadFile(path.join(__dirname, 'fairy-chat-input.html'));
  
  // 포커스 잃으면 닫지 말고 유지 (드래그앤드롭을 위해)
  fairyChatInputWindow.on('blur', () => {
    // 포커스를 잃어도 창을 닫지 않음
    console.log('💬 채팅 입력창 포커스 잃음 (유지됨)');
  });

  // 창이 닫힐 때 변수 리셋
  fairyChatInputWindow.on('closed', () => {
    fairyChatInputWindow = null;
    // fairy.html에 채팅창 닫힘 알림
    if (fairyWindow && !fairyWindow.isDestroyed()) {
      fairyWindow.webContents.send('chat-input-closed');
    }
    console.log('💬 채팅 입력창 닫힘');
  });

  // 채팅창이 생성됨을 fairy.html에 알림
  if (fairyWindow && !fairyWindow.isDestroyed()) {
    fairyWindow.webContents.send('chat-input-opened');
  }

  console.log('💬 요정 채팅 입력창 열림:', inputX, inputY);
  return fairyChatInputWindow;
}

function createFairySpeechBubble(fairyX, fairyY, message, type = 'normal') {
  // 기존 말풍선이 있으면 닫기
  if (fairySpeechBubbleWindow && !fairySpeechBubbleWindow.isDestroyed()) {
    fairySpeechBubbleWindow.close();
    fairySpeechBubbleWindow = null;
  }

  // 요정 위쪽에 말풍선 위치 계산
  const bubbleX = fairyX + (FAIRY_SIZE.width / 2) - 140; // 말풍선 중앙 정렬
  const bubbleY = fairyY - 80; // 요정 위쪽

  fairySpeechBubbleWindow = new BrowserWindow({
    x: bubbleX,
    y: bubbleY,
    width: 280,
    height: 100,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    focusable: false, // 포커스를 받지 않음
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // URL 파라미터로 메시지와 타입 전달
  const encodedMessage = encodeURIComponent(message);
  fairySpeechBubbleWindow.loadFile(
    path.join(__dirname, 'fairy-speech-bubble.html'),
    { query: { message: encodedMessage, type: type } }
  );
  
  // 창이 닫힐 때 변수 리셋
  fairySpeechBubbleWindow.on('closed', () => {
    fairySpeechBubbleWindow = null;
    console.log('💬 말풍선 닫힘');
  });

  console.log('💬 요정 말풍선 생성:', bubbleX, bubbleY, message);
  return fairySpeechBubbleWindow;
}

function updateFairySpeechBubble(message, type = 'normal') {
  if (fairySpeechBubbleWindow && !fairySpeechBubbleWindow.isDestroyed()) {
    fairySpeechBubbleWindow.webContents.send('update-speech', message, type);
    console.log('💬 말풍선 업데이트:', message);
  }
}

function showTypingIndicator() {
  if (fairySpeechBubbleWindow && !fairySpeechBubbleWindow.isDestroyed()) {
    fairySpeechBubbleWindow.webContents.send('show-typing');
    console.log('💬 타이핑 인디케이터 표시');
  }
}

function createFairyInternalSpeech(fairyX, fairyY, message) {
  // 기존 생각중 말풍선 닫기
  closeFairyThinkingBubble();
  
  // 기존 내부 말풍선이 있으면 닫기
  if (fairyInternalSpeechWindow && !fairyInternalSpeechWindow.isDestroyed()) {
    fairyInternalSpeechWindow.close();
    fairyInternalSpeechWindow = null;
  }

  // 요정 위쪽에 내부 말풍선 위치 계산
  const bubbleX = fairyX + (FAIRY_SIZE.width / 2) - 160; // 말풍선 중앙 정렬
  const bubbleY = fairyY - 60; // 요정 위쪽

  fairyInternalSpeechWindow = new BrowserWindow({
    x: bubbleX,
    y: bubbleY,
    width: 320,
    height: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    focusable: false, // 포커스를 받지 않음
    show: false, // 창 생성 시 포커스 도난 방지
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // URL 파라미터로 메시지 전달
  const encodedMessage = encodeURIComponent(message);
  fairyInternalSpeechWindow.loadFile(
    path.join(__dirname, 'fairy-internal-speech.html'),
    { query: { message: encodedMessage } }
  );
  
  // 창이 로드된 후 표시 (포커스 도난 방지)
  fairyInternalSpeechWindow.once('ready-to-show', () => {
    fairyInternalSpeechWindow.show();
  });
  
  // 창이 닫힐 때 변수 리셋
  fairyInternalSpeechWindow.on('closed', () => {
    fairyInternalSpeechWindow = null;
    console.log('💬 내부 말풍선 닫힘');
  });

  console.log('💬 요정 내부 말풍선 생성:', bubbleX, bubbleY, message);
  return fairyInternalSpeechWindow;
}

function createFairyThinkingBubble(fairyX, fairyY) {
  // 기존 생각중 말풍선이 있으면 닫기
  if (fairyThinkingBubbleWindow && !fairyThinkingBubbleWindow.isDestroyed()) {
    fairyThinkingBubbleWindow.close();
    fairyThinkingBubbleWindow = null;
  }

  // 요정 위쪽에 생각중 말풍선 위치 계산
  const bubbleX = fairyX + (FAIRY_SIZE.width / 2) - 60; // 말풍선 중앙 정렬
  const bubbleY = fairyY - 70; // 요정 위쪽

  fairyThinkingBubbleWindow = new BrowserWindow({
    x: bubbleX,
    y: bubbleY,
    width: 120,
    height: 80,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    focusable: false, // 포커스를 받지 않음
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  fairyThinkingBubbleWindow.loadFile(path.join(__dirname, 'fairy-thinking-bubble.html'));
  
  // 창이 닫힐 때 변수 리셋
  fairyThinkingBubbleWindow.on('closed', () => {
    fairyThinkingBubbleWindow = null;
    console.log('☁️ 생각중 말풍선 닫힘');
  });

  console.log('☁️ 요정 생각중 말풍선 생성:', bubbleX, bubbleY);
  return fairyThinkingBubbleWindow;
}

function closeFairyThinkingBubble() {
  if (fairyThinkingBubbleWindow && !fairyThinkingBubbleWindow.isDestroyed()) {
    fairyThinkingBubbleWindow.close();
    fairyThinkingBubbleWindow = null;
    console.log('☁️ 생각중 말풍선 수동 닫기');
  }
}

function createHouse() {
  houseWindow = new BrowserWindow({
    x: HOUSE_POSITION.x,
    y: HOUSE_POSITION.y,
    width: HOUSE_SIZE.width,
    height: HOUSE_SIZE.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 집은 클릭 가능하게 설정
  houseWindow.setIgnoreMouseEvents(false);
  houseWindow.loadFile(path.join(__dirname, 'house.html'));
  
  // 집 창에도 electronAPI 제공
  houseWindow.webContents.on('dom-ready', () => {
    houseWindow.webContents.executeJavaScript(`
      window.electronAPI = {
        openAuthSettings: () => {
          console.log('집에서 인증 설정 요청');
          require('electron').ipcRenderer.send('open-auth-settings');
        }
      };
    `);
  });
  
  // 집 영역 밖 클릭 시 투과 처리
  houseWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'mouseDown') {
      // JavaScript로 클릭 위치 확인 요청
      houseWindow.webContents.executeJavaScript(`
        (function() {
          const rect = document.querySelector('.house-container').getBoundingClientRect();
          const isInsideHouse = ${input.x} >= rect.left && ${input.x} <= rect.right && 
                               ${input.y} >= rect.top && ${input.y} <= rect.bottom;
          return isInsideHouse;
        })()
      `).then((isInsideHouse) => {
        if (!isInsideHouse) {
          // 집 밖 클릭 시 투과 모드 활성화
          houseWindow.setIgnoreMouseEvents(true, { forward: true });
          setTimeout(() => {
            houseWindow.setIgnoreMouseEvents(false);
          }, 100);
        }
      });
    }
  });
}

function createFairy() {
  fairyWindow = new BrowserWindow({
    x: HOUSE_POSITION.x + 20,
    y: HOUSE_POSITION.y + 20,
    width: FAIRY_SIZE.width,
    height: FAIRY_SIZE.height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // 🧚‍♀️ Fairy 윈도우를 House 윈도우보다 높은 z-level에 배치
  fairyWindow.setAlwaysOnTop(true, 'floating');

  // 요정도 클릭 가능하게 설정
  fairyWindow.setIgnoreMouseEvents(false);
  fairyWindow.loadFile(path.join(__dirname, 'luca-fairy.html'));

  // LUCA 캐릭터 로드 완료 후 통합 설정
  fairyWindow.webContents.once('did-finish-load', () => {
    console.log('🧚‍♀️ LUCA 요정 창 로드 완료');
    
    fairyWindow.webContents.executeJavaScript(`
      // Fairy System과의 연동을 위한 글로벌 객체
      window.fairySystem = {
        pauseMovement: () => {
          console.log('🔄 FairySystem.pauseMovement 호출');
          if (typeof require !== 'undefined') {
            require('electron').ipcRenderer.send('pause-fairy-movement');
          }
        },
        resumeMovement: () => {
          console.log('🔄 FairySystem.resumeMovement 호출');
          if (typeof require !== 'undefined') {
            require('electron').ipcRenderer.send('resume-fairy-movement');
          }
        },
        setNewPosition: (x, y) => {
          console.log('🔄 FairySystem.setNewPosition 호출:', x, y);
          const safeX = typeof x === 'number' ? x : Number(x) || 0;
          const safeY = typeof y === 'number' ? y : Number(y) || 0;
          if (typeof require !== 'undefined') {
            require('electron').ipcRenderer.send('set-fairy-position', safeX, safeY);
          }
        }
      };
      
      window.electronAPI = {
        moveWindow: (x, y) => {
          console.log('🖱️ ElectronAPI.moveWindow 호출:', x, y);
          const safeX = typeof x === 'number' ? x : Number(x) || 0;
          const safeY = typeof y === 'number' ? y : Number(y) || 0;
          require('electron').ipcRenderer.send('move-fairy-window', safeX, safeY);
        },
        getWindowPosition: async () => {
          try {
            return await require('electron').ipcRenderer.invoke('get-window-position');
          } catch (error) {
            console.error('윈도우 위치 가져오기 실패:', error);
            return { x: 0, y: 0 };
          }
        }
      };
    `);
  });
  
  // 요정 영역 밖 클릭 시 투과 처리
  fairyWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'mouseDown') {
      // JavaScript로 클릭 위치 확인
      fairyWindow.webContents.executeJavaScript(`
        (function() {
          const rect = document.querySelector('.fairy-container').getBoundingClientRect();
          const isInsideFairy = ${input.x} >= rect.left && ${input.x} <= rect.right && 
                               ${input.y} >= rect.top && ${input.y} <= rect.bottom;
          return isInsideFairy;
        })()
      `).then((isInsideFairy) => {
        if (!isInsideFairy) {
          // 요정 밖 클릭 시 투과 모드
          fairyWindow.setIgnoreMouseEvents(true, { forward: true });
          setTimeout(() => {
            if (fairyWindow && !fairyWindow.isDestroyed()) {
              fairyWindow.setIgnoreMouseEvents(false);
            }
          }, 100);
        } else {
          // 요정 안쪽 클릭 시 이벤트 발생시키기
          fairyWindow.webContents.executeJavaScript('fairyClicked()');
        }
      });
    }
  });
}

function createTray() {
  // 시스템 트레이 아이콘 (임시로 비활성화)
  try {
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    console.log('트레이 아이콘 경로:', iconPath);
    tray = new Tray(iconPath);
  } catch (error) {
    console.log('트레이 아이콘 로딩 실패, 트레이 없이 계속:', error.message);
    return;
  }
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '🧚‍♀️ 페어리 보이기/숨기기',
      click: () => {
        if (fairyWindow && houseWindow) {
          const isVisible = fairyWindow.isVisible();
          fairyWindow.setVisibleOnAllWorkspaces(true);
          houseWindow.setVisibleOnAllWorkspaces(true);
          
          if (isVisible) {
            fairyWindow.hide();
            houseWindow.hide();
          } else {
            fairyWindow.show();
            houseWindow.show();
          }
        }
      }
    },
    {
      label: '🔑 Claude 인증',
      click: () => {
        createAuthSettingsWindow();
      }
    },
    {
      label: '⚙️ 설정',
      click: () => {
        // TODO: 설정창 구현
        console.log('설정창 준비 중...');
      }
    },
    { type: 'separator' },
    {
      label: '❌ 종료',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.setToolTip('Fairy Assistant - 바탕화면 AI 비서');
}

// Electron 앱 초기화
app.whenReady().then(async () => {
  console.log('🧚‍♀️ Fairy Assistant 시작!');
  
  // Python Bridge 시작
  startPythonBridge();
  
  // Python Bridge 초기화 대기 (3초)
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Claude 인증 상태 확인
  try {
    const authStatus = await checkClaudeAuthStatus();
    if (!authStatus.authenticated) {
      console.log('⚠️ Claude 인증 필요:', authStatus.error);
      // 트레이 메뉴에 인증 옵션이 있으므로 자동으로 창을 열지는 않음
    } else {
      console.log('✅ Claude 인증 확인됨:', authStatus.user);
    }
  } catch (error) {
    console.log('⚠️ 인증 상태 확인 실패:', error.message);
  }
  
  // 시스템 트레이 생성
  createTray();
  
  // 집 생성 (고정)
  createHouse();
  
  // 요정 생성 (돌아다니기)
  createFairy();
  
  // 3초 후 돌아다니기 시작
  setTimeout(() => {
    fairySystem.startRoaming();
    console.log('🎮 쿼터뷰 돌아다니기 시작!');
  }, 3000);
});

// macOS에서 모든 윈도우가 닫혀도 앱 유지
app.on('window-all-closed', () => {
  // 시스템 트레이로 최소화된 상태 유지
});

// 앱 완전 종료 시 Python Bridge 정리
app.on('before-quit', () => {
  stopPythonBridge();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createHouse();
    createFairy();
  }
});

// IPC 핸들러들
ipcMain.on('move-fairy-window', (event, x, y) => {
  if (fairyWindow && !fairyWindow.isDestroyed()) {
    fairyWindow.setPosition(Math.floor(x), Math.floor(y));
    // FairySystem 위치도 실시간 업데이트
    fairySystem.currentPosition = { x, y };
    console.log('🖱️ 요정 윈도우 이동:', x, y);
  }
});

ipcMain.handle('get-window-position', () => {
  if (fairyWindow && !fairyWindow.isDestroyed()) {
    const bounds = fairyWindow.getBounds();
    return { x: bounds.x, y: bounds.y };
  }
  return { x: 0, y: 0 };
});

ipcMain.on('pause-fairy-movement', () => {
  fairySystem.pauseMovement();
});

ipcMain.on('resume-fairy-movement', () => {
  fairySystem.resumeMovement();
});

ipcMain.on('set-fairy-position', (event, x, y) => {
  const newX = Math.round(Number(x) || 0);
  const newY = Math.round(Number(y) || 0);
  fairySystem.setNewPosition(newX, newY);
});

// 🧚‍♀️ 페어리 성격 설정 IPC 핸들러들
ipcMain.on('open-personality-settings', () => {
  createPersonalitySettingsWindow();
});

ipcMain.on('save-personality-settings', (event, settings) => {
  savePersonalitySettings(settings).then(success => {
    event.reply('personality-settings-saved', success);
  });
});

ipcMain.on('load-personality-settings', (event) => {
  loadPersonalitySettings().then(settings => {
    event.reply('personality-settings-loaded', settings);
  });
});

// ⚙️ 메인 설정 IPC 핸들러들
ipcMain.on('open-main-settings', () => {
  createMainSettingsWindow();
});

ipcMain.on('save-main-settings', (event, settings) => {
  saveMainSettings(settings).then(success => {
    event.reply('main-settings-saved', success);
  });
});

ipcMain.on('load-main-settings', (event) => {
  loadMainSettings().then(settings => {
    event.reply('main-settings-loaded', settings);
  });
});

// 📋 로그 뷰어 IPC 핸들러들
ipcMain.on('open-log-viewer', () => {
  createLogViewerWindow();
});

ipcMain.on('load-logs', (event) => {
  loadLogFiles().then(logs => {
    event.reply('logs-loaded', logs);
  });
});

ipcMain.on('clear-logs', (event) => {
  clearLogFiles().then(success => {
    event.reply('logs-cleared', success);
  });
});

ipcMain.on('export-logs', (event) => {
  exportLogFiles().then(result => {
    event.reply('logs-exported', result.success, result.filepath);
  });
});

// 💻 시스템 정보 IPC 핸들러들
ipcMain.on('open-system-info', () => {
  createSystemInfoWindow();
});

ipcMain.on('load-system-info', (event) => {
  loadSystemInfo().then(info => {
    event.reply('system-info-loaded', info);
  });
});

// ℹ️ About 창 IPC 핸들러
ipcMain.on('open-about', () => {
  createAboutWindow();
});

// 🎨 커스터마이징 창 IPC 핸들러
ipcMain.on('open-customization', () => {
  createCustomizationWindow();
});

ipcMain.on('open-chat-window', () => {
  createChatWindow();
});

ipcMain.on('open-context-menu', (event, x, y) => {
  const safeX = Math.round(Number(x) || 0);
  const safeY = Math.round(Number(y) || 0);
  createContextMenu(safeX, safeY);
});

ipcMain.on('toggle-fairy-chat', (event, fairyX, fairyY) => {
  // 요정 자동 이동 중단
  fairySystem.pauseMovement();
  
  // 채팅 입력창 토글 - 좌표값 안전하게 처리
  const x = Math.round(Number(fairyX) || 0);
  const y = Math.round(Number(fairyY) || 0);
  createFairyChatInput(x, y);
});

ipcMain.on('show-fairy-typing', () => {
  // 현재 요정 위치 가져오기
  if (fairyWindow && !fairyWindow.isDestroyed()) {
    const [fairyX, fairyY] = fairyWindow.getPosition();
    createFairySpeechBubble(fairyX, fairyY, '생각 중...', 'thinking');
    
    // DOM 로드 후 타이핑 인디케이터 표시
    setTimeout(() => {
      showTypingIndicator();
    }, 200);
  }
});

ipcMain.on('show-fairy-response', (event, message, type) => {
  // 현재 요정 위치에 응답 말풍선 표시 (별도 창)
  if (fairyWindow && !fairyWindow.isDestroyed()) {
    const [fairyX, fairyY] = fairyWindow.getPosition();
    createFairySpeechBubble(fairyX, fairyY, message, type);
  }
});

// Claude 응답을 기존 말풍선에 표시하기 위한 IPC 핸들러
ipcMain.on('send-claude-response-to-fairy', (event, message) => {
  // fairy.html의 기존 말풍선에 Claude 응답 전송
  if (fairyWindow && !fairyWindow.isDestroyed() && typeof message === 'string') {
    const safeMessage = String(message).substring(0, 1000); // 최대 1000자 제한
    fairyWindow.webContents.send('show-claude-response', safeMessage);
    console.log('💬 Claude 응답을 기존 말풍선으로 전송:', safeMessage.substring(0, 50) + '...');
  }
});

// 별도 창 내부 말풍선 생성 IPC 핸들러
ipcMain.on('create-internal-speech-bubble', (event, message) => {
  if (fairyWindow && !fairyWindow.isDestroyed() && typeof message === 'string') {
    const [fairyX, fairyY] = fairyWindow.getPosition();
    const safeMessage = String(message).substring(0, 1000); // 최대 1000자 제한
    createFairyInternalSpeech(fairyX, fairyY, safeMessage);
    console.log('💬 별도 창 내부 말풍선 생성 요청:', safeMessage.substring(0, 50) + '...');
  }
});

// 내부 말풍선 창 크기 조절 IPC 핸들러
ipcMain.on('resize-internal-speech-bubble', (event, width, height) => {
  if (fairyInternalSpeechWindow && !fairyInternalSpeechWindow.isDestroyed()) {
    // 정수로 변환하고 유효한 값인지 확인
    const newWidth = Math.round(Number(width));
    const newHeight = Math.round(Number(height));
    
    if (newWidth > 0 && newHeight > 0 && newWidth < 2000 && newHeight < 2000) {
      fairyInternalSpeechWindow.setSize(newWidth, newHeight);
      console.log('💬 내부 말풍선 크기 조절:', newWidth, newHeight);
    } else {
      console.log('⚠️ 잘못된 창 크기 값:', width, height);
    }
  }
});

// 생각중 말풍선 표시 IPC 핸들러
ipcMain.on('show-thinking-bubble', () => {
  if (fairyWindow && !fairyWindow.isDestroyed()) {
    const [fairyX, fairyY] = fairyWindow.getPosition();
    createFairyThinkingBubble(fairyX, fairyY);
    console.log('☁️ 생각중 말풍선 표시 요청');
  }
});

// 생각중 말풍선 숨기기 IPC 핸들러
ipcMain.on('hide-thinking-bubble', () => {
  closeFairyThinkingBubble();
});

// Claude 인증 상태 확인 함수
async function checkClaudeAuthStatus() {
  return new Promise((resolve) => {
    const http = require('http');
    
    const postData = JSON.stringify({ action: 'check' });
    
    const options = {
      hostname: 'localhost',
      port: 8766,
      path: '/api/auth/check',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000 // 5초 타임아웃
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            resolve(result.status || { authenticated: false, error: 'Unknown status' });
          } else {
            resolve({ authenticated: false, error: 'Auth API not available' });
          }
        } catch (parseError) {
          resolve({ authenticated: false, error: 'Invalid response from auth API' });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log('인증 상태 확인 중 오류:', error.message);
      resolve({ authenticated: false, error: error.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ authenticated: false, error: 'Auth check timeout' });
    });
    
    req.write(postData);
    req.end();
  });
}

console.log('🚀 Fairy Assistant 메인 프로세스 로드 완료!');