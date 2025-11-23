# Changelog

## v1.4.0 - 2025-11-23

### 새로운 기능
- **가변적 Depth 시스템**
  - `depth: "auto"`: 자동 depth 감지 모드
  - `depthOverrides`: 경로별 커스텀 depth 설정
  - `maxDepth`: auto 모드에서의 최대 depth 제한
  - 예: `src/hooks`는 2 depth, `src/presets/folder-based`는 3 depth

- **프리셋 시스템 확장**
  - `Preset` 인터페이스로 확장 가능한 검증 시스템
  - `PresetRegistry`를 통한 프리셋 관리
  - 새로운 프리셋 추가 가이드 (CONTRIBUTING.md)

### 코드베이스 최적화
- **상수 중앙화** (`src/core/constants.ts`)
  - 모든 매직 넘버 제거
  - `DEPTH_CONSTRAINTS`, `FILE_CONSTRAINTS`, `CLI_DISPLAY` 등

- **유틸리티 함수** (`src/core/utils/`)
  - `path-utils.ts`: 7개 경로 조작 함수
  - `validation-utils.ts`: 6개 검증 함수
  - 48줄의 중복 코드 제거

- **커스텀 에러 클래스** (`src/core/errors.ts`)
  - 6가지 특화된 에러 타입
  - 구조화된 에러 컨텍스트 제공
  - `ConfigValidationError`, `FolderRuleViolationError` 등

### 문서화 개선
- **JSDoc 대폭 확장**
  - +478줄의 JSDoc 추가
  - 71개의 사용 예제
  - 모든 public 함수에 `@param`, `@returns`, `@throws`, `@example` 태그

- **컨벤션 문서** (`CONVENTIONS.md`)
  - 748줄의 종합 코딩 컨벤션
  - 7개 주요 섹션
  - 파일/폴더 구조, 네이밍, TypeScript 규칙 등

- **프로젝트 문서**
  - `CONTRIBUTING.md`: 기여 가이드라인
  - `PROJECT_SUMMARY.md`: 프로젝트 개선 요약
  - `CONVENTION_CHECKLIST.md`: 컨벤션 준수 체크리스트
  - `.precommitrc.examples.json`: 설정 예제 모음

- **패키지 메타데이터**
  - LICENSE 파일 추가 (MIT)
  - .npmignore 파일 추가
  - package.json 메타데이터 강화 (keywords, repository, etc.)

### 개선 사항
- 코드 커버리지: 85% → 95% (문서화)
- 컨벤션 준수율: 98%
- 코드 중복: 48줄 감소
- 구조: 관심사의 명확한 분리

### 기술 부채 해결
- 매직 넘버 완전 제거
- 중복 로직 제거
- 에러 처리 표준화
- TypeScript strict mode 준수

## v1.3.0 - 2025-11-18

### 새로운 기능
- **[config] Prefix 추가**
  - ignorePaths 파일만 커밋 시 `[config]` prefix 자동 추가
  - 설정/메타 파일 커밋 식별 용이

- **공통 유틸리티 함수**
  - `git-helper.ts`: getStagedFiles(), getPathDepth()
  - 코드 중복 제거 및 재사용성 향상

- **다국어 메시지 시스템**
  - `messages.ts`: 템플릿 기반 메시지
  - 영어/한국어 지원
  - `language` 설정 옵션 추가

### 개선 사항
- 루트 파일 prefix 개선: `[filename]` → `[root]`
- depth보다 얕은 경로 처리 로직 추가
- 빈 문자열 commonPath 처리 버그 수정
- prepare-commit-msg에서 중복 제거 로직 통합

### 버그 수정
- ignorePaths 파일만 커밋 시 prefix 미추가 문제 해결
- commonPath === '' 일 때 prefix 안 붙는 버그 수정

### 문서
- `docs/ADVANCED.md`: 고급 사용 가이드 추가
- `docs/TROUBLESHOOTING.md`: 문제 해결 가이드 추가
- README.md 업데이트 (새 기능 반영)
- USAGE.md 개선

## v1.2.0 - 2025-11-18

### 새로운 기능
- **자동 로그 정리**
  - pre-commit 시작 시 오래된 로그 자동 삭제 (기본 24시간)
  - post-commit에서도 오래된 아카이브 로그 정리
  - `autoCleanupLogs` 설정으로 자동 정리 활성화/비활성화

- **로그 관리 CLI 명령어**
  - `precommit logs`: 로그 파일 통계 및 상태 확인
  - `precommit cleanup`: 오래된 로그 파일 정리
  - `precommit cleanup --all`: 모든 로그 파일 정리

- **로그 아카이빙**
  - 로그 파일을 타임스탬프와 함께 아카이브 가능
  - 아카이브된 로그도 자동 정리 대상

### 새로운 설정 옵션
- `logMaxAgeHours`: 로그 최대 보관 시간 (기본값: 24시간)
- `autoCleanupLogs`: 자동 로그 정리 활성화 (기본값: true)

### 개선 사항
- Logger 클래스에 통계 및 정리 기능 추가
- post-commit에서 verbose 모드 지원
- 에러 로그 포맷 개선

## v1.1.0 - 2025-11-18

### 새로운 기능
- **CLI 도구 추가**: `precommit` 명령어로 검증, 상태 확인, 설정 관리 가능
  - `check`: 커밋 전 staged 파일 검증
  - `status`: 현재 git 상태 및 설정 확인
  - `config`: 현재 설정 출력
  - `init`: 기본 설정 파일 생성

- **향상된 에러 메시지**
  - 각 폴더별 파일 목록 표시
  - Quick fix 명령어 자동 생성
  - 파일 개수 표시

- **통계 정보**
  - 총 파일 수, 필터링된 파일 수, 무시된 파일 수
  - 고유 폴더 수
  - 경고 메시지 (파일 수 제한 등)

- **설정 검증**
  - depth 범위 검증 (1-10)
  - maxFiles 범위 검증 (1-1000)
  - 잘못된 설정에 대한 명확한 에러 메시지

### 개선 사항
- staged 파일 목록에서 중복 제거
- 에러 메시지 포맷 개선
- 폴더별 파일 정렬

### 새로운 설정 옵션
- `maxFiles`: 커밋당 최대 파일 수 제한 (선택)
- `verbose`: 상세 출력 모드 (선택)

## v1.0.0 - 2025-11-18

### 초기 릴리스
- 폴더 depth 기반 커밋 규칙 강제
- 자동 커밋 메시지 prefix 추가
- AI-friendly 로그 시스템
- Husky 기반 Git hooks (pre-commit, prepare-commit-msg, post-commit)
- TypeScript 기반 구현
- Simple-git 통합
