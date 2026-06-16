import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  position?: 'top' | 'top-center' | 'bottom' | 'bottom-center';
}

export interface ConfirmDialogOptions {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  cancelButtonClass?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ActionSheetOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  danger?: boolean;
}

export interface ActionSheet {
  id: string;
  title?: string;
  options: ActionSheetOption[];
  onSelect?: (value: string | number) => void;
  onCancel?: () => void;
}

interface UIState {
  loadingStack: string[];
  loadingMessage: string;

  toasts: Toast[];
  toastDefaultDuration: number;

  confirmDialog: ConfirmDialogOptions | null;

  actionSheet: ActionSheet | null;

  isSidebarOpen: boolean;
  isDarkMode: boolean;
  isFullscreen: boolean;

  showLoading: (message?: string, key?: string) => string;
  hideLoading: (key?: string) => void;
  hideAllLoading: () => void;

  showToast: (
    message: string,
    type?: ToastType,
    options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>
  ) => string;
  successToast: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => void;
  errorToast: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => void;
  warningToast: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => void;
  infoToast: (message: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'message'>>) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;

  showConfirm: (options: Omit<ConfirmDialogOptions, 'id'>) => Promise<boolean>;
  hideConfirm: () => void;

  showActionSheet: (options: Omit<ActionSheet, 'id'>) => Promise<string | number | null>;
  hideActionSheet: () => void;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;

  setFullscreen: (fullscreen: boolean) => void;
  toggleFullscreen: () => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useUIStore = create<UIState>((set, get) => ({
  loadingStack: [],
  loadingMessage: '',

  toasts: [],
  toastDefaultDuration: 3000,

  confirmDialog: null,

  actionSheet: null,

  isSidebarOpen: false,
  isDarkMode: false,
  isFullscreen: false,

  showLoading: (message = '加载中...', key) => {
    const loadingKey = key || generateId();
    set((state) => ({
      loadingStack: [...state.loadingStack, loadingKey],
      loadingMessage: message,
    }));
    return loadingKey;
  },

  hideLoading: (key) => {
    set((state) => {
      const newStack = key
        ? state.loadingStack.filter((k) => k !== key)
        : state.loadingStack.slice(0, -1);
      return {
        loadingStack: newStack,
        loadingMessage: newStack.length > 0 ? state.loadingMessage : '',
      };
    });
  },

  hideAllLoading: () => {
    set({
      loadingStack: [],
      loadingMessage: '',
    });
  },

  showToast: (message, type = 'info', options = {}) => {
    const id = generateId();
    const toast: Toast = {
      id,
      type,
      message,
      duration: get().toastDefaultDuration,
      position: 'top',
      ...options,
    };

    set((state) => ({
      toasts: [...state.toasts, toast],
    }));

    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        get().hideToast(id);
      }, toast.duration);
    }

    return id;
  },

  successToast: (message, options) => {
    get().showToast(message, 'success', options);
  },

  errorToast: (message, options) => {
    get().showToast(message, 'error', { duration: 4000, ...options });
  },

  warningToast: (message, options) => {
    get().showToast(message, 'warning', options);
  },

  infoToast: (message, options) => {
    get().showToast(message, 'info', options);
  },

  hideToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  showConfirm: (options) => {
    return new Promise((resolve) => {
      const id = generateId();
      set({
        confirmDialog: {
          id,
          title: options.title,
          message: options.message,
          confirmText: options.confirmText || '确定',
          cancelText: options.cancelText || '取消',
          confirmButtonClass: options.confirmButtonClass,
          cancelButtonClass: options.cancelButtonClass,
          onConfirm: () => {
            options.onConfirm?.();
            set({ confirmDialog: null });
            resolve(true);
          },
          onCancel: () => {
            options.onCancel?.();
            set({ confirmDialog: null });
            resolve(false);
          },
        },
      });
    });
  },

  hideConfirm: () => {
    const { confirmDialog } = get();
    confirmDialog?.onCancel?.();
    set({ confirmDialog: null });
  },

  showActionSheet: (options) => {
    return new Promise((resolve) => {
      const id = generateId();
      set({
        actionSheet: {
          id,
          title: options.title,
          options: options.options,
          onSelect: (value) => {
            options.onSelect?.(value);
            set({ actionSheet: null });
            resolve(value);
          },
          onCancel: () => {
            options.onCancel?.();
            set({ actionSheet: null });
            resolve(null);
          },
        },
      });
    });
  },

  hideActionSheet: () => {
    const { actionSheet } = get();
    actionSheet?.onCancel?.();
    set({ actionSheet: null });
  },

  setSidebarOpen: (open) => {
    set({ isSidebarOpen: open });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },

  setDarkMode: (dark) => {
    set({ isDarkMode: dark });
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', dark);
    }
  },

  toggleDarkMode: () => {
    get().setDarkMode(!get().isDarkMode);
  },

  setFullscreen: (fullscreen) => {
    set({ isFullscreen: fullscreen });
  },

  toggleFullscreen: () => {
    set((state) => ({ isFullscreen: !state.isFullscreen }));
  },
}));

export default useUIStore;
