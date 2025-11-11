import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { WorkflowStep } from '@/features/workflow/model/workflowStore';

interface BottomNavigationProps {
  currentStep: number;
  steps: WorkflowStep[];
  isProcessing: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentStep,
  steps,
  isProcessing,
  onPrev,
  onNext,
}) => {
  const atFirstStep = currentStep === 0;
  const atLastStep = currentStep === steps.length - 1;

  return (
    <div className="bottom-navigation">
      <button
        className="nav-button nav-button-left"
        onClick={onPrev}
        disabled={atFirstStep || isProcessing}
      >
        <ChevronLeft size={20} />
        <span>
          {currentStep > 0
            ? `上一步：${steps[currentStep - 1]?.title ?? ''}`
            : '上一步'}
        </span>
      </button>

      <button
        className="nav-button nav-button-right"
        onClick={onNext}
        disabled={atLastStep || isProcessing}
      >
        {isProcessing ? (
          <>
            <div className="loading-spinner" />
            <span>处理中...</span>
          </>
        ) : (
          <>
            <span>
              {currentStep < steps.length - 1
                ? `下一步：${steps[currentStep + 1]?.title ?? ''}`
                : '下一步'}
            </span>
            <ChevronRight size={20} />
          </>
        )}
      </button>
    </div>
  );
};
