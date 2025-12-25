# 코드 컨벤션

## 프로젝트 구조

```
src/
├── cli/                    # CLI 모듈
│   ├── commands/           # CLI 명령어 (각 명령어별 파일)
│   └── index.ts            # CLI 진입점
├── core/                   # 핵심 모듈
│   ├── utils/              # 유틸리티 함수
│   │   ├── path-utils.ts   # 경로 관련 유틸
│   │   ├── validation-utils.ts # 검증 유틸
│   │   ├── glob.ts         # Glob 패턴 매칭
│   │   └── console.ts      # 콘솔 출력 유틸
│   ├── constants.ts        # 공용 상수
│   ├── types.ts            # TypeScript 타입 정의
│   ├── config.ts           # 설정 로더
│   ├── validator.ts        # 검증 위임자
│   ├── logger.ts           # 로깅 시스템
│   ├── messages.ts         # 다국어 메시지 (i18n)
│   ├── git-helper.ts       # Git 유틸리티
│   └── errors.ts           # 커스텀 에러 클래스
├── hooks/                  # Git Hooks
│   ├── utils.ts            # Hook 공용 유틸
│   ├── pre-commit.ts       # Pre-commit hook
│   ├── prepare-commit-msg.ts # Prepare-commit-msg hook
│   ├── commit-msg.ts       # Commit-msg hook
│   └── post-commit.ts      # Post-commit hook
└── presets/                # Preset 시스템
    ├── base/               # 기본 타입 및 레지스트리
    ├── folder-based/       # 폴더 기반 preset
    └── conventional-commits/ # Conventional commits preset
```

## 네이밍 컨벤션

### 파일명
- **케밥 케이스**: `git-helper.ts`, `prepare-commit-msg.ts`
- **단수형**: `validator.ts` (not `validators.ts`)
- **명확한 역할**: 파일명만으로 역할 파악 가능

### 변수/함수
- **camelCase**: `loadConfig()`, `getStagedFiles()`
- **동사로 시작**: `validate()`, `print()`, `get()`
- **boolean**: `is`, `has`, `can` 접두사 (`isValid`, `hasPrefix`)

### 상수
- **SCREAMING_SNAKE_CASE**: `DEFAULT_DEPTH`, `MAX_FILES`
- **객체로 그룹화**: `DEPTH_CONSTRAINTS`, `FILE_CONSTRAINTS`
- **constants.ts에 집중**: 매직 넘버 금지

### 타입/인터페이스
- **PascalCase**: `Config`, `ValidationResult`
- **접미사 없음**: `Config` (not `IConfig`, `ConfigInterface`)

### 클래스
- **PascalCase**: `CommitValidator`, `Logger`
- **명사형**: 역할을 나타내는 명사

## 코드 스타일

### 모듈 구조
```typescript
// 1. 외부 의존성
import { simpleGit } from 'simple-git';

// 2. 내부 모듈 (상대 경로, .js 확장자)
import { loadConfig } from '../core/config.js';
import { printHeader } from '../core/utils/console.js';

// 3. 타입 import
import type { Config } from '../core/types.js';
```

### 함수 작성
```typescript
// 단일 책임 원칙
// Good: 한 가지 일만 수행
function getPathPrefix(filePath: string, depth: number): string {
  const parts = filePath.split('/');
  return parts.slice(0, depth).join('/');
}

// Bad: 여러 역할 혼합
function processAndValidateAndLog(files: string[]): void { ... }
```

### 에러 처리
```typescript
// Hook에서: 조용히 실패 (커밋 차단 안 함)
import { handleHookError, exitSuccess } from './utils.js';

try {
  // ...
} catch (error) {
  handleHookError('hook-name', error, false); // blocking=false
}

// CLI에서: 명확한 에러 메시지
try {
  // ...
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
```

### 콘솔 출력
```typescript
// core/utils/console.ts 함수 사용
import { printHeader, printSuccess, printError } from '../core/utils/console.js';

// Good
printHeader('Status Report', '📊');
printSuccess('Validation passed');

// Bad (직접 호출)
console.log('━'.repeat(60));
console.log('✅ Validation passed');
```

