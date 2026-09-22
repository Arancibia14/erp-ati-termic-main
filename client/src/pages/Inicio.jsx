import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  modulosVisibles, buscarItem, leerRecientes, ATAJOS_ADMIN, ATAJOS_SUPERVISOR
} from '../navigation';

function fechaActual() {
  const texto = new Date().toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function Atajo({ item, indice }) {
  const Icon = item.icon;
  return (
    <Link to={item.to} className="dash-tile" style={{ '--i': indice }}>
      <span className="dash-tile-icon"><Icon size={22} strokeWidth={1.7} /></span>
      <span className="dash-tile-label">{item.label}</span>
    </Link>
  );
}

export default function Inicio() {
  const usuario = useMemo(() => JSON.parse(localStorage.getItem('usuario') || '{}'), []);
  const esAdmin = usuario.rol === 'admin';
  const modulos = useMemo(() => modulosVisibles(esAdmin), [esAdmin]);

  const atajos = (esAdmin ? ATAJOS_ADMIN : ATAJOS_SUPERVISOR)
    .map(buscarItem)
    .filter(Boolean);

  const visibles = new Set(modulos.flatMap(m => m.items.map(i => i.to)));
  const recientes = leerRecientes()
    .filter(ruta => visibles.has(ruta))
    .map(buscarItem)
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="dash">
      <h1 className="dash-hello">Inicio</h1>
      <p className="dash-sub">
        {esAdmin ? 'Administrador' : 'Supervisor de Obra'} · {fechaActual()}
      </p>

      <div className="dash-title">Accesos rápidos</div>
      <div className="dash-tiles">
        {atajos.map((item, i) => <Atajo key={item.to} item={item} indice={i} />)}
      </div>

      {recientes.length > 0 && (
        <>
          <div className="dash-title">Accesos recientes</div>
          <div className="dash-chips">
            {recientes.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link key={item.to} to={item.to} className="dash-chip" style={{ '--i': i }}>
                  <Icon size={15} strokeWidth={1.8} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </>
      )}

      <div className="dash-title">Módulos</div>
      <div className="dash-modules">
        {modulos.map((m, i) => {
          const Icon = m.icon;
          return (
            <section key={m.id} className="dash-module" style={{ '--i': i }}>
              <div className="dash-module-head">
                <span className="dash-tile-icon"><Icon size={22} strokeWidth={1.7} /></span>
                <div>
                  <div className="dash-module-title">{m.label}</div>
                  <div className="dash-module-count">
                    {m.items.length} {m.items.length === 1 ? 'función' : 'funciones'}
                  </div>
                </div>
              </div>
              <div className="dash-module-list">
                {m.items.map(item => {
                  const ItemIcon = item.icon;
                  return (
                    <Link key={item.to} to={item.to} className="dash-link">
                      <ItemIcon size={15} strokeWidth={1.8} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
