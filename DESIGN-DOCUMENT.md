# 🧚‍♀️ Fairy Assistant - 바탕화면 거주형 AI 비서

**⸻**

📌 **문서 목적**

이 문서는 바탕화면 거주형 AI 비서 "Fairy Assistant" (이하 "페어리")를 구현하기 위한 종합 설계서이다. 본 문서는 다음과 같은 목적을 가진다:

• **플랫폼별 스탠드얼론 실행 가능** (macOS, Windows, Linux)  
• **바탕화면 투명 오버레이**로 상시 거주하며 다른 앱 방해 없음  
• **Claude Code SDK + Greeum** 기반 개인화 AI 처리  
• **실시간 파일/폴더 상호작용** 및 바탕화면 통합  
• **커스터마이징 시스템** 및 소셜 기능 제공  
• **프리미엄 구독 모델**로 지속 가능한 서비스  

본 문서 하나만으로 독립적인 재구현이 가능할 정도로 상세한 내용을 포함한다.

**⸻**

## ⚙️ 기술 사양

### ✅ 플랫폼 및 프레임워크

| 영역 | 기술 | 설명 |
|------|------|------|
| 실행 환경 | Electron | 투명 오버레이, 크로스플랫폼, 데스크톱 통합 |
| 프론트엔드 | React + Vite + TailwindCSS + Zustand | 컴포넌트 기반 UI, 상태 관리 |
| 그래픽스 | Canvas 2D + WebGL | 캐릭터 렌더링, 애니메이션 |
| AI 엔진 | Claude Code SDK + Greeum | 대화 처리 + 개인화 메모리 |
| 백엔드 통합 | Node.js + Native APIs | 파일 시스템, OS 통합 |

### ✅ 배포 방식
• **실행 파일** (fairy-assistant.app, .exe, .AppImage)로 빌드  
• **설치 후 자동 실행** 및 시스템 트레이 상주  
• **바탕화면 투명 오버레이**로 항상 표시  

**⸻**

## 🎯 핵심 기능 마일스톤

### **M1-M5: 기반 구조 (Week 1-2)**

**M1. 데스크톱 오버레이 시스템**
- Electron 투명 윈도우 구현 (`transparent: true, alwaysOnTop: true`)
- 선택적 클릭 투과 (`setIgnoreMouseEvents` + 히트 테스팅)
- 시스템 트레이 통합 및 백그라운드 상주

**M2. 캐릭터 렌더링 시스템**
- 2D 스프라이트 기반 요정 캐릭터 렌더링
- 기본 애니메이션 (idle, walk, talk, jump)
- 바탕화면 좌표계 매핑 및 물리 엔진

**M3. AI 대화 시스템**
- Claude Code SDK 연동 및 스트리밍 응답
- Greeum 메모리 시스템 통합 (개인화 학습)
- 기본 성격 시스템 및 감정 표현

**M4. 바탕화면 통합**
- 파일 시스템 모니터링 (`fs.watch` + 이벤트 처리)
- 실시간 파일/폴더 변화 감지 및 반응
- 바탕화면 아이콘 위치 인식

**M5. 기본 상호작용**
- 클릭 시 대화창 활성화
- 간단한 명령 처리 ("안녕하세요", "시간 알려줘")
- 기본 도움말 및 소개 시스템

### **M6-M10: 핵심 경험 (Week 3-4)**

**M6. 폴더 점프 시스템**
- 요정이 실제 폴더로 이동하는 애니메이션
- 파일 정리 도움 기능 구현
- 드래그&드롭 상호작용 지원

**M7. 커스터마이징 시스템**
- 기본 외형 변경 (헤어, 의상, 날개)
- 집 꾸미기 기능 (가구, 정원)
- 아이템 인벤토리 시스템

**M8. 학습 및 개인화**
- 사용자 패턴 분석 및 학습
- 개인화된 도움말 제공
- 감정 상태 및 기분 변화 시스템

**M9. 고급 AI 기능**
- 파일 내용 분석 및 요약
- 개발 도구 연동 (Git, 코드 리뷰)
- 일정 관리 및 알림 기능

