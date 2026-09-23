import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/logo.png';
import Toast, { useToast } from '../components/Toast';

export default function RestablecerContrasena() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();

  const rut = searchParams.get('rut') || '';
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState([]);
  const [enviando, setEnviando] = useState(false);

  const enlaceIncompleto = !rut || !token;

  const clase = campo => 'form-input' + (errores.includes(campo) ? ' is-invalid' : '');

  const handleSubmit = async e => {
    e.preventDefault();

    // Excepción 1 - Las contraseñas no coinciden (chequeo también en el navegador)
    if (password !== confirmacion) {
      setErrores(['password', 'confirmacion']);
      addToast('Las contraseñas no coinciden. Verifica los campos.', 'error');
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setErrores(['password', 'confirmacion']);
      addToast('La contraseña debe tener mínimo 8 caracteres, una mayúscula y un carácter especial', 'error');
      return;
    }

    setErrores([]);
    setEnviando(true);
    try {
      const res = await api.post('/recuperacion/restablecer', { rut, token, password, confirmacion });
      addToast(res.data.data?.mensaje || 'Contraseña restablecida exitosamente', 'success');
      // Paso final - Redirige al login y confirma el éxito del proceso
      setTimeout(() => navigate('/login?motivo=password-restablecida'), 1200);
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al restablecer la contraseña', 'error');
      setErrores(err.response?.data?.campos || []);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-panel" style={{ margin: '0 auto', width: '100%' }}>
        <div className="login-card">
          <div className="login-mobile-logo">
            <div className="logo-chip hero">
              <img src={logo} alt="ATI Termic" />
            </div>
          </div>
          <h1 className="login-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <KeyRound size={20} />
            RESTABLECER CONTRASEÑA
          </h1>

          {enlaceIncompleto ? (
            <p style={{ fontSize: 13, color: 'var(--color-danger)', marginTop: 12 }}>
              Este enlace está incompleto o no es válido. Solicita un nuevo token desde la pantalla de inicio de sesión.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Ingresa tu nueva contraseña para la cuenta <strong>{rut}</strong>.
              </p>

              <div className="form-group">
                <label className="form-label">Nueva Contraseña</label>
                <input
                  type="password"
                  className={clase('password')}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrores([]); }}
                  autoComplete="new-password"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Contraseña</label>
                <input
                  type="password"
                  className={clase('confirmacion')}
                  value={confirmacion}
                  onChange={e => { setConfirmacion(e.target.value); setErrores([]); }}
                  autoComplete="new-password"
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary btn-full${enviando ? ' is-loading' : ''}`}
                style={{ marginTop: 8, height: 48, fontSize: 15 }}
                disabled={enviando}
              >
                {enviando ? 'Guardando...' : 'Finalizar cambio'}
              </button>
            </form>
          )}
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
