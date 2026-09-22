import { useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, X } from 'lucide-react';

const ICONS = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle
};

const TITULOS = {
  success: 'Operación exitosa',
  warning: 'Advertencia',
  error: 'No se pudo completar'
};

const MAXIMO_VISIBLE = 4;

function agrupar(toasts) {
  const grupos = [];
  toasts.forEach(toast => {
    const clave = `${toast.type}|${toast.message}`;
    const existente = grupos.find(g => g.clave === clave);
    if (existente) {
      existente.ids.push(toast.id);
      existente.ultimo = toast;
    } else {
      grupos.push({ clave, type: toast.type, message: toast.message, action: toast.action, ids: [toast.id], ultimo: toast });
    }
  });
  return grupos;
}

export default function Toast({ toasts, removeToast }) {
  const grupos = agrupar(toasts);
  const visibles = grupos.slice(-MAXIMO_VISIBLE);
  const ocultos = grupos.length - visibles.length;

  return (
    <div className="toast-stack" aria-live="polite">
      {ocultos > 0 && (
        <div className="toast-more">
          {ocultos} {ocultos === 1 ? 'aviso anterior' : 'avisos anteriores'}
        </div>
      )}
      {visibles.map(grupo => {
        const tipo = ICONS[grupo.type] ? grupo.type : 'success';
        const Icon = ICONS[tipo];
        return (
          <div key={grupo.clave} className={`toast toast-${tipo}`} role={tipo === 'error' ? 'alert' : 'status'}>
            <span className="toast-icon"><Icon size={18} strokeWidth={2} /></span>
            <div className="toast-body">
              <div className="toast-title">
                {TITULOS[tipo]}
                {grupo.ids.length > 1 && <span className="toast-count">×{grupo.ids.length}</span>}
              </div>
              <div className="toast-message">{grupo.message}</div>
              {grupo.action && (
                <button
                  type="button"
                  className="toast-action"
                  onClick={() => {
                    grupo.action.onClick();
                    grupo.ids.forEach(removeToast);
                  }}
                >
                  {grupo.action.label}
                </button>
              )}
            </div>
            <button
              type="button"
              className="toast-close"
              aria-label="Cerrar aviso"
              onClick={() => grupo.ids.forEach(removeToast)}
            >
              <X size={15} />
            </button>
            <span
              key={grupo.ultimo.id}
              className="toast-bar"
              style={{ animationDuration: `${grupo.ultimo.duration || 3500}ms` }}
            />
          </div>
        );
      })}
    </div>
  );
}

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success', duration = 3500, action = null) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration, action }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    if (type === 'success' && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0) {
      navigator.vibrate?.(15);
    }
  };

  const removeToast = id => setToasts(prev => prev.filter(t => t.id !== id));

  return { toasts, addToast, removeToast };
}
