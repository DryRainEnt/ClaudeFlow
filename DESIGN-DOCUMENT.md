# Fairy Assistant - 설계 문서

---

## 개요

바탕화면에 상주하는 AI 비서 캐릭터. 오픈소스로 개발하며, 사용자가 자신의 AI API 키를 설정하여 사용한다.

### 핵심 원칙
- **로컬 우선**: 모든 데이터는 로컬에 저장
- **오픈소스**: 개인 API 키 연동 방식
- **심플**: 최소한의 핵심 기능에 집중

---

## 기술 사양

### 플랫폼 및 프레임워크

| 영역 | 기술 | 설명 |
|------|------|------|
| 실행 환경 | Electron | 투명 오버레이, 크로스플랫폼 |
| 렌더러 | HTML/CSS/Canvas 2D | 스프라이트 기반 캐릭터 렌더링 |
| AI 엔진 | 사용자 선택 (Claude/OpenAI 등) | 개인 API 키 연동 |
| 메모리 | Greeum | 로컬 개인화 메모리 |
| 브릿지 | Python HTTP Server | AI API 호출 + Greeum 연동 |

### 배포 방식
- macOS: `.app` 번들 (우선 개발)
- Windows/Linux: 추후 지원

---

## 시스템 아키텍처

```
Electron Main Process
├── src/fairy-system.js     # 캐릭터 이동/행동 로직
├── src/window-manager.js   # 윈도우 생성/관리
├── src/settings-manager.js # 설정 저장/로드
├── src/ipc-handlers.js     # IPC 핸들러 등록
├── src/preload.js          # contextIsolation용 preload
└── src/main.js             # 앱 진입점 (위 모듈 조합)

Python Bridge (localhost:8766)
├── fairy_bridge.py         # AI API 호출 (사용자 API 키)
└── greeum_bridge.py        # Greeum 메모리 관리

Renderer (HTML/CSS/JS)
├── fairy.html              # 캐릭터 렌더링 (스프라이트)
├── house.html              # 집 렌더링
├── chat-window.html        # 대화 UI
├── fairy-chat-input.html   # 채팅 입력
├── fairy-speech-bubble.html # 말풍선
└── context-menu.html       # 우클릭 메뉴
```

---

## 핵심 데이터 모델

### FairyState (캐릭터 상태)
```javascript
{
  position: { x, y },        // 화면 좌표
  isMoving: boolean,          // 이동 중 여부
  isPaused: boolean,          // 일시정지 여부
  mood: string,               // 현재 기분
  currentAnimation: string    // 현재 애니메이션 상태
}
```

### Settings (사용자 설정)
```javascript
{
  aiProvider: 'claude' | 'openai' | 'custom',
  apiKey: string,             // 암호화 저장
  personality: {
    name: string,
    description: string,
    role: string
  },
  autoMove: boolean,
  moveInterval: number,
  moveRadius: number
}
```

---

## UI/UX 구성

### 메인 인터페이스 (바탕화면 오버레이)

**캐릭터**: 스프라이트 기반 애니메이션 (사용자 제공 에셋)
- idle, walk, talk 등 상태별 애니메이션
- 바탕화면 내 자유 이동
- 클릭 시 대화 가능

**미니 하우스**: 좌측 상단 고정
- 캐릭터 휴식 공간
- 우클릭 시 설정 메뉴

**대화창**: 말풍선 스타일
- 실시간 스트리밍 응답
- 간단한 입력 필드

### 설정 인터페이스
- AI 제공자 선택 및 API 키 입력
- 캐릭터 성격 설정
- 이동/행동 설정

---

## 기술적 구현 사항

### 1. 투명 오버레이 + 클릭 투과

```javascript
const fairyWindow = new BrowserWindow({
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  skipTaskbar: true,
  webPreferences: {
    contextIsolation: true,
    preload: path.join(__dirname, 'preload.js')
  }
});

// 캐릭터 영역 외에는 클릭 투과
fairyWindow.setIgnoreMouseEvents(true, { forward: true });
```

### 2. preload 스크립트 (보안)

```javascript
// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('fairyAPI', {
  sendChat: (msg) => ipcRenderer.invoke('chat-message', msg),
  onResponse: (cb) => ipcRenderer.on('chat-response', (_, data) => cb(data)),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s)
});
```

### 3. AI API 호출

```python
# fairy_bridge.py - 사용자 API 키로 호출
import anthropic  # 또는 openai

def chat(message, api_key, provider='claude'):
    if provider == 'claude':
        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            messages=[{"role": "user", "content": message}]
        )
        return response.content[0].text
```

---

## 품질 기준

| 지표 | 목표 |
|------|------|
| 메모리 사용량 | < 200MB |
| 응답 시간 | < 2초 |
| 안정성 (24h) | 99%+ |
| 애니메이션 | 60fps |

---

## 구현 우선순위

1. 코드 모듈 분리 + contextIsolation 보안 개선
2. 스프라이트 기반 캐릭터 렌더링
3. AI API 연동 (사용자 API 키 설정 UI)
4. AI 대화 시스템
5. Greeum 메모리 통합
6. 캐릭터 애니메이션 시스템
7. 성능 최적화
8. 크로스플랫폼 포팅 (추후)
