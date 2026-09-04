import { useState, useEffect } from 'react';
import { HardHat, Send, User } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

export default function EntregaEpp() {
  const { toasts, addToast, removeToast } = useToast();
  const [trabajadores, setTrabajadores] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [trabajadorRut, setTrabajadorRut] = useState('');
  const [cantidades, setCantidades] = useState({});
  const [loading, setLoading] = useState(false);

  const cargarCatalogo = () => {
    api.get('/entrega-epp/catalogo')
      .then(r => setCatalogo(r.data.data))
      .catch(() => addToast('Error al cargar el catálogo de EPP', 'error'));
  };

  useEffect(() => {
    api.get('/entrega-epp/trabajadores')
      .then(r => setTrabajadores(r.data.data))
      .catch(() => addToast('Error al cargar trabajadores', 'error'));
    cargarCatalogo();
  }, []);

  const trabajadorSeleccionado = trabajadores.find(t => t.trabajador_rut === trabajadorRut);

  const actualizarCantidad = (materialId, valor) => {
    setCantidades(prev => ({ ...prev, [materialId]: valor }));
  };

  const limpiarFormulario = () => {
    setTrabajadorRut('');
    setCantidades({});
  };

  const handleSubmit = async e => {
    e.preventDefault();

    if (!trabajadorRut) {
      addToast('Selecciona un receptor', 'error'); return;
    }

    const items = Object.entries(cantidades)
      .filter(([, cantidad]) => cantidad && parseInt(cantidad) > 0)
      .map(([material_id, cantidad]) => ({ material_id: parseInt(material_id), cantidad: parseInt(cantidad) }));

    if (items.length === 0) {
      addToast('Marca al menos un artículo con su cantidad', 'error'); return;
    }

    setLoading(true);
    try {
      await api.post('/entrega-epp', { trabajador_rut: trabajadorRut, items });
      addToast('Asignación registrada exitosamente', 'success');
      limpiarFormulario();
      cargarCatalogo();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al registrar la entrega de EPP', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <HardHat size={20} />
        Nueva Entrega de EPP
      </h1>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Trabajador Receptor</label>
            <select className="form-select" value={trabajadorRut} onChange={e => setTrabajadorRut(e.target.value)}>
              <option value="">Selecciona un trabajador...</option>
              {trabajadores.map(t => (
                <option key={t.trabajador_rut} value={t.trabajador_rut}>
                  {t.trabajador_nombres} ({t.trabajador_rut})
                </option>
              ))}
            </select>
          </div>

          {trabajadorSeleccionado && (
            <div style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: '10px 14px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <User size={14} color="var(--color-text-muted)" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{trabajadorSeleccionado.trabajador_nombres}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                  {trabajadorSeleccionado.trabajador_correo} · {trabajadorSeleccionado.trabajador_telefono}
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Elementos de Protección Personal</label>
            {catalogo.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                No hay artículos de EPP en el catálogo. Créalos en "Catálogo Maestro" con la categoría "EPP".
              </p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Artículo</th>
                      <th>Disponible</th>
                      <th>Cantidad a Entregar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catalogo.map(m => (
                      <tr key={m.material_id}>
                        <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{m.material_codigo_sku}</td>
                        <td style={{ fontSize: 13 }}>{m.material_nombre}</td>
                        <td style={{ fontSize: 13 }}>{m.material_stock_minimo}</td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={m.material_stock_minimo}
                            className="form-input"
                            style={{ height: 32, width: 90 }}
                            value={cantidades[m.material_id] || ''}
                            onChange={e => actualizarCantidad(m.material_id, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
            <Send size={15} />
            {loading ? 'Registrando...' : 'Registrar Entrega'}
          </button>
        </form>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
