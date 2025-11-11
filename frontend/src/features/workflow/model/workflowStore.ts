import { create } from 'zustand';
import { MessageCircle, Package, Target, FileText, Mic } from 'lucide-react';

import type { WorkflowStore, WorkflowStep, ChatMessage, WorkflowDocument } from './types';
import type { StepData } from './types';
import type { AgentWorkflow } from '@/types/agentWorkflow';
import type { AIRoleConfig } from '@/types/aiRole';
import type { DifyAPIConfig, WorkflowStepConfig } from '@/services/configService';

const initialChatMessages: ChatMessage[] = [
  {
    id: 'welcome',
    type: 'assistant',
    content:
      '你好！我是智能助手，请输入您的问题或需求，我将为您提供专业的技术分析和内容生成服务。',
    timestamp: new Date(),
  },
];

const initialSteps: WorkflowStep[] = [
  {
    id: 0,
    title: 'AI问答',
    description: '进行中',
    icon: MessageCircle,
    key: 'smartSearch',
    status: 'active',
  },
  {
    id: 1,
    title: '技术包装',
    description: '未开始',
    icon: Package,
    key: 'techPackage',
    status: 'pending',
  },
  {
    id: 2,
    title: '技术策略',
    description: '未开始',
    icon: Target,
    key: 'techStrategy',
    status: 'pending',
  },
  {
    id: 3,
    title: '技术通稿',
    description: '未开始',
    icon: FileText,
    key: 'coreDraft',
    status: 'pending',
  },
  {
    id: 4,
    title: '发布会演讲稿',
    description: '未开始',
    icon: Mic,
    key: 'speechGeneration',
    status: 'pending',
  },
];

type Updater<T> = T | ((prev: T) => T);

const applyUpdater = <T,>(updater: Updater<T>, prev: T): T =>
  typeof updater === 'function' ? (updater as (value: T) => T)(prev) : updater;

const initialState = {
  currentStep: 0,
  stepData: {} as StepData,
  loading: false,
  loadingText: '',
  loadingProgress: undefined as number | undefined,
  currentDocument: null as WorkflowDocument | null,
  difyConfigs: [] as DifyAPIConfig[],
  workflowConfigs: [] as WorkflowStepConfig[],
  configsLoaded: false,
  chatMessages: initialChatMessages,
  inputMessage: '',
  isTyping: false,
  editorContent: '',
  editingStates: {} as Record<number, boolean>,
  autoSaveTimer: null as ReturnType<typeof setTimeout> | null,
  isProcessing: false,
  processError: null as string | null,
  isFullscreenEditor: true,
  conversationId: '',
  smartWorkflow: null as AgentWorkflow | null,
  workflowAgents: [] as AIRoleConfig[],
  useAgentWorkflow: false,
  steps: initialSteps,
};

export const useWorkflowStore = create<WorkflowStore>((set) => ({
  ...initialState,

  setCurrentStep: (step) => set({ currentStep: step }),

  setStepData: (updater) =>
    set((state) => ({ stepData: applyUpdater(updater, state.stepData) })),

  setLoading: (loading) => set({ loading }),

  setLoadingText: (text) => set({ loadingText: text }),

  setLoadingProgress: (progress) => set({ loadingProgress: progress }),

  setCurrentDocument: (doc) => set({ currentDocument: doc }),

  setDifyConfigs: (configs) => set({ difyConfigs: configs }),

  setWorkflowConfigs: (configs) => set({ workflowConfigs: configs }),

  setConfigsLoaded: (loaded) => set({ configsLoaded: loaded }),

  setChatMessages: (updater) =>
    set((state) => ({ chatMessages: applyUpdater(updater, state.chatMessages) })),

  setInputMessage: (message) => set({ inputMessage: message }),

  setIsTyping: (typing) => set({ isTyping: typing }),

  setEditorContent: (content) => set({ editorContent: content }),

  setEditingStates: (updater) =>
    set((state) => ({ editingStates: applyUpdater(updater, state.editingStates) })),

  setAutoSaveTimer: (timer) => set({ autoSaveTimer: timer }),

  setIsProcessing: (processing) => set({ isProcessing: processing }),

  setProcessError: (error) => set({ processError: error }),

  setIsFullscreenEditor: (value) => set({ isFullscreenEditor: value }),

  toggleFullscreenEditor: () =>
    set((state) => ({ isFullscreenEditor: !state.isFullscreenEditor })),

  setConversationId: (id) => set({ conversationId: id }),

  setSmartWorkflow: (workflow) => set({ smartWorkflow: workflow }),

  setWorkflowAgents: (agents) => set({ workflowAgents: agents }),

  setUseAgentWorkflow: (value) => set({ useAgentWorkflow: value }),

  setSteps: (steps) => set({ steps }),

  resetWorkflowState: () => set({ ...initialState, chatMessages: initialChatMessages }),
}));

export type { StepData, WorkflowStep, ChatMessage, WorkflowDocument } from './types';
