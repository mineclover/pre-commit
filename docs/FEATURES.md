# 기능 문서

## 개요

Pre-commit Folder Enforcer는 Git 커밋 시 폴더 기반 규칙을 강제하는 도구입니다.

### 핵심 기능
1. 동일 폴더 파일만 커밋 허용
2. 자동 커밋 prefix 추가
3. AI-friendly 에러 로깅
4. CLI 도구

---

## 1. 폴더 기반 커밋 규칙

### 작동 원리
- 설정된 `depth`까지의 폴더 경로가 동일한 파일만 함께 커밋 가능
- 서로 다른 폴더의 파일을 함께 커밋하면 차단

### Depth 설정
| depth | 파일 경로 | prefix |
|-------|----------|--------|
| 1 | `src/components/Button.tsx` | `[src]` |
| 2 | `src/components/Button.tsx` | `[src/components]` |
| 3 | `src/features/auth/Login.tsx` | `[src/features/auth]` |

### 예시
```bash
# depth=2 설정

# ✅ 성공: 같은 폴더
git add src/components/Button.tsx src/components/Input.tsx
git commit -m "Add components"
# → [src/components] Add components

# ❌ 실패: 다른 폴더
git add src/components/Button.tsx src/utils/helpers.ts
git commit -m "Update"
# → 커밋 차단됨
```

---

## 2. 자동 Prefix 시스템

### Prefix 종류

| Prefix | 조건 | 예시 |
|--------|------|------|
| `[folder/path]` | 일반 폴더 파일 | `[src/components]` |
| `[root]` | 루트 레벨 파일 | `index.ts` 커밋 시 |
| `[config]` | ignorePaths 파일만 | `package.json` 만 커밋 시 |

### 자동 추가 과정
1. `pre-commit`: 폴더 규칙 검증
2. `prepare-commit-msg`: prefix 자동 추가
3. `post-commit`: 로그 정리

### Prefix 규칙
```bash
# 폴더 파일
git commit -m "Add feature"
# → [src/components] Add feature

# 루트 파일
git add index.ts
git commit -m "Add entry"
# → [root] Add entry

# 설정 파일만
git add package.json
git commit -m "Update deps"
# → [config] Update deps
```

---

## 3. CLI 도구

### 명령어 목록

| 명령어 | 설명 |
|--------|------|
| `check` | staged 파일 검증 (커밋 없이) |
| `status` | 현재 설정 및 git 상태 |
| `config` | 설정 JSON 출력 |
| `init` | 기본 설정 파일 생성 |
| `install` | Husky 훅 설치 |
| `logs` | 로그 파일 통계 |
| `cleanup` | 로그 파일 정리 |
| `stats` | 커밋 prefix 통계 |
| `help` | 도움말 |

### 상세 사용법

#### check
```bash
# staged 파일이 규칙을 통과하는지 확인
npm run precommit check

# 출력 예시
📋 Validation Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Staged files: 2
Depth setting: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASSED - All files are in the same folder
📁 Common path: [src/components]
📝 Commit prefix: [src/components]
```

#### status
```bash
npm run precommit status

# 출력 예시
📊 Status Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configuration:
  - Enabled: ✅
  - Depth: 2
  - Log file: .commit-logs/violations.log
  - Ignored paths: 9 entries
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Git Status:
  - Current branch: main
  - Staged files: 0
  - Modified files: 5
  - Untracked files: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### install
```bash
npm run precommit install

# Husky 훅 자동 설치
# - .husky/pre-commit
# - .husky/prepare-commit-msg
# - .husky/post-commit
```

#### stats
```bash
# 최근 20개 커밋 분석 (기본값)
npm run precommit stats

# 최근 50개 커밋 분석
npm run precommit -- stats --last 50

# 출력 예시
📊 Commit Prefix Statistics (last 20 commits)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prefix distribution:
  [config              ]   6 (30.0%) ███
  [src/components      ]   4 (20.0%) ██
  [src/utils           ]   3 (15.0%) █
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### cleanup
```bash
# 24시간 이상된 로그 삭제
npm run precommit cleanup

# 모든 로그 삭제
npm run precommit -- cleanup --all
```

