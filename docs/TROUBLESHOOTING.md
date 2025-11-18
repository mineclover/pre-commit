# 문제 해결 가이드

## 일반적인 문제

### 1. 훅이 실행되지 않음

#### 증상
```bash
git commit -m "test"
# prefix가 추가되지 않고 그냥 커밋됨
```

#### 원인 및 해결

**A. Husky가 설치되지 않음**
```bash
# 확인
ls -la .husky/

# 해결
npm install
npx husky init
```

**B. 훅 파일에 실행 권한 없음**
```bash
# 확인
ls -la .husky/pre-commit .husky/prepare-commit-msg .husky/post-commit

# 해결
chmod +x .husky/pre-commit
chmod +x .husky/prepare-commit-msg
chmod +x .husky/post-commit
```

**C. 빌드되지 않음**
```bash
# 확인
ls -la dist/

# 해결
npm run build
```

**D. Git hooks가 비활성화됨**
```bash
# 확인
git config core.hooksPath

# 해결 (.husky로 설정되어야 함)
git config core.hooksPath .husky
```

### 2. Prefix가 추가되지 않음

#### 증상
```bash
git commit -m "Add feature"
# 결과: "Add feature" (prefix 없음)
```

#### 원인 및 해결

**A. 모든 파일이 ignorePaths에 포함됨**
```bash
# 확인
npm run precommit check
# "All staged files are in ignore list" 경고 확인

# 해결: 이 경우 [config] prefix가 추가되어야 함
# 빌드 후 다시 시도
npm run build
```

**B. prepare-commit-msg 훅 오류**
```bash
# 확인
cat .husky/prepare-commit-msg
# "node dist/prepare-commit-msg.js" 내용 확인

# 해결
echo 'node dist/prepare-commit-msg.js "$1" "$2" "$3"' > .husky/prepare-commit-msg
chmod +x .husky/prepare-commit-msg
```

### 3. 커밋이 예상치 않게 차단됨

#### 증상
```bash
git add src/file.ts
git commit -m "Update"
# ❌ COMMIT BLOCKED
```

#### 원인 및 해결

**A. 다른 파일이 staged 상태**
```bash
# 확인
git status

# 해결: 원하지 않는 파일 unstage
git reset HEAD <file>
```

**B. depth 설정이 너무 높음**
```bash
# 파일: src/file.ts
# depth=3이면 "src" 폴더만으로 부족
# depth=2면 정상 작동

# 해결: .precommitrc.json
{
  "depth": 2  # 또는 1
}
```

**C. 실제로 여러 폴더 파일이 staged**
```bash
# 확인
npm run precommit check
# 어떤 폴더들이 섞여있는지 확인

# 해결: Quick fix 사용
git reset src/components/A.tsx  # 에러 메시지 참고
```

### 4. 한국어/영어 메시지가 안 나옴

#### 증상
```bash
# language: "ko"로 설정했는데 영어로 나옴
```

#### 원인 및 해결

**A. 설정 파일 오류**
```bash
# 확인
npm run precommit config
# language 값 확인

# 해결
# .precommitrc.json 수정
{
  "language": "ko"
}
npm run build
```

**B. 빌드 안 됨**
```bash
npm run build
```

### 5. 로그 파일이 계속 쌓임

#### 증상
```bash
ls .commit-logs/
# violations.log가 오래된 것들이 계속 남아있음
```

#### 원인 및 해결

**A. post-commit 훅 문제**
```bash
# 확인
cat .husky/post-commit

# 해결
echo 'node dist/post-commit.js' > .husky/post-commit
chmod +x .husky/post-commit
```

**B. 수동 정리**
```bash
npm run precommit cleanup --all
```

### 6. "No files staged" 에러

#### 증상
```bash
git commit -m "test"
# ⚠️  No files staged for commit
```

#### 원인 및 해결

**A. 실제로 staged 파일 없음**
```bash
# 확인
git status

# 해결
git add <files>
git commit -m "message"
```

