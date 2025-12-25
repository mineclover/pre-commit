# 코드 컨벤션

## 프로젝트 구조

```
src/
├── commands/           # CLI 명령어 (각 명령어별 파일)
├── utils/              # 유틸리티 함수
├── constants.ts        # 공용 상수
├── types.ts            # TypeScript 타입 정의
├── config.ts           # 설정 로더
├── validator.ts        # 핵심 검증 로직
├── logger.ts           # 로깅 시스템
├── messages.ts         # 다국어 메시지
├── git-helper.ts       # Git 유틸리티
├── cli.ts              # CLI 라우터 (진입점)
├── pre-commit.ts       # Pre-commit hook
├── prepare-commit-msg.ts # Prepare-commit-msg hook
└── post-commit.ts      # Post-commit hook
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
import { loadConfig } from './config.js';
import { printHeader } from './utils/console.js';

// 3. 타입 import
import type { Config } from './types.js';
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
try {
  // ...
} catch (error) {
  console.error('⚠️  Warning:', error);
  process.exit(0); // 0 = 성공으로 처리
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
// utils/console.ts 함수 사용
import { printHeader, printSuccess, printError } from './utils/console.js';

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
// src/commands/example.ts
import { loadConfig } from '../config.js';
import { printHeader, printFooter } from '../utils/console.js';

export async function exampleCommand(args: string[]): Promise<void> {
  const config = loadConfig();

  printHeader('Example Command', '🔧');

  // 로직 구현

  printFooter();
}
```

### cli.ts 등록
```typescript
// src/cli.ts
import { exampleCommand } from './commands/example.js';

const COMMANDS: Record<string, CommandHandler> = {
  // ...
  example: (args) => exampleCommand(args),
};
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

## 상수 관리

### constants.ts 구조
```typescript
// 기본값
export const DEFAULT_DEPTH = 2;
export const DEFAULT_LOG_FILE = '.commit-logs/violations.log';

// 제한값
export const MIN_DEPTH = 1;
export const MAX_DEPTH = 10;

// UI
export const SEPARATOR_WIDTH = 60;
export const SEPARATOR_CHAR = '━';

// 설정
export const CONFIG_FILE = '.precommitrc.json';
export const HUSKY_DIR = '.husky';
```

### 사용 예시
```typescript
// Good
import { DEFAULT_DEPTH, MIN_DEPTH, MAX_DEPTH } from './constants.js';

if (depth < MIN_DEPTH || depth > MAX_DEPTH) {
  throw new Error(`Depth must be ${MIN_DEPTH}-${MAX_DEPTH}`);
}

// Bad
if (depth < 1 || depth > 10) { ... }
```

## 타입 정의

### types.ts
```typescript
// 필수 속성과 선택 속성 구분
export interface Config {
  depth: number;           // 필수
  enabled: boolean;        // 필수
  maxFiles?: number;       // 선택 (?)
  verbose?: boolean;       // 선택
}

// 유니온 타입으로 제한
export type Language = 'en' | 'ko';
```

## 테스트 가이드

### 수동 테스트
```bash
# 빌드
npm run build

# CLI 명령어 테스트
npm run precommit check
npm run precommit status
npm run precommit config

# Hook 직접 테스트
node dist/pre-commit.js
node dist/prepare-commit-msg.js .git/COMMIT_EDITMSG
node dist/post-commit.js
```

### 시나리오 테스트
```bash
# 단일 폴더 (성공)
git add src/commands/check.ts
npm run precommit check

# 다중 폴더 (실패)
git add src/commands/check.ts src/utils/console.ts
npm run precommit check

# 설정 파일만 (성공, [config] prefix)
git add package.json
npm run precommit check
```

## Git 커밋 규칙

### 커밋 메시지
- 이 도구가 자동으로 `[folder]` prefix 추가
- 메시지는 명령형으로 작성: "Add feature" (not "Added feature")
- 50자 이내 제목

### 예시
```
[src/commands] Add stats command
[config] Update dependencies
[docs] Add conventions guide
[root] Add entry point
```

## 버전 관리

### 버전 업데이트 시
1. `package.json` 버전 수정
2. `CHANGELOG.md` 업데이트
3. 빌드 테스트: `npm run build`
4. 기능 테스트: `npm run precommit status`
