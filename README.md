# Pre-commit Folder Enforcer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Convention Compliance](https://img.shields.io/badge/Convention%20Compliance-100%25-brightgreen.svg)](./CONVENTION_CHECKLIST.md)

TypeScript 기반의 확장 가능한 Git pre-commit 훅 시스템으로, 폴더 단위 커밋 규칙을 강제하고 일관된 커밋 메시지 형식을 유지합니다.

## ✨ 주요 특징

- 🎯 **Preset 시스템**: 확장 가능한 검증 규칙 (folder-based, conventional-commits)
- 📁 **가변 Depth 지원**: 고정/자동/경로별 커스텀 depth 설정
- 🤖 **자동 Prefix 추가**: 커밋 메시지에 폴더 경로 자동 추가
- 🌍 **다국어 지원**: 영어/한국어 메시지
- 🛠️ **풍부한 CLI**: 검증, 통계, 로그 관리 도구
- 📝 **100% TypeScript**: 완전한 타입 안정성
- 📚 **완벽한 문서화**: 100% JSDoc 커버리지

## 🚀 빠른 시작

### 자동 설치 (권장)

```bash
# 설치 스크립트 다운로드 및 실행
curl -fsSL https://raw.githubusercontent.com/mineclover/pre-commit/main/install.sh | bash

# 또는 wget 사용
wget -qO- https://raw.githubusercontent.com/mineclover/pre-commit/main/install.sh | bash
```

### 수동 설치

```bash
# 1. 저장소 클론 또는 npm 설치
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

## 📋 주요 기능

### 1. 폴더 경로 기반 커밋 제한
- 설정된 depth까지의 폴더 경로가 동일한 파일만 함께 커밋 가능
- 예: depth=2 설정 시, `src/components` 폴더 내 파일들만 함께 커밋
- **가변 depth 지원**:
  - **고정 depth**: `depth: 3` → `[folder/path/to]` 형식
  - **경로별 depth**: `depthOverrides`로 특정 경로에 다른 depth 적용
  - **자동 감지**: `depth: "auto"`로 파일들의 공통 경로 자동 탐지
  - **스마트 조정**: 실제 폴더 구조가 설정보다 얕으면 자동 조정

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

#### 기본 설정
```json
{
  "preset": "folder-based",
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
  "language": "en"
}
```

#### 경로별 depth 설정
```json
{
  "preset": "folder-based",
  "depth": 3,
  "depthOverrides": {
    "src/hooks": 2,
    "src/core": 2,
    "src/presets/folder-based": 3,
    ".husky": 1,
    "docs": 1
  },
  "ignorePaths": ["dist", "node_modules"],
  "language": "en"
}
```

#### 자동 depth 감지
```json
{
  "preset": "folder-based",
  "depth": "auto",
  "maxDepth": 5,
  "ignorePaths": ["dist", "node_modules"],
  "language": "en"
}
```

#### 설정 옵션
- `depth`: 폴더 경로의 깊이 (기본값: 2, 범위: 1-10 또는 `"auto"`)
  - 숫자: 고정 depth (예: `2` = `[folder/path]`, `3` = `[folder/path/to]`)
  - `"auto"`: 파일들의 공통 경로를 자동 감지
- `depthOverrides`: 경로별 depth 오버라이드 (선택, 객체)
  - 특정 경로에 다른 depth 적용 (예: `{"src/hooks": 2, "src/presets/folder-based": 3}`)
  - 가장 긴 매칭 경로가 우선 적용
- `maxDepth`: auto 모드에서 최대 depth 제한 (선택, 기본값: 5)
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

## 📖 문서

- [CONTRIBUTING.md](./CONTRIBUTING.md) - 기여 가이드라인
- [CONVENTIONS.md](./CONVENTIONS.md) - 코딩 컨벤션
- [CONVENTION_CHECKLIST.md](./CONVENTION_CHECKLIST.md) - 컨벤션 준수 체크리스트
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - 프로젝트 개선 요약
- [CHANGELOG.md](./CHANGELOG.md) - 변경 이력

## 🛠️ 개발

### 프로젝트 구조
```
.
├── src/
│   ├── core/                    # 핵심 시스템
│   │   ├── config.ts            # 설정 로더
│   │   ├── validator.ts         # 검증 로직
│   │   ├── logger.ts            # 로깅 시스템
│   │   ├── messages.ts          # 다국어 메시지
│   │   ├── constants.ts         # 상수 정의
│   │   ├── errors.ts            # 커스텀 에러 클래스
│   │   ├── types.ts             # 타입 정의
│   │   ├── git-helper.ts        # Git 유틸리티
│   │   └── utils/               # 유틸리티 함수
│   │       ├── path-utils.ts    # 경로 조작
│   │       └── validation-utils.ts # 검증 로직
│   ├── presets/                 # 검증 프리셋
│   │   ├── base/                # 베이스 인터페이스
│   │   │   ├── types.ts         # Preset 인터페이스
│   │   │   └── registry.ts      # Preset 레지스트리
│   │   ├── folder-based/        # 폴더 기반 프리셋
│   │   └── conventional-commits/ # Conventional Commits 프리셋
│   ├── hooks/                   # Git hooks
│   │   ├── pre-commit.ts        # 파일 검증
│   │   ├── prepare-commit-msg.ts # Prefix 추가
│   │   ├── commit-msg.ts        # 메시지 검증
│   │   └── post-commit.ts       # 로그 정리
│   └── cli/                     # CLI 도구
│       └── index.ts             # CLI 진입점
├── .husky/                      # Husky hooks
├── dist/                        # 컴파일된 JS
├── docs/                        # 문서
└── .precommitrc.json            # 설정 파일
```

### 아키텍처

이 프로젝트는 **Preset 패턴**을 사용하여 확장 가능한 검증 시스템을 제공합니다:

1. **Core**: 공통 인프라 (설정, 로깅, 검증)
2. **Presets**: 플러그 가능한 검증 규칙
3. **Hooks**: Git 라이프사이클 통합
4. **CLI**: 사용자 인터페이스

### 빌드 및 테스트
```bash
# 빌드
npm run build

# 클린 빌드
npm run rebuild

# 훅 테스트 (실제 커밋으로 테스트)
git add <files>
git commit -m "Test message"
```

### 새로운 Preset 추가하기

자세한 내용은 [CONTRIBUTING.md](./CONTRIBUTING.md)의 "Adding New Presets" 섹션을 참조하세요.

## 🤝 기여하기

기여를 환영합니다! 다음 문서를 참조해주세요:

- [CONTRIBUTING.md](./CONTRIBUTING.md) - 기여 가이드라인
- [CONVENTIONS.md](./CONVENTIONS.md) - 코딩 컨벤션

### 기여 전 체크리스트

1. 코드가 TypeScript strict mode를 통과하는지 확인
2. 모든 함수에 JSDoc 추가
3. [CONVENTIONS.md](./CONVENTIONS.md)의 네이밍 규칙 준수
4. 변경사항을 [CHANGELOG.md](./CHANGELOG.md)에 기록

## 🔗 관련 링크

- [GitHub Repository](https://github.com/mineclover/pre-commit)
- [Issues](https://github.com/mineclover/pre-commit/issues)
- [Pull Requests](https://github.com/mineclover/pre-commit/pulls)

## 📄 라이센스

MIT License - 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.
