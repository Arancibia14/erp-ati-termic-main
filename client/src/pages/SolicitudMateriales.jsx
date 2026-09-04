import { useState, useEffect, useMemo } from 'react';
import { ClipboardList, Send, Search, X } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const ESTADO_LABELS = {
  pendiente: 'Pendiente de Validación'
};

export default function SolicitudMateriales() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [misSolicitudes, setMisSolicitudes] = useState([]);
  const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [proyectoSeleccionado, setProyectoSeleccionado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [esSolicitudEspecial, setEsSolicitudEspecial] = useState(false);
  const [descripcionEspecial, setDescripcionEspecial] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const proyectosEnEjecucion = useMemo(
    () => proyectos.filter(p => p.EstadoProyecto?.estado_proyecto_nombre === 'En Ejecución'),
    [proyectos]
  );

  const materialesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return materiales.filter(m =>
      m.material_nombre.toLowerCase().includes(q) ||
      m.material_codigo_sku.toLowerCase().includes(q)
    );
  }, [busqueda, materiales]);

  const cargarMisSolicitudes = () => {
    setLoadingSolicitudes(true);
    api.get('/solicitud-material/mis-solicitudes')
      .then(r => setMisSolicitudes(r.data.data))
      .catch(() => addToast('Error al cargar tus solicitudes', 'error'))
      .finally(() => setLoadingSolicitudes(false));
  };

  useEffect(() => {
    api.get('/setup/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
    api.get('/material')
      .then(r => setMateriales(r.data.data))
      .catch(() => addToast('Error al cargar el catálogo de materiales', 'error'));
    cargarMisSolicitudes();
  }, []);

  const seleccionarMaterial = m => {
    setMaterialSeleccionado(m);
    setBusqueda(`${m.material_codigo_sku} — ${m.material_nombre}`);
    setEsSolicitudEspecial(false);
  };

  const activarSolicitudEspecial = () => {
    setMaterialSeleccionado(null);
    setBusqueda('');
    setDescripcionEspecial('');
    setEsSolicitudEspecial(true);
  };

  const cancelarSolicitudEspecial = () => {
    setEsSolicitudEspecial(false);
    setDescripcionEspecial('');
  };

  const limpiarFormulario = () => {
    setProyectoSeleccionado('');
    setBusqueda('');
    setMaterialSeleccionado(null);
    setEsSolicitudEspecial(false);
    setDescripcionEspecial('');
    setCantidad('');
    setObservaciones('');
  };

  const enviarSolicitud = () => {
    const descripcionBase = esSolicitudEspecial
      ? descripcionEspecial.trim()
      : materialSeleccionado
        ? `${materialSeleccionado.material_codigo_sku} — ${materialSeleccionado.material_nombre} (${materialSeleccionado.material_unidad_medida})`
        : '';

    if (!proyectoSeleccionado || !descripcionBase || !cantidad) {
      addToast('Proyecto, material/descripción y cantidad son obligatorios', 'error');
      return;
    }

    const descripcionFinal = observaciones.trim()
      ? `${descripcionBase} — Observaciones: ${observaciones.trim()}`
      : descripcionBase;

    setEnviando(true);
    api.post('/solicitud-material', {
      descripcion: descripcionFinal,
      cantidad: parseInt(cantidad),
      proyecto_codigo_correlativo: proyectoSeleccionado,
      material_id: esSolicitudEspecial ? null : materialSeleccionado?.material_id
    })
      .then(() => {
        addToast('Solicitud enviada para validación', 'success');
        limpiarFormulario();
        cargarMisSolicitudes();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al enviar la solicitud', 'error'))
      .finally(() => setEnviando(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ClipboardList size={20} />
        Nueva Solicitud de Materiales
      </h1>

      <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Nueva Solicitud de Materiales
        </h3>

        <div className="form-group">
          <label className="form-label">Proyecto</label>
          <select
            className="form-select"
            value={proyectoSeleccionado}
            onChange={e => setProyectoSeleccionado(e.target.value)}
          >
            <option value="">Selecciona un proyecto en ejecución...</option>
            {proyectosEnEjecucion.map(p => (
              <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
              </option>
            ))}
          </select>
        </div>

        {!esSolicitudEspecial ? (
          <>
            <div className="form-group">
              <label className="form-label">Buscar Material (nombre o SKU)</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--color-text-muted)' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="Ej: Tubería de cobre o MAT-001..."
                  value={busqueda}
                  onChange={e => { setBusqueda(e.target.value); setMaterialSeleccionado(null); }}
                />
              </div>
              {busqueda.trim() && !materialSeleccionado && (
                <div style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  marginTop: 6,
                  maxHeight: 180,
                  overflowY: 'auto'
                }}>
                  {materialesFiltrados.length === 0 ? (
                    <p style={{ padding: 12, fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                      Material no encontrado en el catálogo.
                    </p>
                  ) : (
                    materialesFiltrados.map(m => (
                      <button
                        key={m.material_id}
                        onClick={() => seleccionarMaterial(m)}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 12px',
                          background: 'transparent', border: 'none',
                          borderBottom: '1px solid var(--color-border)',
                          cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: 13
                        }}
                      >
                        <strong>{m.material_codigo_sku}</strong> — {m.material_nombre}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {materialSeleccionado && (
              <div style={{
                background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
                borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12
              }}>
                <div style={{ color: 'var(--color-text-secondary)' }}>Descripción técnica</div>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{materialSeleccionado.material_nombre}</div>
                <div style={{ color: 'var(--color-text-secondary)' }}>Unidad de medida: <strong>{materialSeleccionado.material_unidad_medida}</strong></div>
              </div>
            )}

            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginBottom: 16 }}
              onClick={activarSolicitudEspecial}
            >
              Solicitud Especial
            </button>
          </>
        ) : (
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              Solicitud Especial (material no está en el catálogo)
              <button
                type="button"
                onClick={cancelarSolicitudEspecial}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex' }}
              >
                <X size={14} />
              </button>
            </label>
            <textarea
              className="form-textarea"
              placeholder="Describe el material que necesitas..."
              value={descripcionEspecial}
              onChange={e => setDescripcionEspecial(e.target.value)}
            />
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Cantidad</label>
          <input
            type="number"
            min="1"
            className="form-input"
            value={cantidad}
            onChange={e => setCantidad(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Observaciones (opcional)</label>
          <textarea
            className="form-textarea"
            value={observaciones}
            onChange={e => setObservaciones(e.target.value)}
          />
        </div>

        <button className="btn btn-primary" onClick={enviarSolicitud} disabled={enviando}>
          <Send size={15} />
          {enviando ? 'Enviando...' : 'Enviar para Validación'}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mis Solicitudes
          </h3>
        </div>
        {loadingSolicitudes ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
        ) : misSolicitudes.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
            No has enviado solicitudes de materiales
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Proyecto</th>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {misSolicitudes.map(s => (
                  <tr key={s.solicitud_material_id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>#{s.solicitud_material_id}</td>
                    <td style={{ fontSize: 13 }}>{s.Proyecto?.proyecto_nombre_obra || s.proyecto_codigo_correlativo}</td>
                    <td style={{ fontSize: 13 }}>{s.solicitud_material_descripcion}</td>
                    <td style={{ fontSize: 13 }}>{s.solicitud_material_cantidad}</td>
                    <td><Badge value={ESTADO_LABELS[s.solicitud_material_estado] || s.solicitud_material_estado} /></td>
                    <td style={{ fontSize: 13 }}>{s.solicitud_material_fecha}</td>
                  </tr>
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
