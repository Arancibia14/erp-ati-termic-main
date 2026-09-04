import { useState, useEffect } from 'react';
import { Receipt, Upload, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

const now = new Date();
const periodoActual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

export default function Liquidaciones() {
  const { toasts, addToast, removeToast } = useToast();
  const [trabajadores, setTrabajadores] = useState([]);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState('');
  const [periodo, setPeriodo] = useState(periodoActual);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [confirmarReemplazo, setConfirmarReemplazo] = useState(false);

  useEffect(() => {
    api.get('/trabajador')
      .then(r => setTrabajadores(r.data.data))
      .catch(() => addToast('Error al cargar trabajadores', 'error'));
  }, []);

  const cargarLiquidaciones = rut => {
    if (!rut) { setLiquidaciones([]); return; }
    api.get(`/liquidacion/${rut}`)
      .then(r => setLiquidaciones(r.data.data))
      .catch(() => addToast('Error al cargar liquidaciones del trabajador', 'error'));
  };

  const handleTrabajador = e => {
    setTrabajadorSeleccionado(e.target.value);
    cargarLiquidaciones(e.target.value);
  };

  const enviar = (reemplazar = false) => {
    if (!trabajadorSeleccionado) { addToast('Selecciona un trabajador', 'error'); return; }
    if (!archivo) { addToast('Debes adjuntar el archivo PDF de la liquidación', 'error'); return; }

    const fd = new FormData();
    fd.append('trabajador_rut', trabajadorSeleccionado);
    fd.append('periodo', periodo);
    fd.append('archivo', archivo);
    if (reemplazar) fd.append('reemplazar', 'true');

    setGuardando(true);
    api.post('/liquidacion', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => {
        if (r.data.data.duplicado) {
          setConfirmarReemplazo(true);
          return;
        }
        addToast('Liquidación cargada con éxito', 'success');
        setArchivo(null);
        setConfirmarReemplazo(false);
        cargarLiquidaciones(trabajadorSeleccionado);
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al cargar la liquidación', 'error'))
      .finally(() => setGuardando(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Receipt size={20} />
        Liquidaciones de Sueldo
      </h1>

      <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Trabajador</label>
            <select className="form-select" value={trabajadorSeleccionado} onChange={handleTrabajador}>
              <option value="">Selecciona un trabajador...</option>
              {trabajadores.map(t => (
                <option key={t.trabajador_rut} value={t.trabajador_rut}>
                  {t.trabajador_rut} — {t.trabajador_nombres} {t.trabajador_apellidos}
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

        <div className="form-group">
          <label className="form-label">Liquidación de Sueldo (PDF)</label>
          <input
            type="file"
            accept=".pdf"
            className="form-input"
            onChange={e => setArchivo(e.target.files[0] || null)}
          />
        </div>

        {confirmarReemplazo && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(245,158,11,0.1)', border: '1px solid var(--color-warning)',
            borderRadius: 4, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: 'var(--color-warning)'
          }}>
            <AlertTriangle size={16} />
            Ya existe una liquidación para ese periodo. ¿Deseas reemplazarla?
          </div>
        )}

        {!confirmarReemplazo ? (
          <button className="btn btn-primary" onClick={() => enviar(false)} disabled={guardando}>
            <Upload size={15} />
            {guardando ? 'Cargando...' : 'Cargar Liquidación'}
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

      {trabajadorSeleccionado && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Historial de Liquidaciones
            </h3>
          </div>
          {liquidaciones.length === 0 ? (
            <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
              Sin liquidaciones registradas
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Fecha de Carga</th>
                    <th>Documento</th>
                  </tr>
                </thead>
                <tbody>
                  {liquidaciones.map(l => (
                    <tr key={l.liquidacion_sueldo_id}>
                      <td style={{ fontSize: 13 }}>{l.liquidacion_sueldo_periodo}</td>
                      <td style={{ fontSize: 13 }}>{l.liquidacion_sueldo_fecha_carga}</td>
                      <td style={{ fontSize: 13 }}>
                        <a href={l.liquidacion_sueldo_url_pdf} target="_blank" rel="noreferrer" style={{ color: 'var(--color-blue)' }}>
                          Ver PDF
                        </a>
                      </td>
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
