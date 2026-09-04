import { useState, useEffect } from 'react';
import { ShoppingCart, Eye } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const clp = n => '$' + Number(n || 0).toLocaleString('es-CL');

export default function HistorialOrdenesCompra() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [filtros, setFiltros] = useState({ desde: '', hasta: '', proyecto: '' });
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    api.get('/portafolio')
      .then(r => setProyectos(r.data.data))
      .catch(() => setProyectos([]));
  }, []);

  const buscar = () => {
    setLoading(true);
    const params = {};
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;
    if (filtros.proyecto) params.proyecto = filtros.proyecto;
    api.get('/orden-compra/historial', { params })
      .then(r => setOrdenes(r.data.data))
      .catch(() => addToast('Error al obtener el historial', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { buscar(); }, []);

  const verDetalle = id => {
    api.get(`/orden-compra/${id}/detalle`)
      .then(r => setDetalle(r.data.data))
      .catch(() => addToast('Error al obtener el detalle', 'error'));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShoppingCart size={20} />
        Historial de Órdenes de Compra
      </h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Desde</label>
            <input type="date" className="form-input" value={filtros.desde}
                   onChange={e => setFiltros(f => ({ ...f, desde: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Hasta</label>
            <input type="date" className="form-input" value={filtros.hasta}
                   onChange={e => setFiltros(f => ({ ...f, hasta: e.target.value }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 0, minWidth: 240 }}>
            <label className="form-label">Proyecto</label>
            <select className="form-select" value={filtros.proyecto}
                    onChange={e => setFiltros(f => ({ ...f, proyecto: e.target.value }))}>
              <option value="">Todos</option>
              {proyectos.map(p => (
                <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                  {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={buscar}>Filtrar</button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando...</p>
        ) : ordenes.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            No existen órdenes de compra para los criterios seleccionados.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Proyecto</th>
                  <th>Proveedor</th>
                  <th>Monto Total</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ordenes.map(o => (
                  <tr key={o.orden_compra_id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{o.orden_compra_folio}</td>
                    <td style={{ fontSize: 13 }}>{o.orden_compra_fecha}</td>
                    <td style={{ fontSize: 13 }}>{o.proyecto_codigo_correlativo}</td>
                    <td style={{ fontSize: 13 }}>{o.proveedor}</td>
                    <td style={{ fontSize: 13 }}>{clp(o.monto_total)}</td>
                    <td><Badge value={o.orden_compra_estado} /></td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => verDetalle(o.orden_compra_id)}>
                        <Eye size={13} /> Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detalle && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 500, padding: 24, overflowY: 'auto' }}
          onClick={() => setDetalle(null)}
        >
          <div className="card" style={{ maxWidth: 640, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4, fontSize: 15, fontWeight: 700 }}>{detalle.orden.orden_compra_folio}</h3>
            <div style={{ display: 'grid', gap: 4, fontSize: 12, marginBottom: 16 }}>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Fecha: </span>{detalle.orden.orden_compra_fecha}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Estado: </span>{detalle.orden.orden_compra_estado}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Proyecto: </span>{detalle.orden.Proyecto?.proyecto_nombre_obra} ({detalle.orden.proyecto_codigo_correlativo})</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Proveedor: </span>{detalle.orden.Proveedor?.proveedor_razon_social || detalle.orden.proveedor_rut}</div>
            </div>

            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
              Detalle comercial
            </p>
            <div className="table-container">
              <table>
                <thead><tr><th>Material</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detalle.detalles.map(d => (
                    <tr key={d.detalle_orden_compra_id}>
                      <td style={{ fontSize: 12 }}>{d.detalle_orden_compra_descripcion_material}</td>
                      <td style={{ fontSize: 12 }}>{d.detalle_orden_compra_cantidad}</td>
                      <td style={{ fontSize: 12 }}>{clp(d.detalle_orden_compra_precio_unitario)}</td>
                      <td style={{ fontSize: 12 }}>{clp(d.detalle_orden_compra_cantidad * d.detalle_orden_compra_precio_unitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: 12, fontWeight: 700, fontSize: 14 }}>Total: {clp(detalle.monto_total)}</p>

            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setDetalle(null)}>Cerrar</button>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
