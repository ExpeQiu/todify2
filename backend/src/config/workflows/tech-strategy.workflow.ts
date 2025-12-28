import { AgentWorkflow } from './tech-package.workflow';

/**
 * 技术策略场景工作流
 */
export const techStrategyWorkflow: AgentWorkflow[] = [
  {
    agentId: 'tech-analyzer',
    name: '技术分析',
    instruction: '分析技术特点、创新点、竞争优势',
    useContext: true,
    usePreviousOutput: false
  },
  {
    agentId: 'market-analyzer',
    name: '市场分析',
    instruction: '分析市场环境、目标客户、竞争态势',
    useContext: true,
    usePreviousOutput: true
  },
  {
    agentId: 'strategy-planner',
    name: '策略规划',
    instruction: '制定传播策略、定位策略、核心信息',
    useContext: true,
    usePreviousOutput: true
  },
  {
    agentId: 'strategy-writer',
    name: '策略文档撰写',
    instruction: '撰写完整的技术策略文档',
    useContext: true,
    usePreviousOutput: true
  },
  {
    agentId: 'quality-checker',
    name: '质量检查',
    instruction: '检查策略的完整性、可行性和逻辑性',
    useContext: false,
    usePreviousOutput: true
  }
];

