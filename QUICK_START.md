# ClaudeFlow 빠른 시작 가이드

## 5분 안에 시작하기

### 1. 설치 및 실행
```bash
# 의존성 설치
npm install

# 개발 모드로 실행
npm run tauri:dev
```

### 2. API 키 설정
1. 앱 실행 시 설정 창이 자동으로 열립니다
2. [Claude Console](https://console.anthropic.com/)에서 API 키 발급
3. API 키 입력 후 저장

### 3. 첫 프로젝트 만들기
1. "New Project" 클릭
2. 간단한 예시 입력:
   ```
   Title: Hello World App
   Description: 간단한 인사 앱 만들기
   Objectives: HTML 페이지 생성
   ```
3. "Create Project" 클릭

### 4. 실행 확인
- Manager 세션이 자동으로 시작됩니다
- Supervisor와 Worker 세션이 순차적으로 생성됩니다
- 각 세션의 진행 상황을 실시간으로 확인할 수 있습니다

## 핵심 개념

```
Manager (전체 관리)
   ↓
Supervisor (작업 분해)
   ↓
Worker (실제 수행)
```

## 다음 단계
- [빌드 가이드](BUILD_GUIDE.md) - 프로덕션 빌드 방법
- [사용자 가이드](USER_GUIDE.md) - 상세한 사용 방법
- [API 설정](API_SETUP.md) - API 키 관리 상세 정보

## 도움이 필요하신가요?
- 데모 모드로 시스템 동작 확인: 상단 "Demo" 버튼
- 설정 변경: 우측 상단 API 상태 표시기 클릭
- 세션 상세 정보: 세션 카드 클릭

Happy Coding with ClaudeFlow! 🚀