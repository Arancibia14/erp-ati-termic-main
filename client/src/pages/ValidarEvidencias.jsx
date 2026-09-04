import { useState, useEffect } from 'react';
import { CheckSquare, Check, X, RefreshCw, RotateCcw, ZoomIn } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

export default function ValidarEvidencias() {
  const { toasts, addToast, removeToast } = useToast();
  const [evidencias, setEvidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [procesando, setProcesando] = useState(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState(null);

  // Rejection modal state
  const [modalRechazo, setModalRechazo] = useState(null);
  const [comentario, setComentario] = useState('');

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await api.get('/evidencia/pendientes');
      setEvidencias(r.data.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al cargar evidencias', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const validar = async (id, estado, motivo) => {
    setProcesando(id);
    try {
      await api.patch(`/evidencia/${id}/validar`, { estado, comentario: motivo });
      const label = estado === 'aprobado' ? 'aprobada' : estado === 'rechazado' ? 'rechazada' : 'marcada para re-captura';
      addToast(`Evidencia ${label}`, 'success');
      setEvidencias(prev => prev.filter(e => e.evidencia_fotografica_nro !== id));
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al validar', 'error');
    } finally {
      setProcesando(null);
    }
  };

  const abrirModalRechazo = (ev) => {
    setModalRechazo(ev);
    setComentario('');
  };

  const confirmarRechazo = () => {
    if (!comentario.trim()) {
      addToast('El motivo de rechazo es requerido', 'error');
      return;
    }
    validar(modalRechazo.evidencia_fotografica_nro, 'rechazado', comentario);
    setModalRechazo(null);
    setComentario('');
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0 }}>
          <CheckSquare size={20} />
          Revisiones Pendientes
        </h1>
        <button className="btn btn-secondary" onClick={cargar} disabled={loading} style={{ height: 36 }}>
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)', padding: 32, textAlign: 'center' }}>Cargando evidencias...</div>
      ) : evidencias.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
          No hay evidencias pendientes de validación.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {evidencias.map(ev => (
            <div key={ev.evidencia_fotografica_nro} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setLightbox(ev.evidencia_fotografica_url_foto)}>
                <img
                  src={ev.evidencia_fotografica_url_foto}
                  alt="Evidencia"
                  style={{ width: '100%', height: 200, objectFit: 'cover', display: 'block' }}
                  onError={e => { e.target.style.display = 'none'; }}
                />
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0)', transition: 'background 0.15s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
                >
                  <ZoomIn size={28} color="#fff" style={{ opacity: 0.8 }} />
                </div>
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <Badge value={ev.evidencia_fotografica_estado_aprobacion} />
                </div>
              </div>

              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  {ev.HitoTecnico?.hito_tecnico_nombre_hito || 'Sin hito'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                  Proyecto: {ev.HitoTecnico?.proyecto_codigo_correlativo}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  {new Date(ev.evidencia_fotografica_fecha_captura).toLocaleString('es-CL')}
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
                  Coord: {parseFloat(ev.evidencia_fotografica_latitud).toFixed(4)}, {parseFloat(ev.evidencia_fotografica_longitud).toFixed(4)}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-success"
                    style={{ flex: 1, minWidth: 90, height: 36, fontSize: 12, justifyContent: 'center' }}
                    onClick={() => validar(ev.evidencia_fotografica_nro, 'aprobado', '')}
                    disabled={procesando === ev.evidencia_fotografica_nro}
                  >
                    <Check size={13} /> Aprobar
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1, minWidth: 90, height: 36, fontSize: 12, justifyContent: 'center' }}
                    onClick={() => abrirModalRechazo(ev)}
                    disabled={procesando === ev.evidencia_fotografica_nro}
                  >
                    <X size={13} /> Rechazar
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1, minWidth: 90, height: 36, fontSize: 12, justifyContent: 'center' }}
                    onClick={() => validar(ev.evidencia_fotografica_nro, 're_captura', 'Foto ilegible, se solicita re-captura')}
                    disabled={procesando === ev.evidencia_fotografica_nro}
                    title="Foto ilegible - solicitar nueva captura"
                  >
                    <RotateCcw size={13} /> Re-captura
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }}
        >
          <img
            src={lightbox}
            alt="Vista completa"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 6, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 4, padding: '6px 8px', cursor: 'pointer', color: 'var(--color-text-primary)'
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Modal rechazo */}
      {modalRechazo && (
        <div
          onClick={() => setModalRechazo(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }}
        >
          <div
            className="card"
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 440, padding: 24 }}
          >
            <h2 style={{ fontSize: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <X size={16} color="var(--color-danger)" />
              Rechazar evidencia
            </h2>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              Hito: <strong style={{ color: 'var(--color-text-primary)' }}>
                {modalRechazo.HitoTecnico?.hito_tecnico_nombre_hito}
              </strong>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Proyecto: {modalRechazo.HitoTecnico?.proyecto_codigo_correlativo}
            </div>
            <div className="form-group">
              <label className="form-label">Motivo del rechazo *</label>
              <textarea
                className="form-textarea"
                placeholder="Describe el motivo del rechazo para notificar al supervisor..."
                value={comentario}
                onChange={e => setComentario(e.target.value)}
                rows={4}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button className="btn btn-secondary" onClick={() => setModalRechazo(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={confirmarRechazo} disabled={!comentario.trim()}>
                <X size={13} /> Confirmar rechazo
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
