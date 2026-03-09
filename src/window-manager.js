/**
 * WindowManager - 각종 윈도우 생성/관리 모듈
 */

const { BrowserWindow } = require('electron');
const path = require('path');
const { FAIRY_SIZE, FAIRY_CONTENT_OFFSET, HOUSE_POSITION, HOUSE_SIZE } = require('./fairy-system');

// 현재 열려있는 윈도우 참조
let fairyWindow = null;
let houseWindow = null;
let fairyChatInputWindow = null;
let fairySpeechBubbleWindow = null;
let fairyInternalSpeechWindow = null;
let fairyThinkingBubbleWindow = null;

const defaultWebPreferences = {
  nodeIntegration: true,
  contextIsolation: false
  // TODO: contextIsolation: true + preload 스크립트로 전환 필요
};

// 설정 윈도우용 기본 옵션
function settingsWindowDefaults(opts = {}) {
  return {
    center: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: defaultWebPreferences,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true,
    show: false,
    ...opts
  };
}

function createPersonalitySettingsWindow() {
  const win = new BrowserWindow(settingsWindowDefaults({ width: 520, height: 650 }));
  win.loadFile(path.join(__dirname, 'personality-settings.html'));
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  return win;
}

function createMainSettingsWindow() {
  const win = new BrowserWindow(settingsWindowDefaults({ width: 640, height: 750 }));
  win.loadFile(path.join(__dirname, 'main-settings.html'));
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  return win;
}

function createLogViewerWindow() {
  const win = new BrowserWindow(settingsWindowDefaults({ width: 900, height: 700, resizable: true, maximizable: true }));
  win.loadFile(path.join(__dirname, 'log-viewer.html'));
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  return win;
}

function createSystemInfoWindow() {
  const win = new BrowserWindow(settingsWindowDefaults({ width: 750, height: 650, resizable: true, maximizable: true }));
  win.loadFile(path.join(__dirname, 'system-info.html'));
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  return win;
}

function createAboutWindow() {
  const win = new BrowserWindow(settingsWindowDefaults({ width: 560, height: 720 }));
  win.loadFile(path.join(__dirname, 'about.html'));
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  return win;
}

function createCustomizationWindow() {
  const win = new BrowserWindow(settingsWindowDefaults({ width: 680, height: 800, resizable: true, maximizable: true }));
  win.loadFile(path.join(__dirname, 'customization.html'));
  win.once('ready-to-show', () => { win.show(); win.focus(); });
  return win;
}

function createAuthSettingsWindow() {
  const win = new BrowserWindow(settingsWindowDefaults({ width: 600, height: 700 }));
  win.loadFile(path.join(__dirname, 'auth-settings.html'));
  return win;
}

function createChatWindow() {
  const win = new BrowserWindow({
    width: 450,
    height: 600,
    center: true,
    resizable: true,
    minimizable: true,
    maximizable: false,
    webPreferences: defaultWebPreferences,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'ultra-dark',
    transparent: true
  });
  win.loadFile(path.join(__dirname, 'chat-window.html'));
  return win;
}

function createContextMenu(x, y) {
  const win = new BrowserWindow({
    x, y,
    width: 200,
    height: 250,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: defaultWebPreferences
  });

  win.loadFile(path.join(__dirname, 'context-menu.html'));
  win.on('blur', () => {
    if (!win.isDestroyed()) win.close();
  });
  return win;
}

function createFairyChatInput(fairyX, fairyY) {
  if (fairyChatInputWindow && !fairyChatInputWindow.isDestroyed()) {
    fairyChatInputWindow.close();
    fairyChatInputWindow = null;
    if (fairyWindow && !fairyWindow.isDestroyed()) {
      fairyWindow.webContents.send('chat-input-closed');
    }
    return null;
  }

  const inputX = fairyX + (FAIRY_SIZE.width / 2) - 175;
  const inputY = fairyY + FAIRY_SIZE.height + 10;

  fairyChatInputWindow = new BrowserWindow({
    x: inputX, y: inputY,
    width: 350, height: 80,
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
    resizable: false, minimizable: false, maximizable: false,
    webPreferences: defaultWebPreferences
  });

  fairyChatInputWindow.loadFile(path.join(__dirname, 'fairy-chat-input.html'));

  fairyChatInputWindow.on('closed', () => {
    fairyChatInputWindow = null;
    if (fairyWindow && !fairyWindow.isDestroyed()) {
      fairyWindow.webContents.send('chat-input-closed');
    }
  });

  if (fairyWindow && !fairyWindow.isDestroyed()) {
    fairyWindow.webContents.send('chat-input-opened');
  }

  return fairyChatInputWindow;
}

