import { describe, it, expect } from 'vitest';
import { WorkflowLangGraphAdapter } from '@/services/workflow/langgraph/WorkflowLangGraphAdapter';

describe('WorkflowLangGraphAdapter', () => {
  it('validates basic workflow without errors', () => {
    const nodes = [
      { id: 'n1', type: 'input', data: { inputs: [{ name: 'query' }] } },
      { id: 'n2', type: 'output', data: { outputs: [{ name: 'out' }] } },
    ];
    const edges = [{ id: 'e1', source: 'n1', target: 'n2' }];
    const adapted = WorkflowLangGraphAdapter.adapt(nodes as any, edges as any);
    const res = WorkflowLangGraphAdapter.validate(adapted);
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('detects missing source/target', () => {
    const nodes = [{ id: 'n1', type: 'input', data: {} }];
    const edges = [{ id: 'e1', source: 'n1', target: 'n2' }];
    const adapted = WorkflowLangGraphAdapter.adapt(nodes as any, edges as any);
    const res = WorkflowLangGraphAdapter.validate(adapted);
    expect(res.isValid).toBe(false);
    expect(res.errors.some(e => e.includes('目标'))).toBe(true);
  });
});
