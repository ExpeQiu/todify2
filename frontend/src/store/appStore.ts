/**
 * 应用级 Zustand Store
 * 统一管理跨组件的应用状态
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// UI 状态
interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'auto';
  compactMode: boolean;
}

// 用户状态
interface UserState {
  isAuthenticated: boolean;
  userId?: string;
  userName?: string;
  preferences: Record<string, unknown>;
}

// 通知状态
interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
}

// 路由状态
interface RouteState {
  previousRoutes: string[];
  breadcrumbs: { label: string; path: string }[];
}

// 完整的 App Store 接口
export interface AppStore {
  // UI State
  ui: UIState;
  toggleSidebar: () => void;
  setTheme: (theme: UIState['theme']) => void;
  setCompactMode: (compact: boolean) => void;

  // User State
  user: UserState;
  setUser: (user: Partial<UserState>) => void;
  clearUser: () => void;
  updatePreferences: (prefs: Record<string, unknown>) => void;

  // Notification State
  notifications: NotificationState;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;

  // Route State
  route: RouteState;
  pushRoute: (route: string) => void;
  setBreadcrumbs: (breadcrumbs: RouteState['breadcrumbs']) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial UI State
      ui: {
        sidebarCollapsed: false,
        theme: 'auto',
        compactMode: false,
      },

      toggleSidebar: () =>
        set((state) => ({
          ui: {
            ...state.ui,
            sidebarCollapsed: !state.ui.sidebarCollapsed,
          },
        })),

      setTheme: (theme) =>
        set((state) => ({
          ui: {
            ...state.ui,
            theme,
          },
        })),

      setCompactMode: (compactMode) =>
        set((state) => ({
          ui: {
            ...state.ui,
            compactMode,
          },
        })),

      // Initial User State
      user: {
        isAuthenticated: false,
        preferences: {},
      },

      setUser: (userData) =>
        set((state) => ({
          user: {
            ...state.user,
            ...userData,
          },
        })),

      clearUser: () =>
        set(() => ({
          user: {
            isAuthenticated: false,
            preferences: {},
          },
        })),

      updatePreferences: (prefs) =>
        set((state) => ({
          user: {
            ...state.user,
            preferences: {
              ...state.user.preferences,
              ...prefs,
            },
          },
        })),

      // Initial Notification State
      notifications: {
        notifications: [],
      },

      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duration = notification.duration ?? 5000;

        set((state) => ({
          notifications: {
            notifications: [
              ...state.notifications.notifications,
              { ...notification, id },
            ],
          },
        }));

        // Auto-remove after duration
        if (duration > 0) {
          setTimeout(() => {
            get().removeNotification(id);
          }, duration);
        }
      },

      removeNotification: (id) =>
        set((state) => ({
          notifications: {
            notifications: state.notifications.notifications.filter(
              (n) => n.id !== id
            ),
          },
        })),

      clearNotifications: () =>
        set(() => ({
          notifications: {
            notifications: [],
          },
        })),

      // Initial Route State
      route: {
        previousRoutes: [],
        breadcrumbs: [],
      },

      pushRoute: (route) =>
        set((state) => ({
          route: {
            previousRoutes: [...state.route.previousRoutes.slice(-4), route],
            breadcrumbs: state.route.breadcrumbs,
          },
        })),

      setBreadcrumbs: (breadcrumbs) =>
        set((state) => ({
          route: {
            ...state.route,
            breadcrumbs,
          },
        })),
    }),
    {
      name: 'todify4-app-storage',
      partialize: (state) => ({
        ui: state.ui,
        user: state.user,
      }),
    }
  )
);

// Selector hooks for better performance
export const useUI = () => useAppStore((state) => state.ui);
export const useUser = () => useAppStore((state) => state.user);
export const useNotifications = () =>
  useAppStore((state) => state.notifications.notifications);
export const useRoute = () => useAppStore((state) => state.route);

// Convenience action hooks
export const useUIActions = () => {
  const { toggleSidebar, setTheme, setCompactMode } = useAppStore();
  return { toggleSidebar, setTheme, setCompactMode };
};

export const useUserActions = () => {
  const { setUser, clearUser, updatePreferences } = useAppStore();
  return { setUser, clearUser, updatePreferences };
};

export const useNotificationActions = () => {
  const { addNotification, removeNotification, clearNotifications } =
    useAppStore();
  return { addNotification, removeNotification, clearNotifications };
};