**B. 모든 파일이 이미 커밋됨**
```bash
# 확인
git status
# "nothing to commit, working tree clean"

# 해결: 변경사항이 없으면 커밋할 필요 없음
```

## 고급 문제

### 7. Merge 커밋 시 문제

#### 증상
```bash
git merge feature-branch
# prefix가 이상하게 추가됨
```

#### 해결
Merge 커밋은 자동으로 감지하여 prefix를 추가하지 않습니다.
만약 추가되었다면:

```bash
# .git/COMMIT_EDITMSG 확인
cat .git/COMMIT_EDITMSG

# Merge 메시지는 "Merge"로 시작하므로 prefix 안 붙음
```

### 8. Rebase 시 문제

#### 증상
```bash
git rebase main
# 각 커밋마다 훅이 실행되어 느림
```

#### 해결
```bash
# 일시적으로 훅 비활성화
HUSKY=0 git rebase main

# 또는 설정 비활성화
# .precommitrc.json
{
  "enabled": false
}
# rebase 후 다시 true로
```

### 9. CI/CD 환경에서 문제

#### 증상
```bash
# CI에서 빌드 실패
npm run build
# pre-commit hook error
```

#### 해결

**A. CI 환경에서 Husky 비활성화**
```bash
# package.json
{
  "scripts": {
    "prepare": "husky || true"  # 실패해도 계속
  }
}
```

**B. 환경 변수 사용**
```bash
# CI 환경
CI=true npm install  # Husky 자동 비활성화
```

**C. .husky를 gitignore하지 않기**
```bash
# .gitignore에서 제거
# .husky/  # 이 줄 삭제
```

### 10. 성능 문제 (느린 커밋)

#### 증상
```bash
git commit -m "test"
# 몇 초 이상 걸림
```

#### 원인 및 해결

**A. 많은 파일이 staged**
```bash
# 확인
git diff --cached --name-only | wc -l

# 해결: maxFiles 설정 또는 나눠서 커밋
```

**B. Simple-git 성능**
```bash
# 큰 저장소에서는 느릴 수 있음
# 현재는 최적화된 상태
```

## 디버깅 팁

### 상세 로그 보기
```bash
# verbose 모드 활성화
# .precommitrc.json
{
  "verbose": true
}
```

### 훅 직접 실행
```bash
# pre-commit 테스트
node dist/pre-commit.js

# prepare-commit-msg 테스트
node dist/prepare-commit-msg.js .git/COMMIT_EDITMSG

# post-commit 테스트
node dist/post-commit.js
```

### 로그 파일 확인
```bash
# 실패 로그 확인
cat .commit-logs/violations.log

# 로그 통계
npm run precommit logs
```

### Git 훅 로그
```bash
# 훅 실행 로그 확인
GIT_TRACE=1 git commit -m "test"
```

## 긴급 상황

### 규칙을 무시하고 커밋해야 할 때

**방법 1: --no-verify 플래그**
```bash
git commit -m "Emergency fix" --no-verify
```

**방법 2: HUSKY 환경변수**
```bash
HUSKY=0 git commit -m "Emergency fix"
```

**방법 3: 설정 임시 비활성화**
```bash
# .precommitrc.json
{
  "enabled": false
}
git commit -m "Emergency fix"
# 커밋 후 다시 true로 변경
```

## 도움 요청

문제가 해결되지 않으면:

1. 이슈 리포트
   - GitHub Issues에 상세한 정보와 함께 리포트
   - `npm run precommit status` 출력 포함
   - 에러 메시지 전체 포함

2. 환경 정보 제공
   - Node 버전: `node -v`
   - npm 버전: `npm -v`
   - OS: `uname -a` (Linux/Mac) 또는 `ver` (Windows)
   - Git 버전: `git --version`

3. 재현 단계
   - 어떤 명령어를 실행했는지
   - 어떤 에러가 발생했는지
   - 예상 동작과 실제 동작
