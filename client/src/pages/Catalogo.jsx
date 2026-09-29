import { useState, useEffect } from 'react';
import { Package, Plus, Trash2, Layers, X } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import { IlustracionCatalogoVacio } from '../components/Ilustraciones';
import Badge from '../components/Badge';
import ModalEliminacion from '../components/ModalEliminacion';
import Select from '../components/Select';

const UNIDADES = ['Unidad', 'Metro', 'Kg', 'Litro', 'Caja', 'Rollo', 'Par'];

const FORM_VACIO = {
  material_codigo_sku: '',
  material_nombre: '',
  material_descripcion: '',
  material_unidad_medida: '',
  material_categoria: '',
  material_stock_minimo: '',
  material_proveedor_rut: ''
};

export default function Catalogo() {
  const { toasts, addToast, removeToast } = useToast();
  // CU 49 - Material cuya eliminación se está validando
  const [eliminacion, setEliminacion] = useState(null);
  const [materiales, setMateriales] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [camposInvalidos, setCamposInvalidos] = useState({});
  // CU 26 / UR-F-29 - Valor del inventario por FIFO y lotes de cada material
  const [valorizacion, setValorizacion] = useState({ materiales: [], valor_total: 0 });
  const [lotesDe, setLotesDe] = useState(null);
  const pesos = v => '$' + Math.round(v || 0).toLocaleString('es-CL');
  const valorDe = id => valorizacion.materiales.find(x => x.material_id === id);

  const cargarMateriales = () => {
    setLoading(true);
    api.get('/material/valorizacion')
      .then(r => setValorizacion(r.data.data))
      .catch(() => {});
    api.get('/material')
      .then(r => setMateriales(r.data.data))
      .catch(() => addToast('Error al cargar el catálogo de materiales', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarMateriales();
    api.get('/guia-despacho/proveedores')
      .then(r => setProveedores(r.data.data))
      .catch(() => addToast('Error al cargar proveedores', 'error'));
  }, []);

  const actualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setCamposInvalidos(prev => ({ ...prev, [campo]: false }));
  };

  const cancelarForm = () => {
    setForm(FORM_VACIO);
    setCamposInvalidos({});
    setMostrarForm(false);
  };

  const guardarMaterial = () => {
    const obligatorios = ['material_codigo_sku', 'material_nombre', 'material_unidad_medida'];
    const invalidos = {};
    obligatorios.forEach(campo => {
      if (!form[campo] || !form[campo].toString().trim()) invalidos[campo] = true;
    });

    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos(invalidos);
      addToast('Completa los campos obligatorios resaltados', 'error');
      return;
    }

    setGuardando(true);
    api.post('/material', {
      ...form,
      material_stock_minimo: form.material_stock_minimo ? parseInt(form.material_stock_minimo) : 0
    })
      .then(() => {
        addToast('Registro creado exitosamente', 'success');
        cancelarForm();
        cargarMateriales();
      })
      .catch(err => {
        addToast(err.response?.data?.error || 'Error al crear el material', 'error');
      })
      .finally(() => setGuardando(false));
  };

  const desactivarMaterial = id => {
    api.delete(`/material/${id}`)
      .then(() => {
        addToast('Material desactivado', 'success');
        cargarMateriales();
      })
      .catch(() => addToast('Error al desactivar el material', 'error'));
  };

  const inputStyle = campo => camposInvalidos[campo]
    ? { borderColor: 'var(--color-danger)' }
    : {};

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Package size={20} />
        Catálogo Maestro
      </h1>

      {/* CU 26 / UR-F-29 - Valor del inventario de bodega calculado por FIFO */}
      <div className="card" style={{ maxWidth: 640, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Valor del inventario de bodega
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Método FIFO: primero en entrar, primero en salir</div>
        </div>
        <div className="valor-inventario" style={{ fontSize: 22, fontWeight: 700 }}>{pesos(valorizacion.valor_total)}</div>
      </div>

      <div style={{ marginBottom: 20 }}>
        {!mostrarForm && (
          <button className="btn btn-primary" onClick={() => setMostrarForm(true)}>
            <Plus size={15} />
            Nuevo Material
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Código SKU</label>
              <input
                type="text"
                className="form-input"
                style={inputStyle('material_codigo_sku')}
                value={form.material_codigo_sku}
                onChange={e => actualizarCampo('material_codigo_sku', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombre del Material</label>
              <input
                type="text"
                className="form-input"
                style={inputStyle('material_nombre')}
                value={form.material_nombre}
                onChange={e => actualizarCampo('material_nombre', e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descripción Técnica</label>
            <textarea
              className="form-textarea"
              value={form.material_descripcion}
              onChange={e => actualizarCampo('material_descripcion', e.target.value)}
            />
          </div>

          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Unidad de Medida</label>
              <Select
                className="form-select"
                style={inputStyle('material_unidad_medida')}
                value={form.material_unidad_medida}
                onChange={e => actualizarCampo('material_unidad_medida', e.target.value)}
              >
                <option value="">Selecciona...</option>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </Select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Categoría</label>
              <input
                type="text"
                className="form-input"
                value={form.material_categoria}
                onChange={e => actualizarCampo('material_categoria', e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Stock Mínimo de Seguridad</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={form.material_stock_minimo}
                onChange={e => actualizarCampo('material_stock_minimo', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Proveedor (opcional)</label>
              <Select
                className="form-select"
                value={form.material_proveedor_rut}
                onChange={e => actualizarCampo('material_proveedor_rut', e.target.value)}
              >
                <option value="">Sin proveedor asignado</option>
                {proveedores.map(p => (
                  <option key={p.proveedor_rut} value={p.proveedor_rut}>{p.proveedor_razon_social}</option>
                ))}
              </Select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={guardarMaterial} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button className="btn btn-secondary" onClick={cancelarForm} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
        ) : materiales.length === 0 ? (
          <div className="estado-vacio">
            <IlustracionCatalogoVacio />
            <p>El catálogo está vacío por ahora. Registra el primer material para empezar a usarlo en solicitudes y compras.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Unidad de Medida</th>
                  <th>Stock Mínimo</th>
                  <th>Valor FIFO</th>
                  <th>Proveedor</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {materiales.map(m => (
                  <tr key={m.material_id}>
                    <td style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: 13 }}>{m.material_codigo_sku}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{m.material_nombre}</td>
                    <td style={{ fontSize: 13 }}>{m.material_categoria || '—'}</td>
                    <td style={{ fontSize: 13 }}>{m.material_unidad_medida}</td>
                    <td style={{ fontSize: 13 }}>{m.material_stock_minimo}</td>
                    <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{pesos(valorDe(m.material_id)?.valor_fifo)}</td>
                    <td style={{ fontSize: 13 }}>{m.Proveedor?.proveedor_razon_social || '—'}</td>
                    <td><Badge value={m.material_activo ? 'Activo' : 'Inactivo'} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => setLotesDe(valorDe(m.material_id) || { material_nombre: m.material_nombre, lotes: [], valor_fifo: 0 })}
                        >
                          <Layers size={13} /> Lotes
                        </button>
                        {m.material_activo && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => desactivarMaterial(m.material_id)}
                          >
                            <Trash2 size={13} />
                            Desactivar
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => setEliminacion({ ruta: `/material/${m.material_id}`, tipo: 'el material', nombre: m.material_nombre })}
                        >
                          <Trash2 size={13} /> Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ModalEliminacion
        solicitud={eliminacion}
        addToast={addToast}
        onCerrar={recargar => { setEliminacion(null); if (recargar) cargarMateriales(); }}
        onEliminado={() => { setEliminacion(null); cargarMateriales(); }}
      />

      {/* CU 26 / UR-F-29 - Lotes de inventario del material, del más antiguo al más reciente */}
      {lotesDe && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}
          onClick={() => setLotesDe(null)}>
          <div className="card" style={{ maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Lotes de {lotesDe.material_nombre}</h3>
              <button type="button" className="btn btn-secondary" style={{ padding: '4px 8px' }} onClick={() => setLotesDe(null)} aria-label="Cerrar"><X size={14} /></button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              Las salidas consumen primero el lote más antiguo. Valor FIFO del material: <strong>{pesos(lotesDe.valor_fifo)}</strong>
            </p>
            {lotesDe.lotes.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Este material aún no tiene lotes de inventario.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Ingreso</th><th>Origen</th><th>Inicial</th><th>Disponible</th><th>Costo unitario</th></tr></thead>
                  <tbody>
                    {lotesDe.lotes.map(l => (
                      <tr key={l.lote_material_id} style={{ opacity: l.cantidad_disponible > 0 ? 1 : 0.5 }}>
                        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(l.fecha_ingreso).toLocaleDateString('es-CL', { timeZone: 'America/Santiago' })}</td>
                        <td style={{ fontSize: 12 }}>{l.origen}</td>
                        <td style={{ fontSize: 12 }}>{l.cantidad_inicial}</td>
                        <td style={{ fontSize: 12 }}>{l.cantidad_disponible}</td>
                        <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{pesos(l.costo_unitario)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
