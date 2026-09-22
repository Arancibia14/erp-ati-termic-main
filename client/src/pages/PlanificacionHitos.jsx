import { useState, useEffect } from 'react';
import { Flag, CalendarRange, MapPin, AirVent, Wallet } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

// CU09 - Definiendo hitos técnicos del proyecto
const FORM_VACIO = { nombre: '', inicio: '', termino: '', avance: '0' };

const formatearMonto = monto =>
  monto === null || monto === undefined ? '—' : '$' + Number(monto).toLocaleString('es-CL');

export default function PlanificacionHitos() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [codigo, setCodigo] = useState('');
  const [proyecto, setProyecto] = useState(null);
  const [hitos, setHitos] = useState([]);
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    api.get('/bitacora/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar los proyectos', 'error'));
  }, []);

  // CU09 paso 1 - Al elegir el proyecto se despliegan su ficha y sus hitos
  const cargarPlanificacion = cod => {
    if (!cod) { setProyecto(null); setHitos([]); return; }
    setCargando(true);
    api.get(`/hito/${cod}`)
      .then(r => { setProyecto(r.data.data.proyecto); setHitos(r.data.data.hitos); })
      .catch(() => addToast('Error al cargar la planificación del proyecto', 'error'))
      .finally(() => setCargando(false));
  };

  const elegirProyecto = cod => {
    setCodigo(cod);
    setForm(FORM_VACIO);
    setErrores([]);
    cargarPlanificacion(cod);
  };

  const clase = campo => 'form-input' + (errores.includes(campo) ? ' is-invalid' : '');

  const submit = e => {
    e.preventDefault();

    const faltantes = [];
    if (!form.nombre.trim()) faltantes.push('hito_tecnico_nombre_hito');
    if (!form.inicio) faltantes.push('hito_tecnico_fecha_inicio_estimada');
    if (!form.termino) faltantes.push('hito_tecnico_fecha_termino_estimada');
    if (faltantes.length) {
      setErrores(faltantes);
      return addToast('Completa los campos obligatorios resaltados', 'error');
    }
    // CU09 Excepción 1 - El aviso se da antes de llegar al servidor
    if (form.termino < form.inicio) {
      setErrores(['hito_tecnico_fecha_termino_estimada']);
      return addToast('La fecha de término estimada no puede ser anterior a la de inicio', 'error');
    }

    setErrores([]);
    setGuardando(true);
    api.post('/hito', {
      hito_tecnico_nombre_hito: form.nombre.trim(),
      proyecto_codigo_correlativo: codigo,
      hito_tecnico_avance_fisico: form.avance || 0,
      hito_tecnico_fecha_inicio_estimada: form.inicio,
      hito_tecnico_fecha_termino_estimada: form.termino
    })
      .then(r => {
        addToast(r.data?.mensaje || 'Hito definido correctamente', 'success');
        setForm(FORM_VACIO);
        cargarPlanificacion(codigo);
      })
      .catch(err => {
        addToast(err.response?.data?.error || 'Error al definir el hito', 'error');
        setErrores(err.response?.data?.campos || []);
      })
      .finally(() => setGuardando(false));
  };

  const ultimo = [...hitos].reverse().find(h => h.hito_tecnico_fecha_inicio_estimada);

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Flag size={20} />
        Planificación de Hitos
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

      {cargando && <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando planificación...</p>}

      {proyecto && !cargando && (
        <>
          {/* CU09 paso 1 - Ficha del proyecto */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{proyecto.proyecto_nombre_obra}</h2>
              <Badge value={proyecto.EstadoProyecto?.estado_proyecto_nombre} />
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--color-text-muted)' }}>
                {proyecto.proyecto_codigo_correlativo}
              </span>
            </div>
            <div className="form-grid-2" style={{ gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <CalendarRange size={15} />
                Plazo: {proyecto.proyecto_fecha_inicio && proyecto.proyecto_fecha_termino
                  ? `${proyecto.proyecto_fecha_inicio} a ${proyecto.proyecto_fecha_termino}`
                  : 'sin definir'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <Wallet size={15} />
                Presupuesto: {formatearMonto(proyecto.proyecto_presupuesto_asignado)}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <MapPin size={15} />
                {proyecto.proyecto_ubicacion || 'Ubicación sin registrar'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <AirVent size={15} />
                {proyecto.proyecto_tipo_sistema || 'Tipo de sistema sin registrar'}
              </div>
            </div>
          </div>

          {/* Cronograma ya definido */}
          <div className="card" style={{ padding: 0, marginBottom: 24 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
                Cronograma de hitos ({hitos.length})
              </h3>
            </div>
            {hitos.length === 0 ? (
              <div className="estado-vacio">
                <p>Este proyecto todavía no tiene hitos definidos. Agrega el primero para armar su cronograma.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Hito</th>
                      <th>Inicio estimado</th>
                      <th>Término estimado</th>
                      <th>Avance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hitos.map((h, i) => (
                      <tr key={h.hito_tecnico_id}>
                        <td style={{ color: 'var(--color-text-muted)' }}>{i + 1}</td>
                        <td>{h.hito_tecnico_nombre_hito}</td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {h.hito_tecnico_fecha_inicio_estimada || '—'}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {h.hito_tecnico_fecha_termino_estimada || '—'}
                        </td>
                        <td>{Number(h.hito_tecnico_avance_fisico).toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* CU09 pasos 2 a 4 - Definir un hito nuevo */}
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 0, marginBottom: 6 }}>
              Nuevo hito
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 0, marginBottom: 16 }}>
              {ultimo
                ? `Se agrega después de "${ultimo.hito_tecnico_nombre_hito}", que va del ${ultimo.hito_tecnico_fecha_inicio_estimada} al ${ultimo.hito_tecnico_fecha_termino_estimada || ultimo.hito_tecnico_fecha_inicio_estimada}.`
                : 'Será el primer hito del cronograma.'}
            </p>
            <form onSubmit={submit}>
              <div className="form-group">
                <label className="form-label">Nombre del Hito</label>
                <input className={clase('hito_tecnico_nombre_hito')} placeholder="Ej: Montaje de equipos HVAC"
                  value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fecha de Inicio Estimada</label>
                  <input type="date" className={clase('hito_tecnico_fecha_inicio_estimada')}
                    value={form.inicio} onChange={e => setForm(f => ({ ...f, inicio: e.target.value }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Fecha de Término Estimada</label>
                  <input type="date" className={clase('hito_tecnico_fecha_termino_estimada')}
                    min={form.inicio || undefined}
                    value={form.termino} onChange={e => setForm(f => ({ ...f, termino: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 14, maxWidth: 220 }}>
                <label className="form-label">
                  Avance Físico (%) <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input type="number" className={clase('hito_tecnico_avance_fisico')} min="0" max="100"
                  value={form.avance} onChange={e => setForm(f => ({ ...f, avance: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={guardando}>
                <Flag size={15} /> {guardando ? 'Guardando...' : 'Agregar al Cronograma'}
              </button>
            </form>
          </div>
        </>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
