import { useState, useEffect, useMemo } from 'react';
import { Truck, Search, Send } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

export default function IngresoGuia() {
  const { toasts, addToast, removeToast } = useToast();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [guias, setGuias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [loadingGuias, setLoadingGuias] = useState(true);
  const [confirmando, setConfirmando] = useState(false);

  const [registradas, setRegistradas] = useState([]);
  const [loadingRegistradas, setLoadingRegistradas] = useState(true);
  const [despachando, setDespachando] = useState(null);

  const [numeroGuia, setNumeroGuia] = useState('');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [ordenCompraSeleccionada, setOrdenCompraSeleccionada] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [busqueda, setBusqueda] = useState('');
  const [materialSeleccionado, setMaterialSeleccionado] = useState(null);
  const [cantidadRecibida, setCantidadRecibida] = useState('');
  const [errorGuia, setErrorGuia] = useState('');

  const materialesFiltrados = useMemo(() => {
    if (!busqueda.trim()) return [];
    const q = busqueda.toLowerCase();
    return materiales.filter(m =>
      m.material_nombre.toLowerCase().includes(q) ||
      m.material_codigo_sku.toLowerCase().includes(q)
    );
  }, [busqueda, materiales]);

  const cargarGuias = () => {
    setLoadingGuias(true);
    api.get('/guia-despacho')
      .then(r => setGuias(r.data.data))
      .catch(() => addToast('Error al cargar el historial de guías', 'error'))
      .finally(() => setLoadingGuias(false));
  };

  const cargarRegistradas = () => {
    setLoadingRegistradas(true);
    api.get('/guia-despacho/registradas')
      .then(r => setRegistradas(r.data.data))
      .catch(() => addToast('Error al cargar las guías pendientes de despacho', 'error'))
      .finally(() => setLoadingRegistradas(false));
  };

  const confirmarDespacho = guia => {
    setDespachando(guia.guia_despacho_id);
    api.post(`/guia-despacho/${guia.guia_despacho_id}/confirmar-despacho`)
      .then(() => {
        addToast(`Despacho confirmado — guía ${guia.guia_despacho_numero} ahora está "En Tránsito"`, 'success');
        cargarRegistradas();
        cargarGuias();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al confirmar el despacho', 'error'))
      .finally(() => setDespachando(null));
  };

  useEffect(() => {
    cargarGuias();
    cargarRegistradas();
    api.get('/guia-despacho/proveedores')
      .then(r => setProveedores(r.data.data))
      .catch(() => addToast('Error al cargar proveedores', 'error'));
    api.get('/guia-despacho/ordenes-compra')
      .then(r => setOrdenesCompra(r.data.data))
      .catch(() => addToast('Error al cargar órdenes de compra', 'error'));
    api.get('/material')
      .then(r => setMateriales(r.data.data))
      .catch(() => addToast('Error al cargar el catálogo de materiales', 'error'));
  }, []);

  const seleccionarMaterial = m => {
    setMaterialSeleccionado(m);
    setBusqueda(`${m.material_codigo_sku} — ${m.material_nombre}`);
  };

  const limpiarFormulario = () => {
    setNumeroGuia('');
    setProveedorSeleccionado('');
    setOrdenCompraSeleccionada('');
    setFecha(new Date().toISOString().split('T')[0]);
    setBusqueda('');
    setMaterialSeleccionado(null);
    setCantidadRecibida('');
    setErrorGuia('');
  };

  const confirmarRecepcion = () => {
    if (!numeroGuia.trim() || !proveedorSeleccionado || !materialSeleccionado || !cantidadRecibida) {
      addToast('Número de guía, proveedor, material y cantidad son obligatorios', 'error');
      return;
    }

    setConfirmando(true);
    setErrorGuia('');
    api.post('/guia-despacho', {
      numero: numeroGuia,
      proveedor_rut: proveedorSeleccionado,
      orden_compra_id: ordenCompraSeleccionada || undefined,
      material_id: materialSeleccionado.material_id,
      cantidad_recibida: parseInt(cantidadRecibida),
      fecha
    })
      .then(r => {
        if (r.data.data.alerta_exceso) {
          addToast('Ingreso de materiales exitoso — la cantidad supera lo comprado', 'warning');
        } else {
          addToast('Ingreso de materiales exitoso', 'success');
        }
        limpiarFormulario();
        cargarGuias();
        cargarRegistradas();
      })
      .catch(err => {
        const mensaje = err.response?.data?.error || 'Error al registrar el ingreso';
        setErrorGuia(mensaje);
        addToast(mensaje, 'error');
      })
      .finally(() => setConfirmando(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Truck size={20} />
        Ingreso por Guía
      </h1>

      <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
        <div className="form-group">
          <label className="form-label">Número de Guía de Despacho</label>
          <input
            type="text"
            className="form-input"
            style={errorGuia ? { borderColor: 'var(--color-danger)' } : {}}
            value={numeroGuia}
            onChange={e => { setNumeroGuia(e.target.value); setErrorGuia(''); }}
          />
          {errorGuia && (
            <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errorGuia}</p>
          )}
        </div>

        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Proveedor</label>
            <select
              className="form-select"
              value={proveedorSeleccionado}
              onChange={e => setProveedorSeleccionado(e.target.value)}
            >
              <option value="">Selecciona un proveedor...</option>
              {proveedores.map(p => (
                <option key={p.proveedor_rut} value={p.proveedor_rut}>{p.proveedor_razon_social}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">OC Asociada (opcional)</label>
            <select
              className="form-select"
              value={ordenCompraSeleccionada}
              onChange={e => setOrdenCompraSeleccionada(e.target.value)}
            >
              <option value="">Sin OC asociada</option>
              {ordenesCompra.map(o => (
                <option key={o.orden_compra_id} value={o.orden_compra_id}>{o.orden_compra_folio}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Fecha</label>
          <input
            type="date"
            className="form-input"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Buscar Material</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: 'var(--color-text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Ej: Tubería de cobre o MAT-001..."
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setMaterialSeleccionado(null); }}
            />
          </div>
          {busqueda.trim() && !materialSeleccionado && (
            <div style={{
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              marginTop: 6,
              maxHeight: 180,
              overflowY: 'auto'
            }}>
              {materialesFiltrados.length === 0 ? (
                <p style={{ padding: 12, fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Sin resultados en el catálogo.
                </p>
              ) : (
                materialesFiltrados.map(m => (
                  <button
                    key={m.material_id}
                    onClick={() => seleccionarMaterial(m)}
                    style={{
                      width: '100%', textAlign: 'left', padding: '8px 12px',
                      background: 'transparent', border: 'none',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer', color: 'var(--color-text-primary)', fontSize: 13
                    }}
                  >
                    <strong>{m.material_codigo_sku}</strong> — {m.material_nombre}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {materialSeleccionado && (
          <div className="form-group">
            <label className="form-label">Cantidad Recibida ({materialSeleccionado.material_unidad_medida})</label>
            <input
              type="number"
              min="1"
              className="form-input"
              value={cantidadRecibida}
              onChange={e => setCantidadRecibida(e.target.value)}
            />
          </div>
        )}

        <button className="btn btn-primary" onClick={confirmarRecepcion} disabled={confirmando}>
          {confirmando ? 'Confirmando...' : 'Confirmar Recepción'}
        </button>
      </div>

      {usuario.rol === 'admin' && (
        <div className="card" style={{ padding: 0, marginBottom: 24 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Guías Pendientes de Confirmar Despacho
            </h3>
          </div>
          {loadingRegistradas ? (
            <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
          ) : registradas.length === 0 ? (
            <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
              No hay guías registradas a la espera de que el proveedor confirme el despacho.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>N° Guía</th>
                    <th>Proveedor</th>
                    <th>Material</th>
                    <th>OC</th>
                    <th>Fecha</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {registradas.map(g => (
                    <tr key={g.guia_despacho_id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{g.guia_despacho_numero}</td>
                      <td style={{ fontSize: 13 }}>{g.Proveedor?.proveedor_razon_social || '—'}</td>
                      <td style={{ fontSize: 13 }}>{g.Material?.material_nombre || '—'}</td>
                      <td style={{ fontSize: 13 }}>{g.OrdenCompra?.orden_compra_folio || '—'}</td>
                      <td style={{ fontSize: 13 }}>{g.guia_despacho_fecha}</td>
                      <td>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => confirmarDespacho(g)}
                          disabled={despachando === g.guia_despacho_id}
                        >
                          <Send size={13} />
                          {despachando === g.guia_despacho_id ? 'Confirmando...' : 'Confirmar Despacho'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Historial de Guías
          </h3>
        </div>
        {loadingGuias ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
        ) : guias.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
            No hay guías de despacho registradas
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>N° Guía</th>
                  <th>Proveedor</th>
                  <th>Material</th>
                  <th>Cantidad</th>
                  <th>OC</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {guias.map(g => (
                  <tr key={g.guia_despacho_id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{g.guia_despacho_numero}</td>
                    <td style={{ fontSize: 13 }}>{g.Proveedor?.proveedor_razon_social || '—'}</td>
                    <td style={{ fontSize: 13 }}>{g.Material?.material_nombre || '—'}</td>
                    <td style={{ fontSize: 13 }}>{g.guia_despacho_cantidad_recibida}</td>
                    <td style={{ fontSize: 13 }}>{g.OrdenCompra?.orden_compra_folio || '—'}</td>
                    <td style={{ fontSize: 13 }}>{g.guia_despacho_fecha}</td>
                    <td><Badge value={g.guia_despacho_estado} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
