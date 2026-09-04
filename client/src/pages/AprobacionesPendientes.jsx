import { useState, useEffect, Fragment } from 'react';
import { CheckSquare, AlertTriangle, Check, X } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

export default function AprobacionesPendientes() {
  const { toasts, addToast, removeToast } = useToast();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandidaId, setExpandidaId] = useState(null);
  const [cantidadEditada, setCantidadEditada] = useState('');
  const [montoEstimado, setMontoEstimado] = useState('');
  const [mostrarRechazo, setMostrarRechazo] = useState(false);
  const [comentarioRechazo, setComentarioRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cargarSolicitudes = () => {
    setLoading(true);
    api.get('/solicitud-material/pendientes')
      .then(r => setSolicitudes(r.data.data))
      .catch(() => addToast('Error al cargar las aprobaciones pendientes', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const seleccionarSolicitud = s => {
    if (expandidaId === s.solicitud_material_id) {
      setExpandidaId(null);
      return;
    }
    setExpandidaId(s.solicitud_material_id);
    setCantidadEditada(s.solicitud_material_cantidad);
    setMontoEstimado('');
    setMostrarRechazo(false);
    setComentarioRechazo('');
  };

  const presupuestoExcedido = s => {
    const presupuesto = parseFloat(s.Proyecto?.proyecto_presupuesto_asignado || 0);
    const costo = parseFloat(montoEstimado || 0);
    return montoEstimado !== '' && costo > presupuesto;
  };

  const aprobar = s => {
    setProcesando(true);
    api.put(`/solicitud-material/${s.solicitud_material_id}/aprobar`, {
      cantidad: cantidadEditada ? parseInt(cantidadEditada) : undefined,
      monto_estimado: montoEstimado ? parseFloat(montoEstimado) : undefined
    })
      .then(r => {
        const { alerta_presupuesto, oc_generada, motivo_pausa_oc, orden_compra } = r.data.data;

        if (alerta_presupuesto) {
          addToast('Solicitud aprobada — presupuesto excedido', 'warning');
        } else if (oc_generada) {
          addToast(`Solicitud aprobada — Orden de Compra ${orden_compra.orden_compra_folio} generada automáticamente`, 'success');
        } else {
          addToast(`Solicitud aprobada — ${motivo_pausa_oc}`, 'warning');
        }

        setExpandidaId(null);
        cargarSolicitudes();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al aprobar la solicitud', 'error'))
      .finally(() => setProcesando(false));
  };

  const confirmarRechazo = s => {
    if (!comentarioRechazo.trim()) {
      addToast('Debes ingresar un comentario para rechazar la solicitud', 'error');
      return;
    }
    setProcesando(true);
    api.put(`/solicitud-material/${s.solicitud_material_id}/rechazar`, {
      comentario_rechazo: comentarioRechazo
    })
      .then(() => {
        addToast('Solicitud rechazada', 'success');
        setExpandidaId(null);
        setMostrarRechazo(false);
        setComentarioRechazo('');
        cargarSolicitudes();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al rechazar la solicitud', 'error'))
      .finally(() => setProcesando(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <CheckSquare size={20} />
        Aprobaciones Pendientes
      </h1>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
        ) : solicitudes.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
            No hay solicitudes pendientes de validación
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Supervisor</th>
                  <th>Proyecto</th>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map(s => (
                  <Fragment key={s.solicitud_material_id}>
                    <tr
                      onClick={() => seleccionarSolicitud(s)}
                      style={{ cursor: 'pointer', background: expandidaId === s.solicitud_material_id ? 'var(--color-bg-elevated)' : 'transparent' }}
                    >
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>#{s.solicitud_material_id}</td>
                      <td style={{ fontSize: 13 }}>{s.usuario_nombre}</td>
                      <td style={{ fontSize: 13 }}>{s.Proyecto?.proyecto_nombre_obra || s.proyecto_codigo_correlativo}</td>
                      <td style={{ fontSize: 13 }}>{s.solicitud_material_descripcion}</td>
                      <td style={{ fontSize: 13 }}>{s.solicitud_material_cantidad}</td>
                      <td style={{ fontSize: 13 }}>{s.solicitud_material_fecha}</td>
                    </tr>
                    {expandidaId === s.solicitud_material_id && (
                      <tr key={`${s.solicitud_material_id}-detalle`}>
                        <td colSpan={6} style={{ background: 'var(--color-bg-elevated)', padding: 20 }}>
                          <div style={{ maxWidth: 480 }}>
                            <div className="form-group">
                              <label className="form-label">Cantidad</label>
                              <input
                                type="number"
                                min="1"
                                className="form-input"
                                value={cantidadEditada}
                                onChange={e => setCantidadEditada(e.target.value)}
                              />
                            </div>

                            <div className="form-group">
                              <label className="form-label">Costo Estimado (CLP)</label>
                              <input
                                type="number"
                                min="0"
                                className="form-input"
                                placeholder="Ingresa el costo estimado de la solicitud..."
                                value={montoEstimado}
                                onChange={e => setMontoEstimado(e.target.value)}
                              />
                            </div>

                            {presupuestoExcedido(s) && (
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                background: 'rgba(245,158,11,0.1)', border: '1px solid var(--color-warning)',
                                borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--color-warning)'
                              }}>
                                <AlertTriangle size={16} />
                                El costo estimado supera el presupuesto asignado del proyecto.
                              </div>
                            )}

                            {!mostrarRechazo ? (
                              <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                  className="btn"
                                  style={{ background: 'var(--color-green)', color: '#fff' }}
                                  onClick={() => aprobar(s)}
                                  disabled={procesando}
                                >
                                  <Check size={15} />
                                  Aprobar
                                </button>
                                <button
                                  className="btn btn-danger"
                                  onClick={() => setMostrarRechazo(true)}
                                  disabled={procesando}
                                >
                                  <X size={15} />
                                  Rechazar
                                </button>
                              </div>
                            ) : (
                              <div>
                                <div className="form-group">
                                  <label className="form-label">Motivo del Rechazo</label>
                                  <textarea
                                    className="form-textarea"
                                    placeholder="Ingresa el motivo del rechazo..."
                                    value={comentarioRechazo}
                                    onChange={e => setComentarioRechazo(e.target.value)}
                                  />
                                </div>
                                <div style={{ display: 'flex', gap: 10 }}>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => confirmarRechazo(s)}
                                    disabled={procesando}
                                  >
                                    Confirmar Rechazo
                                  </button>
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => { setMostrarRechazo(false); setComentarioRechazo(''); }}
                                    disabled={procesando}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
