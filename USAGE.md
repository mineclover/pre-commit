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

## v2.0 고급 기능

### 설정 상속 (extends)

여러 설정 파일을 상속하여 사용할 수 있습니다:

```json
{
  "extends": "preset:recommended",
  "depth": 2
}
```

#### 사용 가능한 내장 프리셋:
- `preset:recommended` - 권장 설정 (depth: 3, maxFiles: 50)
- `preset:strict` - 엄격한 설정 (depth: 2, maxFiles: 20)
- `preset:relaxed` - 관대한 설정 (depth: 5, maxFiles: 100)

#### 여러 설정 상속:
```json
{
  "extends": ["preset:recommended", "./team-config.json"],
  "maxFiles": 30
}
```

### 환경 변수 지원

설정 값에 환경 변수를 사용할 수 있습니다:

```json
{
  "preset": "folder-based",
  "depth": "${COMMIT_DEPTH:-3}",
  "logFile": "${LOG_DIR:-.commit-logs}/violations.log",
  "$env": {
    "COMMIT_DEPTH": "2"
  }
}
```

#### 지원 문법:
- `${VAR}` - 환경 변수 값
- `${VAR:-default}` - 기본값 포함
- `$env` - 기본 환경 변수 정의

### 조건부 설정 (conditionals)

브랜치, 환경 변수, 파일 패턴에 따라 다른 설정을 적용할 수 있습니다:

```json
{
  "preset": "folder-based",
  "depth": 3,
  "conditionals": [
    {
      "when": { "branch": "main" },
      "config": { "depth": 2, "maxFiles": 20 }
    },
    {
      "when": { "branch": "feature/*" },
      "config": { "maxFiles": 50 }
    },
    {
      "when": { "files": ["*.test.ts", "*.spec.ts"] },
      "config": { "enabled": false }
    },
    {
      "when": { "env": { "CI": "true" } },
      "config": { "verbose": true }
    }
  ]
}
```

### Validation Pipeline

여러 preset을 순차적 또는 병렬로 실행할 수 있습니다:

```json
{
  "preset": "folder-based",
  "pipeline": {
    "strategy": "sequential",
    "stages": [
      { "preset": "folder-based" },
      { "preset": "conventional-commits", "continueOnError": true }
    ]
  }
}
```

#### 실행 전략:
- `sequential` - 순차 실행 (기본)
- `parallel` - 병렬 실행
- `first-pass` - 첫 번째 성공까지 실행
- `first-fail` - 첫 번째 실패까지 실행

#### 조건부 스테이지:
```json
{
  "pipeline": {
    "strategy": "sequential",
    "stages": [
      {
        "preset": "folder-based",
        "when": {
          "files": ["src/**/*.ts"],
          "branches": ["main", "develop"]
        }
      }
    ]
  }
}
```

### Plugin 시스템

외부 preset을 로드하고 관리할 수 있습니다:

```bash
# 등록된 preset 목록 확인
npm run precommit plugin list

# 설치된 plugin 검색
npm run precommit plugin discover

# plugin 정보 확인
npm run precommit plugin info folder-based

# 외부 plugin 로드
npm run precommit plugin load ./my-preset
npm run precommit plugin load precommit-preset-eslint
```

#### 외부 Preset 생성:

1. npm 패키지 생성:
```json
{
  "name": "precommit-preset-custom",
  "precommit": {
    "preset": "dist/preset.js"
  }
}
```

2. Preset 구현:
```typescript
export default {
  name: 'custom-preset',
  description: 'My custom preset',

  validateFiles(stagedFiles, config) {
    return { valid: true, files: stagedFiles, errors: [] };
  },

  validateCommitMessage(message, config) {
    return { valid: true, errors: [] };
  },

  getCommitPrefix(result, config) {
    return '[custom]';
  },

  // 선택적 라이프사이클 훅
  onRegister() { console.log('Preset registered'); },
  onBeforeValidate(context) { /* ... */ },
  onAfterValidate(result) { /* ... */ },
  onUnload() { /* cleanup */ }
};
```

3. 설정에서 사용:
```json
{
  "preset": "precommit-preset-custom"
}
```

### Property Registry

설정 속성의 메타데이터를 관리하고 검증하는 시스템입니다:

```typescript
import {
  ConfigPropertyRegistry,
  initializePropertyRegistry,
  validateConfigWithRegistry,
  getBuiltinSchema,
} from 'pre-commit-folder-enforcer/core/registry';

// 전역 레지스트리 초기화
initializePropertyRegistry();

// 설정 검증
const result = validateConfigWithRegistry('folder-based', {
  depth: 5,
  ignorePaths: ['*.md'],
});

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// 기본값 적용
const registry = new ConfigPropertyRegistry();
const configWithDefaults = registry.applyDefaults('folder-based', { depth: 2 });

// JSON Schema 생성 (IDE 자동완성용)
const schema = registry.toJsonSchema('folder-based');
```

#### 내장 프리셋 스키마

**folder-based 속성:**
| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `depth` | number | 3 | 폴더 경로 깊이 (1-10) |
| `ignorePaths` | string[] | [] | 무시할 경로 목록 |
| `maxFiles` | number | 100 | 커밋당 최대 파일 수 (1-1000) |
| `depthOverrides` | object | - | 경로별 깊이 재정의 |
| `maxDepth` | number | 5 | auto 모드 최대 깊이 |

**conventional-commits 속성:**
| 속성 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `types` | string[] | ['feat', 'fix', ...] | 허용 타입 목록 |
| `scopes` | string[] | [] | 허용 스코프 목록 |
| `requireScope` | boolean | false | 스코프 필수 여부 |
| `maxHeaderLength` | number | 100 | 헤더 최대 길이 |

#### 커스텀 속성 등록

```typescript
import { getGlobalPropertyRegistry } from 'pre-commit-folder-enforcer/core/registry';

const registry = getGlobalPropertyRegistry();

// 프리셋에 속성 추가
registry.registerProperty('my-preset', 'customOption', {
  name: 'customOption',
  type: 'string',
  description: '커스텀 옵션',
  default: 'default-value',
  required: false,
});

// 전체 스키마 등록
registry.registerSchema({
  preset: 'my-preset',
  properties: {
    option1: { name: 'option1', type: 'number', min: 1, max: 10 },
    option2: { name: 'option2', type: 'boolean', default: false },
  },
});
```

### JS/TS 설정 파일 지원

JSON 외에 JavaScript/TypeScript 설정 파일도 지원합니다:

**.precommitrc.js:**
```javascript
export default {
  preset: 'folder-based',
  depth: process.env.CI ? 2 : 3,
  ignorePaths: getIgnorePaths(),
};

function getIgnorePaths() {
  return ['package.json', '*.md'];
}
```

**.precommitrc.ts:**
```typescript
import type { FolderBasedConfig } from 'pre-commit-folder-enforcer';

const config: FolderBasedConfig = {
  preset: 'folder-based',
  depth: 3,
  enabled: true,
  logFile: '.commit-logs/violations.log',
  ignorePaths: ['package.json'],
};

export default config;
```

설정 파일 우선순위:
1. `.precommitrc.json`
2. `.precommitrc.js`
3. `.precommitrc.ts`
4. `precommit.config.json`
5. `precommit.config.js`
6. `package.json`의 `precommit` 필드
