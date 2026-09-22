import { useState, useEffect } from 'react';
import { PauseCircle, Send, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const MOTIVO_LARGO_MINIMO = 10;

export default function EstadoProyecto() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);

  const [deteniendoCodigo, setDeteniendoCodigo] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [errores, setErrores] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargarProyectos();
  }, []);

  const cargarProyectos = () => {
    setLoading(true);
    api.get('/bitacora/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'))
      .finally(() => setLoading(false));
  };

  const abrirDetencion = codigo => {
    setDeteniendoCodigo(codigo);
    setMotivo('');
    setErrores([]);
  };

  const cerrarDetencion = () => {
    setDeteniendoCodigo(null);
    setMotivo('');
    setErrores([]);
  };

  // CU12 - Registrando detención de proyecto
  const confirmarDetencion = async codigo => {
    const texto = motivo.trim();
    if (!texto) {
      setErrores(['motivo']);
      return addToast('El motivo de la detención es obligatorio', 'error');
    }
    if (texto.length < MOTIVO_LARGO_MINIMO) {
      setErrores(['motivo']);
      return addToast(`El motivo debe ser más descriptivo (mín. ${MOTIVO_LARGO_MINIMO} caracteres)`, 'error');
    }
    setErrores([]);
    setEnviando(true);
    try {
      const r = await api.put(`/portafolio/${codigo}/detener`, { motivo: texto });
      addToast(r.data.mensaje || 'Proyecto detenido correctamente', 'success');
      cerrarDetencion();
      cargarProyectos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al detener el proyecto', 'error');
      setErrores(err.response?.data?.campos || []);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <PauseCircle size={20} />
        Estado del Proyecto
      </h1>

      {loading && <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Cargando proyectos...</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
        {proyectos.map(p => {
          const estado = p.EstadoProyecto?.estado_proyecto_nombre;
          const abierto = deteniendoCodigo === p.proyecto_codigo_correlativo;
          return (
            <div key={p.proyecto_codigo_correlativo} className="card" style={{ padding: 0 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px'
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{p.proyecto_nombre_obra}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--color-text-muted)' }}>
                      {p.proyecto_codigo_correlativo}
                    </span>
                    <Badge value={estado} />
                  </div>
                </div>

                {estado === 'En Ejecución' && (
                  <button
                    className="btn btn-secondary"
                    style={{ fontSize: 12, color: 'var(--color-danger)' }}
                    onClick={() => abierto ? cerrarDetencion() : abrirDetencion(p.proyecto_codigo_correlativo)}
                  >
                    {abierto ? <ChevronUp size={14} /> : <PauseCircle size={14} />}
                    {abierto ? 'Cerrar' : 'Detener Proyecto'}
                  </button>
                )}
              </div>

              {abierto && (
                <div style={{
                  borderTop: '1px solid var(--color-border)',
                  padding: 20,
                  background: 'color-mix(in srgb, var(--color-danger) 6%, transparent)'
                }}>
                  <div className="form-group">
                    <label className="form-label">Motivo de la Detención</label>
                    <textarea
                      className={'form-textarea' + (errores.includes('motivo') ? ' is-invalid' : '')}
                      rows={3}
                      placeholder='Ej: "Falta de materiales críticos" o "Clima adverso"'
                      value={motivo}
                      onChange={e => { setMotivo(e.target.value); setErrores([]); }}
                    />
                    <span style={{ fontSize: 11, color: motivo.trim().length < MOTIVO_LARGO_MINIMO ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
                      {motivo.trim().length} caracteres (mínimo {MOTIVO_LARGO_MINIMO})
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => confirmarDetencion(p.proyecto_codigo_correlativo)}
                      disabled={enviando}
                    >
                      <Send size={15} />
                      {enviando ? 'Registrando...' : 'Confirmar Detención'}
                    </button>
                    <button className="btn btn-secondary" onClick={cerrarDetencion}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {!loading && proyectos.length === 0 && (
          <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No hay proyectos registrados.</p>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
