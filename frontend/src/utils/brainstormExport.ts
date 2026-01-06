import { BrainstormSession, BrainstormMessage, BrainstormParticipant } from '@/types/brainstorm';

/**
 * 导出讨论记录为 Markdown
 */
export function exportToMarkdown(
  session: BrainstormSession,
  messages: BrainstormMessage[],
  participants?: BrainstormParticipant[]
): string {
  let content = `# ${session.title}\n\n`;
  content += `**讨论话题**: ${session.topic}\n\n`;
  
  if (session.description) {
    content += `**话题描述**: ${session.description}\n\n`;
  }

  if (participants && participants.length > 0) {
    content += `**参与专家**: ${participants.map(p => p.displayName || p.aiRole?.name || '专家').join('、')}\n\n`;
  }

  content += `---\n\n`;

  // 按轮次分组
  const messagesByRound = new Map<number, BrainstormMessage[]>();
  messages.forEach(msg => {
    if (!messagesByRound.has(msg.roundNumber)) {
      messagesByRound.set(msg.roundNumber, []);
    }
    messagesByRound.get(msg.roundNumber)!.push(msg);
  });

  const sortedRounds = Array.from(messagesByRound.keys()).sort((a, b) => a - b);

  for (const round of sortedRounds) {
    content += `## 第 ${round} 轮讨论\n\n`;
    const roundMessages = messagesByRound.get(round)!;

    for (const msg of roundMessages) {
      const isUser = msg.messageType === 'user' || msg.participantId === null;
      const participant = participants?.find(p => p.id === msg.participantId);
      const name = isUser ? '我' : (participant?.displayName || participant?.aiRole?.name || '未知专家');

      content += `### ${name}\n\n`;
      content += `${msg.content}\n\n`;
      content += `*${new Date(msg.createdAt).toLocaleString('zh-CN')}*\n\n`;
    }
  }

  if (session.summary) {
    content += `---\n\n`;
    content += `## 讨论总结\n\n`;
    content += `${session.summary}\n\n`;
  }

  return content;
}

/**
 * 导出讨论记录为纯文本
 */
export function exportToText(
  session: BrainstormSession,
  messages: BrainstormMessage[],
  participants?: BrainstormParticipant[]
): string {
  let content = `${session.title}\n`;
  content += `${'='.repeat(session.title.length)}\n\n`;
  content += `讨论话题: ${session.topic}\n`;
  
  if (session.description) {
    content += `话题描述: ${session.description}\n`;
  }

  if (participants && participants.length > 0) {
    content += `参与专家: ${participants.map(p => p.displayName || p.aiRole?.name || '专家').join('、')}\n`;
  }

  content += `\n${'-'.repeat(50)}\n\n`;

  // 按轮次分组
  const messagesByRound = new Map<number, BrainstormMessage[]>();
  messages.forEach(msg => {
    if (!messagesByRound.has(msg.roundNumber)) {
      messagesByRound.set(msg.roundNumber, []);
    }
    messagesByRound.get(msg.roundNumber)!.push(msg);
  });

  const sortedRounds = Array.from(messagesByRound.keys()).sort((a, b) => a - b);

  for (const round of sortedRounds) {
    content += `第 ${round} 轮讨论\n`;
    content += `${'-'.repeat(20)}\n\n`;
    const roundMessages = messagesByRound.get(round)!;

    for (const msg of roundMessages) {
      const isUser = msg.messageType === 'user' || msg.participantId === null;
      const participant = participants?.find(p => p.id === msg.participantId);
      const name = isUser ? '我' : (participant?.displayName || participant?.aiRole?.name || '未知专家');

      content += `${name}:\n`;
      content += `${msg.content}\n\n`;
      content += `[${new Date(msg.createdAt).toLocaleString('zh-CN')}]\n\n`;
    }
  }

  if (session.summary) {
    content += `${'-'.repeat(50)}\n\n`;
    content += `讨论总结\n`;
    content += `${'-'.repeat(20)}\n\n`;
    content += `${session.summary}\n\n`;
  }

  return content;
}

/**
 * 导出讨论记录
 */
export function exportDiscussion(
  session: BrainstormSession,
  messages: BrainstormMessage[],
  participants: BrainstormParticipant[] | undefined,
  format: 'txt' | 'md' = 'md'
): void {
  let content: string;
  let mimeType: string;
  let extension: string;

  if (format === 'md') {
    content = exportToMarkdown(session, messages, participants);
    mimeType = 'text/markdown;charset=utf-8';
    extension = 'md';
  } else {
    content = exportToText(session, messages, participants);
    mimeType = 'text/plain;charset=utf-8';
    extension = 'txt';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${session.title}_讨论记录_${new Date().toISOString().split('T')[0]}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

