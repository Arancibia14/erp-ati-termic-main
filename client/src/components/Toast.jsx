import { useEffect, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
};

const COLORS = {
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  error: 'var(--color-danger)'
};

export default function Toast({ toasts, removeToast }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '360px'
    }}>
      {toasts.map(toast => {
        const Icon = ICONS[toast.type] || CheckCircle;
        const color = COLORS[toast.type] || COLORS.success;
        return (
          <div key={toast.id} style={{
            background: 'var(--color-bg-elevated)',
            border: '1px solid var(--color-border)',
            borderLeft: `3px solid ${color}`,
            borderRadius: '6px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            animation: 'slideUp 0.2s ease',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
          }}>
            <Icon size={18} color={color} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span style={{ flex: 1, fontSize: '14px', color: 'var(--color-text-primary)', lineHeight: '1.4' }}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0 2px' }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3500) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  };

  const removeToast = id => setToasts(prev => prev.filter(t => t.id !== id));

  return { toasts, addToast, removeToast };
}
