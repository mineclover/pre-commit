# Pre-commit Folder Enforcer

TypeScript 기반의 폴더 단위 커밋 규칙을 강제하는 Git pre-commit 훅 시스템입니다.

## 주요 기능

### 1. 폴더 경로 기반 커밋 제한
- 설정된 depth까지의 폴더 경로가 동일한 파일만 함께 커밋 가능
- 예: depth=2 설정 시, `src/components` 폴더 내 파일들만 함께 커밋

### 2. 자동 Prefix 추가
- 커밋 메시지에 자동으로 폴더 경로 prefix 추가
- `git commit -m` 사용 시에도 자동 추가됨
- Prefix 종류:
  - `[folder/path]`: 일반 폴더 (예: `[src/components]`)
  - `[root]`: 루트 레벨 파일
  - `[config]`: 설정/메타 파일만 커밋 시 (ignorePaths)

### 3. AI-Friendly 로깅
- 규칙 위반 시 상세한 에러 메시지 및 로그 파일 생성
- 커밋 성공 시 자동으로 로그 정리
- Quick fix 명령어 제안

### 4. CLI 도구
- `precommit check`: 커밋 전 검증
- `precommit status`: 현재 상태 확인
- `precommit config`: 설정 확인
- `precommit init`: 설정 파일 초기화
- `precommit logs`: 로그 파일 통계
- `precommit cleanup`: 로그 파일 정리
- `precommit stats`: 커밋 prefix 통계 분석

### 5. 통계 및 검증
- 파일 통계 (총 파일, 필터링된 파일, 무시된 파일 등)
- 설정 검증 (depth, maxFiles 등)
- 경고 메시지 (파일 수 제한 초과 등)

### 6. 로그 관리
- 커밋 실패 시 로그 파일 생성 (에러 메시지 저장)
- 다음 커밋 시도 시 이전 로그 자동 삭제
- 커밋 성공 시 모든 로그 삭제
- 수동 로그 정리 명령어 제공 (`precommit cleanup`)

### 7. 다국어 지원
- 영어(en) / 한국어(ko) 메시지 지원
- 설정 파일에서 `language` 옵션으로 변경
- 템플릿 기반 메시지 시스템

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
- `depth`: 폴더 경로의 깊이 (기본값: 2, 범위: 1-10)
- `logFile`: 위반 로그 파일 경로
- `enabled`: 훅 활성화 여부
- `ignorePaths`: 규칙을 적용하지 않을 파일/폴더 목록
- `maxFiles`: 커밋당 최대 파일 수 (선택, 기본값: 100)
- `verbose`: 상세 출력 모드 (선택, 기본값: false)
- `language`: 메시지 언어 'en' | 'ko' (선택, 기본값: 'en')

## CLI 사용법

### 커밋 전 검증
```bash
# 현재 staged 파일들이 규칙을 통과하는지 확인
npm run precommit check
# 또는
node dist/cli.js check
```

### 상태 확인
```bash
# 현재 설정과 git 상태 확인
npm run precommit status
```

### 설정 확인
```bash
# 현재 설정 보기
npm run precommit config
```

### 설정 초기화
```bash
# .precommitrc.json 파일 생성
npm run precommit init
```

### 로그 관리
```bash
# 로그 파일 상태 확인
npm run precommit logs

# 오래된 로그 파일 정리 (24시간 이상)
npm run precommit cleanup

# 모든 로그 파일 정리
npm run precommit cleanup -- --all
```

### 커밋 통계
```bash
# 최근 20개 커밋의 prefix 분포 확인 (기본값)
npm run precommit stats

# 특정 개수의 커밋 분석
npm run precommit stats -- --last 50
```

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
#   [src/components] (1 files):
#     - src/components/Button.tsx
#   [src/utils] (1 files):
#     - src/utils/helpers.ts
#
# ✖ RULE: All staged files must be in the same folder path
# ✖ DEPTH: 2 levels
# ✖ SOLUTION: Unstage files from other folders or commit them separately
#
# 💡 Quick fixes:
#    git reset src/components/Button.tsx  # Unstage [src/components]
#    git reset src/utils/helpers.ts  # Unstage [src/utils]
```

## Hook 구성

### Pre-commit Hook
- Staged 파일들이 동일한 폴더 경로에 있는지 검증
- 규칙 위반 시 커밋 차단 및 상세 에러 메시지 출력

### Prepare-commit-msg Hook
- 커밋 메시지에 자동으로 폴더 경로 prefix 추가

### Commit-msg Hook
- 커밋 메시지 형식 검증
- `[prefix] description` 형식 강제
- 유효한 prefix: `[folder/path]`, `[root]`, `[config]`
- 최소 description 길이 검증
- 형식 위반 시 커밋 차단

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
│   ├── messages.ts           # 다국어 메시지
│   ├── pre-commit.ts         # Pre-commit hook
│   ├── prepare-commit-msg.ts # Prepare-commit-msg hook
│   ├── commit-msg.ts         # Commit-msg hook
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
