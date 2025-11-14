import React from 'react';

import type { WorkflowStep } from '@/features/workflow/model/workflowStore';

interface StepSidebarProps {
  title?: string;
  description?: string;
  steps: WorkflowStep[];
  currentStep: number;
  progress: number;
  onStepClick: (stepId: number) => void;
}

export const StepSidebar: React.FC<StepSidebarProps> = ({
  title = '智能工作流',
  description = '通过五个步骤完成从搜索到演讲稿的完整流程',
  steps,
  currentStep,
  progress,
  onStepClick,
}) => {
  return (
    <div className="workflow-sidebar">
      <div className="workflow-header">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>

      <div className="workflow-steps">
        <div className="progress-header">
          <span>工作流步骤</span>
          <span className="progress-text">{progress}%</span>
        </div>

        {steps.map((step) => (
          <div
            key={step.id}
            className={`workflow-step ${currentStep === step.id ? 'active' : ''} ${step.status}`}
            onClick={() => onStepClick(step.id)}
          >
            <div className="step-icon">
              <step.icon size={20} />
            </div>
            <div className="step-content">
              <div className="step-title">{step.title}</div>
              <div className="step-description">{step.description}</div>
            </div>
            {step.status === 'completed' && (
              <div className="step-status completed">✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
