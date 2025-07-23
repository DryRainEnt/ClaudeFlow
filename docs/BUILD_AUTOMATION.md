# ClaudeFlow 빌드 자동화 가이드

## 개요

ClaudeFlow는 다음 세 가지 방법으로 빌드할 수 있습니다:

1. **GitHub Actions** - 자동화된 CI/CD (권장)
2. **로컬 빌드 스크립트** - 개발 중 테스트
3. **수동 빌드** - 세밀한 제어가 필요한 경우

## 1. GitHub Actions (권장)

### 자동 빌드 트리거

- **태그 푸시**: `v*` 패턴의 태그 (예: v1.0.0)
- **Pull Request**: 자동 테스트 실행
- **수동 실행**: Actions 탭에서 workflow_dispatch

### 사용 방법

```bash
# 1. 버전 태그 생성
git tag v1.0.0
git push origin v1.0.0

# 2. GitHub Actions가 자동으로:
#    - Windows, macOS, Linux 빌드 생성
#    - 드래프트 릴리즈 생성
#    - 빌드 아티팩트 업로드
```

### 빌드 매트릭스

| OS | 타겟 | 출력물 |
|---|---|---|
| Windows | x86_64-pc-windows-msvc | .msi |
| macOS | x86_64-apple-darwin | .dmg |
| macOS | aarch64-apple-darwin | .dmg |
| Linux | x86_64-unknown-linux-gnu | .AppImage, .deb |

## 2. 로컬 빌드 스크립트

### 빠른 시작

```bash
# 의존성 체크 및 빌드
npm run build:local

# 또는 직접 스크립트 실행
./scripts/build-local.sh
```

### 플랫폼별 빌드

```bash
# macOS (유니버설 바이너리)
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux
```

### 빌드 전 체크

```bash
# 모든 의존성 확인
npm run prebuild:check

# Rust 설치 확인
node scripts/check-rust.js

# 코드 품질 체크
npm run check
```

## 3. 수동 빌드

### 개발 빌드

```bash
# 디버그 모드 (빠른 빌드, 큰 파일 크기)
npm run tauri:build:debug
```

### 프로덕션 빌드

```bash
# 최적화된 릴리즈 빌드
npm run tauri:build

# 특정 타겟으로 빌드
npm run tauri:build -- --target x86_64-apple-darwin
```

## 빌드 결과물 위치

```
src-tauri/target/
├── release/
│   └── bundle/
│       ├── dmg/          # macOS 설치 파일
│       ├── msi/          # Windows 설치 파일
│       ├── appimage/     # Linux AppImage
│       └── deb/          # Debian 패키지
└── debug/
    └── bundle/           # 디버그 빌드
```

## 문제 해결

### Rust가 설치되지 않음

```bash
# macOS/Linux
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 설치 후
source $HOME/.cargo/env
```

### Linux 의존성 오류

```bash
sudo apt-get update
sudo apt-get install -y \
    libgtk-3-dev \
    libwebkit2gtk-4.0-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
```

### macOS 코드 서명

```bash
# Xcode Command Line Tools 필요
xcode-select --install
```

### 빌드 캐시 정리

```bash
# 전체 정리
npm run clean:all

# 빌드 캐시만 정리
npm run clean
```

## CI/CD 워크플로우

### PR 워크플로우

1. 코드 변경 및 커밋
2. PR 생성
3. 자동 테스트 실행 (lint, type check, rust checks)
4. 테스트 통과 시 머지 가능

### 릴리즈 워크플로우

1. 버전 업데이트: `package.json`, `src-tauri/Cargo.toml`
2. 변경사항 커밋
3. 태그 생성: `git tag v1.0.0`
4. 태그 푸시: `git push origin v1.0.0`
5. GitHub Actions가 릴리즈 생성

## 보안 고려사항

### API 키 보호

- API 키는 빌드에 포함되지 않음
- 런타임에 사용자가 입력
- 시스템 키체인에 안전하게 저장

### 코드 서명 (향후 구현)

- Windows: 인증서 필요
- macOS: Apple Developer ID 필요
- Linux: GPG 서명 권장

## 성능 최적화

### 빌드 시간 단축

```bash
# 병렬 빌드 활성화
export CARGO_BUILD_JOBS=4

# 캐시 활용
export CARGO_HOME=$HOME/.cargo
```

### 바이너리 크기 최적화

`Cargo.toml`에서:
```toml
[profile.release]
opt-level = "z"     # 크기 최적화
lto = true          # Link Time Optimization
codegen-units = 1   # 단일 코드 생성 단위
strip = true        # 심볼 제거
```

## 추가 리소스

- [Tauri 공식 빌드 가이드](https://tauri.app/v1/guides/building/)
- [GitHub Actions 문서](https://docs.github.com/en/actions)
- [Rust 크로스 컴파일](https://rust-lang.github.io/rustup/cross-compilation.html)