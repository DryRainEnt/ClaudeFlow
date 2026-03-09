/**
 * SettingsManager - 설정 저장/로드 모듈
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.fairy-assistant');

async function ensureConfigDir() {
  try {
    await fs.access(CONFIG_DIR);
  } catch {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  }
}

// 성격 설정
async function savePersonalitySettings(settings) {
  try {
    await ensureConfigDir();
    const configFile = path.join(CONFIG_DIR, 'personality.json');
    await fs.writeFile(configFile, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('페어리 성격 설정 저장 실패:', error);
    return false;
  }
}

async function loadPersonalitySettings() {
  try {
    const configFile = path.join(CONFIG_DIR, 'personality.json');
    const data = await fs.readFile(configFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        name: '페어리',
        personality: '친절하고 도움을 주는 것을 좋아하며, 항상 밝고 긍정적인 에너지를 가지고 있습니다.',
        role: '개발과 창작 활동을 도와주는 AI 어시스턴트',
        timestamp: new Date().toISOString()
      };
    }
    console.error('페어리 성격 설정 로드 실패:', error);
    return null;
  }
}

// 메인 설정
async function saveMainSettings(settings) {
  try {
    await ensureConfigDir();
    const configFile = path.join(CONFIG_DIR, 'main-settings.json');
    await fs.writeFile(configFile, JSON.stringify(settings, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('메인 설정 저장 실패:', error);
    return false;
  }
}

async function loadMainSettings() {
  try {
    const configFile = path.join(CONFIG_DIR, 'main-settings.json');
    const data = await fs.readFile(configFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
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
    console.error('메인 설정 로드 실패:', error);
    return null;
  }
}

// 로그 관리
async function loadLogFiles() {
  try {
    const logDir = path.join(CONFIG_DIR, 'logs');
    const logs = [];

    try {
      await fs.access(logDir);
    } catch {
      return generateDummyLogs();
    }

    const logFileNames = ['debug.log', 'session.log', 'mcp.log', 'main.log'];

    for (const filename of logFileNames) {
      const filepath = path.join(logDir, filename);
      try {
        const content = await fs.readFile(filepath, 'utf8');
        const fileLogs = parseLogFile(content, filename);
        logs.push(...fileLogs);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`${filename} 로드 실패:`, error);
        }
      }
    }

    logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    return logs;
  } catch (error) {
    console.error('로그 파일 로드 실패:', error);
    return generateDummyLogs();
  }
}

function parseLogFile(content, filename) {
  const logs = [];
  const lines = content.split('\n').filter(line => line.trim());

  lines.forEach(line => {
    try {
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
        logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: line.trim(),
          source: filename
        });
      }
    } catch {
      // 파싱 오류 무시
    }
  });

  return logs;
}

function determineLogLevel(level, message) {
  if (level) {
    const lowerLevel = level.toLowerCase();
    if (['error', 'err'].includes(lowerLevel)) return 'error';
    if (['warning', 'warn'].includes(lowerLevel)) return 'warning';
    if (['success', 'ok'].includes(lowerLevel)) return 'success';
    if (['debug', 'dbg'].includes(lowerLevel)) return 'debug';
    return 'info';
  }

  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('error') || lowerMessage.includes('fail')) return 'error';
  if (lowerMessage.includes('warn')) return 'warning';
  if (lowerMessage.includes('success') || lowerMessage.includes('완료')) return 'success';
  if (lowerMessage.includes('debug')) return 'debug';

  return 'info';
}

function generateDummyLogs() {
  const now = new Date();
  return [
    { timestamp: new Date(now - 300000).toISOString(), level: 'info', message: 'Fairy Assistant 시작', source: 'main.log' },
    { timestamp: new Date(now - 250000).toISOString(), level: 'success', message: 'Python Bridge 초기화 완료', source: 'session.log' },
    { timestamp: new Date(now - 200000).toISOString(), level: 'info', message: '집 윈도우 생성 완료', source: 'main.log' },
    { timestamp: now.toISOString(), level: 'info', message: '로그 뷰어 열림', source: 'main.log' }
  ];
}

async function clearLogFiles() {
  try {
    const logDir = path.join(CONFIG_DIR, 'logs');
    const logFileNames = ['debug.log', 'session.log', 'mcp.log', 'main.log'];

    for (const filename of logFileNames) {
      const filepath = path.join(logDir, filename);
      try {
        await fs.writeFile(filepath, '', 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.error(`${filename} 클리어 실패:`, error);
        }
      }
    }
    return true;
  } catch (error) {
    console.error('로그 클리어 실패:', error);
    return false;
  }
}

async function exportLogFiles() {
  try {
    const logs = await loadLogFiles();

    let exportContent = `# Fairy Assistant 로그 내보내기\n`;
    exportContent += `# 내보낸 시간: ${new Date().toLocaleString()}\n`;
    exportContent += `# 총 로그 개수: ${logs.length}\n\n`;

    logs.forEach(log => {
      const timestamp = new Date(log.timestamp).toLocaleString();
      exportContent += `[${timestamp}] [${log.level.toUpperCase()}] ${log.message} (${log.source})\n`;
    });

    const desktopPath = path.join(os.homedir(), 'Desktop');
    const filename = `fairy-assistant-logs-${new Date().toISOString().split('T')[0]}.txt`;
    const filepath = path.join(desktopPath, filename);

    await fs.writeFile(filepath, exportContent, 'utf8');
    return { success: true, filepath };
  } catch (error) {
    console.error('로그 내보내기 실패:', error);
    return { success: false, filepath: null };
  }
}

// 시스템 정보 수집
async function loadSystemInfo(fairySystem, pythonBridgeRunning) {
  try {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      platform: formatPlatformName(os.platform()),
      release: os.release(),
      arch: os.arch(),
      hostname: os.hostname(),
      uptime: os.uptime(),
      totalMemory,
      freeMemory,
      usedMemory,
      memoryUsagePercent: (usedMemory / totalMemory) * 100,
      cpuCount: cpus.length,
      loadAverage: os.loadavg(),
      cpuModel: cpus[0]?.model || 'Unknown',
      pid: process.pid,
      processUptime: process.uptime() * 1000,
      nodeVersion: process.versions.node,
      electronVersion: process.versions.electron,
      chromeVersion: process.versions.chrome,
      v8Version: process.versions.v8,
      fairyMovement: fairySystem ? !fairySystem.isPaused : false,
      pythonBridge: pythonBridgeRunning,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('시스템 정보 수집 실패:', error);
    return null;
  }
}

function formatPlatformName(platform) {
  const names = {
    'darwin': 'macOS',
    'win32': 'Windows',
    'linux': 'Linux',
    'freebsd': 'FreeBSD'
  };
  return names[platform] || platform;
}

module.exports = {
  savePersonalitySettings,
  loadPersonalitySettings,
  saveMainSettings,
  loadMainSettings,
  loadLogFiles,
  clearLogFiles,
  exportLogFiles,
  loadSystemInfo
};
