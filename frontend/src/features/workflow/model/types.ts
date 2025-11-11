import type { LucideIcon } from 'lucide-react';
import type { AgentWorkflow } from '@/types/agentWorkflow';
import type { AIRoleConfig } from '@/types/aiRole';
import type { DifyAPIConfig, WorkflowStepConfig } from '@/services/configService';

export interface StepData {
  smartSearch?: any;
  techPackage?: any;
  techStrategy?: any;
  coreDraft?: any;
  speechGeneration?: any;
  aiSearch?: any;
  [key: string]: any;
}

export interface WorkflowDocument {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
  isRegenerating?: boolean;
  adopted?: boolean;
}

export interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  key: string;
  status: 'active' | 'pending' | 'completed' | string;
}

export interface WorkflowState {
  currentStep: number;
  stepData: StepData;
  loading: boolean;
  loadingText: string;
  loadingProgress?: number;
  currentDocument: WorkflowDocument | null;
  difyConfigs: DifyAPIConfig[];
  workflowConfigs: WorkflowStepConfig[];
  configsLoaded: boolean;
  chatMessages: ChatMessage[];
  inputMessage: string;
  isTyping: boolean;
  editorContent: string;
  editingStates: Record<number, boolean>;
  autoSaveTimer: ReturnType<typeof setTimeout> | null;
  isProcessing: boolean;
  processError: string | null;
  isFullscreenEditor: boolean;
  conversationId: string;
  smartWorkflow: AgentWorkflow | null;
  workflowAgents: AIRoleConfig[];
  useAgentWorkflow: boolean;
  steps: WorkflowStep[];
}

export interface WorkflowActions {
  setCurrentStep: (step: number) => void;
  setStepData: (updater: StepData | ((prev: StepData) => StepData)) => void;
  setLoading: (loading: boolean) => void;
  setLoadingText: (text: string) => void;
  setLoadingProgress: (progress: number | undefined) => void;
  setCurrentDocument: (doc: WorkflowDocument | null) => void;
  setDifyConfigs: (configs: DifyAPIConfig[]) => void;
  setWorkflowConfigs: (configs: WorkflowStepConfig[]) => void;
  setConfigsLoaded: (loaded: boolean) => void;
  setChatMessages: (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  setInputMessage: (message: string) => void;
  setIsTyping: (typing: boolean) => void;
  setEditorContent: (content: string) => void;
  setEditingStates: (updater: Record<number, boolean> | ((prev: Record<number, boolean>) => Record<number, boolean>)) => void;
  setAutoSaveTimer: (timer: ReturnType<typeof setTimeout> | null) => void;
  setIsProcessing: (processing: boolean) => void;
  setProcessError: (error: string | null) => void;
  setIsFullscreenEditor: (value: boolean) => void;
  toggleFullscreenEditor: () => void;
  setConversationId: (id: string) => void;
  setSmartWorkflow: (workflow: AgentWorkflow | null) => void;
  setWorkflowAgents: (agents: AIRoleConfig[]) => void;
  setUseAgentWorkflow: (value: boolean) => void;
  setSteps: (steps: WorkflowStep[]) => void;
  resetWorkflowState: () => void;
}

export type WorkflowStore = WorkflowState & WorkflowActions;
