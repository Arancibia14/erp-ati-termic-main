import { useState, useEffect } from 'react';
import { TrendingUp, ArrowRight, Send } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

const fmt = n => n !== undefined && n !== null ? `$${parseFloat(n).toLocaleString('es-CL')}` : '--';

export default function ControlPresupuesto() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState('');
  const [datos, setDatos] = useState(null);
  const [loadingDatos, setLoadingDatos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ monto_nuevo: '', motivo: '' });

  useEffect(() => {
    api.get('/mano-obra/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  const cargarDatos = codigo => {
    if (!codigo) { setDatos(null); return; }
    setLoadingDatos(true);
    api.get(`/presupuesto/${codigo}`)
      .then(r => setDatos(r.data.data))
      .catch(() => addToast('Error al cargar presupuesto', 'error'))
      .finally(() => setLoadingDatos(false));
  };

  const handleProyecto = e => {
    setCodigoSeleccionado(e.target.value);
    setForm({ monto_nuevo: '', motivo: '' });
    cargarDatos(e.target.value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.monto_nuevo || !form.motivo.trim()) {
      addToast('El monto y la justificación son obligatorios', 'error'); return;
    }
    if (form.motivo.trim().length < 10) {
      addToast('La justificación debe ser más descriptiva (mín. 10 caracteres)', 'error'); return;
    }
    const monto = parseFloat(form.monto_nuevo);
    if (isNaN(monto) || monto <= 0) {
      addToast('El monto debe ser mayor a 0', 'error'); return;
    }
    setLoading(true);
    try {
      await api.post(`/presupuesto/${codigoSeleccionado}/cambio`, {
        monto_nuevo: monto,
        motivo: form.motivo
      });
      addToast('Cambio presupuestario registrado en el historial', 'success');
      setForm({ monto_nuevo: '', motivo: '' });
      cargarDatos(codigoSeleccionado);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar cambio', 'error');
    } finally {
      setLoading(false);
    }
  };

  const delta = datos && form.monto_nuevo
    ? parseFloat(form.monto_nuevo) - parseFloat(datos.presupuesto_actual)
    : null;

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <TrendingUp size={20} />
        Control de Cambios Presupuestarios
      </h1>

      <div className="card" style={{ maxWidth: 420, marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
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
      </div>

      {codigoSeleccionado && (
        <div className="layout-split" style={{ maxWidth: 900 }}>
          {/* Formulario de cambio */}
          <div className="card">
            <h3 style={{ marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Registrar Modificación
            </h3>

            {datos && (
              <div style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                padding: '12px 16px',
                marginBottom: 20
              }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                  Presupuesto Actual
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-green)' }}>
                  {fmt(datos.presupuesto_actual)}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Nuevo Monto ($)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  min="1"
                  value={form.monto_nuevo}
                  onChange={e => setForm(f => ({ ...f, monto_nuevo: e.target.value }))}
                />
                {delta !== null && (
                  <div style={{
                    marginTop: 6,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: delta > 0 ? 'var(--color-green)' : delta < 0 ? 'var(--color-danger)' : 'var(--color-text-muted)'
                  }}>
                    <ArrowRight size={12} />
                    {delta > 0 ? `+${fmt(delta)}` : fmt(delta)} respecto al actual
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Justificación (obligatoria)</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe el motivo del cambio presupuestario..."
                  value={form.motivo}
                  onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
                />
                <span style={{ fontSize: 11, color: form.motivo.length < 10 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                  {form.motivo.length} caracteres (mínimo 10)
                </span>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Send size={15} />
                {loading ? 'Registrando...' : 'Registrar Cambio'}
              </button>
            </form>
          </div>

          {/* Historial */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Historial de Cambios
              </h3>
            </div>
            {loadingDatos && (
              <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
            )}
            {!loadingDatos && datos?.historial?.length === 0 && (
              <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                Sin cambios registrados
              </p>
            )}
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {datos?.historial?.map((c, i) => {
                const variacion = parseFloat(c.control_cambio_ppto_monto_nuevo) - parseFloat(c.control_cambio_ppto_monto_anterior);
                const sube = variacion >= 0;
                return (
                  <div
                    key={i}
                    style={{
                      padding: '14px 20px',
                      borderBottom: '1px solid var(--color-border)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                        {new Date(c.control_cambio_ppto_fecha).toLocaleDateString('es-CL')}
                      </span>
                      <span style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: sube ? 'var(--color-green)' : 'var(--color-danger)'
                      }}>
                        {sube ? '+' : ''}{fmt(variacion)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>{fmt(c.control_cambio_ppto_monto_anterior)}</span>
                      <ArrowRight size={12} color="var(--color-text-muted)" />
                      <span style={{ fontWeight: 600 }}>{fmt(c.control_cambio_ppto_monto_nuevo)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {c.control_cambio_ppto_motivo}
                    </p>
                    {c.usuario_rut && (
                      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                        Por: {c.usuario_rut}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
