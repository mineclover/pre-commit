# Pre-commit Folder Enforcer

TypeScript 기반의 폴더 단위 커밋 규칙을 강제하는 Git pre-commit 훅 시스템입니다.

## 주요 기능

### 1. 폴더 경로 기반 커밋 제한
- 설정된 depth까지의 폴더 경로가 동일한 파일만 함께 커밋 가능
- 예: depth=2 설정 시, `src/components` 폴더 내 파일들만 함께 커밋

### 2. 자동 Prefix 추가
- 커밋 메시지에 자동으로 폴더 경로 prefix 추가
- 예: `[src/components] Add new button component`

### 3. AI-Friendly 로깅
- 규칙 위반 시 상세한 에러 메시지 및 로그 파일 생성
- 커밋 성공 시 자동으로 로그 정리

## 설치 및 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 빌드
```bash
npm run build
```

### 3. 설정 파일 (`.precommitrc.json`)
```json
{
  "depth": 2,
  "logFile": ".commit-logs/violations.log",
  "enabled": true,
  "ignorePaths": [
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    ".gitignore",
    "README.md"
  ]
}
```

#### 설정 옵션
- `depth`: 폴더 경로의 깊이 (기본값: 2)
- `logFile`: 위반 로그 파일 경로
- `enabled`: 훅 활성화 여부
- `ignorePaths`: 규칙을 적용하지 않을 파일/폴더 목록

## 사용 예시

### 성공 케이스
```bash
# src/components 폴더의 파일들만 stage
git add src/components/Button.tsx
git add src/components/Input.tsx
git commit -m "Add new components"

# 자동으로 prefix가 추가됨
# 실제 커밋 메시지: "[src/components] Add new components"
```

### 실패 케이스
```bash
# 서로 다른 폴더의 파일들을 stage
git add src/components/Button.tsx
git add src/utils/helpers.ts
git commit -m "Update files"

# 에러 메시지:
# ❌ COMMIT BLOCKED - Folder Rule Violation
# Files from multiple folders detected (depth=2):
#   [src/components]: src/components/Button.tsx
#   [src/utils]: src/utils/helpers.ts
#
# ✖ RULE: All staged files must be in the same folder path
# ✖ DEPTH: 2 levels
# ✖ SOLUTION: Unstage files from other folders or commit them separately
```

## Hook 구성

### Pre-commit Hook
- Staged 파일들이 동일한 폴더 경로에 있는지 검증
- 규칙 위반 시 커밋 차단 및 상세 에러 메시지 출력

### Prepare-commit-msg Hook
- 커밋 메시지에 자동으로 폴더 경로 prefix 추가

### Post-commit Hook
- 커밋 성공 시 로그 파일 자동 정리

## 개발

### 프로젝트 구조
```
.
├── src/
│   ├── types.ts              # TypeScript 타입 정의
│   ├── config.ts             # 설정 로더
│   ├── logger.ts             # 로깅 시스템
│   ├── validator.ts          # 커밋 검증 로직
│   ├── pre-commit.ts         # Pre-commit hook
│   ├── prepare-commit-msg.ts # Prepare-commit-msg hook
│   └── post-commit.ts        # Post-commit hook
├── .husky/                   # Husky hooks
├── dist/                     # 컴파일된 JS 파일
└── .precommitrc.json         # 설정 파일
```

### 빌드 및 테스트
```bash
# 빌드
npm run build

# 훅 테스트 (실제 커밋으로 테스트)
git add <files>
git commit -m "Test message"
```

## CI/CD 통합

이 도구는 로컬 개발 환경뿐만 아니라 CI/CD 파이프라인에서도 사용 가능합니다:

```yaml
# GitHub Actions 예시
- name: Validate commit structure
  run: |
    npm install
    npm run build
    node dist/pre-commit.js
```

## 라이센스

MIT
