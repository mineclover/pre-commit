# 사용 가이드

## 빠른 시작

### 1. 다른 프로젝트에 설치하기

```bash
# 이 저장소를 클론하거나 파일들을 복사
cp -r /path/to/this/project/{package.json,tsconfig.json,.precommitrc.json,src,.husky} /your/project/

cd /your/project
npm install
npm run build
```

### 2. 설정 조정

`.precommitrc.json` 파일을 프로젝트에 맞게 수정:

```json
{
  "depth": 2,
  "logFile": ".commit-logs/violations.log",
  "enabled": true,
  "ignorePaths": [
    "package.json",
    "package-lock.json",
    ".gitignore"
  ]
}
```

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
