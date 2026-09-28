import { useEffect, useState } from 'react';
import { Bell, X, Trash2, ShieldAlert, ImageOff } from 'lucide-react';
import api from '../api/axios';

const ICONOS = { evidencia_rechazada: ImageOff, incidente_sso: ShieldAlert };

// Sesión para la que ya se avisó de las notificaciones nuevas: el aviso sale una
// sola vez por inicio de sesión aunque Inicio se monte de nuevo.
let sesionAvisada = null;

const fechaHora = f => new Date(f).toLocaleString('es-CL', {
  timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
});

// Notificaciones del usuario en Inicio (CU 17 y CU 57): se guardan hasta que él
// las borra. Al entrar se avisa cuántas son nuevas y quedan marcadas como leídas.
export default function PanelNotificaciones({ addToast }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [borrando, setBorrando] = useState(null);

  useEffect(() => {
    api.get('/notificacion')
      .then(r => {
        const lista = r.data.data;
        setNotificaciones(lista);
        const nuevas = lista.filter(n => !n.notificacion_leida).length;
        const sesion = localStorage.getItem('token');
        if (nuevas > 0 && sesionAvisada !== sesion) {
          sesionAvisada = sesion;
          addToast(nuevas === 1 ? 'Tienes 1 notificación nueva' : `Tienes ${nuevas} notificaciones nuevas`, 'warning');
          api.put('/notificacion/leidas').catch(() => {});
        }
      })
      .catch(() => addToast('Error al cargar las notificaciones', 'error'))
      .finally(() => setCargando(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const borrar = id => {
    setBorrando(id);
    api.delete(`/notificacion/${id}`)
      .then(() => setNotificaciones(prev => prev.filter(n => n.notificacion_id !== id)))
      .catch(err => addToast(err.response?.data?.error || 'Error al eliminar la notificación', 'error'))
      .finally(() => setBorrando(null));
  };

  const borrarTodas = () => {
    setBorrando('todas');
    api.delete('/notificacion')
      .then(() => { setNotificaciones([]); addToast('Notificaciones eliminadas', 'success'); })
      .catch(err => addToast(err.response?.data?.error || 'Error al eliminar las notificaciones', 'error'))
      .finally(() => setBorrando(null));
  };

  return (
    <>
      <div className="dash-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={14} /> Notificaciones{notificaciones.length > 0 ? ` (${notificaciones.length})` : ''}
        </span>
        {notificaciones.length > 1 && (
          <button type="button" className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12, textTransform: 'none', letterSpacing: 0 }}
            onClick={borrarTodas} disabled={borrando === 'todas'}>
            <Trash2 size={13} /> Borrar todas
          </button>
        )}
      </div>

      {cargando ? null : notificaciones.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>No tienes notificaciones.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {notificaciones.map(n => {
            const Icono = ICONOS[n.notificacion_tipo] || Bell;
            return (
              <article key={n.notificacion_id} className="notificacion-item" style={{
                display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', minWidth: 0,
                background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
                borderLeft: `4px solid ${n.notificacion_tipo === 'incidente_sso' ? 'var(--color-danger)' : 'var(--color-warning)'}`,
                borderRadius: 12
              }}>
                <Icono size={18} style={{ flexShrink: 0, marginTop: 2, color: n.notificacion_tipo === 'incidente_sso' ? 'var(--color-danger)' : 'var(--color-warning)' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {n.notificacion_titulo}
                    {!n.notificacion_leida && (
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 6, background: 'var(--color-blue)', color: '#fff' }}>NUEVA</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0', overflowWrap: 'anywhere' }}>{n.notificacion_mensaje}</p>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{fechaHora(n.notificacion_fecha)}</span>
                </div>
                <button type="button" className="btn btn-secondary" title="Borrar notificación" aria-label="Borrar notificación"
                  style={{ padding: '4px 8px', flexShrink: 0 }} onClick={() => borrar(n.notificacion_id)} disabled={borrando === n.notificacion_id}>
                  <X size={14} />
                </button>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
