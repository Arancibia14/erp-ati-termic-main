import { useState, useEffect } from 'react';
import { ShieldPlus, Upload, AirVent } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Select from '../components/Select';
import Badge from '../components/Badge';
import EstadoVacio from '../components/EstadoVacio';

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

      <div className="layout-form-lista">
      <div>
      <div className="card">
        <div className="form-group">
          <label className="form-label">Proyecto</label>
          <Select className="form-select" value={proyectoSeleccionado} onChange={handleProyecto}>
            <option value="">Selecciona un proyecto...</option>
            {proyectos.map(p => (
              <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
              </option>
            ))}
          </Select>
        </div>

        {proyectoSeleccionado && (
          <div className="form-group">
            <label className="form-label">Equipo (Número de Serie)</label>
            <Select
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
            </Select>
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
      </div>

      {proyectoSeleccionado && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Equipos y su garantía en esta obra
            </h3>
          </div>
          {loadingEquipos ? (
            <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando equipos...</p>
          ) : equipos.length === 0 ? (
            <EstadoVacio icon={AirVent}>Este proyecto no tiene equipos registrados. Regístralos primero en Catálogo de Equipos.</EstadoVacio>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>N° de Serie</th>
                    <th>Modelo</th>
                    <th>Garantía</th>
                  </tr>
                </thead>
                <tbody>
                  {equipos.map(eq => (
                    <tr key={eq.equipo_hvac_numero_serie}>
                      <td style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 12 }}>{eq.equipo_hvac_numero_serie}</td>
                      <td style={{ fontSize: 13 }}>{eq.modelo_hvac_nombre}</td>
                      <td>
                        {!eq.garantia ? (
                          <Badge value="Sin registrar" />
                        ) : (
                          <Badge value={eq.garantia.vigente ? 'Vigente' : 'Vencido'} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
