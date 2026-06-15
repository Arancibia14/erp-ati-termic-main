import { useState, useEffect } from 'react';
import { MessageSquare, Send, Paperclip } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const TIPOS = ['Reunión', 'Correo', 'Llamada', 'Acta', 'Visita a Terreno', 'Otro'];

export default function Comunicacion() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState('');
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [adjunto, setAdjunto] = useState(null);
  const [form, setForm] = useState({
    tipo: '',
    fecha: new Date().toISOString().split('T')[0],
    participantes: '',
    descripcion: ''
  });

  useEffect(() => {
    api.get('/mano-obra/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  const cargarHistorial = codigo => {
    if (!codigo) { setHistorial([]); return; }
    setLoadingHistorial(true);
    api.get(`/comunicacion/${codigo}/historial`)
      .then(r => setHistorial(r.data.data))
      .catch(() => addToast('Error al cargar historial', 'error'))
      .finally(() => setLoadingHistorial(false));
  };

  const handleProyecto = e => {
    setCodigoSeleccionado(e.target.value);
    cargarHistorial(e.target.value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!codigoSeleccionado) { addToast('Selecciona un proyecto', 'error'); return; }
    if (!form.tipo || !form.descripcion.trim()) {
      addToast('Tipo y descripción son obligatorios', 'error'); return;
    }
    if (adjunto && adjunto.size > 10 * 1024 * 1024) {
      addToast('El archivo adjunto no puede superar 10 MB', 'error'); return;
    }

    const fd = new FormData();
    fd.append('tipo', form.tipo);
    fd.append('fecha', form.fecha);
    fd.append('participantes', form.participantes);
    fd.append('descripcion', form.descripcion);
    fd.append('proyecto_codigo_correlativo', codigoSeleccionado);
    if (adjunto) fd.append('adjunto', adjunto);

    setLoading(true);
    try {
      await api.post('/comunicacion', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      addToast('Comunicación registrada exitosamente', 'success');
      setForm({ tipo: '', fecha: new Date().toISOString().split('T')[0], participantes: '', descripcion: '' });
      setAdjunto(null);
      cargarHistorial(codigoSeleccionado);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar comunicación', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <MessageSquare size={20} />
        Bitácora de Comunicaciones
      </h1>

      <div className="layout-split" style={{ maxWidth: 1000 }}>
        {/* Formulario */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Nueva Comunicación
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Proyecto</label>
              <select className="form-select" value={codigoSeleccionado} onChange={handleProyecto}>
                <option value="">Selecciona un proyecto...</option>
                {proyectos.map(p => (
                  <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                    {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Comunicación</label>
              <select
                className="form-select"
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              >
                <option value="">Selecciona un tipo...</option>
                {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-input"
                value={form.fecha}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Participantes</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombres separados por coma..."
                value={form.participantes}
                onChange={e => setForm(f => ({ ...f, participantes: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Descripción / Acuerdos</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Detalla los acuerdos, decisiones y puntos clave tratados..."
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Adjunto (opcional, máx. 10MB)</label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: 13,
                color: adjunto ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
              }}>
                <Paperclip size={14} />
                {adjunto ? adjunto.name : 'Seleccionar archivo...'}
                <input
                  type="file"
                  style={{ display: 'none' }}
                  onChange={e => setAdjunto(e.target.files[0] || null)}
                />
              </label>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Send size={15} />
              {loading ? 'Registrando...' : 'Registrar Comunicación'}
            </button>
          </form>
        </div>

        {/* Historial */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Historial {codigoSeleccionado ? `(${historial.length})` : ''}
            </h3>
          </div>

          {!codigoSeleccionado && (
            <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
              Selecciona un proyecto para ver el historial
            </p>
          )}
          {loadingHistorial && (
            <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
          )}
          {!loadingHistorial && codigoSeleccionado && historial.length === 0 && (
            <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
              Sin comunicaciones registradas
            </p>
          )}

          <div style={{ maxHeight: 500, overflowY: 'auto' }}>
            {historial.map(c => (
              <div
                key={c.bitacora_comunicacion_id}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <Badge value={c.bitacora_comunicacion_tipo} />
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {new Date(c.bitacora_comunicacion_fecha).toLocaleDateString('es-CL')}
                  </span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 4, color: 'var(--color-text-primary)' }}>
                  {c.bitacora_comunicacion_descripcion}
                </p>
                {c.bitacora_comunicacion_participantes && (
                  <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    👥 {c.bitacora_comunicacion_participantes}
                  </p>
                )}
                {c.bitacora_comunicacion_url_adjunto && (
                  <a
                    href={c.bitacora_comunicacion_url_adjunto}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 11, color: 'var(--color-blue)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}
                  >
                    <Paperclip size={11} /> Ver adjunto
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
