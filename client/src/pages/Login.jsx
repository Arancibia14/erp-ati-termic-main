import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import api from '../api/axios';
import LogoMarca from '../components/LogoMarca';
import Toast, { useToast } from '../components/Toast';
import { obtenerTema, aplicarTema } from '../utils/tema';

// Ficha técnica: reemplaza el reloj por una franja tipo "cajetín" de plano de
// ingeniería, con el alcance real de la plataforma — información fija, no
// decorativa, coherente con el resto de la identidad "de obra".
const MODULOS_FICHA = ['Proyectos', 'Personal', 'Materiales', 'Finanzas', 'Sistema'];

function FichaTecnica() {
  return (
    <div className="login-ficha" role="presentation">
      {MODULOS_FICHA.map((m, i) => (
        <span key={m} className="login-ficha-item">
          {i > 0 && <span className="login-ficha-div" aria-hidden="true" />}
          {m}
        </span>
      ))}
    </div>
  );
}

// Circuito térmico: el motivo de fondo del login. En vez de las curvas de
// gradiente genéricas de cualquier landing, son 3 circuitos cerrados
// concéntricos (como las dos flechas del isotipo real) con flujo animado en
// direcciones opuestas, marcas de unión estilo ducto y nodos de sensor en las
// esquinas — referencia directa al isotipo de la empresa, no un adorno suelto.
function CircuitoTermico() {
  return (
    <svg className="login-flow" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="ct-azul" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2563eb" stopOpacity="0.9" />
          <stop offset="1" stopColor="#5db835" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="ct-verde" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5db835" stopOpacity="0.9" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      <path className="circuito grande cw" d="M 300,220 H 1140 A 180,180 0 0 1 1140,580 H 300 A 180,180 0 0 1 300,220 Z" stroke="url(#ct-azul)" />
      <path className="circuito mediano ccw" d="M 380,300 H 1060 A 110,110 0 0 1 1060,520 H 380 A 110,110 0 0 1 380,300 Z" stroke="url(#ct-verde)" />
      <path className="circuito chico cw" d="M 460,370 H 980 A 55,55 0 0 1 980,480 H 460 A 55,55 0 0 1 460,370 Z" stroke="url(#ct-azul)" />

      <g className="circuito-marcas">
        {[420, 560, 700, 840, 980].map(x => (
          <line key={`t-${x}`} x1={x} y1="210" x2={x} y2="230" />
        ))}
        {[420, 560, 700, 840, 980].map(x => (
          <line key={`b-${x}`} x1={x} y1="570" x2={x} y2="590" />
        ))}
      </g>

      <g className="circuito-nodos">
        <circle className="n1" cx="300" cy="220" r="5" />
        <circle className="n2" cx="1140" cy="220" r="5" />
        <circle className="n3" cx="1140" cy="580" r="5" />
        <circle className="n4" cx="300" cy="580" r="5" />
      </g>
    </svg>
  );
}

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
      <CircuitoTermico />

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
        <div className="login-stage">
          <span className="login-halo" />
          <svg className="login-ring" viewBox="0 0 200 200" aria-hidden="true">
            <circle cx="100" cy="100" r="96" />
          </svg>
          <svg className="login-ring-marcas" viewBox="0 0 200 200" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => {
              const angulo = (i * 30 * Math.PI) / 180;
              const largo = i % 3 === 0 ? 12 : 6;
              const x1 = 100 + Math.cos(angulo) * 96;
              const y1 = 100 + Math.sin(angulo) * 96;
              const x2 = 100 + Math.cos(angulo) * (96 - largo);
              const y2 = 100 + Math.sin(angulo) * (96 - largo);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
            })}
          </svg>
          <LogoMarca tema={tema} variante="hero" />
        </div>
        <p className="login-tagline">
          Ingeniería en climatización industrial — gestión de obras, personal, materiales y finanzas en un solo lugar.
        </p>
        <FichaTecnica />
        <div className="login-foot">© {new Date().getFullYear()} ATI Termic SpA</div>
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
                  <label className="form-label">Contrasena</label>
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
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
