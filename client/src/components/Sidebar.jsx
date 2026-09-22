import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Search, ChevronDown, ChevronRight, LogOut, Sun, Moon, Menu, X,
  ArrowLeft, CornerDownLeft
} from 'lucide-react';
import logo from '../assets/logo.png';
import {
  modulosVisibles, buscarItem, moduloDeRuta, normalizar,
  registrarReciente, BARRA_ADMIN, BARRA_SUPERVISOR
} from '../navigation';
import { obtenerTema, aplicarTema } from '../utils/tema';
import { activarTablasMoviles } from '../utils/tablasMoviles';
import IndicadorCarga from './IndicadorCarga';
import '../styles/shell.css';

function useTema() {
  const [tema, setTema] = useState(obtenerTema);
  const alternar = () => {
    const siguiente = tema === 'dark' ? 'light' : 'dark';
    aplicarTema(siguiente);
    setTema(siguiente);
  };
  return [tema, alternar];
}

function Paleta({ modulos, onClose }) {
  const navigate = useNavigate();
  const [consulta, setConsulta] = useState('');
  const [indice, setIndice] = useState(0);

  const todos = useMemo(
    () => modulos.flatMap(m => m.items.map(i => ({ ...i, modulo: m.label }))),
    [modulos]
  );

  const resultados = useMemo(() => {
    const t = normalizar(consulta.trim());
    if (!t) return todos;
    return todos.filter(i => normalizar(i.label).includes(t) || normalizar(i.modulo).includes(t));
  }, [consulta, todos]);

  useEffect(() => {
    document.querySelector('.cmd-item.active')?.scrollIntoView({ block: 'nearest' });
  }, [indice]);

  const ir = item => {
    onClose();
    navigate(item.to);
  };

  const alTeclear = e => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndice(i => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndice(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && resultados[indice]) {
      e.preventDefault();
      ir(resultados[indice]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd" role="dialog" aria-label="Buscar función" onClick={e => e.stopPropagation()}>
        <div className="cmd-input">
          <Search size={17} strokeWidth={2} />
          <input
            autoFocus
            type="text"
            placeholder="Buscar función..."
            value={consulta}
            onChange={e => {
              setConsulta(e.target.value);
              setIndice(0);
            }}
            onKeyDown={alTeclear}
            aria-label="Buscar función"
          />
          <kbd>Esc</kbd>
        </div>
        <div className="cmd-list">
          {resultados.length === 0 ? (
            <div className="sb-empty">Sin resultados para "{consulta}"</div>
          ) : (
            resultados.map((item, i) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.to}
                  type="button"
                  className={`cmd-item${i === indice ? ' active' : ''}`}
                  onMouseEnter={() => setIndice(i)}
                  onClick={() => ir(item)}
                >
                  <span className="cmd-icon"><Icon size={16} strokeWidth={1.7} /></span>
                  <span className="cmd-label">{item.label}</span>
                  <span className="cmd-module">{item.modulo}</span>
                  {i === indice && <CornerDownLeft size={14} className="cmd-enter" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const usuario = useMemo(() => JSON.parse(localStorage.getItem('usuario') || '{}'), []);
  const esAdmin = usuario.rol === 'admin';
  const modulos = useMemo(() => modulosVisibles(esAdmin), [esAdmin]);
  const [tema, alternarTema] = useTema();
  const [panel, setPanel] = useState(null);
  const [menuUsuario, setMenuUsuario] = useState(false);
  const [paleta, setPaleta] = useState(false);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [moduloHoja, setModuloHoja] = useState(null);
  const [rutaVista, setRutaVista] = useState(pathname);

  if (rutaVista !== pathname) {
    setRutaVista(pathname);
    setPanel(null);
    setMenuUsuario(false);
    setHojaAbierta(false);
    setModuloHoja(null);
  }

  useEffect(() => {
    registrarReciente(pathname);
  }, [pathname]);

  useEffect(() => activarTablasMoviles(), [pathname]);

  useEffect(() => {
    const alTeclear = e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaleta(true);
      } else if (e.key === 'Escape') {
        setPanel(null);
        setMenuUsuario(false);
      }
    };
    window.addEventListener('keydown', alTeclear);
    return () => window.removeEventListener('keydown', alTeclear);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('sheet-open', hojaAbierta);
    return () => document.body.classList.remove('sheet-open');
  }, [hojaAbierta]);

  const cerrarTodo = () => {
    setPanel(null);
    setMenuUsuario(false);
  };

  const abrirPaleta = () => {
    cerrarTodo();
    setHojaAbierta(false);
    setPaleta(true);
  };

  const volver = () => {
    if (window.history.state && window.history.state.idx > 0) navigate(-1);
    else navigate('/inicio');
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  const iniciales = (usuario.nombre || 'U').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const rolEtiqueta = esAdmin ? 'Administrador' : 'Supervisor';
  const TemaIcon = tema === 'dark' ? Sun : Moon;
  const temaTexto = tema === 'dark' ? 'Modo claro' : 'Modo oscuro';
  const moduloActual = moduloDeRuta(pathname);
  const enInicio = pathname === '/inicio';
  const etiquetaModulo = modulos.find(m => m.id === moduloActual)?.label;
  const moduloPanel = modulos.find(m => m.id === panel);
  const moduloDeHoja = modulos.find(m => m.id === moduloHoja);

  const rutasBarra = esAdmin ? BARRA_ADMIN : BARRA_SUPERVISOR;
  const itemsBarra = rutasBarra.map(buscarItem).filter(Boolean);

  const tbRef = useRef(null);
  const tabsRef = useRef(null);
  const tabRefs = useRef({});
  const [marcador, setMarcador] = useState(null);
  const idResaltado = panel || (enInicio ? 'inicio' : moduloActual);

  useEffect(() => {
    const medir = () => {
      const nodo = idResaltado && tabRefs.current[idResaltado];
      if (!nodo || !tabsRef.current || !tbRef.current) {
        setMarcador(null);
        return;
      }
      const r = nodo.getBoundingClientRect();
      const tabsR = tabsRef.current.getBoundingClientRect();
      const tbR = tbRef.current.getBoundingClientRect();
      setMarcador({
        left: r.left - tabsR.left + 14,
        width: r.width - 28,
        flecha: r.left - tbR.left + r.width / 2
      });
    };
    medir();
    window.addEventListener('resize', medir);
    return () => window.removeEventListener('resize', medir);
  }, [idResaltado, modulos]);

  const infoUsuario = (
    <div className="sb-user-row">
      <div className="sb-avatar">{iniciales}</div>
      <div className="sb-user-info">
        <div className="sb-user-name">{usuario.nombre || 'Usuario'}</div>
        <div className="sb-user-role">{rolEtiqueta}</div>
      </div>
    </div>
  );

  return (
    <>
      <header className="tb" ref={tbRef}>
        <div className="tb-inner">
          <NavLink to="/inicio" className="tb-brand" aria-label="Inicio">
            <div className="logo-chip small">
              <img src={logo} alt="ATI Termic" />
            </div>
          </NavLink>

          <nav className="tb-tabs" ref={tabsRef} aria-label="Módulos">
            <NavLink
              to="/inicio"
              title="Inicio"
              ref={el => { tabRefs.current.inicio = el; }}
              className={({ isActive }) => `tb-tab${isActive ? ' current' : ''}`}
            >
              <Home size={16} strokeWidth={1.8} />
              <span>Inicio</span>
            </NavLink>
            {modulos.map(m => {
              const Icon = m.icon;
              const abierto = panel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  title={m.label}
                  ref={el => { tabRefs.current[m.id] = el; }}
                  className={`tb-tab${abierto ? ' open' : ''}${moduloActual === m.id ? ' current' : ''}`}
                  aria-expanded={abierto}
                  onClick={() => {
                    setMenuUsuario(false);
                    setPanel(abierto ? null : m.id);
                  }}
                >
                  <Icon size={16} strokeWidth={1.8} />
                  <span>{m.label}</span>
                  <ChevronDown size={13} strokeWidth={2.4} className={`tb-caret${abierto ? ' open' : ''}`} />
                </button>
              );
            })}
            {marcador && (
              <span
                className="tb-indicador"
                style={{ left: marcador.left, width: marcador.width }}
                aria-hidden="true"
              />
            )}
          </nav>

          <div className="tb-tools">
            <button type="button" className="tb-search" onClick={abrirPaleta}>
              <Search size={15} strokeWidth={2} />
              <span>Buscar función...</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              type="button"
              className="tb-icon-btn"
              onClick={alternarTema}
              aria-label={temaTexto}
              title={temaTexto}
            >
              <TemaIcon size={17} strokeWidth={1.8} />
            </button>
            <div className="tb-user">
              <button
                type="button"
                className="tb-avatar-btn"
                aria-expanded={menuUsuario}
                aria-label="Cuenta"
                onClick={() => {
                  setPanel(null);
                  setMenuUsuario(v => !v);
                }}
              >
                <div className="sb-avatar small">{iniciales}</div>
              </button>
              {menuUsuario && (
                <div className="tb-usermenu">
                  {infoUsuario}
                  <button type="button" className="sb-action danger" onClick={cerrarSesion}>
                    <LogOut size={14} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {moduloPanel && (
          <div className="tb-panel">
            {marcador && panel && (
              <span className="tb-panel-flecha" style={{ left: marcador.flecha }} aria-hidden="true" />
            )}
            <div className="tb-panel-inner">
              <div className="tb-panel-head">
                <span className="tb-panel-title">{moduloPanel.label}</span>
                <span className="tb-panel-count">
                  {moduloPanel.items.length} {moduloPanel.items.length === 1 ? 'función' : 'funciones'}
                </span>
              </div>
              <div className="tb-panel-grid">
                {moduloPanel.items.map(item => {
                  const ItemIcon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={cerrarTodo}
                      className={({ isActive }) => `tb-card${isActive ? ' active' : ''}`}
                    >
                      <span className="tb-card-icon"><ItemIcon size={18} strokeWidth={1.6} /></span>
                      <span className="tb-card-label">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </header>

      {(panel || menuUsuario) && <div className="tb-backdrop" onClick={cerrarTodo} />}

      <header className="mobile-header">
        {enInicio ? (
          <NavLink to="/inicio" aria-label="Inicio" className="mh-brand">
            <div className="logo-chip small">
              <img src={logo} alt="ATI Termic" />
            </div>
          </NavLink>
        ) : (
          <>
            <button type="button" className="mh-btn" onClick={volver} aria-label="Volver">
              <ArrowLeft size={18} />
            </button>
            <div className="mh-title">{etiquetaModulo || 'ATI Termic'}</div>
          </>
        )}
        <div className="mh-right">
          <button type="button" className="mh-btn" onClick={abrirPaleta} aria-label="Buscar función">
            <Search size={17} />
          </button>
          <button type="button" className="mh-btn" onClick={alternarTema} aria-label={temaTexto}>
            <TemaIcon size={17} />
          </button>
          <div className="sb-avatar small">{iniciales}</div>
        </div>
      </header>

      <nav className="bn" aria-label="Navegación principal">
        <NavLink to="/inicio" className={({ isActive }) => `bn-item${isActive ? ' active' : ''}`}>
          <Home size={21} strokeWidth={1.8} />
          <span>Inicio</span>
        </NavLink>
        {itemsBarra.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `bn-item${isActive ? ' active' : ''}`}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span>{item.short}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          className={`bn-item${hojaAbierta ? ' active' : ''}`}
          onClick={() => {
            setModuloHoja(null);
            setHojaAbierta(v => !v);
          }}
          aria-expanded={hojaAbierta}
        >
          {hojaAbierta ? <X size={21} strokeWidth={1.8} /> : <Menu size={21} strokeWidth={1.8} />}
          <span>Más</span>
        </button>
      </nav>

      {hojaAbierta && (
        <>
          <div className="sheet-backdrop" onClick={() => setHojaAbierta(false)} />
          <div className="sheet" role="dialog" aria-label="Todas las funciones">
            <div className="sheet-handle" />
            <button type="button" className="sb-search sheet-search" onClick={abrirPaleta}>
              <Search size={15} strokeWidth={2} />
              <span>Buscar función...</span>
            </button>
            <div className="sheet-body">
              {!moduloDeHoja ? (
                <div className="sheet-modules">
                  {modulos.map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        className="sheet-module"
                        onClick={() => setModuloHoja(m.id)}
                      >
                        <span className="sheet-module-icon"><Icon size={22} strokeWidth={1.6} /></span>
                        <span className="sheet-module-label">{m.label}</span>
                        <span className="sheet-module-count">
                          {m.items.length} {m.items.length === 1 ? 'función' : 'funciones'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <>
                  <button type="button" className="sheet-back" onClick={() => setModuloHoja(null)}>
                    <ArrowLeft size={16} />
                    {moduloDeHoja.label}
                  </button>
                  <div className="sheet-list">
                    {moduloDeHoja.items.map(item => {
                      const ItemIcon = item.icon;
                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setHojaAbierta(false)}
                          className={({ isActive }) => `sheet-link${isActive ? ' active' : ''}`}
                        >
                          <span className="tb-card-icon"><ItemIcon size={18} strokeWidth={1.6} /></span>
                          <span className="sheet-link-label">{item.label}</span>
                          <ChevronRight size={16} className="sheet-link-arrow" />
                        </NavLink>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <div className="sb-user">
              {infoUsuario}
              <div className="sb-user-actions">
                <button type="button" className="sb-action" onClick={alternarTema}>
                  <TemaIcon size={14} />
                  {temaTexto}
                </button>
                <button type="button" className="sb-action danger" onClick={cerrarSesion}>
                  <LogOut size={14} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {paleta && <Paleta modulos={modulos} onClose={() => setPaleta(false)} />}

      <IndicadorCarga />
    </>
  );
}
