/**
 * IPC Handlers - 렌더러 프로세스와의 통신 핸들러 모듈
 */

const { ipcMain } = require('electron');
const { FAIRY_SIZE } = require('./fairy-system');
const windowManager = require('./window-manager');
const settingsManager = require('./settings-manager');

function registerHandlers(fairySystem) {

  // 요정 이동 관련
  ipcMain.on('move-fairy-window', (event, x, y) => {
    const win = windowManager.getFairyWindow();
    if (win && !win.isDestroyed()) {
      win.setPosition(Math.floor(x), Math.floor(y));
      fairySystem.currentPosition = { x, y };
    }
  });

  ipcMain.handle('get-window-position', () => {
    const win = windowManager.getFairyWindow();
    if (win && !win.isDestroyed()) {
      const bounds = win.getBounds();
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

  // 성격 설정
  ipcMain.on('open-personality-settings', () => {
    windowManager.createPersonalitySettingsWindow();
  });

  ipcMain.on('save-personality-settings', (event, settings) => {
    settingsManager.savePersonalitySettings(settings).then(success => {
      event.reply('personality-settings-saved', success);
    });
  });

  ipcMain.on('load-personality-settings', (event) => {
    settingsManager.loadPersonalitySettings().then(settings => {
      event.reply('personality-settings-loaded', settings);
    });
  });

  // 메인 설정
  ipcMain.on('open-main-settings', () => {
    windowManager.createMainSettingsWindow();
  });

  ipcMain.on('save-main-settings', (event, settings) => {
    settingsManager.saveMainSettings(settings).then(success => {
      if (success) {
        // 설정 적용
        if (fairySystem) {
          if (settings.autoMove) {
            fairySystem.resumeMovement();
          } else {
            fairySystem.pauseMovement();
          }
        }
      }
      event.reply('main-settings-saved', success);
    });
  });

  ipcMain.on('load-main-settings', (event) => {
    settingsManager.loadMainSettings().then(settings => {
      event.reply('main-settings-loaded', settings);
    });
  });

  // 로그 뷰어
  ipcMain.on('open-log-viewer', () => {
    windowManager.createLogViewerWindow();
  });

  ipcMain.on('load-logs', (event) => {
    settingsManager.loadLogFiles().then(logs => {
      event.reply('logs-loaded', logs);
    });
  });

  ipcMain.on('clear-logs', (event) => {
    settingsManager.clearLogFiles().then(success => {
      event.reply('logs-cleared', success);
    });
  });

  ipcMain.on('export-logs', (event) => {
    settingsManager.exportLogFiles().then(result => {
      event.reply('logs-exported', result.success, result.filepath);
    });
  });

  // 시스템 정보
  ipcMain.on('open-system-info', () => {
    windowManager.createSystemInfoWindow();
  });

  ipcMain.on('load-system-info', (event) => {
    const pythonBridgeRunning = true; // TODO: 실제 상태 확인
    settingsManager.loadSystemInfo(fairySystem, pythonBridgeRunning).then(info => {
      event.reply('system-info-loaded', info);
    });
  });

  // 기타 윈도우
  ipcMain.on('open-about', () => {
    windowManager.createAboutWindow();
  });

  ipcMain.on('open-customization', () => {
    windowManager.createCustomizationWindow();
  });

  ipcMain.on('open-chat-window', () => {
    windowManager.createChatWindow();
  });

  ipcMain.on('open-auth-settings', () => {
    windowManager.createAuthSettingsWindow();
  });

  ipcMain.on('open-context-menu', (event, x, y) => {
    const safeX = Math.round(Number(x) || 0);
    const safeY = Math.round(Number(y) || 0);
    windowManager.createContextMenu(safeX, safeY);
  });

  // 채팅 관련
  ipcMain.on('toggle-fairy-chat', (event, fairyX, fairyY) => {
    fairySystem.pauseMovement();
    const x = Math.round(Number(fairyX) || 0);
    const y = Math.round(Number(fairyY) || 0);
    windowManager.createFairyChatInput(x, y);
  });

  ipcMain.on('show-fairy-typing', () => {
    const win = windowManager.getFairyWindow();
    if (win && !win.isDestroyed()) {
      const [fairyX, fairyY] = win.getPosition();
      windowManager.createFairySpeechBubble(fairyX, fairyY, '생각 중...', 'thinking');
      setTimeout(() => {
        windowManager.showTypingIndicator();
      }, 200);
    }
  });

  ipcMain.on('show-fairy-response', (event, message, type) => {
    const win = windowManager.getFairyWindow();
    if (win && !win.isDestroyed()) {
      const [fairyX, fairyY] = win.getPosition();
      windowManager.createFairySpeechBubble(fairyX, fairyY, message, type);
    }
  });

  ipcMain.on('send-claude-response-to-fairy', (event, message) => {
    const win = windowManager.getFairyWindow();
    if (win && !win.isDestroyed() && typeof message === 'string') {
      const safeMessage = String(message).substring(0, 1000);
      win.webContents.send('show-claude-response', safeMessage);
    }
  });

  ipcMain.on('create-internal-speech-bubble', (event, message) => {
    const win = windowManager.getFairyWindow();
    if (win && !win.isDestroyed() && typeof message === 'string') {
      const [fairyX, fairyY] = win.getPosition();
      const safeMessage = String(message).substring(0, 1000);
      windowManager.createFairyInternalSpeech(fairyX, fairyY, safeMessage);
    }
  });

  ipcMain.on('resize-internal-speech-bubble', (event, width, height) => {
    windowManager.resizeInternalSpeechBubble(width, height);
  });

  ipcMain.on('show-thinking-bubble', () => {
    const win = windowManager.getFairyWindow();
    if (win && !win.isDestroyed()) {
      const [fairyX, fairyY] = win.getPosition();
      windowManager.createFairyThinkingBubble(fairyX, fairyY);
    }
  });

  ipcMain.on('hide-thinking-bubble', () => {
    windowManager.closeFairyThinkingBubble();
  });
}

module.exports = { registerHandlers };
