import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

const DETALLE_VACIO = { descripcion_material: '', cantidad: '', precio_unitario: '' };

export default function OrdenCompra() {
  const { toasts, addToast, removeToast } = useToast();
  const [solicitudes, setSolicitudes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Solicitud seleccionada para generar OC
  const [seleccionada, setSeleccionada] = useState(null);
  const [proveedorRut, setProveedorRut] = useState('');
  const [detalles, setDetalles] = useState([{ ...DETALLE_VACIO }]);

  const cargar = async () => {
    setLoading(true);
    try {
      const [rSol, rProv] = await Promise.all([
        api.get('/orden-compra/solicitudes-pendientes'),
        api.get('/orden-compra/proveedores')
      ]);
      setSolicitudes(rSol.data.data);
      setProveedores(rProv.data.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const seleccionar = (sol) => {
    if (seleccionada?.solicitud_material_id === sol.solicitud_material_id) {
      setSeleccionada(null);
      resetForm();
      return;
    }
    setSeleccionada(sol);
    setProveedorRut('');
    setDetalles([{ ...DETALLE_VACIO }]);
  };

  const resetForm = () => {
    setProveedorRut('');
    setDetalles([{ ...DETALLE_VACIO }]);
  };

  const agregarDetalle = () => setDetalles(prev => [...prev, { ...DETALLE_VACIO }]);

  const actualizarDetalle = (i, campo, valor) => {
    setDetalles(prev => prev.map((d, idx) => idx === i ? { ...d, [campo]: valor } : d));
  };

  const eliminarDetalle = (i) => {
    if (detalles.length === 1) return;
    setDetalles(prev => prev.filter((_, idx) => idx !== i));
  };

  const totalOC = detalles.reduce((sum, d) => {
    const cant = parseFloat(d.cantidad) || 0;
    const precio = parseFloat(d.precio_unitario) || 0;
    return sum + cant * precio;
  }, 0);

  const formatPeso = v => v.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  const generar = async () => {
    if (!seleccionada) { addToast('Selecciona una solicitud', 'error'); return; }
    if (!proveedorRut) { addToast('Selecciona un proveedor', 'error'); return; }
    const detvalid = detalles.filter(d => d.descripcion_material.trim() && d.cantidad > 0 && d.precio_unitario > 0);
    if (!detvalid.length) { addToast('Agrega al menos un ítem válido', 'error'); return; }

    setEnviando(true);
    try {
      await api.post('/orden-compra/generar', {
        solicitud_material_id: seleccionada.solicitud_material_id,
        proveedor_rut: proveedorRut,
        detalles: detvalid
      });
      addToast('Orden de compra generada correctamente', 'success');
      setSeleccionada(null);
      resetForm();
      cargar();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al generar orden de compra', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0 }}>
          <ShoppingCart size={20} />
          Generar Orden de Compra
        </h1>
        <button className="btn btn-secondary" onClick={cargar} disabled={loading} style={{ height: 36 }}>
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)', padding: 32, textAlign: 'center' }}>Cargando solicitudes...</div>
      ) : solicitudes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
          No hay solicitudes de materiales pendientes.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {solicitudes.map(sol => {
            const abierto = seleccionada?.solicitud_material_id === sol.solicitud_material_id;
            return (
              <div key={sol.solicitud_material_id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Cabecera solicitud */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', cursor: 'pointer',
                    background: abierto ? 'var(--color-bg-elevated)' : 'transparent'
                  }}
                  onClick={() => seleccionar(sol)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
                      SM-{sol.solicitud_material_id} — {sol.Proyecto?.proyecto_nombre_obra || sol.proyecto_codigo_correlativo}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {sol.solicitud_material_descripcion} · {sol.solicitud_material_cantidad} unid. · {new Date(sol.solicitud_material_fecha + 'T00:00:00').toLocaleDateString('es-CL')}
                    </div>
                  </div>
                  {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* Panel generación OC */}
                {abierto && (
                  <div style={{ borderTop: '1px solid var(--color-border)', padding: '18px 18px 20px' }}>
                    {/* Proveedor */}
                    <div className="form-group">
                      <label className="form-label">Proveedor *</label>
                      <select
                        className="form-select"
                        value={proveedorRut}
                        onChange={e => setProveedorRut(e.target.value)}
                      >
                        <option value="">— Seleccionar proveedor —</option>
                        {proveedores.map(p => (
                          <option key={p.proveedor_rut} value={p.proveedor_rut}>
                            {p.proveedor_razon_social} ({p.proveedor_rut})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Ítems */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span className="form-label" style={{ margin: 0 }}>Ítems de la orden *</span>
                        <button className="btn btn-secondary" style={{ height: 30, fontSize: 12 }} onClick={agregarDetalle}>
                          <Plus size={13} /> Agregar ítem
                        </button>
                      </div>

                      {detalles.map((d, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 120px 36px', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                          <input
                            className="form-input"
                            placeholder="Descripción del material"
                            value={d.descripcion_material}
                            onChange={e => actualizarDetalle(i, 'descripcion_material', e.target.value)}
                          />
                          <input
                            className="form-input"
                            type="number"
                            placeholder="Cant."
                            min="1"
                            value={d.cantidad}
                            onChange={e => actualizarDetalle(i, 'cantidad', e.target.value)}
                          />
                          <input
                            className="form-input"
                            type="number"
                            placeholder="P. unitario"
                            min="0"
                            value={d.precio_unitario}
                            onChange={e => actualizarDetalle(i, 'precio_unitario', e.target.value)}
                          />
                          <button
                            className="btn btn-danger"
                            style={{ height: 40, padding: '0 8px', opacity: detalles.length === 1 ? 0.3 : 1 }}
                            onClick={() => eliminarDetalle(i)}
                            disabled={detalles.length === 1}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Total + botón */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
                      <div>
                        <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total OC</span>
                        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-green)' }}>{formatPeso(totalOC)}</div>
                      </div>
                      <button
                        className="btn btn-primary"
                        onClick={generar}
                        disabled={enviando}
                        style={{ height: 40 }}
                      >
                        <ShoppingCart size={14} />
                        {enviando ? 'Generando...' : 'Generar Orden de Compra'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
