import { useState, useEffect } from 'react';
import { Shield, Upload, User } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

export default function Polizas() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState('');
  const [loadingTrabajadores, setLoadingTrabajadores] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdf, setPdf] = useState(null);
  const [form, setForm] = useState({ trabajador_rut: '', fecha_vencimiento: '' });

  useEffect(() => {
    api.get('/mano-obra/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  const handleProyecto = e => {
    const codigo = e.target.value;
    setCodigoSeleccionado(codigo);
    setForm(f => ({ ...f, trabajador_rut: '' }));
    setTrabajadores([]);
    if (!codigo) return;
    setLoadingTrabajadores(true);
    api.get(`/mano-obra/${codigo}/trabajadores`)
      .then(r => setTrabajadores(r.data.data))
      .catch(() => addToast('Error al cargar trabajadores', 'error'))
      .finally(() => setLoadingTrabajadores(false));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!codigoSeleccionado || !form.trabajador_rut || !form.fecha_vencimiento) {
      addToast('Proyecto, trabajador y fecha de vencimiento son obligatorios', 'error'); return;
    }
    if (!pdf) {
      addToast('Debes adjuntar el PDF de la póliza', 'error'); return;
    }
    if (pdf.size > 10 * 1024 * 1024) {
      addToast('El PDF no puede superar 10 MB', 'error'); return;
    }
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    if (new Date(form.fecha_vencimiento) <= hoy) {
      addToast('La fecha de vencimiento debe ser futura', 'error'); return;
    }

    const fd = new FormData();
    fd.append('trabajador_rut', form.trabajador_rut);
    fd.append('proyecto_codigo_correlativo', codigoSeleccionado);
    fd.append('fecha_vencimiento', form.fecha_vencimiento);
    fd.append('pdf', pdf);

    setLoading(true);
    try {
      await api.post('/poliza', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      addToast('Póliza registrada exitosamente', 'success');
      setForm(f => ({ ...f, trabajador_rut: '', fecha_vencimiento: '' }));
      setPdf(null);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar póliza', 'error');
    } finally {
      setLoading(false);
    }
  };

  const trabajadorSeleccionado = trabajadores.find(t => t.trabajador_rut === form.trabajador_rut);

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Shield size={20} />
        Pólizas de Seguro por Faena
      </h1>

      <div className="card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Proyecto / Faena</label>
            <select className="form-select" value={codigoSeleccionado} onChange={handleProyecto}>
              <option value="">Selecciona un proyecto...</option>
              {proyectos.map(p => (
                <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                  {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                </option>
              ))}
            </select>
          </div>

          {codigoSeleccionado && (
            <div className="form-group">
              <label className="form-label">Trabajador</label>
              {loadingTrabajadores ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando trabajadores...</p>
              ) : trabajadores.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Sin trabajadores asignados a este proyecto
                </p>
              ) : (
                <select
                  className="form-select"
                  value={form.trabajador_rut}
                  onChange={e => setForm(f => ({ ...f, trabajador_rut: e.target.value }))}
                >
                  <option value="">Selecciona un trabajador...</option>
                  {trabajadores.map(t => (
                    <option key={t.trabajador_rut} value={t.trabajador_rut}>
                      {t.trabajador_nombres} ({t.trabajador_rut})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {trabajadorSeleccionado && (
            <div style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <User size={14} color="var(--color-text-muted)" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{trabajadorSeleccionado.trabajador_nombres}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {trabajadorSeleccionado.trabajador_correo} · {trabajadorSeleccionado.trabajador_telefono}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Fecha de Vencimiento de la Cobertura</label>
            <input
              type="date"
              className="form-input"
              value={form.fecha_vencimiento}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Archivo PDF de la Póliza</label>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 14px',
              background: 'var(--color-bg-elevated)',
              border: `1px dashed ${pdf ? 'var(--color-green)' : 'var(--color-border)'}`,
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: 13,
              color: pdf ? 'var(--color-green)' : 'var(--color-text-muted)'
            }}>
              <Upload size={14} />
              {pdf ? pdf.name : 'Seleccionar PDF...'}
              <input
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={e => setPdf(e.target.files[0] || null)}
              />
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Shield size={15} />
            {loading ? 'Registrando...' : 'Registrar Póliza'}
          </button>
        </form>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
