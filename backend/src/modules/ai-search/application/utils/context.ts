export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string | Date;
  outputs?: Record<string, any>;
}

export interface ConversationContextOptions {
  historyLimit?: number;
}

const DEFAULT_HISTORY_LIMIT = 12;
const MAX_HISTORY_LIMIT = 100;
const SUMMARY_MESSAGE_COUNT = 6;
const KEY_PHRASE_LIMIT = 8;

const stripWhitespace = (text: string) =>
  text.replace(/\s+/g, ' ').replace(/\u3000/g, ' ').trim();

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength)}…`;
};

const pickHistoryWindow = (messages: ConversationMessage[], limit?: number) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [];
  }

  if (limit === undefined || limit === null) {
    limit = DEFAULT_HISTORY_LIMIT;
  }

  if (limit <= 0) {
    return messages.slice(-MAX_HISTORY_LIMIT);
  }

  return messages.slice(-Math.min(limit, MAX_HISTORY_LIMIT));
};

const extractKeyPhrases = (messages: ConversationMessage[]) => {
  const latestUser = [...messages]
    .reverse()
    .find((m) => m.role === 'user');

  if (!latestUser) {
    return [];
  }

  const content = stripWhitespace(latestUser.content || '');
  if (!content) {
    return [];
  }

  const separators = /[，,。.;；：:？?！!、\n\r]+/;
  const segments = content
    .split(separators)
    .map((segment) => stripWhitespace(segment))
    .filter((segment) => segment.length > 0);

  const keywords = new Set<string>();

  for (const segment of segments) {
    if (segment.length >= 4) {
      keywords.add(truncateText(segment, 36));
    }
    if (keywords.size >= KEY_PHRASE_LIMIT) {
      break;
    }
  }

  if (keywords.size === 0) {
    keywords.add(truncateText(content, 48));
  }

  return Array.from(keywords);
};

const buildConversationSummary = (messages: ConversationMessage[]) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    return '';
  }

  const recentMessages = messages.slice(-SUMMARY_MESSAGE_COUNT);
  const summaryLines = recentMessages.map((msg) => {
    const roleLabel = msg.role === 'assistant' ? 'AI' : '用户';
    return `${roleLabel}: ${truncateText(stripWhitespace(msg.content || ''), 180)}`;
  });

  return summaryLines.join('\n');
};

export interface ConversationContextResult {
  summary: string;
  keyPhrases: string[];
  history: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
    hasOutputs: boolean;
  }>;
  historySize: number;
  historyLimit: number;
}

export const buildConversationContext = (
  messages: ConversationMessage[] = [],
  options?: ConversationContextOptions
): ConversationContextResult => {
  const historyLimit = options?.historyLimit ?? DEFAULT_HISTORY_LIMIT;
  const effectiveHistory = pickHistoryWindow(messages, historyLimit);

  return {
    summary: buildConversationSummary(effectiveHistory),
    keyPhrases: extractKeyPhrases(effectiveHistory),
    history: effectiveHistory.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt instanceof Date ? msg.createdAt.toISOString() : msg.createdAt,
      hasOutputs: Boolean(msg.outputs && Object.keys(msg.outputs).length > 0),
    })),
    historySize: effectiveHistory.length,
    historyLimit: historyLimit <= 0 ? 0 : Math.min(historyLimit, MAX_HISTORY_LIMIT),
  };
};


