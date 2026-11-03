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

// CU 66 - Notificaciones del usuario en Inicio, generadas por CU 17 y CU 57: se guardan hasta que él
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

  const nuevas = notificaciones.filter(n => !n.notificacion_leida).length;

  return (
    <>
      <div className="pn-cab">
        <h2>
          Notificaciones
          {notificaciones.length > 0 && (
            <span className={`notif-cuenta${nuevas > 0 ? ' nuevas' : ''}`}>{notificaciones.length}</span>
          )}
        </h2>
        {notificaciones.length > 1 && (
          <button type="button" className="notif-borrar" onClick={borrarTodas} disabled={borrando === 'todas'}>
            <Trash2 size={13} /> Borrar todas
          </button>
        )}
      </div>

      {cargando ? null : notificaciones.length === 0 ? (
        <p className="notif-vacio"><Bell size={16} /> No tienes notificaciones.</p>
      ) : (
        <div className="notif-lista">
          {notificaciones.map(n => {
            const Icono = ICONOS[n.notificacion_tipo] || Bell;
            const grave = n.notificacion_tipo === 'incidente_sso';
            return (
              <article key={n.notificacion_id} className={`notificacion-item${grave ? ' grave' : ''}`}>
                <Icono size={18} className="notif-ico" />
                <div className="notif-txt">
                  <div className="notif-titulo">
                    {n.notificacion_titulo}
                    {!n.notificacion_leida && <span className="notif-nueva">NUEVA</span>}
                  </div>
                  <p>{n.notificacion_mensaje}</p>
                  <span className="notif-fecha">{fechaHora(n.notificacion_fecha)}</span>
                </div>
                <button type="button" className="notif-x" title="Borrar notificación" aria-label="Borrar notificación"
                  onClick={() => borrar(n.notificacion_id)} disabled={borrando === n.notificacion_id}>
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
