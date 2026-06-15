import { useState, useEffect } from 'react';
import { FileText, Link, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, Package } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const FORM_VACIO = { factura_folio: '', factura_monto_total: '', factura_fecha: '', pdf: null };

export default function VincularFactura() {
  const { toasts, addToast, removeToast } = useToast();
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [form, setForm] = useState({ ...FORM_VACIO });
  const [alerta, setAlerta] = useState(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const r = await api.get('/factura/ordenes-pendientes');
      setOrdenes(r.data.data);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al cargar órdenes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const seleccionar = (orden) => {
    if (seleccionada?.orden_compra_id === orden.orden_compra_id) {
      setSeleccionada(null);
      setForm({ ...FORM_VACIO });
      setAlerta(null);
      return;
    }
    setSeleccionada(orden);
    setForm({ ...FORM_VACIO });
    setAlerta(null);
  };

  const formatPeso = v => Number(v).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 });

  const verificarMonto = (valor) => {
    const monto = parseFloat(valor);
    const total = seleccionada?.total_calculado || 0;
    if (total > 0 && monto && Math.abs(monto - total) > 1) {
      setAlerta(`El monto ingresado (${formatPeso(monto)}) difiere del total de la OC (${formatPeso(total)})`);
    } else {
      setAlerta(null);
    }
  };

  const vincular = async () => {
    if (!form.factura_folio.trim()) { addToast('El folio es requerido', 'error'); return; }
    if (!form.factura_monto_total) { addToast('El monto es requerido', 'error'); return; }
    if (!form.factura_fecha) { addToast('La fecha es requerida', 'error'); return; }

    const total = seleccionada?.total_calculado || 0;
    const monto = parseFloat(form.factura_monto_total);
    if (total > 0 && Math.abs(monto - total) > 1) {
      addToast(`El monto no coincide con el total de la orden (${formatPeso(total)})`, 'error');
      return;
    }

    setEnviando(true);
    try {
      const fd = new FormData();
      fd.append('factura_folio', form.factura_folio.trim());
      fd.append('factura_monto_total', form.factura_monto_total);
      fd.append('factura_fecha', form.factura_fecha);
      if (form.pdf) fd.append('pdf', form.pdf);

      await api.post(`/factura/${seleccionada.orden_compra_id}/vincular`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      addToast('Factura vinculada correctamente', 'success');
      setSeleccionada(null);
      setForm({ ...FORM_VACIO });
      setAlerta(null);
      cargar();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al vincular factura', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 0 }}>
          <FileText size={20} />
          Vincular Facturas a Órdenes de Compra
        </h1>
        <button className="btn btn-secondary" onClick={cargar} disabled={loading} style={{ height: 36 }}>
          <RefreshCw size={14} />
          Actualizar
        </button>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-text-secondary)', padding: 32, textAlign: 'center' }}>Cargando órdenes...</div>
      ) : ordenes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-secondary)' }}>
          No hay órdenes de compra pendientes de facturación.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ordenes.map(orden => {
            const abierto = seleccionada?.orden_compra_id === orden.orden_compra_id;
            return (
              <div key={orden.orden_compra_id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Cabecera OC */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '14px 18px', cursor: 'pointer',
                    background: abierto ? 'var(--color-bg-elevated)' : 'transparent'
                  }}
                  onClick={() => seleccionar(orden)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{orden.orden_compra_folio}</span>
                      <Badge value={orden.orden_compra_estado} />
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {orden.Proveedor?.proveedor_razon_social || orden.proveedor_rut} ·{' '}
                      {new Date(orden.orden_compra_fecha + 'T00:00:00').toLocaleDateString('es-CL')} ·{' '}
                      <span style={{ color: 'var(--color-green)', fontWeight: 600 }}>{formatPeso(orden.total_calculado || 0)}</span>
                    </div>
                  </div>
                  {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>

                {/* Detalles de la OC */}
                {abierto && (
                  <div style={{ borderTop: '1px solid var(--color-border)', padding: '16px 18px 20px' }}>
                    {/* Tabla ítems */}
                    {orden.DetalleOrdenCompras?.length > 0 && (
                      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 18, background: 'var(--color-bg-elevated)' }}>
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>Material</th>
                                <th style={{ textAlign: 'right' }}>Cant.</th>
                                <th style={{ textAlign: 'right' }}>P. Unitario</th>
                                <th style={{ textAlign: 'right' }}>Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orden.DetalleOrdenCompras.map((d, i) => (
                                <tr key={i}>
                                  <td>{d.detalle_orden_compra_descripcion_material}</td>
                                  <td style={{ textAlign: 'right' }}>{d.detalle_orden_compra_cantidad}</td>
                                  <td style={{ textAlign: 'right' }}>{formatPeso(d.detalle_orden_compra_precio_unitario)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                    {formatPeso(d.detalle_orden_compra_cantidad * d.detalle_orden_compra_precio_unitario)}
                                  </td>
                                </tr>
                              ))}
                              <tr style={{ borderTop: '2px solid var(--color-border)' }}>
                                <td colSpan={3} style={{ fontWeight: 700, textAlign: 'right', textTransform: 'uppercase', fontSize: 12 }}>Total OC</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-green)' }}>{formatPeso(orden.total_calculado)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Guías de despacho asociadas */}
                    {orden.GuiaDespachos?.length > 0 && (
                      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 18, background: 'var(--color-bg-elevated)' }}>
                        <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Package size={13} color="var(--color-text-muted)" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Guías de Despacho ({orden.GuiaDespachos.length})
                          </span>
                        </div>
                        <div className="table-container">
                          <table>
                            <thead>
                              <tr>
                                <th>N° Guía</th>
                                <th>Fecha</th>
                                <th>Estado</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orden.GuiaDespachos.map(g => (
                                <tr key={g.guia_despacho_id}>
                                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{g.guia_despacho_numero}</td>
                                  <td style={{ fontSize: 13 }}>{g.guia_despacho_fecha}</td>
                                  <td><Badge value={g.guia_despacho_estado} /></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Formulario vinculación */}
                    <div className="form-grid-3" style={{ marginBottom: 12 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Folio factura *</label>
                        <input
                          className="form-input"
                          placeholder="Ej: 12345"
                          value={form.factura_folio}
                          onChange={e => setForm(f => ({ ...f, factura_folio: e.target.value }))}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Monto total *</label>
                        <input
                          className="form-input"
                          type="number"
                          placeholder={`Total OC: ${formatPeso(orden.total_calculado)}`}
                          value={form.factura_monto_total}
                          onChange={e => {
                            setForm(f => ({ ...f, factura_monto_total: e.target.value }));
                            verificarMonto(e.target.value);
                          }}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Fecha factura *</label>
                        <input
                          className="form-input"
                          type="date"
                          value={form.factura_fecha}
                          onChange={e => setForm(f => ({ ...f, factura_fecha: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className="form-label">Archivo PDF (opcional)</label>
                      <input
                        type="file"
                        accept=".pdf"
                        className="form-input"
                        style={{ paddingTop: 8 }}
                        onChange={e => setForm(f => ({ ...f, pdf: e.target.files[0] || null }))}
                      />
                    </div>

                    {/* Alerta discrepancia */}
                    {alerta && (
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
                        background: 'rgba(212, 147, 10, 0.12)', border: '1px solid var(--color-warning)',
                        borderRadius: 4, marginBottom: 12, fontSize: 13, color: 'var(--color-warning)'
                      }}>
                        <AlertTriangle size={15} />
                        {alerta}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-primary"
                        onClick={vincular}
                        disabled={enviando}
                        style={{ height: 40 }}
                      >
                        <Link size={14} />
                        {enviando ? 'Vinculando...' : 'Vincular Factura'}
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
