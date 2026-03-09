/**
 * FairySystem - 캐릭터 이동/행동 관리 모듈
 */

const { screen } = require('electron');

// 캐릭터 크기 및 이동 설정
const FAIRY_SIZE = { width: 200, height: 220 };
const FAIRY_CONTENT_OFFSET = { x: 70, y: 80 };
const ROAM_RADIUS = 64;
const MOVE_INTERVAL = 3000;

// 집 위치 설정
const HOUSE_POSITION = { x: 50, y: 50 };
const HOUSE_SIZE = { width: 120, height: 80 };

class FairySystem {
  constructor() {
    this.currentPosition = { ...HOUSE_POSITION };
    this.targetPosition = { ...HOUSE_POSITION };
    this.isMoving = false;
    this.isPaused = false;
    this.roamingTimer = null;
    this.aiActionTimer = null;
    this.lastAiDecisionTime = 0;
    this.aiMode = true;
    this._fairyWindow = null; // 외부에서 주입
  }

  setFairyWindow(win) {
    this._fairyWindow = win;
  }

  generateQuarterViewPosition() {
    const centerX = this.currentPosition.x + FAIRY_SIZE.width / 2;
    const centerY = this.currentPosition.y + FAIRY_SIZE.height / 2;

    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * ROAM_RADIUS;

    const newX = centerX + (Math.cos(angle) * distance) - FAIRY_SIZE.width / 2;
    const newY = centerY + (Math.sin(angle) * distance) - FAIRY_SIZE.height / 2;

    const display = screen.getPrimaryDisplay();
    const bounds = display.workArea;

    return {
      x: Math.max(-FAIRY_SIZE.width / 2, Math.min(newX, bounds.width - FAIRY_SIZE.width / 2)),
      y: Math.max(-FAIRY_SIZE.height / 2, Math.min(newY, bounds.height - FAIRY_SIZE.height / 2))
    };
  }

  async moveToPosition(targetPos) {
    if (this.isMoving) return;

    this.isMoving = true;
    this.targetPosition = targetPos;

    const startPos = { ...this.currentPosition };
    const duration = 2000;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      const currentX = startPos.x + (targetPos.x - startPos.x) * eased;
      const currentY = startPos.y + (targetPos.y - startPos.y) * eased;

      this.currentPosition = { x: currentX, y: currentY };

      if (this._fairyWindow && !this._fairyWindow.isDestroyed()) {
        this._fairyWindow.setBounds({
          x: Math.floor(currentX),
          y: Math.floor(currentY),
          width: FAIRY_SIZE.width,
          height: FAIRY_SIZE.height
        });
      }

      if (progress < 1) {
        setTimeout(animate, 16);
      } else {
        this.isMoving = false;
      }
    };

    animate();
  }

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
    console.log('AI 기반 능동적 행동 시작');

    const aiLoop = async () => {
      if (this.isPaused) return;

      try {
        const aiDecision = await this.requestAiAction();
        await this.executeAiDecision(aiDecision);

        const nextInterval = Math.random() * 600000 + 300000;
        this.aiActionTimer = setTimeout(aiLoop, nextInterval);
      } catch (error) {
        console.error('AI 행동 처리 오류:', error);
        this.aiActionTimer = setTimeout(aiLoop, 180000);
      }
    };

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
        return await response.json();
      } else {
        throw new Error(`AI 행동 요청 실패: ${response.status}`);
      }
    } catch (error) {
      console.error('AI 행동 요청 오류:', error);
      return null;
    }
  }

  async executeAiDecision(aiDecision) {
    if (!aiDecision || !aiDecision.decision) return;

    const decision = aiDecision.decision;

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
            await this.moveToPosition(targetPos.movement);
          }
        }
        break;

      case 'observe':
      case 'wait':
        break;

      default:
        console.log(`알 수 없는 AI 행동: ${decision.action}`);
    }
  }

  async requestAiMovement() {
    try {
      const response = await fetch('http://localhost:8766/api/ai-movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_position: this.currentPosition })
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('AI 이동 요청 오류:', error);
    }
    return null;
  }

  async showAiGeneratedSpeech(message) {
    // 외부 콜백으로 처리 (main.js에서 연결)
    if (this.onSpeech) {
      this.onSpeech(message);
    }
  }

  pauseMovement() {
    this.isPaused = true;
  }

  resumeMovement() {
    this.isPaused = false;
  }

  setNewPosition(x, y) {
    this.currentPosition = { x, y };
    this.targetPosition = { x, y };

    if (this._fairyWindow && !this._fairyWindow.isDestroyed()) {
      this._fairyWindow.setBounds({
        x: Math.floor(x),
        y: Math.floor(y),
        width: FAIRY_SIZE.width,
        height: FAIRY_SIZE.height
      });
    }
  }
}

module.exports = {
  FairySystem,
  FAIRY_SIZE,
  FAIRY_CONTENT_OFFSET,
  HOUSE_POSITION,
  HOUSE_SIZE
};
