# ClaudeFlow Windows 설치 가이드

## 다운로드

현재 사용 가능한 Windows 설치 파일:
- `ClaudeFlow_0.1.0_x64-setup.exe` (2.6MB) - **권장**
- `ClaudeFlow_0.1.0_x64_en-US.msi` (4.0MB)

## 설치 방법

### 방법 1: EXE 설치 프로그램 사용 (권장)

1. `ClaudeFlow_0.1.0_x64-setup.exe` 다운로드
2. 다운로드한 파일 실행
3. Windows Defender 경고 시:
   - "추가 정보" 클릭
   - "실행" 선택
4. 설치 마법사 따라 진행
5. 설치 완료 후 시작 메뉴에서 ClaudeFlow 실행

### 방법 2: MSI 파일 사용

1. `ClaudeFlow_0.1.0_x64_en-US.msi` 다운로드
2. 파일 더블클릭하여 설치
3. Windows Installer가 자동으로 설치 진행

## 시스템 요구사항

- **OS**: Windows 10 1803+ 또는 Windows 11
- **아키텍처**: x64 (64비트)
- **WebView2 런타임**: 
  - Windows 11: 기본 포함
  - Windows 10: 자동 설치됨

## 첫 실행

1. **API 키 설정**
   - 첫 실행 시 API 키 설정 화면이 나타남
   - Anthropic Claude API 키 입력
   - 키는 Windows Credential Manager에 안전하게 저장됨

2. **프로젝트 초기화**
   - "New Project" 버튼 클릭
   - 프로젝트 경로 선택
   - 프로젝트 계획 작성

3. **워크플로우 실행**
   - Manager → Supervisor → Worker 계층 구조 확인
   - 세션 활성화하여 작업 시작

## 문제 해결

### "Windows Defender가 이 앱의 실행을 차단했습니다"
- 앱이 서명되지 않아 발생하는 정상적인 경고
- "추가 정보" → "실행" 선택하여 계속 진행

### WebView2 관련 오류
```
오류: Microsoft Edge WebView2 Runtime이 필요합니다
```
해결 방법:
1. [WebView2 Runtime 다운로드](https://developer.microsoft.com/microsoft-edge/webview2/)
2. Evergreen Bootstrapper 다운로드 및 실행

### Visual C++ 재배포 가능 패키지 오류
```
오류: VCRUNTIME140.dll을 찾을 수 없습니다
```
해결 방법:
1. [Visual C++ 재배포 가능 패키지](https://support.microsoft.com/help/2977003/) 다운로드
2. x64 버전 설치

### 앱이 시작되지 않을 때
1. 작업 관리자에서 ClaudeFlow 프로세스 확인
2. 있으면 종료 후 재시작
3. 없으면:
   - Windows 이벤트 뷰어 확인
   - 재설치 시도

## 제거 방법

### EXE로 설치한 경우
1. 설정 → 앱 → ClaudeFlow 찾기
2. "제거" 클릭

### MSI로 설치한 경우
1. 제어판 → 프로그램 제거
2. ClaudeFlow 선택 → 제거

## 데이터 위치

- **설정**: `%APPDATA%\com.claudeflow.desktop\`
- **로그**: `%APPDATA%\com.claudeflow.desktop\logs\`
- **프로젝트 데이터**: 각 프로젝트 폴더의 `.flow` 디렉토리

## 보안 참고사항

- API 키는 Windows Credential Manager에 암호화되어 저장
- 로컬 파일 시스템 접근 권한 필요
- 네트워크 접근은 Claude API 통신에만 사용

## 지원

문제 발생 시:
1. [GitHub Issues](https://github.com/DryRainEnt/ClaudeFlow/issues) 확인
2. 새 이슈 생성 시 다음 정보 포함:
   - Windows 버전
   - 오류 메시지 전체
   - 재현 단계