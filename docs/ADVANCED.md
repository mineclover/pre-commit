# 고급 사용 가이드

## Prefix 시스템

Pre-commit Folder Enforcer는 커밋 메시지에 자동으로 prefix를 추가합니다.

### Prefix 종류

#### 1. 폴더 경로 Prefix
일반적인 경우, depth 설정에 따라 폴더 경로가 prefix로 추가됩니다.

```bash
# depth=2 설정 시
git add src/components/Button.tsx
git commit -m "Add button component"
# 결과: [src/components] Add button component

git add example/lib/utils.ts example/lib/helpers.ts
git commit -m "Add utility functions"
# 결과: [example/lib] Add utility functions
```

#### 2. Root Prefix
루트 레벨 파일을 커밋할 때 `[root]` prefix가 추가됩니다.

```bash
git add index.ts
git commit -m "Add entry point"
# 결과: [root] Add entry point
```

#### 3. Config Prefix
설정/메타 파일만 커밋할 때 `[config]` prefix가 추가됩니다.
ignorePaths에 포함된 파일만 커밋하는 경우입니다.

```bash
git add package.json tsconfig.json
git commit -m "Update dependencies"
# 결과: [config] Update dependencies
```

## 테스트 시나리오

### 성공 케이스

#### 시나리오 1: 단일 폴더
```bash
git add src/components/Button.tsx src/components/Input.tsx
git commit -m "Add form components"
# ✅ [src/components] Add form components
```

#### 시나리오 2: 루트 파일
```bash
git add index.ts main.ts
git commit -m "Setup entry points"
# ✅ [root] Setup entry points
```

#### 시나리오 3: 설정 파일
```bash
git add package.json .gitignore
git commit -m "Update project config"
# ✅ [config] Update project config
```

#### 시나리오 4: 혼합 (설정 + 일반)
```bash
git add package.json src/components/New.tsx
git commit -m "Add component and update deps"
# ✅ [src/components] Add component and update deps
# (일반 파일 기준으로 prefix 결정)
```

### 실패 케이스

#### 시나리오: 여러 폴더
```bash
git add src/components/A.tsx src/utils/B.ts
git commit -m "Update multiple files"
# ❌ 커밋 차단!
#
# Files from multiple folders detected (depth=2):
#   [src/components] (1 files):
#     - src/components/A.tsx
#   [src/utils] (1 files):
#     - src/utils/B.ts
#
# Quick fixes:
#   git reset src/components/A.tsx  # Unstage [src/components]
#   git reset src/utils/B.ts  # Unstage [src/utils]
```

## 다국어 설정

### 영어 (기본)
```json
{
  "language": "en"
}
```

에러 메시지:
```
❌ COMMIT BLOCKED - Folder Rule Violation
✖ RULE: All staged files must be in the same folder path
✖ DEPTH: 2 levels
✖ SOLUTION: Unstage files from other folders or commit them separately
```

### 한국어
```json
{
  "language": "ko"
}
```

에러 메시지:
```
❌ 커밋 차단 - 폴더 규칙 위반
✖ 규칙: 모든 staged 파일은 같은 폴더 경로에 있어야 합니다
✖ DEPTH: 2 레벨
✖ 해결방법: 다른 폴더의 파일을 unstage하거나 별도로 커밋하세요
```

## Depth 설정 최적화

### Depth 1: 최상위 폴더만
```
src/anything.ts     → [src]
lib/anything.ts     → [lib]
docs/anything.md    → [docs]
```

**적합한 경우:**
- 작은 프로젝트
- 최상위 폴더 단위로 작업 분리가 명확한 경우

### Depth 2: 서브폴더 구분 (권장)
```
src/components/Button.tsx  → [src/components]
src/utils/helpers.ts       → [src/utils]
lib/api/client.ts          → [lib/api]
```

**적합한 경우:**
- 중/대형 프로젝트
- 기능별 폴더 구조
- 대부분의 프로젝트 (기본값)

### Depth 3: 세밀한 분리
```
src/features/auth/Login.tsx      → [src/features/auth]
src/features/user/Profile.tsx    → [src/features/user]
src/components/ui/Button.tsx     → [src/components/ui]
```

