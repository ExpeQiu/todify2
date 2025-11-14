import React from 'react';
import ReactMarkdown from 'react-markdown';
import { CheckCircle, Check, Copy, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';

import type { ChatMessage } from '@/features/workflow/model/workflowStore';

interface ChatMessagesProps {
  messages: ChatMessage[];
  isTyping: boolean;
  processError: string | null;
  onAdopt: (messageId: string) => void;
  onCopy: (content: string) => void;
  onRegenerate: (messageId: string) => void;
  onLike: (messageId: string) => void;
  onDislike: (messageId: string) => void;
  onCloseError: () => void;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  isTyping,
  processError,
  onAdopt,
  onCopy,
  onRegenerate,
  onLike,
  onDislike,
  onCloseError,
}) => (
  <div className="chat-messages">
    {messages.length === 0 ? (
      <div className="chat-welcome">
        <div className="welcome-content">
          <h3>您在忙什么？</h3>
          <p>我是您的AI助手，可以帮助您完成智能工作流的各个步骤</p>
        </div>
      </div>
    ) : (
      messages.map((message) => (
        <div key={message.id} className={`message ${message.type} group`}>
          <div className="message-content">
            <div className="markdown-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
            <div className="message-footer">
              <span className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </span>

              {message.type === 'assistant' && (
                <div className="message-actions">
                  <button
                    onClick={() => onAdopt(message.id)}
                    className={`action-btn adopt-btn ${message.adopted ? 'adopted' : ''}`}
                    title={message.adopted ? '已采纳' : '采纳此消息'}
                  >
                    {message.adopted ? <CheckCircle size={18} /> : <Check size={18} />}
                  </button>

                  <button
                    onClick={() => onCopy(message.content)}
                    className="action-btn copy-btn"
                    title="复制消息"
                  >
                    <Copy size={18} />
                  </button>

                  <button
                    onClick={() => onRegenerate(message.id)}
                    disabled={message.isRegenerating}
                    className="action-btn regenerate-btn disabled:opacity-50"
                    title="重新生成"
                  >
                    <RotateCcw size={18} className={message.isRegenerating ? 'animate-spin' : ''} />
                  </button>

                  <button
                    onClick={() => onLike(message.id)}
                    className={`action-btn like-btn ${message.liked ? 'liked' : ''}`}
                    title="点赞"
                  >
                    <ThumbsUp size={18} />
                  </button>

                  <button
                    onClick={() => onDislike(message.id)}
                    className={`action-btn dislike-btn ${message.disliked ? 'disliked' : ''}`}
                    title="点踩"
                  >
                    <ThumbsDown size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))
    )}

    {isTyping && (
      <div className="message assistant">
        <div className="message-content">
          <div className="typing-indicator">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    )}

    {processError && (
      <div className="error-message">
        <span>⚠️ {processError}</span>
        <button className="error-close" onClick={onCloseError}>
          ×
        </button>
      </div>
    )}
  </div>
);
