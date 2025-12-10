import React from 'react';
import TopNavigation from '../components/TopNavigation';

const AgentWorkflowGuidePage: React.FC = () => {
  return (
    <div className="agent-workflow-guide-page">
      <TopNavigation />
      <div className="guide-container">
        <h1 className="guide-title">Agent 工作流创建指南</h1>

        <section className="guide-section">
          <h2 className="section-title">快速开始</h2>
          <ol className="steps">
            <li>进入 <code>/agent-workflow</code> 页面，点击“添加节点”选择需要的节点</li>
            <li>为 <code>Input</code> 节点配置参数，如 <code>query</code> 等必填项</li>
            <li>添加 <code>Agent</code> 节点，并在节点配置中选择已启用的 AI 角色</li>
            <li>添加 <code>Output</code> 节点，从上游节点输出中选择需要的字段</li>
            <li>点击“保存”，然后“运行”进行一次完整执行</li>
          </ol>
        </section>

        <section className="guide-section">
          <h2 className="section-title">节点类型概览</h2>
          <div className="grid">
            <div className="card"><div className="card-title">Input</div><div className="card-desc">定义工作流输入参数，支持必填、默认值与文件类型</div></div>
            <div className="card"><div className="card-title">Agent</div><div className="card-desc">调用已配置的 AI 角色（Dify 连接），支持 chatflow/workflow 模式</div></div>
            <div className="card"><div className="card-title">Output</div><div className="card-desc">聚合并输出最终结果，可从上游节点选择具体字段</div></div>
            <div className="card"><div className="card-title">Condition</div><div className="card-desc">基于表达式或比较操作符进行条件分支</div></div>
            <div className="card"><div className="card-title">Assign</div><div className="card-desc">写入或更新共享上下文的变量，支持表达式</div></div>
            <div className="card"><div className="card-title">Transform</div><div className="card-desc">对数据进行解析、格式化或 JSON 路径提取</div></div>
            <div className="card"><div className="card-title">Merge</div><div className="card-desc">收敛多路上游数据，支持 override/merge/append/concat</div></div>
            <div className="card"><div className="card-title">Memory</div><div className="card-desc">暂存与编辑文本，后续可扩展为持久化记忆</div></div>
          </div>
        </section>

        <section className="guide-section">
          <h2 className="section-title">编排模式</h2>
          <ul className="bullets">
            <li><b>Native</b>：现有 DAG 执行，支持 Input/Agent/Output</li>
            <li><b>LangGraph</b>：图模式执行，支持更多逻辑节点与条件边</li>
          </ul>
          <p className="note">在“设置”中选择编排模式；状态栏显示当前引擎；运行将按所选模式执行。</p>
        </section>

        <section className="guide-section">
          <h2 className="section-title">编译检查</h2>
          <ul className="bullets">
            <li>点击状态栏“编译”按钮进行校验</li>
            <li>检查项：节点存在性、起始节点、环检测、边源/目标合法性</li>
            <li>修复错误后再次编译，确保通过后再运行</li>
          </ul>
        </section>

        <section className="guide-section">
          <h2 className="section-title">最佳实践</h2>
          <ul className="bullets">
            <li>优先从 Output 节点指定字段输出，避免不确定的自动提取</li>
            <li>在 Assign/Transform 中使用清晰的字段路径与表达式</li>
            <li>为关键 Agent 配置明确输入来源（静态值或上游输出）</li>
            <li>复杂分支使用 Condition 节点与条件边结合，保证可读性</li>
          </ul>
        </section>

        <div className="cta">
          <a href="/agent-workflow" className="cta-button">返回工作流编辑</a>
        </div>
      </div>

      <style>{`
        .agent-workflow-guide-page { width: 100%; min-height: 100vh; background: #f9fafb; }
        .guide-container { max-width: 980px; margin: 0 auto; padding: 24px; }
        .guide-title { font-size: 24px; font-weight: 700; color: #111827; margin: 16px 0 24px; }
        .guide-section { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
        .section-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 12px; }
        .steps { margin: 0; padding-left: 18px; color: #374151; line-height: 1.7; }
        .steps li { margin-bottom: 6px; }
        .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; background: #fafafa; }
        .card-title { font-weight: 600; color: #111827; margin-bottom: 6px; }
        .card-desc { font-size: 13px; color: #6b7280; }
        .bullets { margin: 0; padding-left: 18px; color: #374151; line-height: 1.7; }
        .bullets li { margin-bottom: 6px; }
        .note { font-size: 13px; color: #6b7280; margin-top: 8px; }
        .cta { display: flex; justify-content: flex-end; margin-top: 12px; }
        .cta-button { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 8px; background: #3b82f6; color: #fff; text-decoration: none; }
        .cta-button:hover { background: #2563eb; }
        code { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 1px 6px; }
        @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default AgentWorkflowGuidePage;

