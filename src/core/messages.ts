/**
 * @module messages
 * @description Internationalization (i18n) system for user-facing messages
 *
 * This module provides localized messages for both English and Korean,
 * supporting validation errors, commit message formatting, and CLI output.
 * It includes a template system for dynamic message formatting.
 */

export type Language = 'en' | 'ko';

/**
 * Message interface defining all user-facing strings
 * Used for internationalization support
 */
export interface Messages {
  // Core validation messages
  commitBlocked: string;
  validationPassed: string;
  commitSuccessful: string;
  noFilesStaged: string;
  multipleFolder: string;
  rule: string;
  depth: string;
  solution: string;
  quickFixes: string;
  unstage: string;
  aiSummary: string;
  stagedFiles: string;
  requiredDepth: string;
  multipleFoldersDetected: string;
  actionRequired: string;
  // Commit message validation
  commitMsgBlocked: string;
  commitMsgInvalid: string;
  commitMsgMissingPrefix: string;
  commitMsgInvalidPrefix: string;
  commitMsgTooShort: string;
  commitMsgMissingDescription: string;
  commitMsgRule: string;
  commitMsgExample: string;
  commitMsgValidPrefixes: string;
  commitMsgDepthInfo: string;
  // CLI output messages
  checkPassed: string;
  checkFailed: string;
  commonPath: string;
  commitPrefix: string;
  validatedFiles: string;
  ignoredFiles: string;
  dryRunWarning: string;
  testFiles: string;
  depthSetting: string;
  // Config validation
  configValid: string;
  configNotFound: string;
  usingDefaults: string;
  defaultConfig: string;
  runInit: string;
  ignoredPaths: string;
  globPattern: string;
  notFound: string;
  summary: string;
  maxFilesLabel: string;
  unlimited: string;
  languageLabel: string;
  verboseLabel: string;
  enabled: string;
  disabled: string;
  logFileLabel: string;
  pathsValid: string;
  pathsPatterns: string;
  pathsMissing: string;
  pathsNone: string;
  missingPathsWarning: string;
  // Cleanup
  cleanedAll: string;
  cleanedOld: string;
  filesDeleted: string;
  // Status
  configuration: string;
  gitStatus: string;
  currentBranch: string;
  modifiedFiles: string;
  untrackedFiles: string;
  unknown: string;
  entries: string;
  // Logs
  logExists: string;
  logClean: string;
  path: string;
  size: string;
  bytes: string;
  age: string;
  minutes: string;
  modified: string;
  maxAgeSetting: string;
  hours: string;
  logOlderThanMax: string;
  // Stats
  prefixDistribution: string;
  totalAnalyzed: string;
  withPrefix: string;
  withoutPrefix: string;
  commitsWithoutPrefix: string;
  // Install
  createdHuskyDir: string;
  nextSteps: string;
  installStep1: string;
  installStep2: string;
  installStep3: string;
  // Errors
  unknownCommand: string;
  configError: string;
}