---

## 4. 설정 옵션

### .precommitrc.json

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
  ],
  "maxFiles": 100,
  "verbose": false,
  "logMaxAgeHours": 24,
  "language": "en"
}
```

### 옵션 설명

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `depth` | number | 2 | 폴더 경로 깊이 (1-10) |
| `logFile` | string | `.commit-logs/violations.log` | 로그 파일 경로 |
| `enabled` | boolean | true | 훅 활성화 여부 |
| `ignorePaths` | string[] | [] | 규칙 적용 제외 파일/폴더 |
| `maxFiles` | number | 100 | 커밋당 최대 파일 수 (1-1000) |
| `verbose` | boolean | false | 상세 출력 모드 |
| `logMaxAgeHours` | number | 24 | 로그 최대 보관 시간 |
| `language` | 'en' \| 'ko' | 'en' | 메시지 언어 |

---

## 5. 다국어 지원

### 지원 언어
- English (en) - 기본값
- 한국어 (ko)

### 설정
```json
{
  "language": "ko"
}
```

### 메시지 예시

**English:**
```
❌ COMMIT BLOCKED - Folder Rule Violation
✖ RULE: All staged files must be in the same folder path
✖ SOLUTION: Unstage files from other folders
```

**한국어:**
```
❌ 커밋 차단 - 폴더 규칙 위반
✖ 규칙: 모든 staged 파일은 같은 폴더 경로에 있어야 합니다
✖ 해결방법: 다른 폴더의 파일을 unstage하세요
```

---

## 6. 로그 시스템

### 로그 생성
- 커밋 실패 시 자동으로 로그 파일 생성
- AI-friendly 형식으로 에러 정보 저장

### 로그 정리
- 커밋 성공 시 자동 삭제
- 수동 정리: `npm run precommit cleanup`

### 로그 확인
```bash
npm run precommit logs

# 출력 예시
📊 Log File Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ✅ Log file exists
Path: .commit-logs/violations.log
Size: 1043 bytes
Age: 5 minutes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 7. ignorePaths

### 용도
- 특정 파일/폴더를 규칙에서 제외
- 설정 파일, 문서 등에 유용

### 설정 방법
```json
{
  "ignorePaths": [
    "package.json",      // 특정 파일
    "docs",              // 폴더 전체
    ".github",           // 숨김 폴더
    "*.config.js"        // 패턴 (미지원)
  ]
}
```

### 동작
```bash
# ignorePaths에 포함된 파일만 커밋
git add package.json README.md
git commit -m "Update config"
# → [config] Update config

# ignorePaths + 일반 파일 혼합
git add package.json src/index.ts
git commit -m "Update"
# → [src] Update (일반 파일 기준)
```

---

## 8. Quick Fix 제안

### 에러 발생 시 자동 제안
```bash
❌ COMMIT BLOCKED - Folder Rule Violation

Files from multiple folders detected (depth=2):
  [src/components] (1 files):
    - src/components/Button.tsx
  [src/utils] (1 files):
    - src/utils/helpers.ts

💡 Quick fixes:
   git reset src/components/Button.tsx  # Unstage [src/components]
   git reset src/utils/helpers.ts  # Unstage [src/utils]
```

### 해결 방법
1. 제안된 `git reset` 명령어 실행
2. 폴더별로 나눠서 커밋

---

## 9. 훅 비활성화

### 방법 1: 설정 파일
```json
{
  "enabled": false
}
```

### 방법 2: 환경 변수
```bash
HUSKY=0 git commit -m "Skip hooks"
```

### 방법 3: --no-verify
```bash
git commit --no-verify -m "Emergency fix"
```

---

## 10. CI/CD 통합

### GitHub Actions
```yaml
name: Validate Commits
on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run precommit check
```

### GitLab CI
```yaml
validate-commits:
  stage: test
  image: node:18
  script:
    - npm install
    - npm run build
    - npm run precommit check
```
