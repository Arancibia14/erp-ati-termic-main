import { useState, useEffect } from 'react';
import { FileCheck, Upload, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

const now = new Date();
const periodoActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export default function DocumentacionLaboral() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [proyectoSeleccionado, setProyectoSeleccionado] = useState('');
  const [periodo, setPeriodo] = useState(periodoActual);
  const [certificados, setCertificados] = useState([]);
  const [archivoF30, setArchivoF30] = useState(null);
  const [archivoF30_1, setArchivoF30_1] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarReemplazo, setConfirmarReemplazo] = useState(false);

  useEffect(() => {
    api.get('/setup/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  const cargarCertificados = codigo => {
    if (!codigo) { setCertificados([]); return; }
    api.get(`/certificado-laboral/${codigo}`)
      .then(r => setCertificados(r.data.data))
      .catch(() => addToast('Error al cargar certificados del proyecto', 'error'));
  };

  const handleProyecto = e => {
    setProyectoSeleccionado(e.target.value);
    cargarCertificados(e.target.value);
  };

  const registroPeriodoActual = certificados.find(c => c.certificado_laboral_periodo === periodo);

  const enviar = (reemplazar = false) => {
    if (!proyectoSeleccionado) { addToast('Selecciona un proyecto', 'error'); return; }
    if (!archivoF30 && !archivoF30_1) { addToast('Debes adjuntar al menos un archivo F30 o F30-1', 'error'); return; }

    const fd = new FormData();
    fd.append('proyecto_codigo_correlativo', proyectoSeleccionado);
    fd.append('periodo', periodo);
    if (archivoF30) fd.append('f30', archivoF30);
    if (archivoF30_1) fd.append('f30_1', archivoF30_1);
    if (reemplazar) fd.append('reemplazar', 'true');

    setGuardando(true);
    api.post('/certificado-laboral', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => {
        if (r.data.data.periodo_completo) {
          setConfirmarReemplazo(true);
          return;
        }
        addToast('Certificados almacenados correctamente', 'success');
        setArchivoF30(null);
        setArchivoF30_1(null);
        setConfirmarReemplazo(false);
        cargarCertificados(proyectoSeleccionado);
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al cargar los certificados', 'error'))
      .finally(() => setGuardando(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FileCheck size={20} />
        Documentación Laboral
      </h1>

      <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
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
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Periodo</label>
            <input
              type="month"
              className="form-input"
              value={periodo}
              onChange={e => { setPeriodo(e.target.value); setConfirmarReemplazo(false); }}
            />
          </div>
        </div>

        {registroPeriodoActual && !confirmarReemplazo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
            borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--color-text-secondary)'
          }}>
            Ya existen certificados cargados para este periodo
            {registroPeriodoActual.certificado_laboral_url_f30 && ' — F30'}
            {registroPeriodoActual.certificado_laboral_url_f30_1 && ' — F30-1'}
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Certificado F30 (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            className="form-input"
            onChange={e => setArchivoF30(e.target.files[0] || null)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Certificado F30-1 (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            className="form-input"
            onChange={e => setArchivoF30_1(e.target.files[0] || null)}
          />
        </div>

        {confirmarReemplazo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,158,11,0.1)', border: '1px solid var(--color-warning)',
            borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--color-warning)'
          }}>
            <AlertTriangle size={16} />
            Ya existen certificados para este periodo. ¿Deseas reemplazarlos?
          </div>
        )}

        {!confirmarReemplazo ? (
          <button className="btn btn-primary" onClick={() => enviar(false)} disabled={guardando}>
            <Upload size={15} />
            {guardando ? 'Guardando...' : 'Guardar Certificados'}
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={() => enviar(true)} disabled={guardando}>
              {guardando ? 'Reemplazando...' : 'Sí, Reemplazar'}
            </button>
            <button className="btn btn-secondary" onClick={() => setConfirmarReemplazo(false)} disabled={guardando}>
              Cancelar
            </button>
          </div>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
