# ClaudeFlow

Hierarchical Claude-Code workflow manager - Claude API를 활용한 계층적 작업 관리 시스템

![ClaudeFlow](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey.svg)

## 소개

ClaudeFlow는 복잡한 프로젝트를 Manager-Supervisor-Worker 계층 구조로 분해하여 Claude API를 통해 자동으로 처리하는 데스크톱 애플리케이션입니다. 대규모 코딩 작업이나 복잡한 문서 작성을 효율적으로 관리할 수 있습니다.

### 주요 특징

- 🎯 **계층적 작업 분해**: 큰 프로젝트를 관리 가능한 작은 단위로 자동 분해
- 🔄 **자동 워크플로우**: 세션 간 자동 통신 및 작업 할당
- 📊 **실시간 모니터링**: 진행 상황과 API 사용량 실시간 추적
- 🛡️ **안전한 API 관리**: 시스템 키체인을 통한 안전한 API 키 저장
- 🎨 **직관적인 UI**: 작업 트리 시각화 및 드래그 가능한 패널

## 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/yourusername/ClaudeFlow.git
cd ClaudeFlow

# 의존성 설치
npm install

# 개발 모드 실행
npm run tauri:dev
```

자세한 내용은 [빠른 시작 가이드](QUICK_START.md)를 참조하세요.

## 시스템 요구사항

- Node.js 18.0 이상
- Rust 1.70 이상
- 운영체제: Windows 10+, macOS 10.15+, Ubuntu 20.04+

## 문서

- 📚 [사용자 가이드](USER_GUIDE.md) - 상세한 사용 방법
- 🔨 [빌드 가이드](BUILD_GUIDE.md) - 빌드 및 배포 방법
- 🚀 [빠른 시작](QUICK_START.md) - 5분 안에 시작하기
- 🔑 [API 설정](API_SETUP.md) - Claude API 설정 방법
- 🏗️ [아키텍처](CLAUDE.md) - 프로젝트 구조 및 개발 가이드

## 작동 원리

```
사용자 입력
    ↓
Manager 세션 (프로젝트 관리)
    ↓
Supervisor 세션들 (작업 분해)
    ↓
Worker 세션들 (실제 수행)
    ↓
결과 통합 및 출력
```

## 기여하기

기여를 환영합니다! 다음 방법으로 참여할 수 있습니다:

1. 이슈 보고: 버그나 기능 요청을 [Issues](https://github.com/yourusername/ClaudeFlow/issues)에 등록
2. Pull Request: 개선사항을 구현하여 PR 제출
3. 문서 개선: 오타 수정이나 설명 보완

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 감사의 말

ClaudeFlow는 Anthropic의 Claude API와 Tauri 프레임워크를 기반으로 구축되었습니다.

---

Made with ❤️ by the ClaudeFlow team