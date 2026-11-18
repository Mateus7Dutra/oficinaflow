import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useOficina } from '../context/OficinaContext';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useOficina();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-[calc(100vw-2rem)]">
      {toasts.map((t) => {
        const styles = {
          success: 'bg-white border-l-4 border-[#16A34A] text-slate-800',
          warning: 'bg-white border-l-4 border-[#F59E0B] text-slate-800',
          error: 'bg-white border-l-4 border-[#DC2626] text-slate-800',
          info: 'bg-white border-l-4 border-[#0F2942] text-slate-800',
        }[t.type];

        const Icon = {
          success: CheckCircle2,
          warning: AlertTriangle,
          error: XCircle,
          info: Info,
        }[t.type];

        const iconColor = {
          success: 'text-[#16A34A]',
          warning: 'text-[#F59E0B]',
          error: 'text-[#DC2626]',
          info: 'text-[#0F2942]',
        }[t.type];

        return (
          <div
            key={t.id}
            className={`${styles} rounded-lg shadow-lg border border-slate-200 p-3.5 flex items-start gap-3 animate-fade-in`}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColor}`} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-snug">{t.title}</p>
              {t.description && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              aria-label="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
