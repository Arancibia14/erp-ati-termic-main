import { useState, useEffect } from 'react';
import { BarChart2, RefreshCw, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import {
  ComposedChart, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
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

const COLOR_SERIE = {
  presupuesto_mensual: 'var(--color-blue)',
  gasto_real: 'var(--color-green)',
  acumulado_ppto: 'var(--color-blue)',
  acumulado_real: 'var(--color-green)'
};

const TooltipCustom = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const diferencia = payload.length === 2 ? payload[0].value - payload[1].value : null;
  return (
    <div style={{
      background: 'var(--color-bg-surface)', border: '1px solid var(--color-border-strong)', borderRadius: 12,
      padding: '12px 14px', fontSize: 12.5, minWidth: 210, boxShadow: 'var(--shadow-md)'
    }}>
      <div style={{
        fontWeight: 700, marginBottom: 8, paddingBottom: 8, color: 'var(--color-text-primary)',
        borderBottom: '1px solid var(--color-border-subtle)', letterSpacing: '0.02em'
      }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: COLOR_SERIE[p.dataKey], flexShrink: 0 }} />
          <span style={{ flex: 1, color: 'var(--color-text-secondary)' }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {formatPesoFull(p.value)}
          </span>
        </div>
      ))}
      {diferencia !== null && (
        <div style={{
          display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8,
          borderTop: '1px solid var(--color-border-subtle)', color: 'var(--color-text-secondary)'
        }}>
          <span>Diferencia</span>
          <span style={{ fontWeight: 700, color: diferencia >= 0 ? 'var(--color-green-text)' : 'var(--color-danger)', fontVariantNumeric: 'tabular-nums' }}>
            {diferencia >= 0 ? '+' : ''}{formatPesoFull(diferencia)}
          </span>
        </div>
      )}
    </div>
  );
};

const Leyenda = ({ items }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, marginBottom: 14 }}>
    {items.map(item => (
      <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--color-text-secondary)' }}>
        <span style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
        {item.label}
      </div>
    ))}
  </div>
);

const EJE = { fontSize: 11.5, fill: 'var(--color-text-secondary)' };

