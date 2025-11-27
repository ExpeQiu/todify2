export interface MessageView {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: any[];
  outputs: Record<string, any>;
  createdAt: Date;
}

export interface ConversationDetailView {
  id: string;
  title: string;
  sources: any[];
  messages: MessageView[];
  createdAt: Date;
  updatedAt: Date;
  hasMoreMessages?: boolean;
  nextCursor?: string;
  difyConversationId?: string; // Dify返回的conversation_id，用于多轮对话
}

