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
}