**M10. 성능 최적화**
- 메모리 사용량 최적화 (< 200MB)
- 배터리 영향 최소화
- 60fps 애니메이션 안정화

### **M11-M15: 확장 기능 (Week 5-6)**

**M11. 소셜 기능 (프리미엄)**
- 클라우드 동기화 시스템
- 다른 사용자 페어리와 교류
- 페어리 SNS 기능

**M12. 마켓플레이스**
- 아이템 상점 및 수집 시스템
- 시즌 이벤트 및 특별 아이템
- 사용자 제작 콘텐츠 지원

**M13. Windows/Linux 포팅**
- 플랫폼별 네이티브 API 연동
- DPI 스케일링 대응 (Windows)
- X11/Wayland 지원 (Linux)

**M14. 고급 도구 통합**
- 음성 인식 및 TTS 지원
- 스크린샷 분석 기능
- 자동화 스크립트 실행

**M15. 베타 출시 준비**
- 종합 테스트 및 버그 수정
- 사용자 가이드 및 도움말
- 앱스토어 배포 준비

* **각 마일스톤은 순차적으로 개발하며, 이전 단계 완료 후 다음 단계 진행**
* **각 단계별로 기능 검증 및 사용자 테스트 필수**
* **모든 작업 내역은 Greeum을 통해 기록 및 백업**

**⸻**

## 🏗️ 시스템 아키텍처

### **4계층 데이터 지향적 설계**

```
🧠 Backend Layers (State Management)
├── Model Layer (AI Brain)
│   ├── Claude Code SDK: 실시간 대화 처리
│   ├── Greeum Memory: 개인화 학습 데이터  
│   └── Decision Engine: 행동 결정 알고리즘
│
└── Avatar Layer (Physical State)
    ├── Transform: position, rotation, scale
    ├── Behavior: current_action, mood, animation_queue
    ├── Physics: velocity, collision, interaction_bounds
    └── Context: desktop_awareness, file_monitoring

🎭 Frontend Layers (Presentation & Input)
├── Visual Layer (Rendering Engine)  
│   ├── Character Rendering: 2D 스프라이트 + 애니메이션
│   ├── Environment: 집, 이펙트, UI 위젯
│   └── Performance: 60fps 최적화, LOD 시스템
│
└── Interaction Layer (Input Processing)
    ├── Input Processing: 마우스, 키보드 이벤트
    ├── Desktop Integration: 파일 시스템 모니터링
    └── Event Management: 사용자 액션 → 백엔드 전달
```

### **핵심 데이터 스키마**

#### **FairyState (아바타 상태)**
```typescript
interface FairyState {
  // 물리적 상태
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number };
  scale: number;
  rotation: number;
  
  // 행동 상태
  currentAction: ActionType;
  mood: MoodType;
  energy: number; // 0-100
  
  // 상호작용 상태  
  isInteracting: boolean;
  interactionTarget?: string;
  clickableArea: Rectangle;
  
  // 컨텍스트 인식
  nearbyFiles: FileInfo[];
  desktopEvents: DesktopEvent[];
}
```

#### **AISession (AI 처리 상태)**
```typescript
interface AISession {
  // 대화 상태
  conversationHistory: Message[];
  currentContext: string;
  responseStream?: ReadableStream;
  
  // 개인화 데이터
  userProfile: UserProfile;
  memories: GreuumMemory[];
  learningData: LearningData;
  
  // 결정 상태
  currentIntent: IntentType;
  nextActions: Action[];
  confidence: number;
}
```

#### **CustomizationData (커스터마이징)**
```typescript
interface CustomizationData {
  // 외형
  appearance: {
    face: FaceConfig;
    hair: HairConfig;
    outfit: OutfitConfig;
    wings: WingConfig;
    effects: EffectConfig[];
  };
  
  // 거주지
  housing: {
    houseStyle: HouseStyle;
    furniture: FurnitureItem[];
    garden: GardenItem[];
    environment: EnvironmentConfig;
  };
  
  // 능력
  abilities: {
    tools: ToolConfig[];
    skills: SkillLevel[];
    specialActions: CustomAction[];
  };
}
```

