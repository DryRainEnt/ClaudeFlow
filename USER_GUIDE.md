# ClaudeFlow 사용자 가이드

## 개요
ClaudeFlow는 Claude API를 활용하여 복잡한 작업을 계층적으로 분해하고 관리하는 워크플로우 매니저입니다. Manager-Supervisor-Worker 패턴을 통해 대규모 프로젝트를 효율적으로 처리할 수 있습니다.

## 첫 실행

### 1. API 키 설정
처음 실행하면 API 키 설정 창이 나타납니다.

1. [Claude Console](https://console.anthropic.com/)에서 API 키 발급
2. 설정 창에 API 키 입력 (sk-ant-로 시작)
3. "Test Connection" 클릭하여 연결 확인
4. "Save Settings" 클릭

### 2. 인터페이스 구성

```
┌─────────────────────────────────────────────────┐
│  ClaudeFlow                    [설정] [데모]     │
├────────────────┬────────────────────────────────┤
│                │                                 │
│  세션 트리      │        세션 상세 정보           │
│                │                                 │
│  Manager       │  - 프로젝트 정보                │
│  ├ Supervisor  │  - 진행 상황                    │
│  │ └ Worker    │  - 메시지 로그                  │
│  └ Supervisor  │  - 실행 컨트롤                  │
│    └ Worker    │                                 │
│                │                                 │
└────────────────┴────────────────────────────────┘
```

## 기본 사용법

### 1. 새 프로젝트 시작

1. **"New Project" 버튼 클릭**
2. 프로젝트 정보 입력:
   - **Title**: 프로젝트 이름
   - **Description**: 전체적인 설명
   - **Objectives**: 달성하려는 목표 (여러 개 가능)
   - **Constraints**: 제약사항이나 주의사항
   - **Deliverables**: 최종 산출물
3. **"Create Project"** 클릭

### 2. 워크플로우 이해

#### Manager 세션
- 사용자와 직접 소통
- 전체 프로젝트 관리
- Supervisor 세션들을 생성하여 작업 분배

#### Supervisor 세션
- Manager로부터 작업 계획(WorkPlan) 수신
- 작업을 더 작은 단위로 분해
- Worker 세션들을 생성하여 실제 작업 수행

#### Worker 세션
- Supervisor로부터 구체적인 작업 요청(RequestCall) 수신
- 실제 코드 생성이나 작업 수행
- 결과를 Supervisor에게 보고

### 3. 세션 실행

1. **자동 실행**: Manager 세션이 생성되면 자동으로 시작됩니다.
2. **수동 제어**: 
   - ▶️ Start/Resume: 세션 시작 또는 재개
   - ⏸️ Pause: 일시 정지
   - ⏹️ Terminate: 종료

### 4. 진행 상황 모니터링

- **색상 표시**:
  - 🟢 초록색: 활성/실행 중
  - 🟡 노란색: 대기 중
  - 🔵 파란색: 완료
  - 🔴 빨간색: 오류
  
- **진행률**: 각 세션 카드에 백분율로 표시
- **메시지 수**: 세션 간 주고받은 메시지 개수

## 고급 기능

### 1. 세션 상세 보기
- 세션 카드 클릭하여 상세 정보 확인
- 작업 내용, 진행 상황, 메시지 로그 확인
- 하위 세션 생성 가능

### 2. 데모 모드
상단의 "Demo" 버튼으로 시뮬레이션 실행:
- API 호출 없이 워크플로우 테스트
- 세션 간 통신 과정 확인
- 시스템 동작 이해

### 3. API 사용량 모니터링
우측 상단 상태 표시기:
- 🟢 연결 상태
- 토큰 사용량 (일일 한도 대비)
- 클릭하여 설정 열기

### 4. 파일 시스템 구조
```
프로젝트 폴더/
├── .flow/
│   ├── sessions/      # 세션 상태 파일
│   ├── messages/      # 세션 간 메시지
│   ├── history/       # 대화 기록
│   └── artifacts/     # 생성된 결과물
└── 기타 프로젝트 파일들
```

## 실제 사용 예시

### 예시 1: 웹 애플리케이션 개발

1. **프로젝트 생성**:
   - Title: "Todo App Development"
   - Objectives: "React로 Todo 앱 만들기", "로컬 스토리지 지원"
   
2. **Manager가 자동으로**:
   - Frontend Supervisor 생성
   - Storage Supervisor 생성
   
3. **각 Supervisor가**:
   - Component Worker 생성 (UI 컴포넌트)
   - Logic Worker 생성 (비즈니스 로직)
   
4. **Worker들이**:
   - 실제 코드 생성
   - 테스트 작성
   - 문서화

### 예시 2: 데이터 분석

1. **프로젝트 생성**:
   - Title: "Sales Data Analysis"
   - Objectives: "판매 데이터 분석", "시각화 리포트 생성"
   
2. **워크플로우**:
   - Data Processing Supervisor → Cleaning Worker, Transform Worker
   - Analysis Supervisor → Statistics Worker, Visualization Worker
   - Report Supervisor → Documentation Worker

## 팁과 주의사항

### 효율적인 사용을 위한 팁

1. **명확한 목표 설정**: 프로젝트 생성 시 구체적인 목표 작성
2. **적절한 분해**: 너무 크거나 작지 않은 적절한 작업 단위
3. **진행 상황 확인**: 정기적으로 세션 상태 모니터링
4. **오류 처리**: 빨간색 세션은 즉시 확인하여 문제 해결

### 주의사항

1. **API 사용량**: 일일 토큰 한도 확인
2. **비용 관리**: 복잡한 프로젝트는 많은 API 호출 발생
3. **데이터 보안**: 민감한 정보는 프로젝트에 포함하지 않기
4. **백업**: 중요한 결과물은 별도 백업

## 문제 해결

### 세션이 멈춘 경우
1. 세션 상태 확인 (대기 중인지 오류인지)
2. 메시지 로그에서 마지막 활동 확인
3. Pause → Resume으로 재시작 시도
4. 필요시 Terminate 후 재생성

### API 오류
1. API 키 유효성 확인
2. 인터넷 연결 상태 확인
3. API 사용량 한도 확인
4. 설정에서 연결 테스트 실행

### 성능 문제
1. 동시 실행 세션 수 줄이기
2. 큰 프로젝트는 단계별로 나누어 실행
3. 불필요한 세션 종료

## 추가 도움말

- **키보드 단축키**:
  - `Ctrl/Cmd + ,`: 설정 열기
  - `Ctrl/Cmd + N`: 새 프로젝트
  - `Ctrl/Cmd + R`: 새로고침

- **지원**:
  - GitHub Issues에서 문제 보고
  - 커뮤니티 포럼에서 질문

ClaudeFlow를 사용해 주셔서 감사합니다! 🚀