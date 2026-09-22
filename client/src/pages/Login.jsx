import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, UsersRound, Boxes, Banknote, Sun, Moon } from 'lucide-react';
import api from '../api/axios';
import logo from '../assets/logo.png';
import Toast, { useToast } from '../components/Toast';
import { obtenerTema, aplicarTema } from '../utils/tema';

const CARACTERISTICAS = [
  { icon: Building2, label: 'Obras' },
  { icon: UsersRound, label: 'Personal' },
  { icon: Boxes, label: 'Materiales' },
  { icon: Banknote, label: 'Finanzas' }
];

function FlujoAire() {
  return (
    <svg className="login-flow" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="lf-azul" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#2563eb" stopOpacity="0" />
          <stop offset="0.5" stopColor="#2563eb" stopOpacity="1" />
          <stop offset="1" stopColor="#5db835" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="lf-verde" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#5db835" stopOpacity="0.2" />
          <stop offset="0.5" stopColor="#5db835" stopOpacity="1" />
          <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path className="flow soft s1" d="M-100 660 C 220 520, 460 800, 760 650 S 1220 480, 1540 620" stroke="url(#lf-azul)" />
      <path className="flow soft s2" d="M-100 720 C 260 600, 520 860, 820 720 S 1240 560, 1540 700" stroke="url(#lf-verde)" />
      <path className="flow soft s3" d="M-100 250 C 240 130, 520 380, 820 240 S 1200 90, 1540 210" stroke="url(#lf-azul)" />
      <path className="flow dots d1" d="M-100 660 C 220 520, 460 800, 760 650 S 1220 480, 1540 620" stroke="url(#lf-azul)" />
      <path className="flow dots d2" d="M-100 720 C 260 600, 520 860, 820 720 S 1240 560, 1540 700" stroke="url(#lf-verde)" />
      <path className="flow dots d3" d="M-100 250 C 240 130, 520 380, 820 240 S 1200 90, 1540 210" stroke="url(#lf-azul)" />
      <path className="flow dots d4" d="M-100 470 C 300 380, 560 590, 860 470 S 1240 330, 1540 430" stroke="url(#lf-verde)" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [form, setForm] = useState({ rut: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [campoFlash, setCampoFlash] = useState(null);
  const [tema, setTema] = useState(obtenerTema);

  const marcarError = campo => {
    setCampoFlash(campo);
    setTimeout(() => setCampoFlash(null), 900);
  };

  const alternarTema = () => {
    const siguiente = tema === 'dark' ? 'light' : 'dark';
    aplicarTema(siguiente);
    setTema(siguiente);
  };

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
      const { token, usuario } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      navigate('/inicio');
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <FlujoAire />

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
          <div className="logo-chip hero">
            <img src={logo} alt="ATI Termic" />
          </div>
        </div>
        <p className="login-tagline">
          Plataforma de gestión de obras, personal, materiales y finanzas.
        </p>
        <div className="login-features">
          {CARACTERISTICAS.map(({ icon: Icon, label }) => (
            <div className="login-feature" key={label}>
              <span><Icon size={18} strokeWidth={1.6} /></span>
              {label}
            </div>
          ))}
        </div>
        <div className="login-foot">© {new Date().getFullYear()} ATI Termic SpA</div>
      </div>

      <div className="login-panel">
        <div className="login-card">
          <div className="login-mobile-logo">
            <div className="logo-chip hero">
              <img src={logo} alt="ATI Termic" />
            </div>
          </div>
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
          </form>
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
