# Windows 테스트 가이드

## 방법 1: GitHub Release에서 다운로드 (추천)

1. GitHub Actions를 통해 자동 빌드된 Windows 실행 파일 사용
2. Release 페이지에서 다음 파일 중 하나를 다운로드:
   - `ClaudeFlow_0.1.0_x64-setup.exe` (설치 프로그램)
   - `ClaudeFlow_0.1.0_x64.msi` (MSI 설치 파일)

## 방법 2: 개발 환경에서 직접 빌드

### 필요 사항
- Windows 10/11
- Node.js 20+ 
- Rust (https://rustup.rs/)
- Visual Studio 2022 Build Tools (C++ 빌드 도구 포함)

### 빌드 단계

1. **소스 코드 다운로드**
   ```bash
   git clone https://github.com/DryRainEnt/ClaudeFlow.git
   cd ClaudeFlow
   ```

2. **의존성 설치**
   ```bash
   npm install
   ```

3. **Rust 타겟 추가 (필요시)**
   ```bash
   rustup target add x86_64-pc-windows-msvc
   ```

4. **앱 빌드**
   ```bash
   npm run tauri:build
   ```

5. **빌드된 파일 위치**
   - 실행 파일: `src-tauri\target\release\ClaudeFlow.exe`
   - 설치 프로그램: `src-tauri\target\release\bundle\msi\ClaudeFlow_0.1.0_x64.msi`
   - NSIS 설치 파일: `src-tauri\target\release\bundle\nsis\ClaudeFlow_0.1.0_x64-setup.exe`

## 방법 3: 포터블 버전 만들기

빌드 후 다음 파일들을 함께 복사하면 포터블 버전으로 사용 가능:

```
ClaudeFlow/
├── ClaudeFlow.exe
└── resources/
    └── (필요한 리소스 파일들)
```

## 테스트 시 확인 사항

1. **첫 실행 시**
   - Windows Defender 경고가 나타날 수 있음 (서명되지 않은 앱)
   - "추가 정보" → "실행" 선택

2. **WebView2 런타임**
   - Windows 11: 기본 설치됨
   - Windows 10: 자동으로 다운로드/설치됨

3. **API 키 저장**
   - Windows Credential Manager에 안전하게 저장됨

## 문제 해결

### WebView2 관련 오류
```bash
# WebView2 런타임 수동 설치
https://developer.microsoft.com/en-us/microsoft-edge/webview2/
```

### Visual C++ 재배포 가능 패키지 필요
```bash
# Microsoft Visual C++ 재배포 가능 패키지 설치
https://support.microsoft.com/en-us/help/2977003/
```

## CI/CD를 통한 자동 빌드

현재 프로젝트는 GitHub Actions를 통해 자동으로 Windows 빌드를 생성합니다:

1. 코드를 push하면 자동으로 빌드 시작
2. Actions 탭에서 빌드 진행 상황 확인
3. 성공 시 Artifacts에서 다운로드 가능

### 수동으로 빌드 트리거
```bash
# 태그를 만들어 릴리즈 빌드 시작
git tag v0.1.1
git push origin v0.1.1
```