const EN_MESSAGES: Messages = {
  // Core validation messages
  commitBlocked: 'COMMIT BLOCKED - Folder Rule Violation',
  validationPassed: 'Validation passed',
  commitSuccessful: 'Commit successful - logs cleared',
  noFilesStaged: 'No files staged for commit',
  multipleFolder: 'Files from multiple folders detected (depth={depth}):',
  rule: 'RULE: All staged files must be in the same folder path',
  depth: 'DEPTH: {depth} levels',
  solution: 'SOLUTION: Unstage files from other folders or commit them separately',
  quickFixes: 'Quick fixes:',
  unstage: 'Unstage',
  aiSummary: 'AI-Friendly Error Summary:',
  stagedFiles: 'Staged files: {count}',
  requiredDepth: 'Required depth: {depth}',
  multipleFoldersDetected: 'Multiple folders detected: {count}',
  actionRequired: 'Action required: Unstage conflicting files',
  // Commit message validation
  commitMsgBlocked: 'COMMIT BLOCKED - Invalid Commit Message Format',
  commitMsgInvalid: 'Commit message does not follow the required format',
  commitMsgMissingPrefix: 'Missing required prefix (e.g., {examplePrefix}, [root], [config])',
  commitMsgInvalidPrefix: 'Invalid prefix format - must be {depthFormat}',
  commitMsgTooShort: 'Commit message description is too short (minimum {minLength} characters)',
  commitMsgMissingDescription: 'Missing commit message description after prefix',
  commitMsgRule: 'RULE: Commit messages must start with [prefix] followed by a description',
  commitMsgExample: 'EXAMPLE: {examplePrefix} Add new feature',
  commitMsgValidPrefixes: 'VALID PREFIXES: {depthFormat}, [root], [config]',
  commitMsgDepthInfo: 'CONFIGURED DEPTH: {depth} levels (e.g., {examplePrefix})',
  // CLI output messages
  checkPassed: 'PASSED - All files are in the same folder',
  checkFailed: 'FAILED - Folder rule violation',
  commonPath: 'Common path',
  commitPrefix: 'Commit prefix',
  validatedFiles: 'Validated files',
  ignoredFiles: 'Ignored files',
  dryRunWarning: 'This was a dry-run. No actual validation was performed on staged files.',
  testFiles: 'Test files',
  depthSetting: 'Depth setting',
  // Config validation
  configValid: 'Configuration is valid',
  configNotFound: '{file} not found - using defaults',
  usingDefaults: 'using defaults',
  defaultConfig: 'Default configuration',
  runInit: "Run 'precommit init' to create a config file",
  ignoredPaths: 'Ignored paths',
  globPattern: 'glob pattern',
  notFound: 'not found',
  summary: 'Summary',
  maxFilesLabel: 'Max files',
  unlimited: 'unlimited',
  languageLabel: 'Language',
  verboseLabel: 'Verbose',
  enabled: 'enabled',
  disabled: 'disabled',
  logFileLabel: 'Log file',
  pathsValid: '{count} valid',
  pathsPatterns: '{count} patterns',
  pathsMissing: '{count} missing',
  pathsNone: 'none',
  missingPathsWarning: '{count} ignored path(s) do not exist. Consider removing them.',
  // Cleanup
  cleanedAll: 'Cleaned up all log files',
  cleanedOld: 'Cleaned up old log files (>{hours}h)',
  filesDeleted: '{count} file(s) deleted',
  // Status
  configuration: 'Configuration',
  gitStatus: 'Git Status',
  currentBranch: 'Current branch',
  modifiedFiles: 'Modified files',
  untrackedFiles: 'Untracked files',
  unknown: 'unknown',
  entries: 'entries',
  // Logs
  logExists: 'Log file exists',
  logClean: 'No active log file (all clean)',
  path: 'Path',
  size: 'Size',
  bytes: 'bytes',
  age: 'Age',
  minutes: 'minutes',
  modified: 'Modified',
  maxAgeSetting: 'Max age setting',
  hours: 'hours',
  logOlderThanMax: 'Log is older than configured max age',
  // Stats
  prefixDistribution: 'Prefix distribution',
  totalAnalyzed: 'Total analyzed',
  withPrefix: 'With prefix',
  withoutPrefix: 'Without prefix',
  commitsWithoutPrefix: 'Commits without prefix',
  // Install
  createdHuskyDir: 'Created .husky directory',
  nextSteps: 'Next steps',
  installStep1: 'Run "git add ." to stage changes',
  installStep2: 'Create a commit to test the hooks',
  installStep3: 'The hooks will automatically validate your commits',
  // Errors
  unknownCommand: 'Unknown command',
  configError: 'Configuration error',
};

