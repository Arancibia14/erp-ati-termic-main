import { useState, useEffect } from 'react';
import { ShieldPlus, Upload } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

export default function CargarGarantia() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState('');
  const [equipos, setEquipos] = useState([]);
  const [loadingEquipos, setLoadingEquipos] = useState(false);

  const [numeroSerie, setNumeroSerie] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [errores, setErrores] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    api.get('/bitacora/proyectos').then(r => setProyectos(r.data.data)).catch(() => {});
  }, []);

  const handleProyecto = e => {
    const codigo = e.target.value;
    setProyectoSeleccionado(codigo);
    setNumeroSerie('');
    setEquipos([]);
    if (!codigo) return;
    setLoadingEquipos(true);
    api.get('/garantia', { params: { proyecto: codigo } })
      .then(r => setEquipos(r.data.data))
      .catch(() => addToast('Error al cargar los equipos del proyecto', 'error'))
      .finally(() => setLoadingEquipos(false));
  };

  const clase = campo => 'form-input' + (errores.includes(campo) ? ' is-invalid' : '');

  const cargarCertificado = () => {
    const faltantes = [];
    if (!numeroSerie) faltantes.push('numero_serie');
    if (!archivo) faltantes.push('archivo');
    if (!fechaVencimiento) faltantes.push('fecha_vencimiento');
    if (faltantes.length) {
      setErrores(faltantes);
      addToast('Completa los campos obligatorios resaltados', 'error');
      return;
    }
    setErrores([]);
    setCargando(true);
    const fd = new FormData();
    fd.append('archivo', archivo);
    fd.append('fecha_vencimiento', fechaVencimiento);
    api.post(`/garantia/${numeroSerie}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => {
        addToast(r.data.mensaje || 'Certificado de garantía cargado correctamente', 'success');
        setNumeroSerie('');
        setFechaVencimiento('');
        setArchivo(null);
      })
      .catch(err => {
        addToast(err.response?.data?.error || 'Error al cargar el certificado', 'error');
        setErrores(err.response?.data?.campos || []);
      })
      .finally(() => setCargando(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShieldPlus size={20} />
        Cargar Garantía
      </h1>

      <div className="card" style={{ maxWidth: 480 }}>
        <div className="form-group">
          <label className="form-label">Proyecto</label>
          <select className="form-select" value={proyectoSeleccionado} onChange={handleProyecto}>
            <option value="">Selecciona un proyecto...</option>
            {proyectos.map(p => (
              <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
              </option>
            ))}
          </select>
        </div>

        {proyectoSeleccionado && (
          <div className="form-group">
            <label className="form-label">Equipo (Número de Serie)</label>
            <select
              className={'form-select' + (errores.includes('numero_serie') ? ' is-invalid' : '')}
              value={numeroSerie}
              onChange={e => { setNumeroSerie(e.target.value); setErrores([]); }}
              disabled={loadingEquipos}
            >
              <option value="">{loadingEquipos ? 'Cargando equipos...' : 'Selecciona un equipo...'}</option>
              {equipos.map(eq => (
                <option key={eq.equipo_hvac_numero_serie} value={eq.equipo_hvac_numero_serie}>
                  {eq.equipo_hvac_numero_serie} — {eq.modelo_hvac_nombre}
                </option>
              ))}
            </select>
            {!loadingEquipos && proyectoSeleccionado && equipos.length === 0 && (
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Este proyecto no tiene equipos registrados. Regístralos primero en Catálogo de Equipos.
              </span>
            )}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Certificado (solo PDF)</label>
          <input
            type="file"
            className={clase('archivo')}
            accept=".pdf"
            onChange={e => { setArchivo(e.target.files[0] || null); setErrores([]); }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Fecha de Vencimiento</label>
          <input
            type="date"
            className={clase('fecha_vencimiento')}
            value={fechaVencimiento}
            onChange={e => { setFechaVencimiento(e.target.value); setErrores([]); }}
          />
        </div>

        <button className="btn btn-primary" onClick={cargarCertificado} disabled={cargando || !numeroSerie}>
          <Upload size={15} />
          {cargando ? 'Cargando...' : 'Cargar Certificado'}
        </button>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
