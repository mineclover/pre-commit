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
- `precommit --version`: 버전 정보 출력
- `precommit check`: 커밋 전 검증
- `precommit check --files "a.ts,b.ts"`: Dry-run 검증
- `precommit validate-config`: 설정 파일 유효성 검사
- `precommit status`: 현재 상태 확인
- `precommit config`: 설정 확인
- `precommit init`: 설정 파일 초기화
- `precommit install`: Husky 훅 설치
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

## 빠른 시작

```bash
# 1. 설치 및 빌드
npm install && npm run build

# 2. Husky 훅 설치
node dist/cli.js install

# 3. 설정 파일 생성 (선택)
node dist/cli.js init
```

설치 완료! 이제 커밋 시 자동으로 폴더 규칙이 적용됩니다.

## 설정

### 설정 파일 (`.precommitrc.json`)
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
- `ignorePaths`: 규칙을 적용하지 않을 파일/폴더 목록 (glob 패턴 지원: `*.json`, `**/*.md`, `docs/**`)
- `maxFiles`: 커밋당 최대 파일 수 (선택, 기본값: 100)
- `verbose`: 상세 출력 모드 (선택, 기본값: false)
- `language`: 메시지 언어 'en' | 'ko' (선택, 기본값: 'en')

## CLI 사용법

```bash
# 기본 명령어
node dist/cli.js --version       # 버전 확인
node dist/cli.js help            # 도움말

# 검증
node dist/cli.js check           # staged 파일 검증
node dist/cli.js check --files "a.ts,b.ts"  # dry-run 테스트
node dist/cli.js validate-config # 설정 파일 검증

# 상태
node dist/cli.js status          # 현재 상태 확인
node dist/cli.js config          # 설정 보기
node dist/cli.js stats           # 커밋 통계

# 설정
node dist/cli.js init            # 설정 파일 생성
node dist/cli.js install         # Husky 훅 설치

# 로그
node dist/cli.js logs            # 로그 상태
node dist/cli.js cleanup         # 오래된 로그 정리
node dist/cli.js cleanup --all   # 모든 로그 정리
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

### Post-commit Hook
- 커밋 성공 시 로그 파일 자동 정리

## 개발

### 프로젝트 구조
```
.
├── src/
│   ├── commands/             # CLI 명령어 모듈
│   │   ├── index.ts          # 명령어 내보내기
│   │   ├── check.ts          # check 명령어
│   │   ├── status.ts         # status 명령어
│   │   ├── config.ts         # config 명령어
│   │   ├── init.ts           # init 명령어
│   │   ├── cleanup.ts        # cleanup 명령어
│   │   ├── logs.ts           # logs 명령어
│   │   ├── stats.ts          # stats 명령어
│   │   ├── install.ts        # install 명령어
│   │   ├── validate-config.ts # validate-config 명령어
│   │   └── help.ts           # help 명령어
│   ├── utils/                # 유틸리티 모듈
│   │   ├── console.ts        # 콘솔 출력 유틸리티
│   │   ├── error.ts          # 에러 처리 유틸리티
│   │   ├── glob.ts           # Glob 패턴 매칭
│   │   └── version.ts        # 버전 유틸리티
│   ├── types.ts              # TypeScript 타입 정의
│   ├── constants.ts          # 공용 상수
│   ├── config.ts             # 설정 로더
│   ├── logger.ts             # 로깅 시스템
│   ├── validator.ts          # 커밋 검증 로직
│   ├── messages.ts           # 다국어 메시지 템플릿
│   ├── git-helper.ts         # Git 유틸리티 함수
│   ├── cli.ts                # CLI 라우터
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

## 문서

| 문서 | 설명 |
|------|------|
| [FEATURES.md](docs/FEATURES.md) | 전체 기능 문서 |
| [CONVENTIONS.md](docs/CONVENTIONS.md) | 코드 컨벤션 |
| [ADVANCED.md](docs/ADVANCED.md) | 고급 사용 가이드 |
| [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | 문제 해결 가이드 |
| [USAGE.md](USAGE.md) | 사용 가이드 |
| [CHANGELOG.md](CHANGELOG.md) | 변경 이력 |

## 라이센스

MIT