**적합한 경우:**
- 대형 모노레포
- 복잡한 폴더 구조
- 도메인별 엄격한 분리 필요

## ignorePaths 활용

### 기본 설정
프로젝트 설정 파일들은 일반적으로 무시합니다:

```json
{
  "ignorePaths": [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".gitignore",
    "README.md"
  ]
}
```

### 폴더 단위 무시
특정 폴더 전체를 무시할 수 있습니다:

```json
{
  "ignorePaths": [
    "scripts",
    "docs",
    ".github"
  ]
}
```

### 패턴 매칭
파일명이나 폴더명으로 매칭됩니다:

```json
{
  "ignorePaths": [
    "*.config.js",  // ❌ 지원 안 함 (단순 문자열 매치만)
    "config"        // ✅ config 폴더 또는 파일
  ]
}
```

## CLI 도구 활용

### 커밋 전 검증
```bash
# 커밋하기 전에 미리 확인
git add src/components/*
npm run precommit check

# 출력:
# ✅ PASSED - All files are in the same folder
# 📁 Common path: [src/components]
# 📝 Commit prefix: [src/components]
```

### 상태 확인
```bash
npm run precommit status

# 출력:
# 📊 Status Report
# Configuration:
#   - Enabled: ✅
#   - Depth: 2
#   - Language: en
# Git Status:
#   - Current branch: main
#   - Staged files: 3
```

### 로그 확인
```bash
npm run precommit logs

# 커밋 실패 후:
# Status: ✅ Log file exists
# Size: 1043 bytes
# Age: 2 minutes
```

## 모범 사례

### ✅ 권장하는 커밋 패턴

#### 1. 기능별 커밋
```bash
# 인증 기능 작업
git add src/features/auth/*
git commit -m "Implement login functionality"
# → [src/features] Implement login functionality
```

#### 2. 컴포넌트별 커밋
```bash
# UI 컴포넌트 작업
git add src/components/ui/Button.tsx src/components/ui/Button.test.tsx
git commit -m "Add button component with tests"
# → [src/components] Add button component with tests
```

#### 3. 설정 변경 커밋
```bash
# 프로젝트 설정
git add package.json tsconfig.json
git commit -m "Update build configuration"
# → [config] Update build configuration
```

### ❌ 피해야 할 패턴

#### 1. 여러 영역 동시 수정
```bash
# 나쁜 예
git add src/components/* src/utils/* src/api/*
git commit -m "Various updates"
# ❌ 커밋 차단됨
```

**해결책:** 영역별로 분리해서 커밋
```bash
git add src/components/*
git commit -m "Update components"

git add src/utils/*
git commit -m "Update utilities"

git add src/api/*
git commit -m "Update API layer"
```

#### 2. 무관한 파일 함께 커밋
```bash
# 나쁜 예
git add src/features/auth/Login.tsx README.md package.json
# (README.md, package.json은 ignorePaths에 있지만 좋지 않은 패턴)
```

**해결책:** 관련된 변경사항만 함께 커밋
```bash
git add src/features/auth/Login.tsx
git commit -m "Add login page"

git add README.md
git commit -m "Update documentation"
```

## 문제 해결

### prefix가 추가되지 않는 경우

1. **Husky 훅 재설치**
   ```bash
   npm run precommit install
   ```

2. **빌드 확인**
   ```bash
   npm run build
   # dist/prepare-commit-msg.js 파일 생성 확인
   ```

3. **설정 확인**
   ```bash
   npm run precommit config
   # enabled: true 확인
   ```

### 커밋이 차단되는 경우

1. **어떤 파일이 문제인지 확인**
   ```bash
   npm run precommit check
   ```

2. **Quick fix 사용**
   에러 메시지에 나오는 git reset 명령어 실행

3. **일시적으로 비활성화**
   ```bash
   HUSKY=0 git commit -m "Emergency fix"
   ```

## 성능 팁

### 대량 파일 커밋
maxFiles 설정을 조정하세요:

```json
{
  "maxFiles": 200  // 기본값 100에서 증가
}
```

### 빠른 검증
커밋 전에 CLI로 미리 확인:

```bash
npm run precommit check  # 빠르게 검증만
```
