# 기능 문서

## 개요

Pre-commit Folder Enforcer는 Git 커밋 시 폴더 기반 규칙을 강제하는 도구입니다.

### 핵심 기능
1. 동일 폴더 파일만 커밋 허용 (Preset 시스템)
2. 자동 커밋 prefix 추가
3. AI-friendly 에러 로깅
4. 모듈화된 CLI 도구
5. 다국어 지원 (EN/KO)

---

## 1. Preset 시스템

### 지원 Preset

| Preset | 설명 |
|--------|------|
| `folder-based` | 폴더 기반 커밋 규칙 (기본값) |
| `conventional-commits` | Conventional Commits 형식 |

### 설정
```json
{
  "preset": "folder-based"
}
```

---

## 2. 폴더 기반 커밋 규칙 (folder-based)

### 작동 원리
- 설정된 `depth`까지의 폴더 경로가 동일한 파일만 함께 커밋 가능
- 서로 다른 폴더의 파일을 함께 커밋하면 차단

### Depth 설정
| depth | 파일 경로 | prefix |
|-------|----------|--------|
| 1 | `src/components/Button.tsx` | `[src]` |
| 2 | `src/components/Button.tsx` | `[src/components]` |
| 3 | `src/features/auth/Login.tsx` | `[src/features/auth]` |

### Auto Depth
```json
{
  "depth": "auto",
  "maxDepth": 5
}
```
자동으로 최적의 depth를 감지합니다.

### Depth Overrides
```json
{
  "depth": 2,
  "depthOverrides": {
    "src/components": 3,
    "tests": 1
  }
}
```
특정 경로에 다른 depth를 적용합니다.

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

## 3. 자동 Prefix 시스템

### Prefix 종류

| Prefix | 조건 | 예시 |
|--------|------|------|
| `[folder/path]` | 일반 폴더 파일 | `[src/components]` |
| `[root]` | 루트 레벨 파일 | `index.ts` 커밋 시 |
| `[config]` | ignorePaths 파일만 | `package.json` 만 커밋 시 |

### 자동 추가 과정
1. `pre-commit`: 폴더 규칙 검증
2. `prepare-commit-msg`: prefix 자동 추가
3. `commit-msg`: 커밋 메시지 형식 검증
4. `post-commit`: 로그 정리

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

## 4. CLI 도구

### 명령어 목록

| 명령어 | 설명 |
|--------|------|
| `check` | staged 파일 검증 (커밋 없이) |
| `check --files "a,b"` | dry-run 검증 |
| `status` | 현재 설정 및 git 상태 |
| `config` | 설정 JSON 출력 |
| `validate-config` | 설정 파일 검증 |
| `init` | 기본 설정 파일 생성 |
| `install` | Husky 훅 설치 |
| `logs` | 로그 파일 통계 |
| `cleanup` | 로그 파일 정리 |
| `stats` | 커밋 prefix 통계 |
| `--version` | 버전 출력 |
| `help` | 도움말 |

### 상세 사용법

#### check
```bash
# staged 파일이 규칙을 통과하는지 확인
node dist/cli/index.js check

# dry-run: 특정 파일로 테스트
node dist/cli/index.js check --files "src/cli/index.ts,src/hooks/utils.ts"

# 출력 예시
📋 Validation Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Preset: folder-based
Staged files: 2
Depth setting: 3
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ PASSED - All files are in the same folder
📁 Common path: [src/components]
📝 Commit prefix: [src/components]
```

#### status
```bash
node dist/cli/index.js status

# 출력 예시
📊 Status Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Configuration:
  - Preset: folder-based
  - Enabled: ✅
  - Depth: 3
  - Ignored paths: 9 entries
  - Log file: .commit-logs/violations.log
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Git Status:
  - Current branch: main
  - Staged files: 0
  - Modified files: 5
  - Untracked files: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### validate-config
```bash
node dist/cli/index.js validate-config

# 출력 예시
🔍 Configuration Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Configuration is valid

Ignored paths:
  ✅ package.json
  ✅ package-lock.json
  🔍 src/**/*.test.ts (glob pattern)
  ⚠️  old-file.js (not found)

Summary:
  - Depth setting: 3
  - Max files: 100
  - Language: en
  - Ignored paths: 3 valid, 1 patterns, 1 missing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### install
```bash
node dist/cli/index.js install

# Husky 훅 자동 설치
# - .husky/pre-commit
# - .husky/prepare-commit-msg
# - .husky/commit-msg
# - .husky/post-commit
```

#### stats
```bash
# 최근 20개 커밋 분석 (기본값)
node dist/cli/index.js stats

# 최근 50개 커밋 분석
node dist/cli/index.js stats --last 50

# 출력 예시
📊 Commit Prefix Statistics (last 20 commits)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Prefix distribution:
  [root                ]   6 (30.0%) ███
  [src/cli             ]   4 (20.0%) ██
  [src/hooks           ]   3 (15.0%) █
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total analyzed: 20 commits
With prefix: 18
Without prefix: 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 5. 설정 옵션

### .precommitrc.json

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
  "logMaxAgeHours": 24,
  "language": "en"
}
```

### 옵션 설명

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `preset` | string | `folder-based` | 사용할 preset |
| `depth` | number \| 'auto' | 3 | 폴더 경로 깊이 (1-10) |
| `maxDepth` | number | 5 | auto 모드 최대 depth |
| `depthOverrides` | object | - | 경로별 depth 오버라이드 |
| `logFile` | string | `.commit-logs/violations.log` | 로그 파일 경로 |
| `enabled` | boolean | true | 훅 활성화 여부 |
| `ignorePaths` | string[] | [] | 규칙 적용 제외 파일/폴더 (glob 지원) |
| `maxFiles` | number | 100 | 커밋당 최대 파일 수 |
| `verbose` | boolean | false | 상세 출력 모드 |
| `logMaxAgeHours` | number | 24 | 로그 최대 보관 시간 |
| `language` | 'en' \| 'ko' | 'en' | 메시지 언어 |

---

## 6. 다국어 지원

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

## 7. Glob 패턴 지원

### ignorePaths에서 glob 사용
```json
{
  "ignorePaths": [
    "package.json",
    "**/*.test.ts",
    "src/**/*.spec.js",
    "docs/**"
  ]
}
```

### 지원 패턴
- `*` - 단일 세그먼트 와일드카드
- `**` - 다중 세그먼트 와일드카드
- `?` - 단일 문자 와일드카드

---

## 8. 로그 시스템

### 로그 생성
- 커밋 실패 시 자동으로 로그 파일 생성
- AI-friendly 형식으로 에러 정보 저장

### 로그 정리
- 커밋 성공 시 자동 삭제
- 수동 정리: `node dist/cli/index.js cleanup`

### 로그 확인
```bash
node dist/cli/index.js logs

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

## 9. Quick Fix 제안

### 에러 발생 시 자동 제안
```bash
❌ COMMIT BLOCKED - Folder Rule Violation

Files from multiple folders detected (depth=3):
  [src/cli] (1 files):
    - src/cli/index.ts
  [src/hooks] (1 files):
    - src/hooks/utils.ts

💡 Quick fixes:
   git reset src/cli/index.ts  # Unstage [src/cli]
   git reset src/hooks/utils.ts  # Unstage [src/hooks]
```

---

## 10. 훅 비활성화

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

## 11. CI/CD 통합

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
      - run: node dist/cli/index.js check
```
