# 사용 가이드

Pre-commit Folder Enforcer의 상세한 사용 방법을 설명합니다.

## 📦 설치

### 자동 설치 (권장)

가장 쉬운 방법은 자동 설치 스크립트를 사용하는 것입니다:

```bash
# curl 사용
curl -fsSL https://raw.githubusercontent.com/mineclover/pre-commit/main/install.sh | bash

# 또는 wget 사용
wget -qO- https://raw.githubusercontent.com/mineclover/pre-commit/main/install.sh | bash

# 특정 디렉토리에 설치
curl -fsSL https://raw.githubusercontent.com/mineclover/pre-commit/main/install.sh | bash -s my-project
```

자동 설치 스크립트는 다음을 수행합니다:
1. ✓ Node.js, npm, git 설치 확인
2. ✓ 저장소 클론
3. ✓ 의존성 설치
4. ✓ 프로젝트 빌드
5. ✓ 기본 설정 파일 생성
6. ✓ Git hooks 설정

### 수동 설치

더 세밀한 제어가 필요한 경우 수동으로 설치하세요:

```bash
# 1. 저장소 클론
git clone https://github.com/mineclover/pre-commit.git
cd pre-commit

# 2. 의존성 설치
npm install

# 3. 빌드
npm run build

# 4. 설정 파일 생성
npm run precommit init

# 5. Git hooks 설정
npm run prepare
```

### 기존 프로젝트에 통합

기존 프로젝트에 통합하려면:

```bash
# 1. 서브모듈로 추가
git submodule add https://github.com/mineclover/pre-commit.git tools/pre-commit
cd tools/pre-commit
npm install && npm run build

# 2. 또는 필요한 파일만 복사
cp -r tools/pre-commit/{package.json,tsconfig.json,.precommitrc.json,src,.husky} .
npm install && npm run build
```

## ⚙️ 설정

### 기본 설정

`.precommitrc.json` 파일을 프로젝트 루트에 생성:

```json
{
  "preset": "folder-based",
  "depth": 3,
  "logFile": ".commit-logs/violations.log",
  "enabled": true,
  "ignorePaths": [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".gitignore",
    "README.md"
  ],
  "maxFiles": 100,
  "verbose": false,
  "language": "en",
  "logMaxAgeHours": 24
}
```

### Preset 시스템

프로젝트는 **Preset 패턴**을 사용하여 다양한 검증 규칙을 지원합니다:

#### 1. folder-based (기본)
폴더 경로 기반으로 커밋을 제한:
```json
{
  "preset": "folder-based",
  "depth": 3
}
```

#### 2. conventional-commits
Conventional Commits 스펙 준수:
```json
{
  "preset": "conventional-commits"
}
```

### 고급 Depth 설정

#### 고정 Depth
```json
{
  "depth": 2
}
```
- `depth: 2` → `[folder/path]` 형식
- `depth: 3` → `[folder/path/to]` 형식

#### 자동 Depth 감지
```json
{
  "depth": "auto",
  "maxDepth": 5
}
```
- 파일들의 공통 경로를 자동으로 감지
- `maxDepth`로 최대 깊이 제한

#### 경로별 Depth Override
```json
{
  "depth": 3,
  "depthOverrides": {
    "src/hooks": 2,
    "src/core": 2,
    "src/presets/folder-based": 3,
    ".husky": 1,
    "docs": 1
  }
}
```
- 특정 경로에 다른 depth 적용
- 가장 긴 매칭 경로가 우선 적용

## 실전 시나리오

### 시나리오 1: Feature 개발

```bash
# src/features/authentication 폴더에서 작업
git add src/features/authentication/Login.tsx
git add src/features/authentication/LoginForm.tsx
git commit -m "Implement login functionality"

# 자동으로 변환됨:
# "[src/features] Implement login functionality"
```

### 시나리오 2: 다른 폴더 작업 시도 (실패)

```bash
git add src/features/authentication/Login.tsx
git add src/components/shared/Button.tsx
git commit -m "Update files"

# 에러 발생:
# ❌ COMMIT BLOCKED - Folder Rule Violation
# Files from multiple folders detected (depth=2):
#   [src/features]: src/features/authentication/Login.tsx
#   [src/components]: src/components/shared/Button.tsx
```

### 시나리오 3: 올바른 분리 커밋

```bash
# 첫 번째 커밋: authentication 폴더
git add src/features/authentication/Login.tsx
git commit -m "Implement login functionality"
# → "[src/features] Implement login functionality"

# 두 번째 커밋: shared 컴포넌트
git add src/components/shared/Button.tsx
git commit -m "Add reusable button component"
# → "[src/components] Add reusable button component"
```

## Depth 설정 예시

### Depth = 1
```
src/Login.tsx  → [src]
lib/utils.ts   → [lib]
```

