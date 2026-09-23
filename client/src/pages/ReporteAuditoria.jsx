import { useState, useEffect } from 'react';
import { ScrollText, Search, X, ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const FILTROS_VACIOS = { fecha_inicio: '', fecha_termino: '', usuario_rut: '', modulo: '' };

const ESTILO_INTEGRIDAD = {
  ok: { icon: ShieldCheck, color: 'var(--color-green)', texto: 'Integridad verificada: sin alteraciones detectadas.' },
  alterado: { icon: ShieldAlert, color: 'var(--color-danger)', texto: '¡Alerta de seguridad crítica! Este registro fue alterado fuera del sistema.' },
  sin_verificar: { icon: ShieldQuestion, color: 'var(--color-text-muted)', texto: 'Registro anterior a la verificación de integridad: no se puede confirmar.' }
};

export default function ReporteAuditoria() {
  const { toasts, addToast, removeToast } = useToast();
  const [logs, setLogs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [usuarios, setUsuarios] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  useEffect(() => {
    api.get('/usuario').then(r => setUsuarios(r.data.data)).catch(() => {});
    api.get('/log-auditoria/modulos').then(r => setModulos(r.data.data)).catch(() => {});
    buscar();
  }, []);

  const buscar = (f = filtros) => {
    setLoading(true);
    const params = {};
    if (f.fecha_inicio) params.fecha_inicio = f.fecha_inicio;
    if (f.fecha_termino) params.fecha_termino = f.fecha_termino;
    if (f.usuario_rut) params.usuario_rut = f.usuario_rut;
    if (f.modulo) params.modulo = f.modulo;

    api.get('/log-auditoria', { params })
      .then(r => setLogs(r.data.data))
      .catch(() => addToast('Error al consultar los registros de auditoría', 'error'))
      .finally(() => setLoading(false));
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_VACIOS);
    buscar(FILTROS_VACIOS);
  };

  const verDetalle = id => {
    setCargandoDetalle(true);
    api.get(`/log-auditoria/${id}`)
      .then(r => {
        setDetalle(r.data.data);
        if (r.data.alerta_seguridad) {
          addToast('¡Alerta de seguridad crítica! Este registro fue alterado fuera del sistema.', 'error');
        }
      })
      .catch(() => addToast('Error al obtener el detalle del registro', 'error'))
      .finally(() => setCargandoDetalle(false));
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v);

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ScrollText size={20} />
        Reporte de Auditoría
      </h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Desde</label>
            <input
              type="date"
              className="form-input"
              value={filtros.fecha_inicio}
              onChange={e => setFiltros(f => ({ ...f, fecha_inicio: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hasta</label>
            <input
              type="date"
              className="form-input"
              value={filtros.fecha_termino}
              onChange={e => setFiltros(f => ({ ...f, fecha_termino: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Usuario</label>
            <select
              className="form-select"
              value={filtros.usuario_rut}
              onChange={e => setFiltros(f => ({ ...f, usuario_rut: e.target.value }))}
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map(u => (
                <option key={u.usuario_rut} value={u.usuario_rut}>{u.usuario_nombre} ({u.usuario_rut})</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Tipo de Acción</label>
            <select
              className="form-select"
              value={filtros.modulo}
              onChange={e => setFiltros(f => ({ ...f, modulo: e.target.value }))}
            >
              <option value="">Todos los tipos</option>
              {modulos.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => buscar()} disabled={loading}>
            <Search size={15} />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          {hayFiltrosActivos && (
            <button className="btn btn-secondary" onClick={limpiarFiltros}>
              <X size={15} />
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
        ) : !logs || logs.length === 0 ? (
          <div className="estado-vacio">
            <p>
              {hayFiltrosActivos
                ? 'No existen registros de actividad para los filtros seleccionados.'
                : 'Todavía no hay registros de auditoría.'}
            </p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Usuario</th>
                  <th>Tipo de Acción</th>
                  <th>Acción</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.log_auditoria_id}>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {new Date(l.log_auditoria_fecha_hora).toLocaleString('es-CL')}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {l.Usuario?.usuario_nombre || l.usuario_rut}
                    </td>
                    <td><Badge value={l.log_auditoria_modulo} /></td>
                    <td style={{ fontSize: 13, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.log_auditoria_accion}
                    </td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => verDetalle(l.log_auditoria_id)}>
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de detalle (CU04 paso 3 / Excepción 2) */}
      {detalle && (
        <div
          onClick={() => setDetalle(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }}
        >
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 480, padding: 24 }}>
            <h2 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ScrollText size={16} />
              Detalle del Registro #{detalle.log_auditoria_id}
            </h2>

            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <strong>Fecha y hora:</strong> {new Date(detalle.log_auditoria_fecha_hora).toLocaleString('es-CL')}
            </div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <strong>Usuario:</strong> {detalle.Usuario?.usuario_nombre || detalle.usuario_rut} ({detalle.usuario_rut})
            </div>
            <div style={{ fontSize: 13, marginBottom: 10 }}>
              <strong>Tipo de acción:</strong> <Badge value={detalle.log_auditoria_modulo} />
            </div>
            <div style={{ fontSize: 13, marginBottom: 16 }}>
              <strong>Acción:</strong>
              <p style={{ marginTop: 4, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {detalle.log_auditoria_accion}
              </p>
            </div>

            {(() => {
              const e = ESTILO_INTEGRIDAD[detalle.integridad];
              const Icon = e.icon;
              return (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 12px', borderRadius: 6,
                  background: `color-mix(in srgb, ${e.color} 12%, transparent)`,
                  border: `1px solid color-mix(in srgb, ${e.color} 40%, transparent)`
                }}>
                  <Icon size={16} color={e.color} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 12.5, color: e.color, fontWeight: 600 }}>{e.texto}</span>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setDetalle(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
