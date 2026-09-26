import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  modulosVisibles, buscarItem, leerRecientes, ATAJOS_ADMIN, ATAJOS_SUPERVISOR
} from '../navigation';
import api from '../api/axios';
import AvisoTarjeta from '../components/AvisoTarjeta';

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
  // CU 46 - Avisos internos listos para publicar y vigentes hoy
  const [avisos, setAvisos] = useState([]);

  useEffect(() => {
    api.get('/aviso/vigentes')
      .then(r => setAvisos(r.data.data))
      .catch(() => {});
  }, []);

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

      {avisos.length > 0 && (
        <>
          <div className="dash-title">Avisos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 16 }}>
            {avisos.map(a => (
              <AvisoTarjeta key={a.aviso_id} titulo={a.aviso_titulo} texto={a.aviso_texto}
                imagen={a.aviso_url_imagen} fechaTermino={a.aviso_fecha_termino} />
            ))}
          </div>
        </>
      )}

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
