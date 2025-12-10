import { describe, it, expect } from 'vitest';
import { LangGraphEngine } from '@/services/workflow/langgraph/LangGraphEngine';

// 使用简化的执行记录模型替代真实数据库交互（由模型内部处理）
describe('LangGraphEngine', () => {
  it('executes input -> output workflow', async () => {
    const engine = new LangGraphEngine();
    const workflow = {
      id: 'wf_test',
      name: 'Test WF',
      nodes: JSON.stringify([
        { id: 'n1', type: 'input', data: { inputs: [{ name: 'query', required: true }] } },
        { id: 'n2', type: 'output', data: { outputs: [{ name: 'out', sourceNodeId: 'n1' }] } },
      ]),
      edges: JSON.stringify([{ id: 'e1', source: 'n1', target: 'n2' }]),
    } as any;
    const res = await engine.execute(workflow, { input: { query: 'hello' } });
    expect(res.message).toBeTruthy();
    expect(res.data?.outputs?.text || res.data?.outputs?.answer).toBeDefined();
  });
});
