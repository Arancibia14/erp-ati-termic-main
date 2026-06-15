import { useState, useEffect } from 'react';
import { DollarSign, Plus, Send, X } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

const fmt = n => n !== undefined && n !== null ? `$${parseFloat(n).toLocaleString('es-CL')}` : '--';

export default function CajaChica() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState('');
  const [saldo, setSaldo] = useState(null);
  const [egresos, setEgresos] = useState([]);
  const [loadingEgresos, setLoadingEgresos] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    egreso_caja_chica_monto: '',
    egreso_caja_chica_concepto: '',
    egreso_caja_chica_fecha: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    api.get('/caja-chica/proyectos')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  const cargarDatos = async codigo => {
    if (!codigo) { setSaldo(null); setEgresos([]); return; }
    try {
      const [rSaldo, rEgresos] = await Promise.all([
        api.get(`/caja-chica/saldo/${codigo}`),
        api.get(`/caja-chica/${codigo}/egresos`)
      ]);
      setSaldo(rSaldo.data.data);
      setEgresos(rEgresos.data.data);
    } catch {
      addToast('Error al cargar datos del proyecto', 'error');
    }
  };

  const handleProyecto = e => {
    const codigo = e.target.value;
    setCodigoSeleccionado(codigo);
    setMostrarForm(false);
    cargarDatos(codigo);
  };

  const abrirNuevo = () => {
    setForm({ egreso_caja_chica_monto: '', egreso_caja_chica_concepto: '', egreso_caja_chica_fecha: new Date().toISOString().split('T')[0] });
    setMostrarForm(true);
  };

  const cancelar = () => setMostrarForm(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.egreso_caja_chica_monto || !form.egreso_caja_chica_concepto) {
      addToast('Monto y concepto son requeridos', 'error'); return;
    }
    const monto = parseFloat(form.egreso_caja_chica_monto);
    if (isNaN(monto) || monto <= 0) { addToast('El monto debe ser mayor a 0', 'error'); return; }
    if (saldo && monto > saldo.saldo_disponible) {
      addToast(`Saldo insuficiente. Disponible: ${fmt(saldo.saldo_disponible)}`, 'error'); return;
    }
    setLoading(true);
    try {
      await api.post('/caja-chica', { ...form, proyecto_codigo_correlativo: codigoSeleccionado });
      addToast('Egreso registrado correctamente', 'success');
      setMostrarForm(false);
      cargarDatos(codigoSeleccionado);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar egreso', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <DollarSign size={20} />
        Caja Chica
      </h1>

      {/* Selector proyecto */}
      <div className="card" style={{ maxWidth: 680, marginBottom: 20 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Proyecto</label>
          <select className="form-select" value={codigoSeleccionado} onChange={handleProyecto}>
            <option value="">Selecciona un proyecto...</option>
            {proyectos.map(p => (
              <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
              </option>
            ))}
          </select>
        </div>

        {/* Saldo */}
        {saldo && (
          <div className="form-grid-3" style={{ marginTop: 16 }}>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Presupuesto</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(saldo.presupuesto)}</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Total Egresos</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-danger)' }}>{fmt(saldo.total_egresos)}</div>
            </div>
            <div style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', borderRadius: 4, padding: '10px 14px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Saldo Disponible</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: saldo.saldo_disponible >= 0 ? 'var(--color-green)' : 'var(--color-danger)' }}>
                {fmt(saldo.saldo_disponible)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón Nuevo Egreso */}
      {codigoSeleccionado && !mostrarForm && (
        <div style={{ maxWidth: 680, marginBottom: 20 }}>
          <button className="btn btn-primary" onClick={abrirNuevo}>
            <Plus size={15} />
            Nuevo Egreso de Caja Chica
          </button>
        </div>
      )}

      {/* Formulario nuevo egreso */}
      {mostrarForm && (
        <div className="card" style={{ maxWidth: 680, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nuevo Egreso de Caja Chica
            </h3>
            <button onClick={cancelar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Fecha</label>
              <input
                type="date"
                className="form-input"
                value={form.egreso_caja_chica_fecha}
                onChange={e => setForm(f => ({ ...f, egreso_caja_chica_fecha: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Monto ($)</label>
              <input
                type="number"
                className="form-input"
                placeholder="0"
                min="1"
                value={form.egreso_caja_chica_monto}
                onChange={e => setForm(f => ({ ...f, egreso_caja_chica_monto: e.target.value }))}
              />
              {saldo && form.egreso_caja_chica_monto && parseFloat(form.egreso_caja_chica_monto) > saldo.saldo_disponible && (
                <span style={{ fontSize: 12, color: 'var(--color-danger)', display: 'block', marginTop: 4 }}>
                  Monto supera el saldo disponible ({fmt(saldo.saldo_disponible)})
                </span>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Concepto</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Descripción del gasto..."
                value={form.egreso_caja_chica_concepto}
                onChange={e => setForm(f => ({ ...f, egreso_caja_chica_concepto: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Send size={15} />
                {loading ? 'Registrando...' : 'Registrar Egreso'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelar}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de egresos */}
      {codigoSeleccionado && (
        <div style={{ maxWidth: 680 }}>
          {loadingEgresos && <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando egresos...</p>}
          {!loadingEgresos && egresos.length === 0 && !mostrarForm && (
            <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>
              No hay egresos registrados para este proyecto.
            </div>
          )}
          {egresos.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Historial de Egresos ({egresos.length})
                </span>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Concepto</th>
                      <th style={{ textAlign: 'right' }}>Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {egresos.map(e => (
                      <tr key={e.egreso_caja_chica_id}>
                        <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>
                          {new Date(e.egreso_caja_chica_fecha + 'T00:00:00').toLocaleDateString('es-CL')}
                        </td>
                        <td style={{ fontSize: 13 }}>{e.egreso_caja_chica_concepto}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-danger)' }}>
                          {fmt(e.egreso_caja_chica_monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
