# 🧹 프로젝트 정리 계획 - ClaudeFlow → Fairy Assistant

## 📋 정리 대상 파일 분석

### ✅ **유지할 파일들**
- `DESIGN-DOCUMENT.md` ✅ (새로 작성 완료)
- `FAIRY_ASSISTANT_PROJECT_SPEC.md` ✅ (종합 스펙)
- `FAIRY_ASSISTANT_IMPLEMENTATION_PLAN.md` ✅ (구현 계획)
- `CLAUDE.md` ✅ (프로젝트 지시서)
- `.gitignore`, `package.json` ✅ (기본 설정)
- `data/` 폴더 ✅ (Greeum 데이터)

### ⚠️ **검토 후 정리 대상**
- `MILESTONE_CHECKLIST.md` - 기존 ClaudeFlow용, 아카이브 필요
- `check_ui.html` - 테스트용, 삭제 고려
- `test_verification.js` - 기존 테스트, 아카이브
- `src/`, `src-tauri/` - 기존 코드베이스, 아카이브
- `dist/`, `node_modules/` - 빌드 결과물, 삭제
- `outputs/` - 기존 출력물, 아카이브

### 🗑️ **삭제 대상**
- `.DS_Store` - macOS 시스템 파일
- `tauri.log` - 기존 로그
- 기타 임시 파일들

## 📁 새로운 프로젝트 구조

```
FairyAssistant/
├── 📋 문서 (Documentation)
│   ├── DESIGN-DOCUMENT.md
│   ├── FAIRY_ASSISTANT_PROJECT_SPEC.md
│   ├── FAIRY_ASSISTANT_IMPLEMENTATION_PLAN.md
│   └── CLAUDE.md
├── 📂 아카이브 (Archive)
│   ├── legacy-claudeflow/
│   │   ├── MILESTONE_CHECKLIST.md
│   │   ├── src/
│   │   ├── src-tauri/
│   │   └── test_verification.js
│   └── README_ARCHIVE.md
├── 💾 데이터 (Data)
│   └── data/ (Greeum 메모리)
├── ⚙️ 설정 (Configuration)
│   ├── package.json
│   ├── .gitignore
│   └── fairy-config.json (새로 생성)
└── 🚀 소스 코드 (새로 시작)
    └── (M1 개발 시작 시 생성)
```

## 🎯 정리 실행 계획

1. **아카이브 디렉토리 생성**
2. **기존 파일들 적절히 이동**
3. **불필요한 파일 삭제**
4. **새로운 구조로 재구성**
5. **README 업데이트**