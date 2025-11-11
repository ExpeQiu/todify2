import { useCallback } from 'react';

import { useWorkflowStore } from '@/features/workflow/model/workflowStore';

export const useWorkflowChat = () => {
  const {
    chatMessages,
    setChatMessages,
    setInputMessage,
    setConversationId,
    setProcessError,
  } = useWorkflowStore((state) => ({
    chatMessages: state.chatMessages,
    setChatMessages: state.setChatMessages,
    setInputMessage: state.setInputMessage,
    setConversationId: state.setConversationId,
    setProcessError: state.setProcessError,
  }));

  const resetConversation = useCallback(() => {
    setChatMessages([
      {
        id: '1',
        type: 'assistant',
        content:
          '你好！我是智能助手，请输入您的问题或需求，我将为您提供专业的技术分析和内容生成服务。',
        timestamp: new Date(),
      },
    ]);
    setInputMessage('');
    setConversationId('');
    setProcessError(null);
  }, [setChatMessages, setInputMessage, setConversationId, setProcessError]);

  const addUserMessage = useCallback(
    (content: string) => {
      const message = {
        id: `user-${Date.now()}`,
        type: 'user' as const,
        content,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, message]);
    },
    [setChatMessages],
  );

  const addAssistantMessage = useCallback(
    (partial: Partial<(typeof chatMessages)[number]> & { content: string }) => {
      const message = {
        id: partial.id ?? `assistant-${Date.now()}`,
        type: 'assistant' as const,
        timestamp: new Date(),
        liked: false,
        disliked: false,
        adopted: false,
        isRegenerating: false,
        ...partial,
      };
      setChatMessages((prev) => [...prev, message]);
    },
    [setChatMessages],
  );

  const updateMessageById = useCallback(
    (messageId: string, updater: (message: (typeof chatMessages)[number]) => void) => {
      setChatMessages((prev) =>
        prev.map((message) => {
          if (message.id !== messageId) {
            return message;
          }
          const updated = { ...message };
          updater(updated);
          return updated;
        }),
      );
    },
    [setChatMessages],
  );

  const removeMessageById = useCallback(
    (messageId: string) => {
      setChatMessages((prev) => prev.filter((message) => message.id !== messageId));
    },
    [setChatMessages],
  );

  return {
    chatMessages,
    resetConversation,
    addUserMessage,
    addAssistantMessage,
    updateMessageById,
    removeMessageById,
    setChatMessages,
  };
};
