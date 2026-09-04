import { useState, useEffect } from 'react';
import { Truck, PackageSearch } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

export default function MaterialesTransito() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [proyecto, setProyecto] = useState('');
  const [envios, setEnvios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    api.get('/portafolio')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  const cargar = () => {
    setLoading(true);
    api.get('/transito', { params: proyecto ? { proyecto } : {} })
      .then(r => setEnvios(r.data.data))
      .catch(() => addToast('Error al cargar los materiales en tránsito', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, [proyecto]);

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Truck size={20} />
        Materiales en Tránsito
      </h1>

      <div className="card" style={{ marginBottom: 16, maxWidth: 420 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Proyecto</label>
          <select className="form-select" value={proyecto} onChange={e => setProyecto(e.target.value)}>
            <option value="">Todos mis proyectos</option>
            {proyectos.map(p => (
              <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando...</p>
        ) : envios.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            No existen materiales en tránsito para ese proyecto.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>N° Guía Proveedor</th>
                  <th>Proyecto</th>
                  <th>Proveedor</th>
                  <th>Material</th>
                  <th>Cantidad</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {envios.map(e => (
                  <tr key={e.guia_despacho_id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{e.guia_despacho_numero}</td>
                    <td style={{ fontSize: 12 }}>{e.proyecto_codigo_correlativo || '—'}</td>
                    <td style={{ fontSize: 13 }}>{e.proveedor}</td>
                    <td style={{ fontSize: 13 }}>{e.material_nombre}</td>
                    <td style={{ fontSize: 13 }}>{e.cantidad} {e.unidad}</td>
                    <td style={{ fontSize: 13 }}>{e.guia_despacho_fecha}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12 }}
                              onClick={() => setDetalle(e)}>
                        <PackageSearch size={13} /> Ver detalle
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}
          onClick={() => setDetalle(null)}
        >
          <div className="card" style={{ maxWidth: 460, width: '100%' }} onClick={ev => ev.stopPropagation()}>
            <h3 style={{ marginBottom: 12, fontSize: 15, fontWeight: 700 }}>Detalle del envío</h3>
            <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
              <div><span style={{ color: 'var(--color-text-muted)' }}>N° Guía de despacho: </span>{detalle.guia_despacho_numero}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Proyecto: </span>{detalle.proyecto_codigo_correlativo}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Proveedor: </span>{detalle.proveedor}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>OC: </span>{detalle.orden_compra_folio || '—'}</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Material: </span>{detalle.material_nombre} ({detalle.material_sku})</div>
              <div><span style={{ color: 'var(--color-text-muted)' }}>Cantidad: </span>{detalle.cantidad} {detalle.unidad}</div>
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setDetalle(null)}>Cerrar</button>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
