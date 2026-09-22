import { useState, useEffect } from 'react';
import { FileText, Upload, ExternalLink, TriangleAlert } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

// CU13 - Gestionando Especificaciones Técnicas
export default function EspecificacionesTecnicas() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [proyecto, setProyecto] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [limiteMb, setLimiteMb] = useState(15);
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);

  useEffect(() => {
    api.get('/bitacora/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar los proyectos', 'error'));
  }, []);

  // CU13 paso 1 - Ficha del proyecto y sus especificaciones ya cargadas
  const cargarProyecto = cod => {
    if (!cod) { setProyecto(null); setDocumentos([]); return; }
    setCargando(true);
    api.get(`/especificacion/${cod}`)
      .then(r => {
        setProyecto(r.data.data.proyecto);
        setDocumentos(r.data.data.documentos);
        setLimiteMb(r.data.data.limite_mb);
      })
      .catch(() => addToast('Error al cargar las especificaciones del proyecto', 'error'))
      .finally(() => setCargando(false));
  };

  const elegirProyecto = cod => {
    setCodigo(cod);
    setArchivo(null);
    setErrorArchivo('');
    cargarProyecto(cod);
  };

  // CU13 pasos 3 y 4 - Se valida antes de enviar, para avisar de inmediato
  const elegirArchivo = f => {
    setArchivo(f || null);
    if (!f) return setErrorArchivo('');
    const esPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!esPdf) {
      // CU13 Excepción 1
      setErrorArchivo('Solo se admiten archivos PDF. Convierte la especificación a PDF antes de cargarla.');
      return;
    }
    if (f.size > limiteMb * 1024 * 1024) {
      // CU13 Excepción 2
      setErrorArchivo(`El archivo pesa ${(f.size / 1024 / 1024).toFixed(1)} MB y el límite es de ${limiteMb} MB.`);
      return;
    }
    setErrorArchivo('');
  };

  // CU13 paso 5 - Almacenar y vincular al proyecto
  const subir = () => {
    if (!archivo) return addToast('Selecciona el archivo PDF de la especificación técnica', 'error');
    if (errorArchivo) return addToast(errorArchivo, 'error');

    const fd = new FormData();
    fd.append('archivo', archivo);
    setSubiendo(true);
    api.post(`/especificacion/${codigo}`, fd)
      .then(r => {
        addToast(r.data?.mensaje || 'Documento vinculado exitosamente', 'success');
        setArchivo(null);
        setErrorArchivo('');
        // El input de archivo es no controlado: se limpia a mano
        const input = document.getElementById('archivo-especificacion');
        if (input) input.value = '';
        cargarProyecto(codigo);
      })
      .catch(err => {
        const d = err.response?.data;
        addToast(d?.error || 'Error al cargar la especificación técnica', 'error');
        if (d?.excepcion) setErrorArchivo(d.error);
      })
      .finally(() => setSubiendo(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FileText size={20} />
        Especificaciones Técnicas
      </h1>

      <div className="card" style={{ marginBottom: 24 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Proyecto</label>
          <select className="form-select" value={codigo} onChange={e => elegirProyecto(e.target.value)}>
            <option value="">Selecciona un proyecto...</option>
            {proyectos.map(p => (
              <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cargando && <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando especificaciones...</p>}

      {proyecto && !cargando && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{proyecto.proyecto_nombre_obra}</h2>
              <Badge value={proyecto.EstadoProyecto?.estado_proyecto_nombre} />
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>
                {proyecto.proyecto_codigo_correlativo}
              </span>
            </div>
          </div>

          {/* Especificaciones ya vinculadas */}
          <div className="card" style={{ padding: 0, marginBottom: 24 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Especificaciones cargadas ({documentos.length})
              </h3>
            </div>
            {documentos.length === 0 ? (
              <div className="estado-vacio">
                <p>Este proyecto todavía no tiene especificaciones técnicas vinculadas.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>N°</th>
                      <th>Fecha de carga</th>
                      <th>Estado</th>
                      <th>Archivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentos.map(d => (
                      <tr key={d.documento_legal_id}>
                        <td style={{ color: 'var(--color-text-muted)' }}>{d.documento_legal_id}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{d.documento_legal_fecha_emision}</td>
                        <td><Badge value={d.documento_legal_estado} /></td>
                        <td>
                          {d.archivo_disponible ? (
                            <a className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}
                               href={d.documento_legal_url_pdf} target="_blank" rel="noreferrer">
                              <ExternalLink size={13} /> Ver PDF
                            </a>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-warning)' }}>
                              <TriangleAlert size={13} /> Archivo no disponible
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CU13 pasos 2 a 5 - Cargar especificación */}
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 0, marginBottom: 6 }}>
              Cargar especificación
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 16 }}>
              Únicamente archivos PDF, de hasta {limiteMb} MB.
            </p>
            <div className="form-group">
              <label className="form-label">Archivo PDF</label>
              <input id="archivo-especificacion" type="file" accept="application/pdf,.pdf"
                className={'form-input' + (errorArchivo ? ' is-invalid' : '')}
                onChange={e => elegirArchivo(e.target.files[0] || null)} />
            </div>
            {errorArchivo && (
              <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--color-danger)', margin: '0 0 12px' }}>
                <TriangleAlert size={14} /> {errorArchivo}
              </p>
            )}
            {archivo && !errorArchivo && (
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '0 0 12px' }}>
                {archivo.name} — {(archivo.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
            <button type="button" className="btn btn-primary" onClick={subir} disabled={subiendo || !!errorArchivo}>
              <Upload size={15} /> {subiendo ? 'Cargando...' : 'Cargar Especificación'}
            </button>
          </div>
        </>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