function createFairySpeechBubble(fairyX, fairyY, message, type = 'normal') {
  if (fairySpeechBubbleWindow && !fairySpeechBubbleWindow.isDestroyed()) {
    fairySpeechBubbleWindow.close();
    fairySpeechBubbleWindow = null;
  }

  const bubbleX = fairyX + (FAIRY_SIZE.width / 2) - 140;
  const bubbleY = fairyY - 80;

  fairySpeechBubbleWindow = new BrowserWindow({
    x: bubbleX, y: bubbleY,
    width: 280, height: 100,
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
    resizable: false, minimizable: false, maximizable: false, focusable: false,
    webPreferences: defaultWebPreferences
  });

  const encodedMessage = encodeURIComponent(message);
  fairySpeechBubbleWindow.loadFile(
    path.join(__dirname, 'fairy-speech-bubble.html'),
    { query: { message: encodedMessage, type } }
  );

  fairySpeechBubbleWindow.on('closed', () => {
    fairySpeechBubbleWindow = null;
  });

  return fairySpeechBubbleWindow;
}

function updateFairySpeechBubble(message, type = 'normal') {
  if (fairySpeechBubbleWindow && !fairySpeechBubbleWindow.isDestroyed()) {
    fairySpeechBubbleWindow.webContents.send('update-speech', message, type);
  }
}

function showTypingIndicator() {
  if (fairySpeechBubbleWindow && !fairySpeechBubbleWindow.isDestroyed()) {
    fairySpeechBubbleWindow.webContents.send('show-typing');
  }
}

function createFairyInternalSpeech(fairyX, fairyY, message) {
  closeFairyThinkingBubble();

  if (fairyInternalSpeechWindow && !fairyInternalSpeechWindow.isDestroyed()) {
    fairyInternalSpeechWindow.close();
    fairyInternalSpeechWindow = null;
  }

  const bubbleX = fairyX + (FAIRY_SIZE.width / 2) - 160;
  const bubbleY = fairyY - 60;

  fairyInternalSpeechWindow = new BrowserWindow({
    x: bubbleX, y: bubbleY,
    width: 320, height: 80,
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
    resizable: false, minimizable: false, maximizable: false,
    focusable: false, show: false,
    webPreferences: defaultWebPreferences
  });

  const encodedMessage = encodeURIComponent(message);
  fairyInternalSpeechWindow.loadFile(
    path.join(__dirname, 'fairy-internal-speech.html'),
    { query: { message: encodedMessage } }
  );

  fairyInternalSpeechWindow.once('ready-to-show', () => {
    fairyInternalSpeechWindow.show();
  });

  fairyInternalSpeechWindow.on('closed', () => {
    fairyInternalSpeechWindow = null;
  });

  return fairyInternalSpeechWindow;
}

function resizeInternalSpeechBubble(width, height) {
  if (fairyInternalSpeechWindow && !fairyInternalSpeechWindow.isDestroyed()) {
    const newWidth = Math.round(Number(width));
    const newHeight = Math.round(Number(height));
    if (newWidth > 0 && newHeight > 0 && newWidth < 2000 && newHeight < 2000) {
      fairyInternalSpeechWindow.setSize(newWidth, newHeight);
    }
  }
}

function createFairyThinkingBubble(fairyX, fairyY) {
  if (fairyThinkingBubbleWindow && !fairyThinkingBubbleWindow.isDestroyed()) {
    fairyThinkingBubbleWindow.close();
    fairyThinkingBubbleWindow = null;
  }

  const bubbleX = fairyX + (FAIRY_SIZE.width / 2) - 60;
  const bubbleY = fairyY - 70;

  fairyThinkingBubbleWindow = new BrowserWindow({
    x: bubbleX, y: bubbleY,
    width: 120, height: 80,
    frame: false, transparent: true, alwaysOnTop: true, skipTaskbar: true,
    resizable: false, minimizable: false, maximizable: false, focusable: false,
    webPreferences: defaultWebPreferences
  });

  fairyThinkingBubbleWindow.loadFile(path.join(__dirname, 'fairy-thinking-bubble.html'));

  fairyThinkingBubbleWindow.on('closed', () => {
    fairyThinkingBubbleWindow = null;
  });

  return fairyThinkingBubbleWindow;
}