const KO_MESSAGES: Messages = {
  // Core validation messages
  commitBlocked: '커밋 차단 - 폴더 규칙 위반',
  validationPassed: '검증 통과',
  commitSuccessful: '커밋 성공 - 로그 삭제됨',
  noFilesStaged: '커밋할 파일이 없습니다',
  multipleFolder: '여러 폴더의 파일이 감지됨 (depth={depth}):',
  rule: '규칙: 모든 staged 파일은 같은 폴더 경로에 있어야 합니다',
  depth: 'DEPTH: {depth} 레벨',
  solution: '해결방법: 다른 폴더의 파일을 unstage하거나 별도로 커밋하세요',
  quickFixes: '빠른 해결:',
  unstage: 'Unstage',
  aiSummary: 'AI 친화적 에러 요약:',
  stagedFiles: 'Staged 파일: {count}개',
  requiredDepth: '필요 depth: {depth}',
  multipleFoldersDetected: '감지된 폴더 수: {count}',
  actionRequired: '필요한 작업: 충돌하는 파일 unstage',
  // Commit message validation
  commitMsgBlocked: '커밋 차단 - 잘못된 커밋 메시지 형식',
  commitMsgInvalid: '커밋 메시지가 필요한 형식을 따르지 않습니다',
  commitMsgMissingPrefix: '필수 prefix가 없습니다 (예: {examplePrefix}, [root], [config])',
  commitMsgInvalidPrefix: '잘못된 prefix 형식 - {depthFormat} 형식이어야 합니다',
  commitMsgTooShort: '커밋 메시지 설명이 너무 짧습니다 (최소 {minLength}자)',
  commitMsgMissingDescription: 'Prefix 뒤에 커밋 메시지 설명이 없습니다',
  commitMsgRule: '규칙: 커밋 메시지는 [prefix]로 시작하고 설명이 따라와야 합니다',
  commitMsgExample: '예시: {examplePrefix} 새로운 기능 추가',
  commitMsgValidPrefixes: '유효한 PREFIX: {depthFormat}, [root], [config]',
  commitMsgDepthInfo: '설정된 DEPTH: {depth} 레벨 (예: {examplePrefix})',
  // CLI output messages
  checkPassed: '통과 - 모든 파일이 동일한 폴더에 있습니다',
  checkFailed: '실패 - 폴더 규칙 위반',
  commonPath: '공통 경로',
  commitPrefix: '커밋 prefix',
  validatedFiles: '검증된 파일',
  ignoredFiles: '무시된 파일',
  dryRunWarning: '이것은 dry-run입니다. 실제 staged 파일에 대한 검증은 수행되지 않았습니다.',
  testFiles: '테스트 파일',
  depthSetting: 'Depth 설정',
  // Config validation
  configValid: '설정이 유효합니다',
  configNotFound: '{file}을(를) 찾을 수 없음 - 기본값 사용',
  usingDefaults: '기본값 사용',
  defaultConfig: '기본 설정',
  runInit: "'precommit init'을 실행하여 설정 파일을 생성하세요",
  ignoredPaths: '무시 경로',
  globPattern: 'glob 패턴',
  notFound: '찾을 수 없음',
  summary: '요약',
  maxFilesLabel: '최대 파일 수',
  unlimited: '제한 없음',
  languageLabel: '언어',
  verboseLabel: '상세 모드',
  enabled: '활성화',
  disabled: '비활성화',
  logFileLabel: '로그 파일',
  pathsValid: '{count}개 유효',
  pathsPatterns: '{count}개 패턴',
  pathsMissing: '{count}개 누락',
  pathsNone: '없음',
  missingPathsWarning: '{count}개의 무시 경로가 존재하지 않습니다. 제거를 고려해보세요.',
  // Cleanup
  cleanedAll: '모든 로그 파일 정리 완료',
  cleanedOld: '오래된 로그 파일 정리 완료 (>{hours}시간)',
  filesDeleted: '{count}개 파일 삭제됨',
  // Status
  configuration: '설정',
  gitStatus: 'Git 상태',
  currentBranch: '현재 브랜치',
  modifiedFiles: '수정된 파일',
  untrackedFiles: '추적되지 않는 파일',
  unknown: '알 수 없음',
  entries: '개 항목',
  // Logs
  logExists: '로그 파일 존재',
  logClean: '활성 로그 파일 없음 (모두 정리됨)',
  path: '경로',
  size: '크기',
  bytes: '바이트',
  age: '경과 시간',
  minutes: '분',
  modified: '수정일',
  maxAgeSetting: '최대 보관 기간 설정',
  hours: '시간',
  logOlderThanMax: '로그가 설정된 최대 기간보다 오래됨',
  // Stats
  prefixDistribution: 'Prefix 분포',
  totalAnalyzed: '총 분석',
  withPrefix: 'Prefix 있음',
  withoutPrefix: 'Prefix 없음',
  commitsWithoutPrefix: 'Prefix 없는 커밋',
  // Install
  createdHuskyDir: '.husky 디렉토리 생성됨',
  nextSteps: '다음 단계',
  installStep1: '"git add ."를 실행하여 변경사항을 스테이지하세요',
  installStep2: '커밋을 생성하여 훅을 테스트하세요',
  installStep3: '훅이 자동으로 커밋을 검증합니다',
  // Errors
  unknownCommand: '알 수 없는 명령어',
  configError: '설정 오류',
};

const MESSAGES_MAP: Record<Language, Messages> = {
  en: EN_MESSAGES,
  ko: KO_MESSAGES
};

/**
 * Get localized messages for the specified language
 *
 * @param lang - The language code ('en' or 'ko')
 * @returns Messages object with all localized strings
 *
 * @example
 * const messages = getMessages('ko');
 * console.log(messages.validationPassed); // "검증 통과"
 *
 * @example
 * const messages = getMessages('en');
 * console.log(messages.commitBlocked); // "COMMIT BLOCKED - Folder Rule Violation"
 */
export function getMessages(lang: Language = 'en'): Messages {
  return MESSAGES_MAP[lang] || EN_MESSAGES;
}

/**
 * Format a message template with dynamic parameters
 *
 * Replaces placeholders in the format `{key}` with corresponding values
 * from the params object.
 *
 * @param template - Message template with {placeholder} syntax
 * @param params - Object containing replacement values
 * @returns Formatted message string
 *
 * @example
 * formatMessage('Staged files: {count}', { count: 5 });
 * // Returns: "Staged files: 5"
 *
 * @example
 * formatMessage('DEPTH: {depth} levels', { depth: 3 });
 * // Returns: "DEPTH: 3 levels"
 */
export function formatMessage(template: string, params: Record<string, any>): string {
  let result = template;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, String(value));
  });
  return result;
}
