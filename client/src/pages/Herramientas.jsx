import { useState, useEffect } from 'react';
import { Wrench, Send, RotateCcw, History, Plus } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

export default function Herramientas() {
  const { toasts, addToast, removeToast } = useToast();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [herramientas, setHerramientas] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [form, setForm] = useState({ herramienta_codigo: '', tecnico_rut: '', estado_herramienta: '' });
  const [asignando, setAsignando] = useState(false);

  const [mostrarFormAlta, setMostrarFormAlta] = useState(false);
  const [formAlta, setFormAlta] = useState({ herramienta_codigo: '', herramienta_nombre: '' });
  const [creandoHerramienta, setCreandoHerramienta] = useState(false);

  const [devModal, setDevModal] = useState(null);
  const [estadoDev, setEstadoDev] = useState('');
  const [devolviendo, setDevolviendo] = useState(false);

  const [histModal, setHistModal] = useState(null);
  const [historial, setHistorial] = useState([]);

  const cargar = () => {
    api.get('/herramienta')
      .then(r => setHerramientas(r.data.data))
      .catch(() => addToast('Error al cargar las herramientas', 'error'));
  };

  useEffect(() => {
    cargar();
    api.get('/herramienta/trabajadores')
      .then(r => setTrabajadores(r.data.data))
      .catch(() => addToast('Error al cargar el personal', 'error'));
  }, []);

  const asignar = () => {
    if (!form.herramienta_codigo || !form.tecnico_rut || !form.estado_herramienta.trim()) {
      addToast('Selecciona la herramienta, el técnico y registra el estado de la herramienta', 'error');
      return;
    }
    setAsignando(true);
    api.post('/herramienta/asignar', form)
      .then(r => {
        addToast(r.data.data?.mensaje || 'Asignación registrada exitosamente', 'success');
        setForm({ herramienta_codigo: '', tecnico_rut: '', estado_herramienta: '' });
        cargar();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al registrar la asignación', 'error'))
      .finally(() => setAsignando(false));
  };

  const registrarDevolucion = () => {
    setDevolviendo(true);
    api.post(`/herramienta/${devModal.herramienta_id}/devolver`, { estado_devolucion: estadoDev })
      .then(r => {
        addToast(r.data.data?.mensaje || 'Devolución registrada', 'success');
        setDevModal(null);
        setEstadoDev('');
        cargar();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al registrar la devolución', 'error'))
      .finally(() => setDevolviendo(false));
  };

  const abrirHistorial = h => {
    setHistModal(h);
    setHistorial([]);
    api.get('/herramienta/historial', { params: { herramienta_id: h.herramienta_id } })
      .then(r => setHistorial(r.data.data))
      .catch(() => addToast('Error al cargar el historial de trazabilidad', 'error'));
  };

  const crearHerramienta = () => {
    if (!formAlta.herramienta_codigo.trim() || !formAlta.herramienta_nombre.trim()) {
      addToast('Código y nombre de la herramienta son obligatorios', 'error');
      return;
    }
    setCreandoHerramienta(true);
    api.post('/herramienta', formAlta)
      .then(() => {
        addToast('Herramienta dada de alta exitosamente', 'success');
        setFormAlta({ herramienta_codigo: '', herramienta_nombre: '' });
        setMostrarFormAlta(false);
        cargar();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al dar de alta la herramienta', 'error'))
      .finally(() => setCreandoHerramienta(false));
  };

  const disponibles = herramientas.filter(h => h.herramienta_estado === 'Disponible');

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Wrench size={20} />
        Herramientas
      </h1>

      {usuario.rol === 'admin' && (
        <div className="card" style={{ maxWidth: 720, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: mostrarFormAlta ? 14 : 0 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Catálogo Maestro de Herramientas
            </h3>
            {!mostrarFormAlta && (
              <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => setMostrarFormAlta(true)}>
                <Plus size={13} /> Nueva Herramienta
              </button>
            )}
          </div>

          {mostrarFormAlta && (
            <div>
              <div className="form-grid-2" style={{ marginBottom: 14 }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Código</label>
                  <input
                    className="form-input"
                    placeholder="Ej. HER-004"
                    value={formAlta.herramienta_codigo}
                    onChange={e => setFormAlta(f => ({ ...f, herramienta_codigo: e.target.value }))}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-input"
                    placeholder="Ej. Taladro Percutor Bosch"
                    value={formAlta.herramienta_nombre}
                    onChange={e => setFormAlta(f => ({ ...f, herramienta_nombre: e.target.value }))}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={crearHerramienta} disabled={creandoHerramienta}>
                  {creandoHerramienta ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '5px 10px', fontSize: 12 }}
                  onClick={() => { setMostrarFormAlta(false); setFormAlta({ herramienta_codigo: '', herramienta_nombre: '' }); }}
                  disabled={creandoHerramienta}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card" style={{ maxWidth: 720, marginBottom: 20 }}>
        <h3 style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Asignación
        </h3>

        <div className="form-grid-2" style={{ marginBottom: 14 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Herramienta (código)</label>
            <select
              className="form-select"
              value={form.herramienta_codigo}
              onChange={e => setForm(f => ({ ...f, herramienta_codigo: e.target.value }))}
            >
              <option value="">Selecciona una herramienta disponible...</option>
              {disponibles.map(h => (
                <option key={h.herramienta_id} value={h.herramienta_codigo}>
                  {h.herramienta_codigo} — {h.herramienta_nombre}
                </option>
              ))}
            </select>
            {disponibles.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--color-warning)', display: 'block', marginTop: 6 }}>
                No hay herramientas disponibles en el catálogo maestro.
              </span>
            )}
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Técnico (RUT)</label>
            <select
              className="form-select"
              value={form.tecnico_rut}
              onChange={e => setForm(f => ({ ...f, tecnico_rut: e.target.value }))}
            >
              <option value="">Selecciona un técnico activo...</option>
              {trabajadores.map(t => (
                <option key={t.trabajador_rut} value={t.trabajador_rut}>
                  {t.trabajador_nombres} {t.trabajador_apellidos || ''} ({t.trabajador_rut})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Estado de la herramienta</label>
          <input
            className="form-input"
            placeholder="Ej. Operativa, sin daños"
            value={form.estado_herramienta}
            onChange={e => setForm(f => ({ ...f, estado_herramienta: e.target.value }))}
          />
        </div>

        <button className="btn btn-primary" onClick={asignar} disabled={asignando}>
          <Send size={14} />
          {asignando ? 'Registrando...' : 'Confirmar Asignación'}
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {herramientas.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            No hay herramientas registradas en el catálogo maestro.
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Herramienta</th>
                  <th>Estado</th>
                  <th>Técnico responsable</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {herramientas.map(h => (
                  <tr key={h.herramienta_id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{h.herramienta_codigo}</td>
                    <td style={{ fontSize: 13 }}>{h.herramienta_nombre}</td>
                    <td><Badge value={h.herramienta_estado} /></td>
                    <td style={{ fontSize: 13 }}>{h.tecnico_nombre || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {h.herramienta_estado === 'Asignada' && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => { setDevModal(h); setEstadoDev(''); }}
                          >
                            <RotateCcw size={13} /> Registrar Devolución
                          </button>
                        )}
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => abrirHistorial(h)}
                        >
                          <History size={13} /> Historial
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

      {devModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}
          onClick={() => !devolviendo && setDevModal(null)}
        >
          <div className="card" style={{ maxWidth: 460, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 6, fontSize: 15, fontWeight: 700 }}>Registrar Devolución</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              {devModal.herramienta_codigo} — {devModal.herramienta_nombre} · devuelta por {devModal.tecnico_nombre}
            </p>
            <div className="form-group">
              <label className="form-label">Estado de la herramienta al devolver</label>
              <input className="form-input" placeholder="Ej. Operativa / Requiere mantenimiento"
                     value={estadoDev} onChange={e => setEstadoDev(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={registrarDevolucion} disabled={devolviendo}>
                {devolviendo ? 'Registrando...' : 'Confirmar Devolución'}
              </button>
              <button className="btn btn-secondary" onClick={() => setDevModal(null)} disabled={devolviendo}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {histModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 500, padding: 24, overflowY: 'auto' }}
          onClick={() => setHistModal(null)}
        >
          <div className="card" style={{ maxWidth: 640, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={16} /> Historial de Trazabilidad
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              {histModal.herramienta_codigo} — {histModal.herramienta_nombre}
            </p>
            {historial.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Sin movimientos registrados.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Técnico</th><th>Entrega</th><th>Estado entrega</th><th>Devolución</th><th>Estado devolución</th></tr>
                  </thead>
                  <tbody>
                    {historial.map(m => (
                      <tr key={m.asignacion_herramienta_id}>
                        <td style={{ fontSize: 12 }}>{m.trabajador_nombre}</td>
                        <td style={{ fontSize: 12 }}>{m.asignacion_herramienta_fecha_entrega}</td>
                        <td style={{ fontSize: 12 }}>{m.asignacion_herramienta_estado_entrega || '—'}</td>
                        <td style={{ fontSize: 12 }}>{m.asignacion_herramienta_fecha_devolucion || 'En poder del técnico'}</td>
                        <td style={{ fontSize: 12 }}>{m.asignacion_herramienta_estado_devolucion || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => setHistModal(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
