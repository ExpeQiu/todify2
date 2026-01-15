import React, { useEffect, useRef, useMemo } from 'react';
import { BrainstormMessage, BrainstormParticipant } from '@/types/brainstorm';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '@/styles/markdown.css';

interface BrainstormMessageListProps {
  messages: BrainstormMessage[];
  participants?: BrainstormParticipant[];
  autoScroll?: boolean;
}

export const BrainstormMessageList: React.FC<BrainstormMessageListProps> = ({
  messages,
  participants = [],
  autoScroll = true,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const prevLastMessageIdRef = useRef<string | null>(null);

  // 使用 useMemo 缓存按轮次分组的结果，避免每次渲染都重新计算
  const messagesByRound = useMemo(() => {
    const map = new Map<number, BrainstormMessage[]>();
    messages.forEach((msg) => {
      if (!map.has(msg.roundNumber)) {
        map.set(msg.roundNumber, []);
      }
      map.get(msg.roundNumber)!.push(msg);
    });
    return map;
  }, [messages]);

  // 只在有新消息时滚动，避免轮询导致的频繁滚动
  useEffect(() => {
    if (!autoScroll || messages.length === 0) return;
    
    const currentLastMessageId = messages[messages.length - 1]?.id || null;
    const hasNewMessages = 
      messages.length > prevMessageCountRef.current || 
      currentLastMessageId !== prevLastMessageIdRef.current;
    
    if (hasNewMessages) {
      // 延迟滚动，等待 DOM 更新
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      });
      prevMessageCountRef.current = messages.length;
      prevLastMessageIdRef.current = currentLastMessageId;
    }
  }, [messages, autoScroll]);

  const getParticipant = (participantId: number): BrainstormParticipant | undefined => {
    return participants.find((p) => p.id === participantId);
  };

  const getParticipantName = (message: BrainstormMessage): string => {
    const participant = getParticipant(message.participantId);
    return (
      participant?.displayName ||
      participant?.aiRole?.name ||
      message.participant?.displayName ||
      message.participant?.aiRole?.name ||
      '未知专家'
    );
  };

  const getParticipantAvatar = (message: BrainstormMessage): string | undefined => {
    const participant = getParticipant(message.participantId);
    return participant?.aiRole?.avatar || message.participant?.aiRole?.avatar;
  };

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>讨论尚未开始</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(messagesByRound.keys())
        .sort((a, b) => a - b)
        .map((roundNumber) => {
          const roundMessages = messagesByRound.get(roundNumber)!;
          return (
            <div key={roundNumber} className="space-y-4">
              {/* 轮次标题 */}
              <div className="flex items-center space-x-2 text-sm text-gray-500 font-medium">
                <div className="flex-1 border-t border-gray-200"></div>
                <span>第 {roundNumber} 轮讨论</span>
                <div className="flex-1 border-t border-gray-200"></div>
              </div>

              {/* 该轮次的消息 */}
              <div className="space-y-3">
                {roundMessages.map((message) => {
                  const isUserMessage = message.messageType === 'user' || message.participantId === null;
                  const participantName = isUserMessage ? '我' : getParticipantName(message);
                  const avatar = isUserMessage ? undefined : getParticipantAvatar(message);
                  const hasError = message.metadata?.error;

                  return (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-2.5 p-3 rounded-lg ${
                        hasError ? 'bg-red-50 border border-red-200' : 
                        isUserMessage ? 'bg-green-50 border border-green-200' : 
                        'bg-white border border-gray-200'
                      }`}
                    >
                      {/* 头像 */}
                      <div className="flex-shrink-0">
                        {isUserMessage ? (
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-green-600" />
                          </div>
                        ) : avatar ? (
                          <img
                            src={avatar}
                            alt={participantName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                      </div>

                      {/* 消息内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{participantName}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.createdAt).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div
                          className={`brainstorm-message-content ${
                            hasError ? 'text-red-700' : ''
                          }`}
                        >
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        {message.metadata?.error && (
                          <div className="mt-1.5 text-xs text-red-600">
                            错误: {message.metadata.error}
                          </div>
                        )}
                        {message.metadata?.totalTokens && (
                          <div className="mt-1.5 text-xs text-gray-400">
                            Token: {message.metadata.totalTokens}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      <div ref={messagesEndRef} />
    </div>
  );
};

