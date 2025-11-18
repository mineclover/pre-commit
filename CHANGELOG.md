# Changelog

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
