import { RouterProvider } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
} from 'lucide-react';
import router from './router';
import { useUIStore, type ToastType } from './stores/uiStore';
import { cn } from './lib/utils';

const toastStyles: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; iconBg: string }> = {
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: <CheckCircle2 size={18} className="text-emerald-500" />,
    iconBg: 'bg-emerald-100',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: <XCircle size={18} className="text-red-500" />,
    iconBg: 'bg-red-100',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: <AlertTriangle size={18} className="text-amber-500" />,
    iconBg: 'bg-amber-100',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: <Info size={18} className="text-blue-500" />,
    iconBg: 'bg-blue-100',
  },
};

const ToastContainer: React.FC = () => {
  const { toasts, hideToast } = useUIStore();

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] px-4 pt-safe-top pointer-events-none">
      <div className="max-w-md mx-auto space-y-2 pt-3">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => {
            const style = toastStyles[toast.type];
            const positionClass =
              toast.position === 'bottom' || toast.position === 'bottom-center'
                ? 'mt-auto'
                : '';
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onClick={() => hideToast(toast.id)}
                className={cn(
                  'pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-lg cursor-pointer backdrop-blur-sm',
                  style.bg,
                  style.border,
                  positionClass
                )}
              >
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', style.iconBg)}>
                  {style.icon}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-gray-800 leading-snug">
                    {toast.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

const LoadingOverlay: React.FC = () => {
  const { loadingStack, loadingMessage } = useUIStore();
  const isLoading = loadingStack.length > 0;

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99] bg-black/30 backdrop-blur-sm flex items-center justify-center px-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs w-full"
          >
            <div className="relative">
              <Loader2 size={40} className="text-primary-500 animate-spin" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                className="absolute inset-0 rounded-full border-4 border-primary-100 border-t-primary-500"
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-800">
                {loadingMessage || '加载中...'}
              </p>
              <p className="text-[11px] text-gray-400 mt-1">请稍候</p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <RouterProvider router={router} />
      <ToastContainer />
      <LoadingOverlay />
    </div>
  );
}
