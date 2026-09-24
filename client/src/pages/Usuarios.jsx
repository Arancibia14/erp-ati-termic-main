import { useState, useEffect } from 'react';
import { UserCog, Plus, KeyRound } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const FORM_VACIO = {
  rut: '',
  nombre: '',
  correo: '',
  password: '',
  rol: 'supervisor',
  registro_certificacion: '',
  telefono_emergencia: ''
};

const ROL_LABEL = { admin: 'Administrador Total', supervisor: 'Supervisor de Obra', sin_rol: 'Sin rol asignado' };

export default function Usuarios() {
  const { toasts, addToast, removeToast } = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [camposInvalidos, setCamposInvalidos] = useState({});
  const [errorForm, setErrorForm] = useState('');
  const [rolModal, setRolModal] = useState(null);
  const [nuevoRol, setNuevoRol] = useState('');
  const [rolInvalido, setRolInvalido] = useState(false);
  const [errorRol, setErrorRol] = useState(null);
  const [cambiandoRol, setCambiandoRol] = useState(false);
  const rutPropio = JSON.parse(localStorage.getItem('usuario') || '{}').rut;

  const cargarUsuarios = () => {
    setLoading(true);
    api.get('/usuario')
      .then(r => setUsuarios(r.data.data))
      .catch(() => addToast('Error al cargar los usuarios', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarUsuarios(); }, []);

  const actualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setCamposInvalidos(prev => ({ ...prev, [campo]: false }));
    setErrorForm('');
  };

  const cancelarForm = () => {
    setForm(FORM_VACIO);
    setCamposInvalidos({});
    setErrorForm('');
    setMostrarForm(false);
  };

  const contraseñaValida = pw => pw.length >= 8 && /[A-Z]/.test(pw) && /[^A-Za-z0-9]/.test(pw);

  const guardarUsuario = () => {
    const obligatorios = ['rut', 'nombre', 'correo', 'password'];
    const invalidos = {};
    obligatorios.forEach(campo => {
      if (!form[campo] || !form[campo].toString().trim()) invalidos[campo] = true;
    });

    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos(invalidos);
      addToast('Completa los campos obligatorios resaltados', 'error');
      return;
    }

    if (!contraseñaValida(form.password)) {
      setCamposInvalidos(prev => ({ ...prev, password: true }));
      addToast('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un carácter especial', 'error');
      return;
    }

    setGuardando(true);
    setErrorForm('');
    api.post('/usuario', form)
      .then(() => {
        addToast('Usuario registrado exitosamente', 'success');
        cancelarForm();
        cargarUsuarios();
      })
      .catch(err => {
        const mensaje = err.response?.data?.error || 'Error al registrar el usuario';
        setErrorForm(mensaje);
        setCamposInvalidos(prev => ({ ...prev, rut: true }));
        addToast(mensaje, 'error');
      })
      .finally(() => setGuardando(false));
  };

  // CU02 - Gestionando niveles de acceso
  const abrirCambioRol = usuario => {
    setRolModal(usuario);
    setNuevoRol('');
    setRolInvalido(false);
    setErrorRol(null);
  };

  const confirmarCambioRol = () => {
    if (!nuevoRol) {
      setRolInvalido(true);
      addToast('Selecciona el nuevo nivel de acceso', 'error');
      return;
    }

    setCambiandoRol(true);
    setErrorRol(null);
    // Se envía el rol que se vio en pantalla para detectar cambios simultáneos (Excepción 2)
    api.put(`/usuario/${encodeURIComponent(rolModal.usuario_rut)}/rol`, { rol: nuevoRol, rol_anterior: rolModal.rol })
      .then(r => {
        if (r.data.data.propio) {
          // El token propio lleva el rol anterior: hay que volver a entrar
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          localStorage.removeItem('inactividad_minutos');
          window.location.href = '/login?motivo=rol-actualizado';
          return;
        }
        addToast(r.data.mensaje, 'success');
        setRolModal(null);
        cargarUsuarios();
      })
      .catch(err => {
        const data = err.response?.data || {};
        const mensaje = data.error || 'Error al actualizar el nivel de acceso';
        addToast(mensaje, 'error');
        if (err.response?.status === 404) {
          // Excepción 1: el registro ya no existe, se refresca el listado
          setRolModal(null);
          cargarUsuarios();
          return;
        }
        if (data.campos?.includes('rol')) setRolInvalido(true);
        setErrorRol({ mensaje, recargar: data.codigo === 'CONCURRENCIA' });
      })
      .finally(() => setCambiandoRol(false));
  };

  const inputStyle = campo => camposInvalidos[campo]
    ? { borderColor: 'var(--color-danger)' }
    : {};

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <UserCog size={20} />
        Usuarios del Sistema
      </h1>

      <div style={{ marginBottom: 20 }}>
        {!mostrarForm && (
          <button className="btn btn-primary" onClick={() => setMostrarForm(true)}>
            <Plus size={15} />
            Nuevo Usuario
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">RUT</label>
              <input
                type="text"
                className="form-input"
                placeholder="12345678-9"
                style={inputStyle('rut')}
                value={form.rut}
                onChange={e => actualizarCampo('rut', e.target.value)}
              />
              {errorForm && (
                <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errorForm}</p>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rol</label>
              <select
                className="form-select"
                value={form.rol}
                onChange={e => actualizarCampo('rol', e.target.value)}
              >
                <option value="supervisor">Supervisor de Obra</option>
                <option value="admin">Administrador Total</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nombre Completo</label>
            <input
              type="text"
              className="form-input"
              style={inputStyle('nombre')}
              value={form.nombre}
              onChange={e => actualizarCampo('nombre', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Correo Institucional</label>
            <input
              type="email"
              className="form-input"
              style={inputStyle('correo')}
              value={form.correo}
              onChange={e => actualizarCampo('correo', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña (mín. 8 caracteres, 1 mayúscula, 1 carácter especial)</label>
            <input
              type="password"
              className="form-input"
              style={inputStyle('password')}
              value={form.password}
              onChange={e => actualizarCampo('password', e.target.value)}
            />
          </div>

          {form.rol === 'supervisor' && (
            <div className="form-grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Registro de Certificación (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.registro_certificacion}
                  onChange={e => actualizarCampo('registro_certificacion', e.target.value)}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Teléfono de Emergencia (opcional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={form.telefono_emergencia}
                  onChange={e => actualizarCampo('telefono_emergencia', e.target.value)}
                />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={guardarUsuario} disabled={guardando}>
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
        ) : usuarios.length === 0 ? (
          <div className="estado-vacio">
            <p>Todavía no hay usuarios registrados en el sistema.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombre</th>
                  <th>Correo Institucional</th>
                  <th>Rol</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.usuario_rut}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{u.usuario_rut}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>
                      {u.usuario_nombre}
                      {u.usuario_rut === rutPropio && (
                        <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}> (tú)</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13 }}>{u.usuario_correo_institucional}</td>
                    <td><Badge value={ROL_LABEL[u.rol]} /></td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '5px 10px', fontSize: 12 }}
                        onClick={() => abrirCambioRol(u)}
                      >
                        <KeyRound size={13} /> Cambiar rol
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rolModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}
          onClick={() => !cambiandoRol && setRolModal(null)}
        >
          <div className="card" style={{ maxWidth: 460, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 6, fontSize: 15, fontWeight: 700 }}>Cambiar nivel de acceso</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              {rolModal.usuario_nombre} · {rolModal.usuario_rut} · rol actual: {ROL_LABEL[rolModal.rol]}
            </p>

            <div className="form-group">
              <label className="form-label">Nuevo nivel de acceso</label>
              <select
                className={`form-select${rolInvalido ? ' is-invalid' : ''}`}
                value={nuevoRol}
                onChange={e => { setNuevoRol(e.target.value); setRolInvalido(false); setErrorRol(null); }}
              >
                <option value="">Selecciona un nivel</option>
                {['admin', 'supervisor'].filter(r => r !== rolModal.rol).map(r => (
                  <option key={r} value={r}>{ROL_LABEL[r]}</option>
                ))}
              </select>
            </div>

            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              {rolModal.usuario_rut === rutPropio
                ? 'Estás cambiando tu propio nivel de acceso. Al confirmar se cerrará tu sesión y deberás volver a entrar.'
                : 'Si este usuario tiene una sesión abierta, se cerrará para que el nuevo nivel se aplique de inmediato.'}
            </p>

            {errorRol && (
              <div style={{ marginBottom: 14 }}>
                <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{errorRol.mensaje}</p>
                {errorRol.recargar && (
                  <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={() => window.location.reload()}>
                    Recargar página
                  </button>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={confirmarCambioRol} disabled={cambiandoRol}>
                {cambiandoRol ? 'Guardando...' : 'Confirmar cambio'}
              </button>
              <button className="btn btn-secondary" onClick={() => setRolModal(null)} disabled={cambiandoRol}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
