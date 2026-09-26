import { useEffect, useState } from 'react';
import { Trash2, ShieldAlert } from 'lucide-react';
import api from '../api/axios';

// CU 49 - Validando integridad referencial en eliminaciones.
// Recibe { ruta, tipo, nombre }: ruta es la base del registro, por ejemplo
// "/trabajador/12345678-9". Primero pide al servidor rastrear los registros
// asociados y, solo si no hay ninguno, ofrece la confirmación final.
export default function ModalEliminacion(props) {
  // Se vuelve a montar con cada solicitud para partir siempre desde "revisando"
  return props.solicitud ? <Contenido key={props.solicitud.ruta} {...props} /> : null;
}

function Contenido({ solicitud, onCerrar, onEliminado, addToast }) {
  const [estado, setEstado] = useState('revisando'); // revisando | bloqueado | confirmar | eliminando
  const [bloqueo, setBloqueo] = useState(null);

  useEffect(() => {
    api.get(`${solicitud.ruta}/dependencias`)
      .then(r => {
        if (r.data.data.eliminable) {
          setEstado('confirmar');
        } else {
          setBloqueo(r.data.data);
          setEstado('bloqueado');
        }
      })
      .catch(err => {
        addToast(err.response?.data?.error || 'Error al revisar los registros asociados', 'error');
        onCerrar(err.response?.status === 404);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // CU 49 Excepción 2 - El actor cancela: el registro queda sin cambios
  const cancelar = () => {
    if (estado === 'eliminando') return;
    if (estado === 'confirmar') addToast('Eliminación cancelada: el registro no se modificó', 'warning');
    onCerrar(false);
  };

  const eliminar = () => {
    setEstado('eliminando');
    api.delete(`${solicitud.ruta}/definitivo`)
      .then(r => {
        addToast(r.data.mensaje || 'Registro eliminado exitosamente', 'success');
        onEliminado();
      })
      .catch(err => {
        const data = err.response?.data;
        // Otro usuario le asoció un documento entre la revisión y la confirmación
        if (err.response?.status === 409 && data?.codigo === 'DEPENDENCIAS') {
          setBloqueo({ mensaje: data.error, dependencias: data.dependencias || [] });
          setEstado('bloqueado');
          return;
        }
        addToast(data?.error || 'Error al eliminar el registro', 'error');
        onCerrar(err.response?.status === 404);
      });
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}
      onClick={cancelar}
    >
      <div className="card" style={{ maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
        {estado === 'revisando' && (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Revisando si {solicitud.tipo} tiene registros asociados...
          </p>
        )}

        {estado === 'bloqueado' && bloqueo && (
          <>
            <h3 style={{ marginBottom: 10, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-danger)' }}>
              <ShieldAlert size={18} /> No se puede eliminar
            </h3>
            <p style={{ fontSize: 13, marginBottom: 12 }}>{bloqueo.mensaje}</p>
            {bloqueo.dependencias.length > 0 && (
              <ul style={{ fontSize: 13, marginBottom: 14, paddingLeft: 18 }}>
                {bloqueo.dependencias.map(d => <li key={d.texto}>{d.texto}</li>)}
              </ul>
            )}
            <button className="btn btn-secondary" onClick={() => onCerrar(false)}>Entendido</button>
          </>
        )}

        {(estado === 'confirmar' || estado === 'eliminando') && (
          <>
            <h3 style={{ marginBottom: 10, fontSize: 15, fontWeight: 700 }}>Confirmar eliminación</h3>
            <p style={{ fontSize: 13, marginBottom: 6 }}>
              ¿Eliminar definitivamente {solicitud.tipo} <strong>"{solicitud.nombre}"</strong>?
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              No tiene registros asociados. Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-danger" onClick={eliminar} disabled={estado === 'eliminando'}>
                <Trash2 size={14} /> {estado === 'eliminando' ? 'Eliminando...' : 'Eliminar definitivamente'}
              </button>
              <button className="btn btn-secondary" onClick={cancelar} disabled={estado === 'eliminando'}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
