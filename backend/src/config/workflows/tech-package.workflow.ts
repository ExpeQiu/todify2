/**
 * Agent工作流步骤定义
 */
export interface AgentWorkflow {
  agentId: string;
  name: string;
  instruction: string;
  useContext: boolean;        // 是否使用项目上下文
  usePreviousOutput: boolean; // 是否使用前一个Agent的输出
}

/**
 * 技术包装场景工作流
 */
export const techPackageWorkflow: AgentWorkflow[] = [
  {
    agentId: 'tech-highlighter',
    name: '技术亮点提取',
    instruction: '分析技术资料，提取核心亮点和创新点',
    useContext: true,
    usePreviousOutput: false
  },
  {
    agentId: 'value-analyzer',
    name: '价值分析',
    instruction: '分析技术的商业价值、用户价值和竞争优势',
    useContext: true,
    usePreviousOutput: true
  },
  {
    agentId: 'package-writer',
    name: '包装内容撰写',
    instruction: '基于亮点和价值分析，撰写吸引人的技术包装内容',
    useContext: true,
    usePreviousOutput: true
  },
  {
    agentId: 'quality-checker',
    name: '质量检查',
    instruction: '检查内容完整性、吸引力和准确性',
    useContext: false,
    usePreviousOutput: true
  }
];