### Depth = 2
```
src/features/Login.tsx    → [src/features]
src/components/Button.tsx → [src/components]
lib/utils/date.ts         → [lib/utils]
```

### Depth = 3
```
src/features/auth/Login.tsx      → [src/features/auth]
src/features/user/Profile.tsx    → [src/features/user]
src/components/ui/Button.tsx     → [src/components/ui]
```

## CI/CD 통합

### GitHub Actions

```yaml
name: Validate Commits

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Validate commit structure
        run: node dist/pre-commit.js
```

### GitLab CI

```yaml
validate-commits:
  stage: test
  image: node:18
  script:
    - npm install
    - npm run build
    - node dist/pre-commit.js
```

## CLI 명령어 상세

### precommit check

staged 파일들의 규칙 준수 여부를 검증합니다.

```bash
# 현재 staged 파일 검증
npm run precommit check

# 특정 파일로 dry-run 테스트
npm run precommit check -- --files "src/core/config.ts,src/core/types.ts"
```

출력 예시:
```
📋 Validation Check (Dry Run)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Preset: folder-based
Test files: 2
Depth setting: 3
✅ PASSED - All files are in the same folder
📁 Common path: [src/core]
📝 Commit prefix: [src/core]

📄 Validated files:
   - src/core/config.ts
   - src/core/types.ts

⚠️  This was a dry-run. No actual validation was performed on staged files.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### precommit status

현재 설정 및 git 상태를 확인합니다.

```bash
npm run precommit status
```

### precommit config

현재 적용 중인 설정을 JSON 형태로 출력합니다.

```bash
npm run precommit config
```

### precommit init

기본 설정 파일(.precommitrc.json)을 생성합니다.

```bash
npm run precommit init
```

### precommit validate-config

설정 파일의 유효성을 검증하고 잠재적 문제를 확인합니다.

```bash
npm run precommit validate-config
```

출력 예시:
```
🔍 Configuration Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Preset: folder-based
Depth: 3
Max Files: 100
Language: en

✅ Configuration is valid

Warnings:
⚠️  Consider adding 'node_modules' to ignorePaths
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### precommit logs

로그 파일 통계를 확인합니다.

```bash
npm run precommit logs
```

### precommit cleanup

로그 파일을 정리합니다.

```bash
# 오래된 로그 파일만 정리 (logMaxAgeHours 기준)
npm run precommit cleanup

# 모든 로그 파일 정리
npm run precommit cleanup -- --all
```

### precommit stats

커밋 히스토리의 prefix 통계를 분석합니다.

```bash
# 최근 20개 커밋 분석 (기본값)
npm run precommit stats

# 특정 개수의 커밋 분석
npm run precommit stats -- --last 50
```

출력 예시:
```
📊 Commit Prefix Statistics (last 20 commits)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prefix distribution:
  [src/core            ]   5 (25.0%) ██
  [src/cli/commands    ]   4 (20.0%) ██
  [src/hooks           ]   3 (15.0%) █
  [root                ]   3 (15.0%) █
  [docs                ]   2 (10.0%) █
  [tests/unit/core     ]   2 (10.0%) █
  [config              ]   1 (5.0%)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total analyzed: 20 commits
With prefix: 20
Without prefix: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### precommit install

Husky hooks를 설치합니다. (pre-commit, prepare-commit-msg, commit-msg, post-commit)

```bash
npm run precommit install
```

## 문제 해결

### 1. 훅이 실행되지 않음
```bash
# 훅 파일 권한 확인
chmod +x .husky/pre-commit
chmod +x .husky/prepare-commit-msg
chmod +x .husky/post-commit

# Husky 재설치
rm -rf .husky
npx husky init
npm run build
```

### 2. 일시적으로 훅 비활성화
```bash
# 방법 1: 설정 파일에서
# .precommitrc.json의 "enabled"를 false로 설정

# 방법 2: 환경 변수
HUSKY=0 git commit -m "Emergency fix"

# 방법 3: --no-verify 플래그
git commit --no-verify -m "Skip hooks"
```

### 3. 로그 파일 수동 확인
```bash
cat .commit-logs/violations.log
```

## 모범 사례

### ✅ 권장
- 관련 기능별로 폴더를 구성
- 한 번에 하나의 기능/영역만 수정
- 의미 있는 커밋 메시지 작성

### ❌ 비권장
- 여러 기능을 한 번에 커밋
- 너무 큰 변경사항을 한 커밋에 포함
- 관련 없는 파일들을 함께 커밋

## 고급 설정

### 동적 Depth 설정 (프로젝트별)

대형 모노레포의 경우:
```json
{
  "depth": 3,
  "ignorePaths": [
    "packages/*/package.json",
    "apps/*/package.json"
  ]
}
```

### 특정 폴더만 검증

```json
{
  "depth": 2,
  "ignorePaths": [
    "docs",
    "scripts",
    "config"
  ]
}
```
