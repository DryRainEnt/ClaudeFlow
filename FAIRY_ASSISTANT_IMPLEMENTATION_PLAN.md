# 🧚‍♀️ Fairy Assistant - 바탕화면 거주형 AI 비서 구현 계획서

## 🎯 프로젝트 개요
**목표**: Claude Code SDK + Greeum을 활용한 바탕화면 거주형 요정 AI 비서 개발
**컨셉**: 바탕화면에 작은 집을 짓고, 요정이 실제 파일/폴더와 상호작용하는 혁신적 AI 비서

## 🏗️ 기술 아키텍처

### **Core Stack**
- **AI Engine**: Claude Code SDK (Python 3.10+) + Greeum Memory System
- **Desktop Integration**: Electron/Tauri + Native Desktop APIs
- **Graphics**: Canvas 2D/WebGL + CSS Animations
- **File System**: Node.js fs + File System Watcher APIs

### **3계층 구조**
```
🎭 Presentation Layer (바탕화면 UI)
├── Fairy Character (2D 스프라이트/Live2D)
├── House Widget (항상 표시되는 작은 집)
├── Desktop Overlay (투명 윈도우, 항상 위)
└── Animation Engine (점프/이동/표정 변화)

🧠 Intelligence Layer (AI 처리)
├── Claude Code SDK (대화 처리)
├── Greeum Memory (사용자 학습/기억)
├── Context Engine (바탕화면 상황 인식)
└── Personality System (요정 성격/감정)

💾 Integration Layer (시스템 연동)
├── File System Monitor (실시간 파일 변화)
├── Desktop API (아이콘/폴더 위치)
├── OS Integration (알림, 단축키)
└── Settings Manager (사용자 설정)
```

## 📋 구현 로드맵 (6주 계획)

### **Week 1-2: 기초 인프라**
- [ ] **M1**: 프로젝트 리브랜딩 (ClaudeFlow → FairyAssistant)
- [ ] **M2**: Electron/Tauri 데스크톱 앱 기본 구조
- [ ] **M3**: 투명 오버레이 윈도우 구현
- [ ] **M4**: Claude Code SDK 기본 연동
- [ ] **M5**: Greeum 메모리 시스템 통합

### **Week 3-4: 캐릭터 시스템**
- [ ] **M6**: 2D 요정 캐릭터 디자인 & 스프라이트
- [ ] **M7**: 기본 애니메이션 (idle, walk, jump, talk)
- [ ] **M8**: 바탕화면 좌표계 매핑
- [ ] **M9**: 집 UI 위젯 구현
- [ ] **M10**: 캐릭터 이동 물리 엔진

### **Week 5-6: 상호작용 시스템**
- [ ] **M11**: 파일/폴더 감지 및 반응
- [ ] **M12**: "폴더에 점프" 기능 구현
- [ ] **M13**: 음성 인식 & TTS 통합
- [ ] **M14**: 개인화 학습 알고리즘
- [ ] **M15**: 베타 테스트 및 최적화

## 🎨 핵심 기능 상세

### **1. 바탕화면 거주 시스템**
```javascript
// 투명 오버레이 윈도우
const overlay = new BrowserWindow({
  transparent: true,
  frame: false,
  alwaysOnTop: true,
  skipTaskbar: true,
  webPreferences: {
    nodeIntegration: true
  }
});

// 바탕화면 전체 크기로 설정
overlay.setFullScreen(true);
```

### **2. 폴더 점프 애니메이션**
```javascript
// 파일 드롭 이벤트 감지
fileWatcher.on('add', (filePath) => {
  fairy.lookAt(filePath);
  fairy.jumpTo(filePath, () => {
    fairy.say("새 파일이 생겼네요! 🌟");
  });
});
```

### **3. AI 대화 시스템**
```python
# Claude Code SDK 통합
from claude_code_sdk import ClaudeSDKClient

client = ClaudeSDKClient(
    system_prompt="당신은 사용자의 바탕화면에 사는 친근한 요정 비서입니다.",
    model="claude-3-5-sonnet-20241022"
)

response = client.query("안녕하세요!", stream=True)
```

## 🛠️ 개발 환경 설정

### **필수 도구**
- Node.js 18+ (Electron/Tauri)
- Python 3.10+ (Claude Code SDK)
- Git (버전 관리)
- VS Code (개발 환경)

### **의존성 설치**
```bash
# 프론트엔드
npm install electron electron-builder
npm install canvas fabric pixi.js

# 백엔드  
pip install claude-code-sdk
pip install greeum-memory-system

# 개발 도구
npm install -D webpack typescript
```

## 💰 비용 분석

### **개발 비용**
- Claude API 사용료: ~$50/월 (개발용)
- 디자인 에셋: ~$200 (1회)
- 개발 시간: 6주 (1인)

### **운영 비용**
- Claude API: 사용량 기반 ($0.01/1K 토큰)
- Greeum: 로컬 저장 (무료)
- 배포: GitHub/자체 배포 (무료)

## 🎯 MVP 기능 정의

### **Phase 1 - 기본 거주**
- ✅ 바탕화면 투명 오버레이
- ✅ 기본 요정 캐릭터 표시
- ✅ 작은 집 UI 위젯
- ✅ 간단한 대화 기능

### **Phase 2 - 상호작용**
- 🔄 파일/폴더 감지
- 🔄 요정 이동 애니메이션
- 🔄 기본적인 파일 도움 기능
- 🔄 개인화 학습 시작

### **Phase 3 - 고도화**
- ⏳ 폴더 점프 기능
- ⏳ 음성 인식/TTS
- ⏳ 복잡한 작업 자동화
- ⏳ 감정 표현 시스템

## 🚀 프로젝트 리브랜딩 계획

### **이름 변경**
- **기존**: ClaudeFlow
- **신규**: FairyAssistant (또는 DesktopFairy)

### **리브랜딩 작업**
1. GitHub 저장소 이름 변경
2. 프로젝트 폴더 이름 변경  
3. package.json, README 업데이트
4. 브랜딩 에셋 새로 제작

## 📊 성공 지표

### **기술적 목표**
- [ ] 24/7 안정적 바탕화면 거주
- [ ] 응답 속도 < 2초
- [ ] 메모리 사용량 < 200MB
- [ ] CPU 사용률 < 5% (idle)

### **사용자 경험 목표**
- [ ] "살아있는 느낌" 구현
- [ ] 개인화 학습 만족도 90%+
- [ ] 일주일 연속 사용률 70%+
- [ ] 감정적 유대감 형성

## 🎉 혁신 포인트

1. **업계 최초**: AI + 바탕화면 캐릭터 결합
2. **실용성**: 진짜 파일 관리 + 재미
3. **개인화**: 사용자별 완전 맞춤 학습
4. **감정적 연결**: 디지털 펫 수준의 유대감

---

**시작일**: 2025-09-06
**예상 완료**: 2025-10-18 (6주)
**프로젝트 코드명**: Project Fairy 🧚‍♀️✨