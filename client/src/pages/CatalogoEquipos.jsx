import { useState, useEffect } from 'react';
import { Package, Upload, Download, FileText, Plus, HardHat } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

export default function CatalogoEquipos() {
  const { toasts, addToast, removeToast } = useToast();
  const [modelos, setModelos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [etiqueta, setEtiqueta] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const [mostrarFormModelo, setMostrarFormModelo] = useState(false);
  const [nombreModelo, setNombreModelo] = useState('');
  const [creandoModelo, setCreandoModelo] = useState(false);

  // CU 64 - Unidades físicas instaladas del modelo seleccionado
  const [proyectos, setProyectos] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [mostrarFormUnidad, setMostrarFormUnidad] = useState(false);
  const [formUnidad, setFormUnidad] = useState({ numero_serie: '', proyecto_codigo_correlativo: '', fecha_instalacion: '' });
  const [erroresUnidad, setErroresUnidad] = useState([]);
  const [creandoUnidad, setCreandoUnidad] = useState(false);

  const cargarModelos = () => {
    api.get('/equipo/modelos')
      .then(r => setModelos(r.data.data))
      .catch(() => addToast('Error al cargar el catálogo de equipos', 'error'));
  };

  useEffect(() => {
    cargarModelos();
    api.get('/bitacora/proyectos').then(r => setProyectos(r.data.data)).catch(() => {});
  }, []);

  const crearModelo = () => {
    if (!nombreModelo.trim()) {
      addToast('El nombre del modelo es obligatorio', 'error'); return;
    }
    setCreandoModelo(true);
    api.post('/equipo/modelos', { nombre: nombreModelo.trim() })
      .then(() => {
        addToast('Registro creado exitosamente', 'success');
        setNombreModelo('');
        setMostrarFormModelo(false);
        cargarModelos();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al dar de alta el modelo', 'error'))
      .finally(() => setCreandoModelo(false));
  };

  const seleccionar = m => {
    setSeleccionado(m);
    setDocumentos([]);
    setEtiqueta('');
    setArchivo(null);
    setUnidades([]);
    setMostrarFormUnidad(false);
    setFormUnidad({ numero_serie: '', proyecto_codigo_correlativo: '', fecha_instalacion: '' });
    setErroresUnidad([]);
    api.get(`/equipo/modelos/${m.modelo_hvac_id}/documentos`)
      .then(r => setDocumentos(r.data.data))
      .catch(() => addToast('Error al cargar la documentación adjunta', 'error'));
    api.get(`/equipo/modelos/${m.modelo_hvac_id}/unidades`)
      .then(r => setUnidades(r.data.data))
      .catch(() => addToast('Error al cargar las unidades instaladas', 'error'));
  };

  // CU 64 - Registrando unidades físicas de equipo HVAC
  const crearUnidad = () => {
    const faltantes = [];
    if (!formUnidad.numero_serie.trim()) faltantes.push('numero_serie');
    if (!formUnidad.proyecto_codigo_correlativo) faltantes.push('proyecto_codigo_correlativo');
    if (!formUnidad.fecha_instalacion) faltantes.push('fecha_instalacion');
    if (faltantes.length) {
      setErroresUnidad(faltantes);
      addToast('Completa los campos obligatorios resaltados', 'error');
      return;
    }
    setErroresUnidad([]);
    setCreandoUnidad(true);
    api.post(`/equipo/modelos/${seleccionado.modelo_hvac_id}/unidades`, {
      numero_serie: formUnidad.numero_serie.trim(),
      proyecto_codigo_correlativo: formUnidad.proyecto_codigo_correlativo,
      fecha_instalacion: formUnidad.fecha_instalacion
    })
      .then(() => {
        addToast('Registro creado exitosamente', 'success');
        setFormUnidad({ numero_serie: '', proyecto_codigo_correlativo: '', fecha_instalacion: '' });
        setMostrarFormUnidad(false);
        return api.get(`/equipo/modelos/${seleccionado.modelo_hvac_id}/unidades`);
      })
      .then(r => setUnidades(r.data.data))
      .catch(err => {
        addToast(err.response?.data?.error || 'Error al registrar la unidad', 'error');
        setErroresUnidad(err.response?.data?.campos || []);
      })
      .finally(() => setCreandoUnidad(false));
  };

  const subirArchivo = () => {
    if (!archivo) { addToast('Selecciona el manual o ficha técnica', 'error'); return; }
    if (!etiqueta.trim()) { addToast('Escribe una etiqueta para el documento (ej. Manual de Instalación)', 'error'); return; }
    const fd = new FormData();
    fd.append('etiqueta', etiqueta.trim());
    fd.append('archivo', archivo);
    setSubiendo(true);
    api.post(`/equipo/modelos/${seleccionado.modelo_hvac_id}/documentos`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(() => {
        addToast('Documento cargado correctamente', 'success');
        setEtiqueta('');
        setArchivo(null);
        return api.get(`/equipo/modelos/${seleccionado.modelo_hvac_id}/documentos`);
      })
      .then(r => setDocumentos(r.data.data))
      .catch(err => addToast(err.response?.data?.error || 'Error al subir el archivo', 'error'))
      .finally(() => setSubiendo(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Package size={20} />
        Catálogo de Equipos
      </h1>

      <div className="layout-split" style={{ maxWidth: 960, alignItems: 'flex-start' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Modelos
            </h3>
            {!mostrarFormModelo && (
              <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setMostrarFormModelo(true)}>
                <Plus size={13} /> Nuevo Modelo
              </button>
            )}
          </div>

          {mostrarFormModelo && (
            <div style={{ marginBottom: 14 }}>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <label className="form-label">Nombre del Modelo</label>
                <input
                  className="form-input"
                  placeholder="Ej. Split Muro 12000 BTU"
                  value={nombreModelo}
                  onChange={e => setNombreModelo(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={crearModelo} disabled={creandoModelo}>
                  {creandoModelo ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 10px', fontSize: 12 }}
                  onClick={() => { setMostrarFormModelo(false); setNombreModelo(''); }}
                  disabled={creandoModelo}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {modelos.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              El catálogo de equipos no tiene modelos registrados.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {modelos.map(m => (
                <button
                  key={m.modelo_hvac_id}
                  onClick={() => seleccionar(m)}
                  className="btn"
                  style={{
                    justifyContent: 'flex-start',
                    background: seleccionado?.modelo_hvac_id === m.modelo_hvac_id ? 'var(--color-bg-elevated)' : 'transparent',
                    border: '1px solid var(--color-border)',
                    fontSize: 13
                  }}
                >
                  {m.modelo_hvac_nombre}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          {!seleccionado ? (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Selecciona un modelo del catálogo para ver su ficha y su documentación adjunta.
            </p>
          ) : (
            <>
              <h3 style={{ marginBottom: 4, fontSize: 15, fontWeight: 700 }}>{seleccionado.modelo_hvac_nombre}</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                Modelo #{seleccionado.modelo_hvac_id}
              </p>

              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Documentación Adjunta
              </p>
              {documentos.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: 16 }}>
                  Sin documentos adjuntos.
                </p>
              ) : (
                <div className="table-container" style={{ marginBottom: 16 }}>
                  <table>
                    <thead><tr><th>Etiqueta</th><th>Formato</th><th>Fecha</th><th></th></tr></thead>
                    <tbody>
                      {documentos.map(d => (
                        <tr key={d.documento_equipo_id}>
                          <td style={{ fontSize: 12 }}><FileText size={12} /> {d.documento_equipo_etiqueta}</td>
                          <td style={{ fontSize: 12, textTransform: 'uppercase' }}>{d.documento_equipo_formato}</td>
                          <td style={{ fontSize: 12 }}>{d.documento_equipo_fecha}</td>
                          <td>
                            <a href={d.documento_equipo_url} target="_blank" rel="noreferrer"
                               className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11, textDecoration: 'none' }}>
                              <Download size={12} /> Ver
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Etiqueta del documento</label>
                <input className="form-input" placeholder="Ej. Manual de Instalación"
                       value={etiqueta} onChange={e => setEtiqueta(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Archivo (PDF, JPG o PNG)</label>
                <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png"
                       onChange={e => setArchivo(e.target.files[0] || null)} />
              </div>
              <button className="btn btn-primary" onClick={subirArchivo} disabled={subiendo}>
                <Upload size={14} />
                {subiendo ? 'Subiendo...' : 'Subir Archivo'}
              </button>

              {/* CU 64 - Unidades físicas instaladas de este modelo */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Unidades Instaladas
                  </p>
                  {!mostrarFormUnidad && (
                    <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setMostrarFormUnidad(true)}>
                      <Plus size={13} /> Registrar unidad
                    </button>
                  )}
                </div>

                {unidades.length === 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: 12 }}>
                    Todavía no hay unidades de este modelo registradas en ninguna obra.
                  </p>
                ) : (
                  <div className="table-container" style={{ marginBottom: 12 }}>
                    <table>
                      <thead><tr><th>N° Serie</th><th>Proyecto</th><th>Instalación</th></tr></thead>
                      <tbody>
                        {unidades.map(u => (
                          <tr key={u.equipo_hvac_numero_serie}>
                            <td style={{ fontSize: 12, fontFamily: 'monospace' }}><HardHat size={12} /> {u.equipo_hvac_numero_serie}</td>
                            <td style={{ fontSize: 12 }}>{u.Proyecto?.proyecto_nombre_obra || u.proyecto_codigo_correlativo}</td>
                            <td style={{ fontSize: 12 }}>{u.equipo_hvac_fecha_instalacion}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {mostrarFormUnidad && (
                  <div>
                    <div className="form-grid-2" style={{ marginBottom: 8 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Número de Serie</label>
                        <input
                          className={'form-input' + (erroresUnidad.includes('numero_serie') ? ' is-invalid' : '')}
                          placeholder="Ej. SN-00234"
                          value={formUnidad.numero_serie}
                          onChange={e => { setFormUnidad(f => ({ ...f, numero_serie: e.target.value })); setErroresUnidad([]); }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Fecha de Instalación</label>
                        <input
                          type="date"
                          className={'form-input' + (erroresUnidad.includes('fecha_instalacion') ? ' is-invalid' : '')}
                          value={formUnidad.fecha_instalacion}
                          onChange={e => { setFormUnidad(f => ({ ...f, fecha_instalacion: e.target.value })); setErroresUnidad([]); }}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Proyecto</label>
                      <select
                        className={'form-select' + (erroresUnidad.includes('proyecto_codigo_correlativo') ? ' is-invalid' : '')}
                        value={formUnidad.proyecto_codigo_correlativo}
                        onChange={e => { setFormUnidad(f => ({ ...f, proyecto_codigo_correlativo: e.target.value })); setErroresUnidad([]); }}
                      >
                        <option value="">Selecciona un proyecto...</option>
                        {proyectos.map(p => (
                          <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                            {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={crearUnidad} disabled={creandoUnidad}>
                        {creandoUnidad ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => { setMostrarFormUnidad(false); setErroresUnidad([]); }}
                        disabled={creandoUnidad}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