const Degradados = ({ id }) => (
  <defs>
    <linearGradient id={`${id}-azul`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style={{ stopColor: 'var(--color-blue)', stopOpacity: 0.95 }} />
      <stop offset="100%" style={{ stopColor: 'var(--color-blue)', stopOpacity: 0.45 }} />
    </linearGradient>
    <linearGradient id={`${id}-verde`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style={{ stopColor: 'var(--color-green)', stopOpacity: 0.95 }} />
      <stop offset="100%" style={{ stopColor: 'var(--color-green)', stopOpacity: 0.5 }} />
    </linearGradient>
    <linearGradient id={`${id}-area-azul`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style={{ stopColor: 'var(--color-blue)', stopOpacity: 0.22 }} />
      <stop offset="100%" style={{ stopColor: 'var(--color-blue)', stopOpacity: 0 }} />
    </linearGradient>
    <linearGradient id={`${id}-area-verde`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" style={{ stopColor: 'var(--color-green)', stopOpacity: 0.3 }} />
      <stop offset="100%" style={{ stopColor: 'var(--color-green)', stopOpacity: 0 }} />
    </linearGradient>
  </defs>
);

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: 6 }, (_, i) => ANIO_ACTUAL - i);

// Últimos seis años más los del plazo del proyecto: una obra que termina el
// próximo año también debe poder revisarse en ese año.
const aniosDisponibles = proyecto => {
  const anios = new Set(ANIOS);
  if (proyecto?.proyecto_fecha_inicio && proyecto?.proyecto_fecha_termino) {
    const hasta = parseInt(proyecto.proyecto_fecha_termino.slice(0, 4));
    for (let y = parseInt(proyecto.proyecto_fecha_inicio.slice(0, 4)); y <= hasta; y++) anios.add(y);
  }
  return [...anios].sort((a, b) => b - a);
};

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

  const anios = aniosDisponibles(proyectos.find(p => p.proyecto_codigo_correlativo === codigoSel));
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
              {anios.map(y => (
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
            {!sinPresupuesto && datos.plazo && (
              <> · Plazo de la obra: {datos.plazo.inicio} a {datos.plazo.termino} ({datos.plazo.meses} {datos.plazo.meses === 1 ? 'mes' : 'meses'})</>
            )}
          </div>

          {/* Sin plazo registrado, el presupuesto planificado es una estimación anual */}
          {!sinPresupuesto && !datos.plazo && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px',
              background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)',
              borderRadius: 6, marginBottom: 20, fontSize: 13, color: 'var(--color-text-secondary)'
            }}>
              <AlertTriangle size={16} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                Este proyecto no tiene plazo registrado, así que el presupuesto planificado se reparte en los 12 meses de {yearSel} como estimación.
                Para una obra de varios años, registra su fecha de inicio y de término en Configuración → Proyectos.
              </div>
            </div>
          )}

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
              borderRadius: 4, marginBottom: 20, fontSize: 13, color: 'var(--color-danger)'
            }}>
              <AlertTriangle size={16} />
              Alerta: la desviación supera el umbral de tolerancia. Se requiere revisión del presupuesto.
            </div>
          )}

          {/* Gráficos — solo si hay presupuesto */}
          {!sinPresupuesto && (
            <>
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                  Gasto mensual vs Presupuesto mensual — {yearSel}
                </div>
                <Leyenda items={[
                  { label: 'Presupuesto mensual', color: 'var(--color-blue)' },
                  { label: 'Gasto real', color: 'var(--color-green)' }
                ]} />
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={datos.serie} margin={{ top: 8, right: 12, bottom: 0, left: 4 }} barGap={4} barCategoryGap="22%">
                    <Degradados id="gm" />
                    <CartesianGrid vertical={false} strokeDasharray="2 5" stroke="var(--color-border)" />
                    <XAxis dataKey="label" tick={EJE} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} tickMargin={10} />
                    <YAxis tickFormatter={formatPeso} tick={EJE} axisLine={false} tickLine={false} width={64} />
                    <Tooltip content={<TooltipCustom />} cursor={{ fill: 'var(--color-blue-muted)' }} />
                    <Bar dataKey="presupuesto_mensual" name="Presupuesto mensual" fill="url(#gm-azul)" maxBarSize={22} radius={[7, 7, 0, 0]} />
                    <Bar dataKey="gasto_real" name="Gasto real" fill="url(#gm-verde)" maxBarSize={22} radius={[7, 7, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)' }}>
                  Curva de costo acumulado — Planificado vs Real
                </div>
                <Leyenda items={[
                  { label: 'Acumulado planificado', color: 'var(--color-blue)' },
                  { label: 'Acumulado real', color: 'var(--color-green)' },
                  { label: 'Presupuesto total', color: 'var(--color-warning)' }
                ]} />
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={datos.serie} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
                    <Degradados id="ac" />
                    <CartesianGrid vertical={false} strokeDasharray="2 5" stroke="var(--color-border)" />
                    <XAxis dataKey="label" tick={EJE} axisLine={{ stroke: 'var(--color-border)' }} tickLine={false} tickMargin={10} />
                    <YAxis tickFormatter={formatPeso} tick={EJE} axisLine={false} tickLine={false} width={64} />
                    <Tooltip content={<TooltipCustom />} cursor={{ stroke: 'var(--color-border-strong)', strokeDasharray: '3 3' }} />
                    {/* extendDomain: en una obra de varios años lo planificado del año no llega al
                        total, y sin esto el eje se corta antes y la línea no se dibuja */}
                    <ReferenceLine
                      y={datos.presupuesto}
                      ifOverflow="extendDomain"
                      stroke="var(--color-warning)"
                      strokeDasharray="6 4"
                      label={{ value: 'Presupuesto total', fill: 'var(--color-warning)', fontSize: 11.5, position: 'insideTopRight' }}
                    />
                    <Area type="monotone" dataKey="acumulado_ppto" name="Acumulado planificado" stroke="var(--color-blue)" strokeWidth={2.5} fill="url(#ac-area-azul)" dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--color-bg-surface)' }} />
                    <Area type="monotone" dataKey="acumulado_real" name="Acumulado real" stroke="var(--color-green)" strokeWidth={2.5} fill="url(#ac-area-verde)" dot={{ r: 3.5, strokeWidth: 2, stroke: 'var(--color-bg-surface)', fill: 'var(--color-green)' }} activeDot={{ r: 5.5, strokeWidth: 2, stroke: 'var(--color-bg-surface)' }} />
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
