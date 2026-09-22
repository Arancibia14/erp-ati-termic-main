import { useState, useEffect } from 'react';
import { Building2, Plus, Ban, RotateCcw, X } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

// CU34 - Gestionando catálogo de proveedores
const FORM_VACIO = { rut: '', razon_social: '', correo: '', telefono: '' };

export default function CatalogoProveedores() {
  const { toasts, addToast, removeToast } = useToast();
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [cambiando, setCambiando] = useState('');

  const cargar = () => {
    setCargando(true);
    api.get('/proveedor')
      .then(r => setProveedores(r.data.data))
      .catch(() => addToast('Error al cargar el catálogo de proveedores', 'error'))
      .finally(() => setCargando(false));
  };

  // La carga inicial no usa cargar() para no llamar a setState de forma
  // sincrónica dentro del efecto: el estado ya parte en "cargando".
  useEffect(() => {
    api.get('/proveedor')
      .then(r => setProveedores(r.data.data))
      .catch(() => addToast('Error al cargar el catálogo de proveedores', 'error'))
      .finally(() => setCargando(false));
  }, []);

  const clase = campo => 'form-input' + (errores.includes(campo) ? ' is-invalid' : '');

  const abrirFormulario = () => {
    setForm(FORM_VACIO);
    setErrores([]);
    setAbierto(true);
  };

  // CU34 pasos 4 a 9 - Registrar el proveedor
  const guardar = e => {
    e.preventDefault();

    // CU34 Excepción 3 - Datos incompletos
    const faltantes = [];
    if (!form.rut.trim()) faltantes.push('proveedor_rut');
    if (!form.razon_social.trim()) faltantes.push('proveedor_razon_social');
    if (faltantes.length) {
      setErrores(faltantes);
      return addToast('El RUT y la razón social son obligatorios', 'error');
    }

    setErrores([]);
    setGuardando(true);
    api.post('/proveedor', {
      proveedor_rut: form.rut.trim(),
      proveedor_razon_social: form.razon_social.trim(),
      proveedor_correo: form.correo.trim() || undefined,
      proveedor_telefono: form.telefono.trim() || undefined
    })
      .then(r => {
        addToast(r.data?.mensaje || 'Proveedor registrado exitosamente', 'success');
        setForm(FORM_VACIO);
        setAbierto(false);
        cargar();
      })
      .catch(err => {
        const d = err.response?.data;
        addToast(d?.error || 'Error al registrar el proveedor', 'error');
        setErrores(d?.campos || []);
      })
      .finally(() => setGuardando(false));
  };

  // CU34 paso 10 - Baja y reactivación
  const cambiarEstado = (p, activo) => {
    setCambiando(p.proveedor_rut);
    api.put(`/proveedor/${p.proveedor_rut}/estado`, { activo })
      .then(r => { addToast(r.data?.mensaje || 'Estado actualizado', 'success'); cargar(); })
      .catch(err => addToast(err.response?.data?.error || 'Error al cambiar el estado', 'error'))
      .finally(() => setCambiando(''));
  };

  const activos = proveedores.filter(p => p.proveedor_activo).length;

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Building2 size={20} />
        Catálogo de Proveedores
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <button type="button" className="btn btn-primary" onClick={abrirFormulario}>
          <Plus size={15} /> Nuevo Proveedor
        </button>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          {activos} activo{activos === 1 ? '' : 's'} de {proveedores.length} registrado{proveedores.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* CU34 pasos 3 a 8 - Alta de proveedor */}
      {abierto && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              Nuevo proveedor
            </h3>
            <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px' }}
              onClick={() => setAbierto(false)}>
              <X size={14} />
            </button>
          </div>
          <form onSubmit={guardar}>
            <div className="form-grid-2">
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">RUT</label>
                <input className={clase('proveedor_rut')} placeholder="76543210-9" value={form.rut}
                  onChange={e => setForm(f => ({ ...f, rut: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Razón Social</label>
                <input className={clase('proveedor_razon_social')} placeholder="Nombre de la empresa..." value={form.razon_social}
                  onChange={e => setForm(f => ({ ...f, razon_social: e.target.value }))} />
              </div>
            </div>
            <div className="form-grid-2" style={{ marginTop: 14 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Correo <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input type="email" className={clase('proveedor_correo')} placeholder="empresa@correo.cl" value={form.correo}
                  onChange={e => setForm(f => ({ ...f, correo: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">
                  Teléfono <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <input className={clase('proveedor_telefono')} placeholder="+56 9 1234 5678" value={form.telefono}
                  onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={guardando}>
              <Plus size={15} /> {guardando ? 'Guardando...' : 'Guardar Proveedor'}
            </button>
          </form>
        </div>
      )}

      {/* CU34 paso 2 - Listado del catálogo */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Proveedores registrados ({proveedores.length})
          </h3>
        </div>
        {cargando ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
        ) : proveedores.length === 0 ? (
          <div className="estado-vacio">
            <p>Todavía no hay proveedores en el catálogo. Registra el primero para poder emitir órdenes de compra.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Razón Social</th>
                  <th>Correo</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {proveedores.map(p => (
                  <tr key={p.proveedor_rut} style={{ opacity: p.proveedor_activo ? 1 : 0.55 }}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.proveedor_rut}</td>
                    <td>{p.proveedor_razon_social}</td>
                    <td style={{ fontSize: 13 }}>{p.proveedor_correo || '—'}</td>
                    <td style={{ fontSize: 13 }}>{p.proveedor_telefono || '—'}</td>
                    <td><Badge value={p.proveedor_activo ? 'Activo' : 'Inactivo'} /></td>
                    <td>
                      {p.proveedor_activo ? (
                        <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}
                          disabled={cambiando === p.proveedor_rut}
                          onClick={() => cambiarEstado(p, false)}>
                          <Ban size={13} /> Desactivar
                        </button>
                      ) : (
                        <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}
                          disabled={cambiando === p.proveedor_rut}
                          onClick={() => cambiarEstado(p, true)}>
                          <RotateCcw size={13} /> Reactivar
                        </button>
                      )}
                    </td>
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
