import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import api from '../api/axios';
import LogoMarca from '../components/LogoMarca';
import IconoAti from '../components/IconoAti';
import Toast, { useToast } from '../components/Toast';
import { obtenerTema, aplicarTema } from '../utils/tema';

// Ciclo del logo: dos flechas, verde y azul, que giran lento alrededor de la marca
function anillo() {
  const r = 96;
  const q = (g, rad) => [100 + rad * Math.sin((g * Math.PI) / 180), 100 - rad * Math.cos((g * Math.PI) / 180)].map(n => n.toFixed(2));
  const arco = (a, b) => `M${q(a, r).join(' ')}A${r} ${r} 0 0 1 ${q(b, r).join(' ')}`;
  const punta = (g, t) => `${q(g, r - 4).join(',')} ${q(g, r + 4).join(',')} ${q(t, r).join(',')}`;
  return { a1: arco(12, 160), p1: punta(160, 172), a2: arco(192, 340), p2: punta(340, 352) };
}

const ANILLO = anillo();

const MODULOS_LOGIN = [
  ['ducto', 'Proyectos'],
  ['casco', 'Personal'],
  ['valvula', 'Materiales'],
  ['caja', 'Finanzas'],
  ['termostato', 'Sistema']
];

// CU05 - Texto literal que pide la ficha al expirar la sesión por inactividad
const MENSAJE_INACTIVIDAD = 'Su sesión ha expirado por inactividad. Por favor, ingrese sus credenciales nuevamente';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toasts, addToast, removeToast } = useToast();
  const [form, setForm] = useState({ rut: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [campoFlash, setCampoFlash] = useState(null);
  const [tema, setTema] = useState(obtenerTema);

  // CU06 - Solicitando recuperación de credenciales
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [identificador, setIdentificador] = useState('');
  const [erroresRecuperacion, setErroresRecuperacion] = useState([]);
  const [enviandoToken, setEnviandoToken] = useState(false);

  const marcarError = campo => {
    setCampoFlash(campo);
    setTimeout(() => setCampoFlash(null), 900);
  };

  const alternarTema = () => {
    const siguiente = tema === 'dark' ? 'light' : 'dark';
    aplicarTema(siguiente);
    setTema(siguiente);
  };

  // CU05 - Paso 5: mensaje al llegar redirigido por inactividad
  // CU07 - Confirmación al volver del restablecimiento de contraseña
  useEffect(() => {
    if (searchParams.get('motivo') === 'inactividad') {
      addToast(MENSAJE_INACTIVIDAD, 'error');
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('motivo') === 'password-restablecida') {
      addToast('Contraseña restablecida exitosamente. Ya puedes iniciar sesión con tus nuevas credenciales.', 'success');
      setSearchParams({}, { replace: true });
    } else if (searchParams.get('motivo') === 'rol-actualizado') {
      // CU02 - Postcondición: el nuevo rango se aplica al volver a entrar
      addToast('Su nivel de acceso fue modificado por un administrador. Ingrese nuevamente para aplicar sus nuevos permisos', 'warning');
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const alCambiarVisibilidad = () => {
      document.body.classList.toggle('anim-pausada', document.hidden);
    };
    document.addEventListener('visibilitychange', alCambiarVisibilidad);
    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad);
      document.body.classList.remove('anim-pausada');
    };
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.rut || !form.password) {
      addToast('Ingresa tu RUT y contraseña', 'error');
      marcarError(!form.rut ? 'rut' : 'password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { token, usuario, inactividad_minutos } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      localStorage.setItem('inactividad_minutos', String(inactividad_minutos || 15));
      navigate('/inicio');
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  // CU06 - Solicitando recuperación de credenciales
  const abrirRecuperacion = () => {
    setMostrarRecuperacion(true);
    setIdentificador(form.rut || '');
    setErroresRecuperacion([]);
  };

  const cerrarRecuperacion = () => {
    setMostrarRecuperacion(false);
    setIdentificador('');
    setErroresRecuperacion([]);
  };

  const enviarToken = async e => {
    e.preventDefault();
    if (!identificador.trim()) {
      setErroresRecuperacion(['identificador']);
      addToast('Ingresa tu RUT para recibir el token de recuperación', 'error');
      return;
    }
    setErroresRecuperacion([]);
    setEnviandoToken(true);
    try {
      const res = await api.post('/recuperacion/solicitar', { identificador: identificador.trim() });
      addToast(res.data.data?.mensaje || 'Se envió un token de recuperación a tu correo institucional', 'success');
      cerrarRecuperacion();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al solicitar la recuperación', 'error');
      setErroresRecuperacion(err.response?.data?.campos || []);
    } finally {
      setEnviandoToken(false);
    }
  };

  return (
    <div className="login-wrap">

      <button
        type="button"
        className="login-tema-btn"
        onClick={alternarTema}
        aria-label={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
      >
        {tema === 'dark' ? <Sun size={17} strokeWidth={1.8} /> : <Moon size={17} strokeWidth={1.8} />}
      </button>

      <div className="login-brand">
        <svg className="login-anillo" viewBox="0 0 200 200" aria-hidden="true">
          <g className="a1"><path d={ANILLO.a1} /><polygon points={ANILLO.p1} /></g>
          <g className="a2"><path d={ANILLO.a2} /><polygon points={ANILLO.p2} /></g>
        </svg>
        <div className="login-centro">
          <LogoMarca tema="dark" variante="hero" />
          <div className="login-modulos">
            {MODULOS_LOGIN.map(([icono, nombre]) => (
              <span key={nombre}><IconoAti nombre={icono} size={36} />{nombre}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <div className="login-mobile-logo">
            <LogoMarca tema={tema} variante="hero" />
          </div>
          {!mostrarRecuperacion ? (
            <>
              <h1 className="login-title">INICIAR SESIÓN</h1>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">RUT</label>
                  <input
                    type="text"
                    className={`form-input${campoFlash === 'rut' ? ' campo-flash' : ''}`}
                    placeholder="12345678-9"
                    value={form.rut}
                    onChange={e => setForm(f => ({ ...f, rut: e.target.value }))}
                    autoComplete="username"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className={`form-input${campoFlash === 'password' ? ' campo-flash' : ''}`}
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary btn-full${loading ? ' is-loading' : ''}`}
                  style={{ marginTop: 8, height: 48, fontSize: 15 }}
                  disabled={loading}
                >
                  {loading ? 'Iniciando...' : 'Iniciar Sesión'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  style={{ marginTop: 10, height: 40, fontSize: 13, background: 'transparent', border: 'none' }}
                  onClick={abrirRecuperacion}
                >
                  ¿Olvidó su contraseña?
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="login-title">RECUPERAR CONTRASEÑA</h1>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Ingresa tu RUT y te enviaremos un token a tu correo institucional para restablecer tu contraseña.
              </p>

              <form onSubmit={enviarToken}>
                <div className="form-group">
                  <label className="form-label">Identificador de Usuario (RUT)</label>
                  <input
                    type="text"
                    className={'form-input' + (erroresRecuperacion.includes('identificador') ? ' is-invalid' : '')}
                    placeholder="12345678-9"
                    value={identificador}
                    onChange={e => { setIdentificador(e.target.value); setErroresRecuperacion([]); }}
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  className={`btn btn-primary btn-full${enviandoToken ? ' is-loading' : ''}`}
                  style={{ marginTop: 8, height: 48, fontSize: 15 }}
                  disabled={enviandoToken}
                >
                  {enviandoToken ? 'Enviando...' : 'Enviar token'}
                </button>

                <button
                  type="button"
                  className="btn btn-secondary btn-full"
                  style={{ marginTop: 10, height: 40, fontSize: 13, background: 'transparent', border: 'none' }}
                  onClick={cerrarRecuperacion}
                >
                  Volver a iniciar sesión
                </button>
              </form>
            </>
          )}
        </div>
        <small className="login-pie">© {new Date().getFullYear()} ATI Termic SpA</small>
      </div>

      <span className="login-escala" aria-hidden="true" />

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
