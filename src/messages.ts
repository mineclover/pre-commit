export type Language = 'en' | 'ko';

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
  actionRequired: 'Action required: Unstage conflicting files'
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
  actionRequired: '필요한 작업: 충돌하는 파일 unstage'
};

const MESSAGES_MAP: Record<Language, Messages> = {
  en: EN_MESSAGES,
  ko: KO_MESSAGES
};

export function getMessages(lang: Language = 'en'): Messages {
  return MESSAGES_MAP[lang] || EN_MESSAGES;
}

export function formatMessage(template: string, params: Record<string, any>): string {
  let result = template;
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, String(value));
  });
  return result;
}
