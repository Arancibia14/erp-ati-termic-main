import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, NavLink } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { modulosVisibles, moduloDeRuta, colorAcento, buscarItem } from '../navigation';

// Migas de pan + salto rápido: bajo la barra superior, en toda página
// muestra a qué módulo pertenece y permite saltar a cualquier otra función
// del mismo módulo en dos clics — una forma de encontrar cosas que no
// depende de abrir el buscador (Ctrl+K) ni de volver arriba a la barra.
export default function Migas() {
  const { pathname } = useLocation();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  const usuario = useMemo(() => JSON.parse(localStorage.getItem('usuario') || '{}'), []);
  const esAdmin = usuario.rol === 'admin';
  const modulos = useMemo(() => modulosVisibles(esAdmin), [esAdmin]);
  const idModulo = moduloDeRuta(pathname);
  const modulo = modulos.find(m => m.id === idModulo);
  const actual = buscarItem(pathname);

  useEffect(() => {
    setAbierto(false);
  }, [pathname]);

  useEffect(() => {
    if (!abierto) return;
    const alClicFuera = e => {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    };
    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, [abierto]);

  if (!modulo || !actual || pathname === '/inicio') return null;

  const Icon = modulo.icon;
  const acento = colorAcento(modulo.id);

  return (
    <div className="migas" ref={ref} style={{ '--acento': acento }}>
      <span className="migas-modulo">
        <Icon size={14} strokeWidth={2} />
        {modulo.label}
      </span>
      <span className="migas-sep" aria-hidden="true">/</span>
      <button type="button" className="migas-actual" onClick={() => setAbierto(v => !v)} aria-expanded={abierto}>
        {actual.label}
        <ChevronDown size={13} strokeWidth={2.4} className={`migas-caret${abierto ? ' open' : ''}`} />
      </button>

      {abierto && (
        <div className="migas-menu" role="menu">
          {modulo.items.map(item => {
            const ItemIcon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `migas-item${isActive ? ' active' : ''}`}
              >
                <ItemIcon size={15} strokeWidth={1.7} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}
