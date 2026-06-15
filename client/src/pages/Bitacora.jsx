import { useState, useEffect } from 'react';
import { BookOpen, Plus, Send, X, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const DRAFT_KEY = 'erp_bitacora_draft';

export default function Bitacora() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState('');
  const [bitacoras, setBitacoras] = useState([]);
  const [loadingLista, setLoadingLista] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    bitacora_diaria_descripcion_actividad: '',
    bitacora_diaria_fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    api.get('/bitacora/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));

    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        setForm(f => ({ ...f, bitacora_diaria_descripcion_actividad: parsed.bitacora_diaria_descripcion_actividad || '' }));
        setMostrarForm(true);
        if (parsed.proyecto_codigo_correlativo) setCodigoSeleccionado(parsed.proyecto_codigo_correlativo);
        addToast('Borrador restaurado. Puedes continuar donde lo dejaste.', 'warning');
      }
    } catch {}
  }, []);

  const cargarBitacoras = codigo => {
    if (!codigo) { setBitacoras([]); return; }
    setLoadingLista(true);
    api.get(`/bitacora/${codigo}`)
      .then(r => setBitacoras(r.data.data))
      .catch(() => addToast('Error al cargar bitácoras', 'error'))
      .finally(() => setLoadingLista(false));
  };

  const handleProyecto = e => {
    const codigo = e.target.value;
    setCodigoSeleccionado(codigo);
    setMostrarForm(false);
    cargarBitacoras(codigo);
  };

  const abrirNueva = () => {
    setForm({ bitacora_diaria_descripcion_actividad: '', bitacora_diaria_fecha: new Date().toISOString().split('T')[0] });
    setMostrarForm(true);
  };

  const cancelar = () => {
    setMostrarForm(false);
    localStorage.removeItem(DRAFT_KEY);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!codigoSeleccionado) { addToast('Selecciona un proyecto', 'error'); return; }
    if (form.bitacora_diaria_descripcion_actividad.trim().length < 10) {
      addToast('La descripción debe tener al menos 10 caracteres', 'error'); return;
    }
    setLoading(true);
    try {
      await api.post('/bitacora', { ...form, proyecto_codigo_correlativo: codigoSeleccionado });
      addToast('Bitácora registrada exitosamente', 'success');
      localStorage.removeItem(DRAFT_KEY);
      setMostrarForm(false);
      cargarBitacoras(codigoSeleccionado);
    } catch (err) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, proyecto_codigo_correlativo: codigoSeleccionado }));
      addToast((err.response?.data?.error || 'Error al registrar') + ' — Borrador guardado localmente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const proyectoSeleccionado = proyectos.find(p => p.proyecto_codigo_correlativo === codigoSeleccionado);

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BookOpen size={20} />
        Bitácora Técnica Diaria
      </h1>

      {/* Selector proyecto */}
      <div className="card" style={{ maxWidth: 680, marginBottom: 20 }}>
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
        {proyectoSeleccionado && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Estado:</span>
            <Badge value={proyectoSeleccionado.EstadoProyecto?.estado_proyecto_nombre} />
          </div>
        )}
      </div>

      {/* Botón Nueva Bitácora */}
      {codigoSeleccionado && !mostrarForm && (
        <div style={{ maxWidth: 680, marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={abrirNueva}>
            <Plus size={15} />
            Nueva Bitácora Diaria
          </button>
        </div>
      )}

      {/* Formulario nueva bitácora */}
      {mostrarForm && (
        <div className="card" style={{ maxWidth: 680, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nueva Bitácora Diaria
            </h3>
            <button onClick={cancelar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-input"
                value={form.bitacora_diaria_fecha}
                onChange={e => setForm(f => ({ ...f, bitacora_diaria_fecha: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Descripción de Actividades</label>
              <textarea
                className="form-textarea"
                rows={5}
                placeholder="Describa detalladamente las actividades realizadas hoy en terreno..."
                value={form.bitacora_diaria_descripcion_actividad}
                onChange={e => setForm(f => ({ ...f, bitacora_diaria_descripcion_actividad: e.target.value }))}
              />
              <span style={{ fontSize: 12, color: form.bitacora_diaria_descripcion_actividad.length < 10 ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                {form.bitacora_diaria_descripcion_actividad.length} caracteres (mínimo 10)
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Send size={15} />
                {loading ? 'Registrando...' : 'Registrar Bitácora'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelar}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de bitácoras */}
      {codigoSeleccionado && (
        <div style={{ maxWidth: 680 }}>
          {loadingLista && <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando bitácoras...</p>}
          {!loadingLista && bitacoras.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>
              No hay bitácoras registradas para este proyecto.
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bitacoras.map(b => (
              <div key={b.bitacora_diaria_id} className="card" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>
                    {new Date(b.bitacora_diaria_fecha + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {b.usuario_rut}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                  {b.bitacora_diaria_descripcion_actividad}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
