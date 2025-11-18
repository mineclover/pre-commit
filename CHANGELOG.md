# Changelog

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