function closeFairyThinkingBubble() {
  if (fairyThinkingBubbleWindow && !fairyThinkingBubbleWindow.isDestroyed()) {
    fairyThinkingBubbleWindow.close();
    fairyThinkingBubbleWindow = null;
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
    webPreferences: defaultWebPreferences
  });

  houseWindow.setIgnoreMouseEvents(false);
  houseWindow.loadFile(path.join(__dirname, 'house.html'));

  houseWindow.webContents.on('dom-ready', () => {
    houseWindow.webContents.executeJavaScript(`
      window.electronAPI = {
        openAuthSettings: () => {
          require('electron').ipcRenderer.send('open-auth-settings');
        }
      };
    `);
  });

  houseWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'mouseDown') {
      houseWindow.webContents.executeJavaScript(`
        (function() {
          const rect = document.querySelector('.house-container').getBoundingClientRect();
          return ${input.x} >= rect.left && ${input.x} <= rect.right &&
                 ${input.y} >= rect.top && ${input.y} <= rect.bottom;
        })()
      `).then((isInsideHouse) => {
        if (!isInsideHouse) {
          houseWindow.setIgnoreMouseEvents(true, { forward: true });
          setTimeout(() => { houseWindow.setIgnoreMouseEvents(false); }, 100);
        }
      });
    }
  });

  return houseWindow;
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
    webPreferences: defaultWebPreferences
  });

  fairyWindow.setAlwaysOnTop(true, 'floating');
  fairyWindow.setIgnoreMouseEvents(false);
  fairyWindow.loadFile(path.join(__dirname, 'luca-fairy.html'));

  fairyWindow.webContents.once('did-finish-load', () => {
    fairyWindow.webContents.executeJavaScript(`
      window.fairySystem = {
        pauseMovement: () => {
          require('electron').ipcRenderer.send('pause-fairy-movement');
        },
        resumeMovement: () => {
          require('electron').ipcRenderer.send('resume-fairy-movement');
        },
        setNewPosition: (x, y) => {
          const safeX = typeof x === 'number' ? x : Number(x) || 0;
          const safeY = typeof y === 'number' ? y : Number(y) || 0;
          require('electron').ipcRenderer.send('set-fairy-position', safeX, safeY);
        }
      };

      window.electronAPI = {
        moveWindow: (x, y) => {
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

  fairyWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'mouseDown') {
      fairyWindow.webContents.executeJavaScript(`
        (function() {
          const rect = document.querySelector('.fairy-container').getBoundingClientRect();
          return ${input.x} >= rect.left && ${input.x} <= rect.right &&
                 ${input.y} >= rect.top && ${input.y} <= rect.bottom;
        })()
      `).then((isInsideFairy) => {
        if (!isInsideFairy) {
          fairyWindow.setIgnoreMouseEvents(true, { forward: true });
          setTimeout(() => {
            if (fairyWindow && !fairyWindow.isDestroyed()) {
              fairyWindow.setIgnoreMouseEvents(false);
            }
          }, 100);
        } else {
          fairyWindow.webContents.executeJavaScript('fairyClicked()');
        }
      });
    }
  });

  return fairyWindow;
}

function getFairyWindow() { return fairyWindow; }
function getHouseWindow() { return houseWindow; }

module.exports = {
  createPersonalitySettingsWindow,
  createMainSettingsWindow,
  createLogViewerWindow,
  createSystemInfoWindow,
  createAboutWindow,
  createCustomizationWindow,
  createAuthSettingsWindow,
  createChatWindow,
  createContextMenu,
  createFairyChatInput,
  createFairySpeechBubble,
  updateFairySpeechBubble,
  showTypingIndicator,
  createFairyInternalSpeech,
  resizeInternalSpeechBubble,
  createFairyThinkingBubble,
  closeFairyThinkingBubble,
  createHouse,
  createFairy,
  getFairyWindow,
  getHouseWindow
};
