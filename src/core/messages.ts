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
}

const EN_MESSAGES: Messages = {
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
  commitMsgDepthInfo: 'CONFIGURED DEPTH: {depth} levels (e.g., {examplePrefix})'
};

const KO_MESSAGES: Messages = {
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
  commitMsgDepthInfo: '설정된 DEPTH: {depth} 레벨 (예: {examplePrefix})'
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
