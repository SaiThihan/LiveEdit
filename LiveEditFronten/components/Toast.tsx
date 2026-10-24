import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import type { ToastItem } from '../context/ToastContext';

export interface ToastProps {
  toast: ToastItem;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const duration = toast.duration ?? 5000;
    if (duration <= 0) return;

    const timer = setTimeout(() => {
      onClose(toast.id);
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onClose]);

  const getStyleConfig = () => {
    switch (toast.type) {
      case 'error':
        return {
          icon: 'fa-circle-exclamation',
          iconColor: 'text-red-500',
          borderAccent: 'border-l-red-500',
        };
      case 'warning':
        return {
          icon: 'fa-triangle-exclamation',
          iconColor: 'text-amber-500',
          borderAccent: 'border-l-amber-500',
        };
      case 'success':
        return {
          icon: 'fa-circle-check',
          iconColor: 'text-[#00ff41]',
          borderAccent: 'border-l-[#00ff41]',
        };
      case 'info':
      default:
        return {
          icon: 'fa-circle-info',
          iconColor: 'text-blue-400',
          borderAccent: 'border-l-blue-400',
        };
    }
  };

  const { icon, iconColor, borderAccent } = getStyleConfig();
  const role = toast.type === 'error' ? 'alert' : 'status';
  const ariaLive = toast.type === 'error' ? 'assertive' : 'polite';

  return (
    <div
      role={role}
      aria-live={ariaLive}
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm rounded-lg p-3.5 border border-l-4 backdrop-blur-md transition-all duration-200 shadow-xl ${
        isDark
          ? 'bg-[#161616]/95 text-neutral-200 border-[#2a2a2a] shadow-black/60'
          : 'bg-white/95 text-neutral-900 border-[#e0e0e0] shadow-black/10'
      } ${borderAccent}`}
    >
      <div className="pt-0.5 shrink-0">
        <i className={`fas ${icon} ${iconColor} text-base`} aria-hidden="true" />
      </div>
      <div className="flex-1 text-xs font-medium leading-relaxed break-words">
        {toast.message}
      </div>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className={`shrink-0 -mr-1 -mt-1 p-1.5 rounded transition-colors ${
          isDark
            ? 'text-neutral-400 hover:text-white hover:bg-neutral-800'
            : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
        }`}
        aria-label="Close notification"
      >
        <i className="fas fa-times text-xs" aria-hidden="true" />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: ToastItem[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div
      className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};

export default Toast;
