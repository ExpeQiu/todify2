import { AgentWorkflow } from './tech-package.workflow';

/**
 * 技术通稿场景工作流
 */
export const techArticleWorkflow: AgentWorkflow[] = [
  {
    agentId: 'info-collector',
    name: '信息收集',
    instruction: '整理技术信息、市场背景、应用案例',
    useContext: true,
    usePreviousOutput: false
  },
  {
    agentId: 'news-writer',
    name: '新闻稿撰写',
    instruction: '按照新闻稿格式撰写初稿，注重新闻性',
    useContext: true,
    usePreviousOutput: true
  },
  {
    agentId: 'editor',
    name: '编辑润色',
    instruction: '优化文章结构、语言和可读性',
    useContext: false,
    usePreviousOutput: true
  },
  {
    agentId: 'format-checker',
    name: '格式检查',
    instruction: '检查格式规范、字数和排版',
    useContext: false,
    usePreviousOutput: true
  }
];