**⸻**

## 🖥 UI/UX 구성

### **메인 인터페이스 (바탕화면 오버레이)**

**[중앙] 페어리 캐릭터**
• 2D 스프라이트 기반 애니메이션 (64x64 ~ 128x128px)  
• 상태별 표정/제스처 변화 (idle, happy, thinking, working)  
• 클릭 시 대화 버블 표시 및 상호작용 메뉴  

**[좌측 상단] 미니 하우스**  
• 항상 표시되는 작은 집 위젯 (100x60px)  
• 페어리 휴식 공간, 커스터마이징 미리보기  
• 우클릭 시 설정 메뉴 접근  

**[대화 시] 채팅 인터페이스**
• 말풍선 스타일 대화창 (최대 400x300px)  
• 실시간 스트리밍 텍스트 표시  
• 간단한 명령 버튼 (도움말, 파일정리, 설정)  

### **설정 인터페이스 (별도 윈도우)**

**[전체화면] 커스터마이징 스튜디오**
• 좌측: 카테고리별 아이템 브라우저  
• 중앙: 실시간 프리뷰 (페어리 + 집)  
• 우측: 세부 옵션 및 색상 조정  

**[팝업] 설정 패널**  
• AI 모델 선택 (Claude, Local, Custom)  
• 개인화 옵션 (성격, 반응 속도)  
• 알림 및 권한 설정  

**⸻**

## 💰 서비스 모델 및 수익화

### **티어별 기능**

| 기능 | Basic (무료) | Premium ($9.99/월) | Ultimate ($19.99/월) |
|------|-------------|-------------------|---------------------|
| **기본 페어리** | ✅ 1마리 | ✅ 무제한 | ✅ 무제한 |
| **커스터마이징** | 20% | 100% | 100% + 독점 아이템 |
| **AI 상호작용** | 기본 | 고급 | 무제한 + 커스텀 모델 |
| **메모리 저장** | 로컬만 | 클라우드 동기화 | 클라우드 + 백업 |
| **소셜 기능** | ❌ | ✅ 친구 추가 | ✅ 커뮤니티 + NFT |
| **고급 도구** | 기본 | 전체 | 전체 + API 접근 |

### **수익화 전략**
1. **감정적 애착** → 무료 사용으로 페어리와 유대감 형성  
2. **커스터마이징** → 개성 표현 욕구로 프리미엄 전환  
3. **소셜 압박** → 친구들과 비교로 업그레이드 유도  
4. **편의성** → 클라우드 동기화 등 실용적 가치 제공  

### **예상 수익 (10만 사용자 기준)**
- Premium 전환율 5% × $9.99 = **$49,950/월**  
- Ultimate 전환율 1% × $19.99 = **$19,990/월**  
- **총 월 수익: ~$70,000** (연간 $840,000)  

**⸻**

## 🔧 기술적 구현 세부사항

### **투명 오버레이 + 클릭 투과**

```javascript
// Electron 메인 프로세스
const overlayWindow = new BrowserWindow({
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

// 동적 클릭 마스크
overlayWindow.setIgnoreMouseEvents(true, { forward: true });

// 캐릭터 영역 클릭 시만 활성화
ipcMain.on('fairy-clicked', () => {
  overlayWindow.setIgnoreMouseEvents(false);
  setTimeout(() => {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }, 100);
});
```

### **파일 시스템 모니터링**

```javascript
// 바탕화면 파일 변화 감지
const chokidar = require('chokidar');
const desktopPath = path.join(os.homedir(), 'Desktop');

const watcher = chokidar.watch(desktopPath, {
  persistent: true,
  ignoreInitial: false
});

watcher
  .on('add', (filePath) => {
    fairySystem.onFileAdded(filePath);
  })
  .on('unlink', (filePath) => {
    fairySystem.onFileRemoved(filePath);
  });
```

### **AI 대화 처리**

