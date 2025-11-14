import { useCallback, useMemo } from 'react';

import { useWorkflowStore } from '@/features/workflow/model/workflowStore';

export const previewStepIds = [1, 2, 3, 4];

export const useWorkflowEditor = () => {
  const {
    currentStep,
    editorContent,
    setEditorContent,
    editingStates,
    setEditingStates,
    autoSaveTimer,
    setAutoSaveTimer,
    stepData,
    setStepData,
    steps,
  } = useWorkflowStore((state) => ({
    currentStep: state.currentStep,
    editorContent: state.editorContent,
    setEditorContent: state.setEditorContent,
    editingStates: state.editingStates,
    setEditingStates: state.setEditingStates,
    autoSaveTimer: state.autoSaveTimer,
    setAutoSaveTimer: state.setAutoSaveTimer,
    stepData: state.stepData,
    setStepData: state.setStepData,
    steps: state.steps,
  }));

  const currentStepKey = steps[currentStep]?.key;

  const isEditing = useMemo(() => {
    if (previewStepIds.includes(currentStep)) {
      return Boolean(editingStates[currentStep]);
    }
    return true;
  }, [currentStep, editingStates]);

  const toggleEditingMode = useCallback(() => {
    if (!previewStepIds.includes(currentStep)) {
      return;
    }
    setEditingStates((prev) => ({
      ...prev,
      [currentStep]: !prev[currentStep],
    }));
  }, [currentStep, setEditingStates]);

  const updateStepContentState = useCallback(
    (nextContent: string) => {
      if (!currentStepKey) {
        return;
      }

      const contentKeyMap: Record<string, string> = {
        techPackage: 'techPackageContent',
        techStrategy: 'techStrategyContent',
        coreDraft: 'coreDraftContent',
        speechGeneration: 'speechGenerationContent',
      };

      const targetKey = contentKeyMap[currentStepKey];

      if (!targetKey) {
        return;
      }

      setStepData((prev) => {
        if (prev[targetKey] === nextContent) {
          return prev;
        }

        return {
          ...prev,
          [targetKey]: nextContent,
        };
      });
    },
    [currentStepKey, setStepData],
  );

  const setEditorContentAndScheduleSave = useCallback(
    (nextContent: string) => {
      setEditorContent(nextContent);

      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer as unknown as number);
      }

      const timer = setTimeout(() => {
        updateStepContentState(nextContent);
      }, 3000);

      setAutoSaveTimer(timer as unknown as ReturnType<typeof setTimeout>);
    },
    [autoSaveTimer, setAutoSaveTimer, setEditorContent, updateStepContentState],
  );

  const setEditorContentDirect = useCallback(
    (nextContent: string) => {
      setEditorContent(nextContent);

      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer as unknown as number);
        setAutoSaveTimer(null);
      }

      updateStepContentState(nextContent);
    },
    [autoSaveTimer, setAutoSaveTimer, setEditorContent, updateStepContentState],
  );

  const loadContentForStep = useCallback(() => {
    if (!currentStepKey) {
      return '';
    }

    if (currentStepKey === 'techPackage' && stepData.techPackageContent) {
      return stepData.techPackageContent;
    }
    if (currentStepKey === 'techStrategy' && stepData.techStrategyContent) {
      return stepData.techStrategyContent;
    }
    if (currentStepKey === 'coreDraft' && stepData.coreDraftContent) {
      return stepData.coreDraftContent;
    }
    if (currentStepKey === 'speechGeneration' && stepData.speechGenerationContent) {
      return stepData.speechGenerationContent;
    }

    const fallback = stepData[currentStepKey];
    if (typeof fallback === 'string') {
      return fallback;
    }

    if (fallback && typeof fallback === 'object') {
      return (
        fallback.data?.outputs?.text1 ||
        fallback.data?.outputs?.text2 ||
        fallback.data?.outputs?.text3 ||
        fallback.data?.outputs?.answer ||
        fallback.result ||
        fallback.content ||
        ''
      );
    }

    return '';
  }, [currentStepKey, stepData]);

  return {
    editorContent,
    isEditing,
    setEditorContentDirect,
    setEditorContentAndScheduleSave,
    toggleEditingMode,
    loadContentForStep,
  };
};
