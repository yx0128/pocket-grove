import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useWorldStore } from '../../store/useWorldStore';
import type { ToastMessage } from '../../types';

const TONE_STYLES = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    bar: 'bg-emerald-500',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-rose-500',
    bar: 'bg-rose-400',
  },
  info: {
    icon: Info,
    iconClass: 'text-sky-600',
    bar: 'bg-sky-400',
  },
};

function ToastItem({ toast }: { toast: ToastMessage }) {
  const dismiss = useWorldStore((state) => state.dismissToast);
  const tone = TONE_STYLES[toast.tone];
  const Icon = tone.icon;

  useEffect(() => {
    const timeout = window.setTimeout(() => dismiss(toast.id), 2800);
    return () => window.clearTimeout(timeout);
  }, [dismiss, toast.id]);

  return (
    <button
      type="button"
      onClick={() => dismiss(toast.id)}
      className="pointer-events-auto relative flex w-full max-w-sm items-center gap-3 overflow-hidden rounded-2xl border border-white/60 bg-cream/90 px-4 py-3 text-left text-sm font-semibold text-ink shadow-glass backdrop-blur-xl animate-toast-in"
    >
      <span className={`absolute left-0 top-0 h-full w-1 ${tone.bar}`} />
      <Icon className={`h-5 w-5 shrink-0 ${tone.iconClass}`} />
      <span className="min-w-0 flex-1 leading-snug">{toast.message}</span>
      <X className="h-4 w-4 shrink-0 text-ink-soft/60" />
    </button>
  );
}

export function Toasts() {
  const toasts = useWorldStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-[80] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