```python
# Claude Code SDK 연동
from claude_code_sdk import ClaudeSDKClient

client = ClaudeSDKClient(
    system_prompt="""당신은 사용자의 바탕화면에 사는 친근한 요정 비서입니다. 
    항상 도움이 되고 싶어하며, 파일 정리와 일상 업무를 도와줍니다.""",
    model="claude-3-5-sonnet-20241022"
)

# 스트리밍 응답 처리
def stream_response(user_message):
    for chunk in client.query(user_message, stream=True):
        emit_to_frontend('ai-response-chunk', chunk.content)
```

### **성능 최적화**

```javascript
// 오브젝트 풀링으로 GC 압박 최소화
class AnimationPool {
  constructor(size = 100) {
    this.pool = Array.from({ length: size }, () => new AnimationFrame());
    this.available = [...this.pool];
    this.inUse = [];
  }
  
  acquire() {
    if (this.available.length === 0) return null;
    const frame = this.available.pop();
    this.inUse.push(frame);
    return frame;
  }
  
  release(frame) {
    const index = this.inUse.indexOf(frame);
    if (index !== -1) {
      this.inUse.splice(index, 1);
      this.available.push(frame.reset());
    }
  }
}
```

**⸻**

## 📊 품질 보증 및 테스트

### **자동화 테스트 체계**

#### **유닛 테스트**
- 각 컴포넌트별 독립 테스트 (90%+ 커버리지)
- AI 응답 품질 테스트 (감정 분석, 적절성)
- 성능 벤치마크 (메모리, CPU, 렌더링)

#### **통합 테스트**  
- 바탕화면 오버레이 안정성 (24시간 연속 실행)
- 파일 시스템 모니터링 정확성
- 크로스플랫폼 호환성 (macOS, Windows, Linux)

#### **사용자 테스트**
- 베타 테스터 만족도 조사 (목표: 4.5/5.0+)
- 핵심 시나리오 완료율 (목표: 90%+)
- 기능별 사용 빈도 분석

### **성공 지표**

| 분야 | 지표 | 목표 |
|------|------|------|
| **기술적** | 메모리 사용량 | < 200MB |
| **기술적** | 응답 시간 | < 2초 |
| **기술적** | 안정성 | 99.5%+ 가동률 |
| **사용자** | 만족도 | 4.5/5.0+ |
| **사용자** | 리텐션 | 70%+ (1주일) |
| **비즈니스** | 전환율 | 5%+ (무료→프리미엄) |

**⸻**

## 📈 기대 결과 및 사용성

| 요소 | 기대 결과 |
|------|----------|
| **혁신성** | 업계 최초 바탕화면 거주형 AI 비서 |
| **사용성** | 설치 후 바로 바탕화면에서 자연스러운 상호작용 |
| **개인화** | 사용자별 학습하여 점점 더 유용한 도움 제공 |
| **감정적 유대** | 디지털 펫 수준의 애착 및 지속 사용 |
| **확장성** | 플랫폼 확장, 기업 버전, 생태계 구축 가능 |
| **수익성** | 지속 가능한 구독 모델로 안정적 성장 |

**⸻**

## ✅ 구현 우선순위 요약

1. **macOS 기본 오버레이** - 투명 윈도우 + 클릭 투과  
2. **캐릭터 렌더링** - 2D 스프라이트 + 기본 애니메이션  
3. **AI 대화 시스템** - Claude SDK + 기본 응답  
4. **파일 시스템 연동** - 바탕화면 모니터링 + 반응  
5. **폴더 점프 기능** - 핵심 차별화 경험  
6. **커스터마이징** - 기본 외형 변경 시스템  
7. **성능 최적화** - 메모리 + 배터리 최적화  
8. **크로스플랫폼** - Windows/Linux 포팅  
9. **프리미엄 기능** - 클라우드 동기화 + 소셜  
10. **마켓플레이스** - 수익화 시스템 완성  

**⸻**

이 설계서는 Fairy Assistant MVP를 구현하기 위한 기준 문서로 사용되며, 이 문서 하나만으로 전체 시스템을 이해하고 구현할 수 있어야 한다.

**"바탕화면에 사는 나만의 AI 요정" - Fairy Assistant 🧚‍♀️✨**