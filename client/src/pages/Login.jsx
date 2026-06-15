import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import logo from '../assets/logo.png';
import Toast, { useToast } from '../components/Toast';

export default function Login() {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();
  const [form, setForm] = useState({ rut: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.rut || !form.password) {
      addToast('Ingresa tu RUT y contraseña', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { token, usuario } = res.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('usuario', JSON.stringify(usuario));
      navigate('/bitacora');
    } catch (err) {
      const msg = err.response?.data?.error || 'Error al iniciar sesión';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #060B14 0%, #0C1322 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16
    }}>
      <div style={{
        background: '#0C1322',
        border: '1px solid #1A2840',
        borderRadius: 12,
        padding: '36px 40px 40px',
        width: '100%',
        maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            background: '#ffffff',
            borderRadius: 10,
            padding: '10px 20px',
            display: 'inline-block',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
            marginBottom: 24,
          }}>
            <img src={logo} alt="ATI Termic" style={{ maxWidth: 180, height: 'auto', display: 'block' }} />
          </div>
          <h1 style={{ fontSize: 18, letterSpacing: '0.08em', color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            INICIAR SESIÓN
          </h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">RUT</label>
            <input
              type="text"
              className="form-input"
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
              className="form-input"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: 8, height: 44, fontSize: 15 }}
            disabled={loading}
          >
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
