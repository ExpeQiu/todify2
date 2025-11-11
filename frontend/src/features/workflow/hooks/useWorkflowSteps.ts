import { useCallback, useMemo } from 'react';

import type { WorkflowStep } from '@/features/workflow/model/types';
import { useWorkflowStore } from '@/features/workflow/model/workflowStore';

interface UseWorkflowStepsOptions {
  onStepActivated?: (step: WorkflowStep, stepIndex: number) => void;
}

export const useWorkflowSteps = (options: UseWorkflowStepsOptions = {}) => {
  const { steps, setSteps, currentStep, setCurrentStep, isProcessing } = useWorkflowStore((state) => ({
    steps: state.steps,
    setSteps: state.setSteps,
    currentStep: state.currentStep,
    setCurrentStep: state.setCurrentStep,
    isProcessing: state.isProcessing,
  }));

  const progress = useMemo(() => {
    const completed = steps.filter((step) => step.status === 'completed').length;
    const activeBonus = steps.some((step) => step.status === 'active' && step.id === currentStep) ? 0.5 : 0;
    return Math.round(((completed + activeBonus) / steps.length) * 100);
  }, [steps, currentStep]);

  const activateStep = useCallback(
    (targetStep: number) => {
      if (targetStep < 0 || targetStep >= steps.length) {
        return;
      }

      const nextSteps = steps.map((step, index) => {
        let status = step.status;
        if (index < targetStep) {
          status = 'completed';
        } else if (index === targetStep) {
          status = 'active';
        } else {
          status = 'pending';
        }

        const description =
          status === 'completed' ? '已完成' : status === 'active' ? '进行中' : '未开始';

        return {
          ...step,
          status,
          description,
        } as WorkflowStep;
      });

      setSteps(nextSteps);
      setCurrentStep(targetStep);

      if (options.onStepActivated) {
        options.onStepActivated(nextSteps[targetStep], targetStep);
      }
    },
    [options, setCurrentStep, setSteps, steps],
  );

  const goToStep = useCallback(
    (stepId: number) => {
      if (isProcessing) {
        return;
      }
      activateStep(stepId);
    },
    [activateStep, isProcessing],
  );

  const goPrevStep = useCallback(() => {
    if (isProcessing || currentStep === 0) {
      return;
    }
    activateStep(currentStep - 1);
  }, [activateStep, currentStep, isProcessing]);

  const goNextStep = useCallback(() => {
    if (isProcessing || currentStep >= steps.length - 1) {
      return;
    }
    activateStep(currentStep + 1);
  }, [activateStep, currentStep, isProcessing, steps.length]);

  return {
    steps,
    currentStep,
    progress,
    goToStep,
    goPrevStep,
    goNextStep,
  };
};
