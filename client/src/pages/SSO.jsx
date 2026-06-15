import { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Trash2, Send, Camera, X } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const GRAVEDADES = ['leve', 'grave', 'fatal'];
const TIPOS = ['Accidente', 'Incidente', 'Enfermedad Laboral'];

export default function SSO() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [form, setForm] = useState({
    proyecto_codigo_correlativo: '',
    incidente_sso_descripcion: '',
    incidente_sso_gravedad: 'leve',
    incidente_sso_tipo: '',
    incidente_sso_lugar: '',
    incidente_sso_fecha_hora: new Date().toISOString().slice(0, 16)
  });
  const [involucrados, setInvolucrados] = useState([]);
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/sso/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  useEffect(() => {
    if (!form.proyecto_codigo_correlativo) { setTrabajadores([]); return; }
    api.get(`/sso/trabajadores/${form.proyecto_codigo_correlativo}`)
      .then(r => setTrabajadores(r.data.data))
      .catch(() => addToast('Error al cargar trabajadores', 'error'));
  }, [form.proyecto_codigo_correlativo]);

  const addInvolucrado = () => {
    setInvolucrados(prev => [...prev, { rut: '', dias_perdidos: 0, riesgo_potencial: '' }]);
  };

  const removeInvolucrado = idx => {
    setInvolucrados(prev => prev.filter((_, i) => i !== idx));
  };

  const updateInvolucrado = (idx, field, value) => {
    setInvolucrados(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.proyecto_codigo_correlativo || !form.incidente_sso_descripcion || !form.incidente_sso_gravedad || !form.incidente_sso_tipo) {
      addToast('Proyecto, tipo de incidente, descripción y gravedad son obligatorios', 'error'); return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    data.append('trabajadores_involucrados', JSON.stringify(involucrados));
    fotos.forEach(f => data.append('fotos', f));

    setLoading(true);
    try {
      const res = await api.post('/sso/incidente', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      addToast(`Incidente SSO registrado. Folio #${res.data.data.incidente_sso_id}`, 'success');
      setForm(f => ({ ...f, incidente_sso_descripcion: '', incidente_sso_gravedad: 'leve', incidente_sso_tipo: '', incidente_sso_lugar: '', proyecto_codigo_correlativo: '' }));
      setInvolucrados([]);
      setFotos([]);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar incidente', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <AlertTriangle size={20} />
        Registrar Incidente SSO
      </h1>

      <div className="card" style={{ maxWidth: 720 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Proyecto</label>
              <select
                className="form-select"
                value={form.proyecto_codigo_correlativo}
                onChange={e => setForm(f => ({ ...f, proyecto_codigo_correlativo: e.target.value }))}
              >
                <option value="">Selecciona...</option>
                {proyectos.map(p => (
                  <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                    {p.proyecto_codigo_correlativo}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tipo de Incidente *</label>
              <select
                className="form-select"
                value={form.incidente_sso_tipo}
                onChange={e => setForm(f => ({ ...f, incidente_sso_tipo: e.target.value }))}
              >
                <option value="">Selecciona...</option>
                {TIPOS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Gravedad *</label>
              <select
                className="form-select"
                value={form.incidente_sso_gravedad}
                onChange={e => setForm(f => ({ ...f, incidente_sso_gravedad: e.target.value }))}
              >
                {GRAVEDADES.map(g => (
                  <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Lugar dentro de la Obra</label>
              <select
                className="form-select"
                value={form.incidente_sso_lugar}
                onChange={e => setForm(f => ({ ...f, incidente_sso_lugar: e.target.value }))}
              >
                <option value="No asignado">No asignado</option>
                <option value="Sala de máquinas">Sala de máquinas</option>
                <option value="Techo / Cubierta">Techo / Cubierta</option>
                <option value="Área de ductos">Área de ductos</option>
                <option value="Bodega">Bodega</option>
                <option value="Acceso / Pasillo">Acceso / Pasillo</option>
                <option value="Exterior obra">Exterior obra</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Fecha y Hora del Incidente</label>
            <input
              type="datetime-local"
              className="form-input"
              value={form.incidente_sso_fecha_hora}
              onChange={e => setForm(f => ({ ...f, incidente_sso_fecha_hora: e.target.value }))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Descripción del Incidente</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Describa qué ocurrió, lugar exacto, condiciones del ambiente..."
              value={form.incidente_sso_descripcion}
              onChange={e => setForm(f => ({ ...f, incidente_sso_descripcion: e.target.value }))}
            />
          </div>

          {/* Trabajadores involucrados */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span className="form-label" style={{ margin: 0 }}>Trabajadores Involucrados (opcional)</span>
              <button type="button" className="btn btn-secondary" style={{ height: 32, padding: '0 12px', fontSize: 13 }} onClick={addInvolucrado}>
                <Plus size={14} /> Agregar
              </button>
            </div>

            {involucrados.map((inv, idx) => (
              <div key={idx} className="involucrado-grid" style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-border)',
                borderRadius: 4, padding: '12px 14px', marginBottom: 8,
              }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>RUT Trabajador</label>
                  <select
                    className="form-select"
                    value={inv.rut}
                    onChange={e => updateInvolucrado(idx, 'rut', e.target.value)}
                  >
                    <option value="">Selecciona...</option>
                    {trabajadores.map(t => (
                      <option key={t.trabajador_rut} value={t.trabajador_rut}>
                        {t.trabajador_rut} — {t.trabajador_nombres}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Días perdidos</label>
                  <input type="number" min="0" className="form-input" value={inv.dias_perdidos}
                    onChange={e => updateInvolucrado(idx, 'dias_perdidos', e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>Riesgo potencial</label>
                  <input type="text" className="form-input" placeholder="Describe el riesgo..."
                    value={inv.riesgo_potencial}
                    onChange={e => updateInvolucrado(idx, 'riesgo_potencial', e.target.value)} />
                </div>
                <button type="button" onClick={() => removeInvolucrado(idx)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 4, alignSelf: 'center' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Adjuntar fotos */}
          <div style={{ marginBottom: 16 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Camera size={14} />
              Fotos del Incidente (opcional, máx. 10)
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              id="sso-fotos-input"
              onChange={e => {
                const nuevas = Array.from(e.target.files);
                setFotos(prev => [...prev, ...nuevas].slice(0, 10));
                e.target.value = '';
              }}
            />
            <label
              htmlFor="sso-fotos-input"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', padding: '8px 14px',
                border: '1px dashed var(--color-border)',
                borderRadius: 4, fontSize: 13, color: 'var(--color-text-muted)',
                background: 'var(--color-bg-elevated)', marginBottom: fotos.length ? 10 : 0
              }}
            >
              <Camera size={15} />
              Seleccionar fotos
            </label>

            {fotos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {fotos.map((f, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img
                      src={URL.createObjectURL(f)}
                      alt=""
                      style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-border)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))}
                      style={{
                        position: 'absolute', top: -6, right: -6,
                        background: 'var(--color-danger)', border: 'none',
                        borderRadius: '50%', width: 18, height: 18,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                      }}
                    >
                      <X size={10} color="#fff" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={15} />
            {loading ? 'Registrando...' : 'Registrar Incidente'}
          </button>
        </form>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
