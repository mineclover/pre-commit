# Changelog

## v1.5.0 - 2025-12-26

### 새로운 기능
- **버전 플래그**
  - `precommit --version` 또는 `-v`: 버전 정보 출력

- **Dry-run 검증**
  - `precommit check --files "a.ts,b.ts"`: 실제 staged 파일 없이 검증 테스트
  - 커밋 전 규칙 위반 여부 사전 확인 가능

- **설정 검증 명령어**
  - `precommit validate-config`: 설정 파일 유효성 검사
  - ignorePaths 존재 여부 확인
  - glob 패턴 인식

- **Glob 패턴 지원**
  - `ignorePaths`에서 glob 패턴 사용 가능
  - `*`: 단일 경로 세그먼트 매칭
  - `**`: 모든 경로 세그먼트 매칭
  - `?`: 단일 문자 매칭
  - 예: `"*.json"`, `"**/*.md"`, `"docs/**"`

- **무시된 파일 표시**
  - `precommit check` 실행 시 무시된 파일 목록 출력
  - 어떤 파일이 ignorePaths에 의해 제외되는지 명확히 확인

### 버그 수정
- `--files ""` 빈 문자열 입력 시 빈 파일 엔트리 생성 문제 수정
- 모든 파일이 무시될 때 "Validated files:" 섹션이 빈 상태로 표시되는 문제 수정

### 다국어 지원 강화
- 모든 CLI 명령어에 i18n 적용 (check, status, logs, cleanup, stats, validate-config, install)
- 60+ 개의 새로운 메시지 키 추가
- 영어/한국어 완벽 지원

### 리팩토링
- `src/utils/glob.ts`: 경량 glob 매칭 유틸리티 추가
- `src/utils/version.ts`: 버전 유틸리티 추가
- 미사용 함수 제거: `filterByGlob`, `excludeByGlob`, `getPathDepth`, `getMinDepth`, `isPermissionError`, `archive()`, `printKeyValue`
- `pre-commit.ts`: 불필요한 COMMIT_EDITMSG 처리 코드 제거 (prepare-commit-msg에서 처리)
- `check.ts`: 중복 경로 정규화 제거로 코드 단순화

## v1.4.1 - 2025-12-25

### 리팩토링
- **통합 에러 처리**
  - `src/utils/error.ts`: 에러 유틸리티 모듈 추가
  - `getErrorMessage()`, `handleFatalError()`, `handleWarning()` 함수
  - `isFileNotFoundError()` 타입 가드
  - 모든 파일에 일관된 에러 처리 적용

- **코드 중복 제거**
  - `hasCommitPrefix()`, `isMergeCommit()` 함수를 `git-helper.ts`로 통합
  - pre-commit.ts, prepare-commit-msg.ts에서 공유 함수 사용

- **코드 품질 개선**
  - logger.ts: 미사용 변수 제거 (catch 블록)
  - messages.ts: `replace()` → `replaceAll()` (복수 플레이스홀더 지원)
  - post-commit.ts: 미사용 `deletedCount` 변수 제거

- **타입 안전성 강화**
  - `ValidationResult.stats`, `warnings` 필수 필드로 변경
  - non-null assertion (`!`) 제거
  - `config.language` null 병합 연산자 적용
  - `DEFAULT_CONFIG` export 추가
  - 언어 검증 타입 가드 추가
  - `getMessages()` 함수 타입 안전하게 개선
  - `isPlainObject()` 타입 가드 추가
  - `extractConfigProps()` 안전한 속성 추출 함수 추가
  - 모든 catch 블록에 `: unknown` 타입 추가

- **설정 검증 강화**
  - `ignorePaths` 배열 요소 타입 검증 (문자열만 허용)
  - `verbose` 타입 검증 추가

### 문서
- JSDoc 주석 추가: logger.ts, messages.ts, git-helper.ts
- 모든 public 함수에 @param, @returns 문서화

## v1.4.0 - 2025-12-25

### 새로운 기능
- **Husky 훅 설치 명령어**
  - `precommit install`: Husky 훅 자동 설치
  - pre-commit, prepare-commit-msg, post-commit 훅 생성
  - 실행 권한 자동 설정

### 리팩토링
- **CLI 모듈화**
  - `src/commands/`: 명령어별 분리 (9개 파일)
  - `cli.ts`: 350줄 → 50줄 (thin router 패턴)
  - 각 명령어 독립적 유지보수 가능

- **공용 상수 중앙화**
  - `src/constants.ts`: 기본값, 제한값, Hook 정의
  - Magic number 제거

- **콘솔 유틸리티**
  - `src/utils/console.ts`: 출력 포맷 함수
  - printHeader, printFooter, printSuccess 등

### 문서
- README.md: 프로젝트 구조 업데이트
- install 명령어 문서화
- TROUBLESHOOTING.md: install 명령어 활용 추가

## v1.3.0 - 2025-11-18

### 새로운 기능
- **[config] Prefix 추가**
  - ignorePaths 파일만 커밋 시 `[config]` prefix 자동 추가
  - 설정/메타 파일 커밋 식별 용이

- **공통 유틸리티 함수**
  - `git-helper.ts`: getStagedFiles()
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