## CLI 명령어 작성

### 명령어 파일 구조
```typescript
// src/cli/commands/example.ts
import { loadConfig } from '../../core/config.js';
import { printHeader, printFooter } from '../../core/utils/console.js';

export async function exampleCommand(args: string[]): Promise<void> {
  const config = loadConfig();

  printHeader('Example Command', '🔧');

  // 로직 구현

  printFooter();
}
```

### commands/index.ts 등록
```typescript
// src/cli/commands/index.ts
export { exampleCommand } from './example.js';
```

### help.ts 업데이트
```typescript
// Commands 섹션에 추가
Commands:
  example         Description of the command

// Examples 섹션에 추가
Examples:
  precommit example              # Example usage
```

## Hook 작성

### Hook 파일 구조
```typescript
// src/hooks/example-hook.ts
import { initHook, handleHookError, exitSuccess, exitFailure } from './utils.js';

async function main() {
  try {
    const ctx = initHook();
    if (!ctx) exitSuccess(); // disabled면 조기 종료

    const { config } = ctx;

    // Hook 로직

    exitSuccess();
  } catch (error) {
    handleHookError('example-hook', error, true); // blocking=true
  }
}

main();
```

## 상수 관리

### constants.ts 구조
```typescript
// 제약 조건 그룹
export const DEPTH_CONSTRAINTS = {
  MIN: 1,
  MAX: 10,
  DEFAULT: 3,
} as const;

// UI 관련
export const CLI_DISPLAY = {
  SEPARATOR_WIDTH: 60,
  SEPARATOR_CHAR: '━',
} as const;

// 설정 파일
export const CONFIG_FILE = '.precommitrc.json';
export const HUSKY_DIR = '.husky';
```

### 사용 예시
```typescript
// Good
import { DEPTH_CONSTRAINTS } from '../core/constants.js';

if (depth < DEPTH_CONSTRAINTS.MIN || depth > DEPTH_CONSTRAINTS.MAX) {
  throw new Error(`Depth must be ${DEPTH_CONSTRAINTS.MIN}-${DEPTH_CONSTRAINTS.MAX}`);
}

// Bad
if (depth < 1 || depth > 10) { ... }
```

## 타입 정의

### Preset 타입
```typescript
// presets/base/types.ts
export interface Preset<TConfig extends BaseConfig> {
  name: string;
  description: string;
  validateFiles(files: string[], config: TConfig): ValidationResult;
  validateCommitMessage(msg: string, config: TConfig): CommitMsgValidationResult;
  getCommitPrefix(result: ValidationResult, config: TConfig): string;
}
```

### Config 타입
```typescript
// core/types.ts
export interface BaseConfig {
  preset: string;
  enabled: boolean;
  logFile: string;
  language?: Language;
}

// presets/folder-based/types.ts
export interface FolderBasedConfig extends BaseConfig {
  depth: number | 'auto';
  ignorePaths: string[];
  maxFiles?: number;
  verbose?: boolean;
}
```

## 테스트

### 단위 테스트
```bash
npm test              # Watch 모드
npm test -- --run     # 단일 실행
```

### CLI 테스트
```bash
npm run build
node dist/cli/index.js --version
node dist/cli/index.js check --files "src/cli/index.ts"
node dist/cli/index.js status
```

### Hook 테스트
```bash
# 실제 커밋으로 테스트
git add src/cli/commands/check.ts
git commit -m "Test commit"
```

## Git 커밋 규칙

### 커밋 메시지
- 이 도구가 자동으로 `[folder]` prefix 추가
- 메시지는 명령형으로 작성: "Add feature" (not "Added feature")
- 50자 이내 제목

### 예시
```
[src/cli/commands] Add stats command
[src/core] Update config loader
[docs] Add conventions guide
[root] Update dependencies
```

## 버전 관리

### 버전 업데이트 시
1. `package.json` 버전 수정
2. `src/cli/commands/version.ts` 버전 수정
3. `CHANGELOG.md` 업데이트
4. 빌드 테스트: `npm run build`
5. 기능 테스트: `node dist/cli/index.js status`
