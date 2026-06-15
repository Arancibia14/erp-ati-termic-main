import { useState, useEffect } from 'react';
import { Image, Edit3, Save, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

export default function Portafolio() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editando, setEditando] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({ proyecto_nombre_obra: '', proyecto_correo_contacto: '', proyecto_descripcion_tecnica: '', proyecto_ubicacion: '' });

  useEffect(() => {
    cargarProyectos();
  }, []);

  const cargarProyectos = () => {
    setLoading(true);
    api.get('/portafolio')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar portafolio', 'error'))
      .finally(() => setLoading(false));
  };

  const abrirEdicion = p => {
    setEditando(p.proyecto_codigo_correlativo);
    setForm({
      proyecto_nombre_obra: p.proyecto_nombre_obra,
      proyecto_correo_contacto: p.proyecto_correo_contacto,
      proyecto_descripcion_tecnica: p.proyecto_descripcion_tecnica || '',
      proyecto_ubicacion: p.proyecto_ubicacion || ''
    });
    setImagenes([]);
  };

  const cerrarEdicion = () => {
    setEditando(null);
    setImagenes([]);
  };

  const handleImagenes = e => {
    const files = Array.from(e.target.files);
    const invalidas = files.filter(f => !/\.(jpg|jpeg|png|webp)$/i.test(f.name));
    if (invalidas.length > 0) {
      addToast('Solo se permiten imágenes JPG, PNG o WEBP', 'error');
      return;
    }
    const grandes = files.filter(f => f.size > 10 * 1024 * 1024);
    if (grandes.length > 0) {
      addToast('Cada imagen debe pesar menos de 10 MB', 'error');
      return;
    }
    setImagenes(files);
  };

  const guardar = async codigo => {
    setGuardando(true);
    try {
      const fd = new FormData();
      fd.append('proyecto_nombre_obra', form.proyecto_nombre_obra);
      fd.append('proyecto_correo_contacto', form.proyecto_correo_contacto);
      fd.append('proyecto_descripcion_tecnica', form.proyecto_descripcion_tecnica);
      fd.append('proyecto_ubicacion', form.proyecto_ubicacion);
      imagenes.forEach(img => fd.append('imagenes', img));

      await api.put(`/portafolio/${codigo}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      addToast('Portafolio actualizado exitosamente', 'success');
      cerrarEdicion();
      cargarProyectos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al actualizar', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Image size={20} />
        Portafolio de Obras
      </h1>

      {loading && <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Cargando proyectos...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        {proyectos.map(p => (
          <div key={p.proyecto_codigo_correlativo} className="card" style={{ padding: 0 }}>
            {/* Header de la tarjeta */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              cursor: 'pointer'
            }}
              onClick={() => editando === p.proyecto_codigo_correlativo ? cerrarEdicion() : abrirEdicion(p)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{p.proyecto_nombre_obra}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                      {p.proyecto_codigo_correlativo}
                    </span>
                    <Badge value={p.EstadoProyecto?.estado_proyecto_nombre} />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {parseFloat(p.proyecto_porcentaje_avance).toFixed(1)}% avance
                </span>
                {editando === p.proyecto_codigo_correlativo
                  ? <ChevronUp size={16} color="var(--color-text-muted)" />
                  : <ChevronDown size={16} color="var(--color-text-muted)" />
                }
              </div>
            </div>

            {/* Panel de edición */}
            {editando === p.proyecto_codigo_correlativo && (
              <div style={{ borderTop: '1px solid var(--color-border)', padding: 20 }}>
                <div className="form-grid-2" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Nombre / Título de Obra</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.proyecto_nombre_obra}
                      onChange={e => setForm(f => ({ ...f, proyecto_nombre_obra: e.target.value }))}
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Ubicación</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej: Santiago, Región Metropolitana"
                      value={form.proyecto_ubicacion}
                      onChange={e => setForm(f => ({ ...f, proyecto_ubicacion: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripción Técnica</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Describe el alcance técnico del proyecto, sistemas instalados, características especiales..."
                    value={form.proyecto_descripcion_tecnica}
                    onChange={e => setForm(f => ({ ...f, proyecto_descripcion_tecnica: e.target.value }))}
                  />
                </div>

                <div className="form-grid-2" style={{ marginBottom: 16 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Correo de Contacto</label>
                    <input
                      type="email"
                      className="form-input"
                      value={form.proyecto_correo_contacto}
                      onChange={e => setForm(f => ({ ...f, proyecto_correo_contacto: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Fotografías (JPG, PNG, WEBP — máx. 10MB c/u)</label>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: 'var(--color-bg-elevated)',
                    border: '1px dashed var(--color-border)',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                    color: imagenes.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)'
                  }}>
                    <Image size={14} />
                    {imagenes.length > 0
                      ? `${imagenes.length} imagen(es) seleccionada(s)`
                      : 'Seleccionar imágenes...'
                    }
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleImagenes}
                    />
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => guardar(p.proyecto_codigo_correlativo)}
                    disabled={guardando}
                  >
                    <Save size={15} />
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                  <button className="btn btn-secondary" onClick={cerrarEdicion}>
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {!loading && proyectos.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No hay proyectos registrados.</p>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
