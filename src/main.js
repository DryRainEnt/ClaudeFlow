/**
 * Fairy Assistant - 메인 프로세스 진입점
 * 바탕화면 거주형 AI 비서
 */

const { app, BrowserWindow, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

// IPC 클로닝 오류 경고 억제
process.on('unhandledRejection', (reason, promise) => {
  if (reason && reason.message && reason.message.includes('object could not be cloned')) {
    return;
  }
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// 모듈 로드
const { FairySystem } = require('./fairy-system');
const windowManager = require('./window-manager');
const { registerHandlers } = require('./ipc-handlers');

// 시스템 초기화
const fairySystem = new FairySystem();
let tray = null;
let pythonBridge = null;

// Python Bridge 관리
function startPythonBridge() {
  const pythonScript = path.join(__dirname, 'python', 'fairy_bridge.py');

  try {
    const venvPython = path.join(__dirname, 'python', 'venv', 'bin', 'python');
    pythonBridge = spawn(venvPython, [pythonScript], {
      cwd: path.join(__dirname, 'python')
    });

    pythonBridge.stdout.on('data', (data) => {
      console.log('Python Bridge:', data.toString());
    });

    pythonBridge.stderr.on('data', (data) => {
      console.error('Python Bridge 오류:', data.toString());
    });

    pythonBridge.on('close', (code) => {
      console.log(`Python Bridge 종료됨 (코드: ${code})`);
    });

    console.log('Python Bridge 시작됨');
    return true;
  } catch (error) {
    console.error('Python Bridge 시작 실패:', error);
    return false;
  }
}

function stopPythonBridge() {
  if (pythonBridge && !pythonBridge.killed) {
    pythonBridge.kill();
    console.log('Python Bridge 종료');
  }
}

// Claude 인증 상태 확인
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
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const result = JSON.parse(data);
            resolve(result.status || { authenticated: false, error: 'Unknown status' });
          } else {
            resolve({ authenticated: false, error: 'Auth API not available' });
          }
        } catch {
          resolve({ authenticated: false, error: 'Invalid response from auth API' });
        }
      });
    });

    req.on('error', (error) => {
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

// 시스템 트레이
function createTray() {
  try {
    const iconPath = path.join(__dirname, 'assets', 'tray-icon.png');
    tray = new Tray(iconPath);
  } catch (error) {
    console.log('트레이 아이콘 로딩 실패:', error.message);
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '페어리 보이기/숨기기',
      click: () => {
        const fairyWin = windowManager.getFairyWindow();
        const houseWin = windowManager.getHouseWindow();
        if (fairyWin && houseWin) {
          const isVisible = fairyWin.isVisible();
          fairyWin.setVisibleOnAllWorkspaces(true);
          houseWin.setVisibleOnAllWorkspaces(true);

          if (isVisible) {
            fairyWin.hide();
            houseWin.hide();
          } else {
            fairyWin.show();
            houseWin.show();
          }
        }
      }
    },
    {
      label: 'API 인증 설정',
      click: () => { windowManager.createAuthSettingsWindow(); }
    },
    {
      label: '설정',
      click: () => { windowManager.createMainSettingsWindow(); }
    },
    { type: 'separator' },
    {
      label: '종료',
      click: () => { app.quit(); }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.setToolTip('Fairy Assistant - 바탕화면 AI 비서');
}

// AI 생성 메시지 표시 콜백
fairySystem.onSpeech = (message) => {
  const fairyPos = fairySystem.currentPosition;
  const { FAIRY_CONTENT_OFFSET } = require('./fairy-system');
  const speechX = fairyPos.x + FAIRY_CONTENT_OFFSET.x - 60;
  const speechY = fairyPos.y + FAIRY_CONTENT_OFFSET.y + 20;
  windowManager.createFairyInternalSpeech(speechX, speechY, message);
};

// IPC 핸들러 등록
registerHandlers(fairySystem);

// Electron 앱 초기화
app.whenReady().then(async () => {
  console.log('Fairy Assistant 시작!');

  // Python Bridge 시작
  startPythonBridge();
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Claude 인증 상태 확인
  try {
    const authStatus = await checkClaudeAuthStatus();
    if (!authStatus.authenticated) {
      console.log('Claude 인증 필요:', authStatus.error);
    } else {
      console.log('Claude 인증 확인됨:', authStatus.user);
    }
  } catch (error) {
    console.log('인증 상태 확인 실패:', error.message);
  }

  // UI 생성
  createTray();
  windowManager.createHouse();

  const fairyWin = windowManager.createFairy();
  fairySystem.setFairyWindow(fairyWin);

  // 돌아다니기 시작
  setTimeout(() => {
    fairySystem.startRoaming();
    console.log('캐릭터 로밍 시작');
  }, 3000);
});

// macOS에서 모든 윈도우가 닫혀도 앱 유지
app.on('window-all-closed', () => {});

app.on('before-quit', () => {
  stopPythonBridge();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    windowManager.createHouse();
    const fairyWin = windowManager.createFairy();
    fairySystem.setFairyWindow(fairyWin);
  }
});

console.log('Fairy Assistant 메인 프로세스 로드 완료');
