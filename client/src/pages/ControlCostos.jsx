import { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

const formatPeso = v => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
};

const formatPesoFull = v =>
  Number(v).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1C2128', border: '1px solid #2D3748', borderRadius: 6,
      padding: '10px 14px', fontSize: 12
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#E6EDF3' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: {formatPesoFull(p.value)}
        </div>
      ))}
    </div>
  );
};

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - i);

export default function ControlCostos() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [codigoSel, setCodigoSel] = useState('');
  const [yearSel, setYearSel] = useState(ANIO_ACTUAL);
  const [datos, setDatos] = useState(null);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [cargandoDatos, setCargandoDatos] = useState(false);

  useEffect(() => {
    api.get('/control-costos/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'))
      .finally(() => setCargandoProyectos(false));
  }, []);

  const cargarGrafico = async (codigo, year) => {
    if (!codigo) return;
    setCargandoDatos(true);
    setDatos(null);
    try {
      const r = await api.get(`/control-costos/${codigo}/gastos-por-mes`, { params: { year } });
      setDatos(r.data.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al obtener datos del proyecto', 'error');
    } finally {
      setCargandoDatos(false);
    }
  };

  const handleProyecto = (e) => {
    const val = e.target.value;
    setCodigoSel(val);
    cargarGrafico(val, yearSel);
  };

  const handleYear = (e) => {
    const y = parseInt(e.target.value);
    setYearSel(y);
    cargarGrafico(codigoSel, y);
  };

  const desvNegativa = datos && datos.porcentaje_desviacion > 0;
  const sinPresupuesto = datos && (!datos.presupuesto || datos.presupuesto === 0);
  const sinGastos = datos && !sinPresupuesto && datos.total_gastos === 0;
  const conDatos = datos && !sinPresupuesto && datos.total_gastos > 0;

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BarChart2 size={20} />
        Control de Costos — Desviación
      </h1>

      {/* Selectores proyecto + año */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Proyecto a analizar</label>
            <select
              className="form-select"
              value={codigoSel}
              onChange={handleProyecto}
              disabled={cargandoProyectos}
            >
              <option value="">— Seleccionar proyecto —</option>
              {proyectos.map(p => (
                <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                  {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Año</label>
            <select
              className="form-select"
              value={yearSel}
              onChange={handleYear}
              style={{ width: 110 }}
            >
              {ANIOS.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {cargandoDatos && (
        <div style={{ color: 'var(--color-text-secondary)', padding: 32, textAlign: 'center' }}>
          <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
          &nbsp; Calculando desviación...
        </div>
      )}

      {datos && !cargandoDatos && (
        <>
          {/* Nombre del proyecto analizado */}
          <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Analizando: <strong style={{ color: 'var(--color-text-primary)' }}>{datos.proyecto}</strong> — {yearSel}
          </div>

          {/* Excepción 1: sin presupuesto cargado */}
          {sinPresupuesto && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px',
              background: 'rgba(212, 147, 10, 0.1)', border: '1px solid var(--color-warning)',
              borderRadius: 6, marginBottom: 20
            }}>
              <AlertTriangle size={20} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontWeight: 700, color: 'var(--color-warning)', marginBottom: 4 }}>
                  Excepción 1 — Datos insuficientes
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  Este proyecto no tiene presupuesto asignado. No se puede generar la comparación financiera.
                  Asigna un presupuesto en Configuración → Proyectos.
                </div>
              </div>
            </div>
          )}

          {/* Sin gastos pero con presupuesto */}
          {sinGastos && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '16px 20px',
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 6, marginBottom: 20
            }}>
              <AlertTriangle size={18} color="var(--color-text-muted)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                No hay gastos reales registrados para este proyecto en {yearSel}.
                Los gráficos muestran solo el presupuesto planificado. Vincular facturas activará la comparación real.
              </div>
            </div>
          )}

          {/* KPIs — solo si hay presupuesto */}
          {!sinPresupuesto && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              <div className="card">
                <div className="saldo-label">Presupuesto asignado</div>
                <div className="saldo-value">{formatPesoFull(datos.presupuesto)}</div>
              </div>
              <div className="card">
                <div className="saldo-label">Gasto real acumulado</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2, color: conDatos && desvNegativa ? 'var(--color-danger)' : 'var(--color-green)' }}>
                  {formatPesoFull(datos.total_gastos)}
                </div>
              </div>
              <div className="card">
                <div className="saldo-label">Varianza</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2, color: conDatos && desvNegativa ? 'var(--color-danger)' : 'var(--color-green)' }}>
                  {datos.varianza >= 0 ? '+' : ''}{formatPesoFull(datos.varianza)}
                </div>
              </div>
              <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div className="saldo-label">Desviación</div>
                  <div style={{
                    fontSize: 22, fontWeight: 700, marginTop: 2,
                    color: conDatos && desvNegativa ? 'var(--color-danger)' : conDatos ? 'var(--color-green)' : 'var(--color-text-muted)'
                  }}>
                    {conDatos ? `${datos.porcentaje_desviacion >= 0 ? '+' : ''}${datos.porcentaje_desviacion.toFixed(1)}%` : '—'}
                  </div>
                </div>
                {conDatos && (desvNegativa
                  ? <TrendingUp size={28} color="var(--color-danger)" />
                  : <TrendingDown size={28} color="var(--color-green)" />)}
              </div>
            </div>
          )}

          {/* Alerta umbral — solo si hay gastos reales */}
          {conDatos && desvNegativa && datos.porcentaje_desviacion > 10 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              background: 'rgba(192, 57, 43, 0.12)', border: '1px solid var(--color-danger)',
              borderRadius: 4, marginBottom: 20, fontSize: 13, color: '#e57368'
            }}>
              <AlertTriangle size={16} />
              Alerta: la desviación supera el umbral de tolerancia. Se requiere revisión del presupuesto.
            </div>
          )}

          {/* Gráficos — solo si hay presupuesto */}
          {!sinPresupuesto && (
            <>
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                  Gasto mensual vs Presupuesto mensual — {yearSel}
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={datos.serie} margin={{ top: 4, right: 16, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8B949E' }} />
                    <YAxis tickFormatter={formatPeso} tick={{ fontSize: 11, fill: '#8B949E' }} width={72} />
                    <Tooltip content={<TooltipCustom />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#8B949E' }} />
                    <Bar dataKey="presupuesto_mensual" name="Presupuesto mensual" fill="#1E40D8" opacity={0.7} radius={[2, 2, 0, 0]} />
                    <Bar dataKey="gasto_real" name="Gasto real" fill="#5DB835" radius={[2, 2, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                  Curva de costo acumulado — Planificado vs Real
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={datos.serie} margin={{ top: 4, right: 16, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8B949E' }} />
                    <YAxis tickFormatter={formatPeso} tick={{ fontSize: 11, fill: '#8B949E' }} width={72} />
                    <Tooltip content={<TooltipCustom />} />
                    <Legend wrapperStyle={{ fontSize: 12, color: '#8B949E' }} />
                    <ReferenceLine
                      y={datos.presupuesto}
                      stroke="var(--color-warning)"
                      strokeDasharray="6 3"
                      label={{ value: 'Presupuesto total', fill: '#D4930A', fontSize: 11, position: 'insideTopRight' }}
                    />
                    <Line type="monotone" dataKey="acumulado_ppto" name="Acumulado planificado" stroke="#1E40D8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="acumulado_real" name="Acumulado real" stroke="#5DB835" strokeWidth={2} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
