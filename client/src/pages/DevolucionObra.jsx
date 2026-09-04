import { useState, useEffect } from 'react';
import { Undo2, Send } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

const FORM_VACIO = { fase: '', material_id: '', cantidad: '', estado_fisico: 'Operativo', observacion: '' };

export default function DevolucionObra() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [proyecto, setProyecto] = useState('');
  const [materiales, setMateriales] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [despacho, setDespacho] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [vale, setVale] = useState(null);
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    api.get('/portafolio')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  const cargarHistorial = codigo => {
    if (!codigo) { setHistorial([]); return; }
    api.get('/devolucion-obra/historial', { params: { proyecto: codigo } })
      .then(r => setHistorial(r.data.data))
      .catch(() => setHistorial([]));
  };

  const elegirProyecto = codigo => {
    setProyecto(codigo);
    setForm(FORM_VACIO);
    setDespacho(null);
    setVale(null);
    setMateriales([]);
    if (!codigo) return;
    api.get('/devolucion-obra/materiales', { params: { proyecto: codigo } })
      .then(r => setMateriales(r.data.data))
      .catch(() => addToast('Error al cargar materiales despachados', 'error'));
    cargarHistorial(codigo);
  };

  const elegirMaterial = id => {
    setForm(f => ({ ...f, material_id: id }));
    setDespacho(null);
    if (!id) return;
    api.get('/devolucion-obra/despachado', { params: { proyecto, material: id } })
      .then(r => setDespacho(r.data.data))
      .catch(() => setDespacho(null));
  };

  const confirmar = () => {
    if (!proyecto || !form.material_id || !form.cantidad || !form.estado_fisico) {
      addToast('Selecciona proyecto, material, cantidad y estado físico', 'error');
      return;
    }
    if (form.estado_fisico === 'Dañado' && !form.observacion.trim()) {
      addToast('El material está dañado: la observación es obligatoria.', 'error');
      return;
    }
    setEnviando(true);
    setVale(null);
    api.post('/devolucion-obra', {
      proyecto,
      fase: form.fase,
      material_id: form.material_id,
      cantidad: parseInt(form.cantidad),
      estado_fisico: form.estado_fisico,
      observacion: form.observacion
    })
      .then(r => {
        addToast(r.data.data?.mensaje || 'Reingreso procesado exitosamente', 'success');
        setVale({ numero: r.data.data?.vale, monto_rebajado: r.data.data?.monto_rebajado || 0 });
        setForm(FORM_VACIO);
        setDespacho(null);
        cargarHistorial(proyecto);
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al registrar el reingreso', 'error'))
      .finally(() => setEnviando(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Undo2 size={20} />
        Devolución de Obra
      </h1>

      <div className="card" style={{ maxWidth: 640, marginBottom: 20 }}>
        <div className="form-group">
          <label className="form-label">Proyecto / Obra</label>
          <select className="form-select" value={proyecto} onChange={e => elegirProyecto(e.target.value)}>
            <option value="">Selecciona un proyecto...</option>
            {proyectos.map(p => (
              <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
              </option>
            ))}
          </select>
        </div>

        {proyecto && (
          <>
            <div className="form-group">
              <label className="form-label">Fase terminada</label>
              <input className="form-input" placeholder="Ej. Montaje de ductos"
                     value={form.fase} onChange={e => setForm(f => ({ ...f, fase: e.target.value }))} />
            </div>

            <div className="form-group">
              <label className="form-label">Material a reintegrar</label>
              <select className="form-select" value={form.material_id} onChange={e => elegirMaterial(e.target.value)}>
                <option value="">Selecciona un material despachado...</option>
                {materiales.map(m => (
                  <option key={m.material_id} value={m.material_id}>
                    {m.material_codigo_sku} — {m.material_nombre}
                  </option>
                ))}
              </select>
              {materiales.length === 0 && (
                <span style={{ fontSize: 12, color: 'var(--color-warning)', display: 'block', marginTop: 6 }}>
                  No hay materiales despachados a esta obra (vía guía de despacho con OC).
                </span>
              )}
            </div>

            {despacho && (
              <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12 }}>
                Cantidad máxima despachada a la obra: <strong>{despacho.despachado}</strong> ·
                {' '}Ya devuelto: <strong>{despacho.ya_devuelto}</strong> ·
                {' '}Disponible para devolver: <strong>{despacho.disponible}</strong>
              </div>
            )}

            <div className="form-grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Cantidad sobrante</label>
                <input type="number" min="1" className="form-input"
                       value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Estado físico del material</label>
                <select className="form-select" value={form.estado_fisico}
                        onChange={e => setForm(f => ({ ...f, estado_fisico: e.target.value }))}>
                  <option value="Operativo">Operativo</option>
                  <option value="Dañado">Dañado</option>
                </select>
              </div>
            </div>

            {form.estado_fisico === 'Dañado' && (
              <div className="form-group">
                <label className="form-label">Observación (obligatoria)</label>
                <textarea className="form-input" rows={2}
                          value={form.observacion} onChange={e => setForm(f => ({ ...f, observacion: e.target.value }))} />
              </div>
            )}

            <button className="btn btn-primary" onClick={confirmar} disabled={enviando}>
              <Send size={14} />
              {enviando ? 'Procesando...' : 'Confirmar Reingreso'}
            </button>

            {vale && (
              <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(93,184,53,0.1)', border: '1px solid var(--color-green)', borderRadius: 4, fontSize: 13 }}>
                <div>Vale de devolución generado: <strong>{vale.numero}</strong></div>
                {vale.monto_rebajado > 0 ? (
                  <div style={{ marginTop: 4 }}>
                    Costo de la obra rebajado en: <strong>${Number(vale.monto_rebajado).toLocaleString('es-CL')}</strong>
                  </div>
                ) : (
                  <div style={{ marginTop: 4, color: 'var(--color-text-muted)' }}>
                    No se encontró un precio de referencia para este material en la Orden de Compra del proyecto; no se aplicó rebaje de costo.
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {proyecto && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Reingresos de esta obra
            </h3>
          </div>
          {historial.length === 0 ? (
            <p style={{ padding: 20, fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sin reingresos registrados.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr><th>Vale</th><th>Fecha</th><th>Fase</th><th>Material</th><th>Cantidad</th><th>Estado</th><th>Observación</th></tr>
                </thead>
                <tbody>
                  {historial.map(d => (
                    <tr key={d.devolucion_obra_id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.devolucion_obra_vale}</td>
                      <td style={{ fontSize: 12 }}>{d.devolucion_obra_fecha}</td>
                      <td style={{ fontSize: 12 }}>{d.devolucion_obra_fase || '—'}</td>
                      <td style={{ fontSize: 12 }}>{d.material_nombre}</td>
                      <td style={{ fontSize: 12 }}>{d.devolucion_obra_cantidad} {d.unidad}</td>
                      <td style={{ fontSize: 12 }}>{d.devolucion_obra_estado_fisico}</td>
                      <td style={{ fontSize: 12 }}>{d.devolucion_obra_observacion || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
