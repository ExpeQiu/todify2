/**
 * Store 统一导出
 * 提供集中式的状态管理访问入口
 */

// App-level Store
export {
  useAppStore,
  useUI,
  useUser,
  useNotifications,
  useRoute,
  useUIActions,
  useUserActions,
  useNotificationActions,
} from './appStore';

export type { AppStore } from './appStore';

// Legacy workflow store re-export
// export { useWorkflowStore } from '@/features/workflow/model/workflowStore';
