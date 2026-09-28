import { useState, useEffect } from 'react';
import { Users, Link2, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';
import Select from '../components/Select';

export default function SubcontratistasProyecto() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState('');
  const [entidades, setEntidades] = useState(null);
  const [proveedorRut, setProveedorRut] = useState('');
  const [rol, setRol] = useState('');
  const [invalidos, setInvalidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEntidades, setLoadingEntidades] = useState(false);

  useEffect(() => {
    api.get('/proyecto/proveedores')
      .then(r => setProveedores(r.data.data))
      .catch(() => addToast('Error al cargar proveedores', 'error'));
    api.get('/portafolio')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  useEffect(() => {
    if (!codigoSeleccionado) { setEntidades(null); return; }
    setLoadingEntidades(true);
    api.get(`/proyecto/config/${codigoSeleccionado}`)
      .then(r => { setEntidades(r.data.data); setProveedorRut(''); setRol(''); setInvalidos([]); })
      .catch(() => addToast('Error al cargar entidades del proyecto', 'error'))
      .finally(() => setLoadingEntidades(false));
  }, [codigoSeleccionado]);

  // CU15 - Una obra puede tener varios subcontratistas, cada uno con su rol
  const subcontratistas = entidades?.subcontratistas || [];

  const handleVincular = async () => {
    const faltan = [];
    if (!proveedorRut) faltan.push('proveedor_rut');
    if (!rol.trim()) faltan.push('rol');
    if (faltan.length) {
      setInvalidos(faltan);
      addToast('Selecciona el subcontratista e indica el rol que cumplirá en la obra', 'error'); return;
    }
    // Excepción 2 - Vinculación duplicada
    if (subcontratistas.some(s => s.proveedor_rut === proveedorRut)) {
      setInvalidos(['proveedor_rut']);
      addToast('La empresa ya forma parte del proyecto', 'warning'); return;
    }
    setLoading(true);
    try {
      const res = await api.post(`/proyecto/${codigoSeleccionado}/subcontratistas`, { proveedor_rut: proveedorRut, rol: rol.trim() });
      addToast(res.data.mensaje || 'Subcontratista asociado exitosamente', 'success');
      const r = await api.get(`/proyecto/config/${codigoSeleccionado}`);
      setEntidades(r.data.data);
      setProveedorRut('');
      setRol('');
      setInvalidos([]);
    } catch (err) {
      setInvalidos(err.response?.data?.campos || []);
      addToast(err.response?.data?.error || 'Error al asociar el subcontratista', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Users size={20} />
        Subcontratistas por Proyecto
      </h1>

      <div className="layout-split" style={{ maxWidth: 900 }}>
        {/* Columna izquierda: selección y estado actual */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Proyecto
          </h3>
          <div className="form-group">
            <label className="form-label">Seleccionar Proyecto</label>
            <Select
              className="form-select"
              value={codigoSeleccionado}
              onChange={e => setCodigoSeleccionado(e.target.value)}
            >
              <option value="">Selecciona un proyecto...</option>
              {proyectos.map(p => (
                <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                  {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                </option>
              ))}
            </Select>
          </div>

          {loadingEntidades && (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
          )}

          {entidades && (
            <div>
              <div style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Estado:</span>
                <Badge value={entidades.proyecto?.EstadoProyecto?.estado_proyecto_nombre} />
              </div>

              <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 14, marginTop: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  Subcontratistas Asociados ({subcontratistas.length})
                </p>
                {subcontratistas.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {subcontratistas.map(s => (
                      <div key={s.proyecto_subcontratista_id} style={{ background: 'var(--color-bg-elevated)', borderRadius: 4, padding: '10px 14px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{s.Proveedor?.proveedor_razon_social}</div>
                        <div style={{ fontSize: 13, marginBottom: 2 }}>Rol: {s.proyecto_subcontratista_rol}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>RUT: {s.proveedor_rut} · desde {s.proyecto_subcontratista_fecha?.split('-').reverse().join('-')}</div>
                        {s.Proveedor?.proveedor_correo && (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{s.Proveedor.proveedor_correo}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sin subcontratistas asociados</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Columna derecha: selección de nuevo proveedor */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Asignar Subcontratista
          </h3>

          {!codigoSeleccionado && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Primero selecciona un proyecto
            </p>
          )}

          {codigoSeleccionado && (
            <>
              <div className="form-group">
                <label className="form-label">Subcontratista</label>
                <Select
                  className={`form-select${invalidos.includes('proveedor_rut') ? ' is-invalid' : ''}`}
                  value={proveedorRut}
                  onChange={e => { setProveedorRut(e.target.value); setInvalidos(prev => prev.filter(c => c !== 'proveedor_rut')); }}
                >
                  <option value="">Selecciona un proveedor...</option>
                  {proveedores.map(p => (
                    <option key={p.proveedor_rut} value={p.proveedor_rut}>
                      {p.proveedor_razon_social} ({p.proveedor_rut})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="form-group">
                <label className="form-label">Rol en la obra</label>
                <input
                  className={`form-input${invalidos.includes('rol') ? ' is-invalid' : ''}`}
                  placeholder="Ej. Instalación de ductos"
                  maxLength={150}
                  value={rol}
                  onChange={e => { setRol(e.target.value); setInvalidos(prev => prev.filter(c => c !== 'rol')); }}
                />
              </div>

              {proveedores.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--color-warning)', marginBottom: 12 }}>
                  No hay subcontratistas registrados. Créalos en el módulo de proveedores.
                </p>
              )}

              {proveedorRut && (
                <div style={{ background: 'var(--color-bg-elevated)', borderRadius: 4, padding: '10px 14px', border: '1px solid var(--color-border)', marginBottom: 16 }}>
                  {(() => {
                    const p = proveedores.find(x => x.proveedor_rut === proveedorRut);
                    return p ? (
                      <>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.proveedor_razon_social}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.proveedor_correo}</div>
                        {p.proveedor_telefono && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{p.proveedor_telefono}</div>}
                      </>
                    ) : null;
                  })()}
                </div>
              )}

              <button
                className="btn btn-primary btn-full"
                onClick={handleVincular}
                disabled={loading}
              >
                <Link2 size={15} />
                {loading ? 'Asociando...' : 'Asociar Subcontratista'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabla de todos los proyectos con su subcontratista */}
      {proyectos.length > 0 && (
        <div className="card" style={{ maxWidth: 900, marginTop: 24 }}>
          <h3 style={{ marginBottom: 16, fontSize: 14, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Resumen de Proyectos
          </h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre de Obra</th>
                  <th>Estado</th>
                  <th>Presupuesto</th>
                </tr>
              </thead>
              <tbody>
                {proyectos.map(p => (
                  <tr
                    key={p.proyecto_codigo_correlativo}
                    style={{ cursor: 'pointer', background: codigoSeleccionado === p.proyecto_codigo_correlativo ? 'var(--color-bg-elevated)' : 'transparent' }}
                    onClick={() => setCodigoSeleccionado(p.proyecto_codigo_correlativo)}
                  >
                    <td style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 13 }}>{p.proyecto_codigo_correlativo}</td>
                    <td>{p.proyecto_nombre_obra}</td>
                    <td><Badge value={p.EstadoProyecto?.estado_proyecto_nombre} /></td>
                    <td style={{ color: 'var(--color-green)' }}>
                      ${parseFloat(p.proyecto_presupuesto_asignado).toLocaleString('es-CL')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
