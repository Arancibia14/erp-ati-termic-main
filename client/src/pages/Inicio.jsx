import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flag, Camera, BookOpen, ChevronRight } from 'lucide-react';
import {
  modulosVisibles, buscarItem, ATAJOS_ADMIN, ATAJOS_SUPERVISOR, ICONO_RUTA
} from '../navigation';
import api from '../api/axios';
import IconoAti from '../components/IconoAti';
import CicloAvance from '../components/CicloAvance';
import AvisoTarjeta from '../components/AvisoTarjeta';
import PanelNotificaciones from '../components/PanelNotificaciones';
import ContratosPorVencer from '../components/ContratosPorVencer';
import Select from '../components/Select';
import Toast, { useToast } from '../components/Toast';

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

const pesos = n => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;

const cantidad = ruta => api.get(ruta).then(r => (Array.isArray(r.data.data) ? r.data.data.length : 0));

// Hito en curso: el primero que todavía no llega al 100%
function hitoEnCurso(hitos) {
  const pendiente = hitos.find(h => Number(h.hito_tecnico_avance_fisico) < 100);
  return (pendiente || hitos[hitos.length - 1])?.hito_tecnico_nombre_hito || null;
}

// Escala térmica de la desviación (CU 41): azul bajo presupuesto, rojo sobre
// el umbral configurado en el sistema
function EscalaDesviacion({ desviacion, umbral }) {
  const v = Math.round(desviacion);
  const posicion = Math.min(100, Math.max(0, ((v + umbral * 1.5) / (umbral * 3)) * 100));
  const tono = v > umbral ? 'cal' : v > 0 ? 'tib' : 'fri';
  return (
    <div className="esc">
      <div className="esc-tt"><span>Desviación</span><b className={tono}>{v > 0 ? '+' : ''}{v}%</b></div>
      <div className="esc-barra"><i style={{ left: `${posicion}%` }} /></div>
    </div>
  );
}

function Indicador({ to, titulo, valor, icono, tono }) {
  return (
    <Link to={to} className="kpi">
      <IconoAti nombre={icono} size={30} />
      <span className="kpi-txt">
        <b className={tono}>{valor ?? '–'}</b>
        <small>{titulo}</small>
      </span>
    </Link>
  );
}

export default function Inicio() {
  const usuario = useMemo(() => JSON.parse(localStorage.getItem('usuario') || '{}'), []);
  const esAdmin = usuario.rol === 'admin';
  const modulos = useMemo(() => modulosVisibles(esAdmin), [esAdmin]);
  const { toasts, addToast, removeToast } = useToast();
  // CU 46 - Avisos internos listos para publicar y vigentes hoy
  const [avisos, setAvisos] = useState([]);
  const [proyectos, setProyectos] = useState(null);
  const [detalle, setDetalle] = useState({});
  const [umbral, setUmbral] = useState(10);
  const [conteos, setConteos] = useState({});
  const [enFoco, setEnFoco] = useState('');

  useEffect(() => {
    api.get('/aviso/vigentes')
      .then(r => setAvisos(r.data.data))
      .catch(() => {});

    api.get('/setup/proyectos')
      .then(r => {
        const activos = r.data.data.filter(p => !p.proyecto_archivado);
        setProyectos(activos);
        setEnFoco(activos[0]?.proyecto_codigo_correlativo || '');
        activos.forEach(p => {
          const codigo = p.proyecto_codigo_correlativo;
          api.get(`/hito/${encodeURIComponent(codigo)}`)
            .then(h => setDetalle(d => ({ ...d, [codigo]: { ...d[codigo], hito: hitoEnCurso(h.data.data.hitos || []) } })))
            .catch(() => {});
          if (esAdmin) {
            api.get(`/control-costos/${encodeURIComponent(codigo)}/gastos`)
              .then(g => setDetalle(d => ({ ...d, [codigo]: { ...d[codigo], desviacion: g.data.data.porcentaje_desviacion } })))
              .catch(() => {});
          }
        });
      })
      .catch(() => setProyectos([]));

    const pedir = (clave, promesa) => promesa.then(n => setConteos(c => ({ ...c, [clave]: n }))).catch(() => {});
    pedir('transito', cantidad('/transito'));
    if (esAdmin) {
      pedir('aprobaciones', cantidad('/solicitud-material/pendientes'));
      pedir('revisiones', cantidad('/evidencia/pendientes'));
      pedir('contratos', cantidad('/setup/contratos/por-vencer'));
      api.get('/control-costos/parametro/umbral')
        .then(r => setUmbral(Number(r.data.data.parametro_sistema_valor) || 10))
        .catch(() => {});
    } else {
      pedir('solicitudes', api.get('/solicitud-material/mis-solicitudes')
        .then(r => r.data.data.filter(s => s.solicitud_material_estado === 'pendiente').length));
    }
  }, [esAdmin]);

  const atajos = (esAdmin ? ATAJOS_ADMIN : ATAJOS_SUPERVISOR).map(buscarItem).filter(Boolean);
  const enEjecucion = (proyectos || []).filter(p => p.EstadoProyecto?.estado_proyecto_nombre === 'En Ejecución').length;
  const foco = (proyectos || []).find(p => p.proyecto_codigo_correlativo === enFoco);

  const abrirModulo = id => window.dispatchEvent(new CustomEvent('ati:abrir-modulo', { detail: id }));

  return (
    <div className={`ini${esAdmin ? '' : ' ini-sup'}`}>
      <header className="ini-cab">
        <h1>Inicio</h1>
        <p>{esAdmin ? 'Administrador' : 'Supervisor de Obra'} · {fechaActual()}</p>
      </header>

      <section className="kpis" aria-label="Resumen">
        {esAdmin ? (
          <>
            <Indicador to="/aprobaciones" titulo="Aprobaciones pendientes" valor={conteos.aprobaciones} icono="firma" tono="tib" />
            <Indicador to="/validar" titulo="Revisiones pendientes" valor={conteos.revisiones} icono="revisa" tono="tib" />
            <Indicador to="/trabajadores" titulo="Contratos por vencer" valor={conteos.contratos} icono="contrato" tono="cal" />
            <Indicador to="/materiales-transito" titulo="Materiales en tránsito" valor={conteos.transito} icono="camion" tono="fri" />
          </>
        ) : (
          <>
            <Indicador to="/solicitud-materiales" titulo="Mis solicitudes pendientes" valor={conteos.solicitudes} icono="firma" tono="tib" />
            <Indicador to="/materiales-transito" titulo="Materiales en tránsito" valor={conteos.transito} icono="camion" tono="fri" />
          </>
        )}
      </section>

      {!esAdmin && (
        <section className="sup-movil" aria-label="Mi obra">
          {foco && (
            <div className="pn sup-obra">
              <div className="sup-obra-fila">
                <CicloAvance porcentaje={foco.proyecto_porcentaje_avance} size={82} />
                <div>
                  <span className="cod">{foco.proyecto_codigo_correlativo}</span>
                  <h3>{foco.proyecto_nombre_obra}</h3>
                </div>
              </div>
              {detalle[enFoco]?.hito && <small className="hito"><Flag size={15} />{detalle[enFoco].hito}</small>}
              {proyectos.length > 1 && (
                <Select className="form-select sup-cambiar" value={enFoco} onChange={e => setEnFoco(e.target.value)} aria-label="Cambiar proyecto">
                  {proyectos.map(p => (
                    <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                      {p.proyecto_codigo_correlativo} · {p.proyecto_nombre_obra}
                    </option>
                  ))}
                </Select>
              )}
            </div>
          )}
          <div className="sup-tiles">
            {atajos.map((item, i) => (
              <Link key={item.to} to={item.to} state={{ proyecto: enFoco }} className={`sup-tile${i === 0 ? ' principal' : ''}`}>
                <IconoAti nombre={ICONO_RUTA[item.to]} size={42} />
                <span>{item.short === 'SSO' ? 'Incidentes SSO' : item.label}</span>
              </Link>
            ))}
          </div>
          <Link to="/materiales-transito" className="pn sup-fila">
            <IconoAti nombre="camion" size={26} />
            <span>Materiales en Tránsito</span>
            <b>{conteos.transito ?? '–'}</b>
          </Link>
        </section>
      )}

      {avisos.length > 0 && (
        <section className="ini-avisos">
          {avisos.map(a => (
            <AvisoTarjeta key={a.aviso_id} titulo={a.aviso_titulo} texto={a.aviso_texto}
              imagen={a.aviso_url_imagen} fechaTermino={a.aviso_fecha_termino} />
          ))}
        </section>
      )}

      <div className="ini-cuerpo">
        <div className="ini-principal">
          <section className="pn obras">
            <div className="pn-cab">
              <h2>Proyectos</h2>
              <span>{enEjecucion} en ejecución</span>
            </div>
            {proyectos === null ? (
              <p className="pn-vacio">Cargando proyectos...</p>
            ) : proyectos.length === 0 ? (
              <p className="pn-vacio">No hay proyectos activos.</p>
            ) : proyectos.map(p => {
              const codigo = p.proyecto_codigo_correlativo;
              const d = detalle[codigo] || {};
              const estado = p.EstadoProyecto?.estado_proyecto_nombre;
              return (
                <article key={codigo} className={`obra${esAdmin ? '' : ' sin-costos'}`}>
                  <CicloAvance porcentaje={p.proyecto_porcentaje_avance} size={72} />
                  <div className="obra-info">
                    <span className="cod">{codigo}{estado && estado !== 'En Ejecución' ? ` · ${estado}` : ''}</span>
                    <h3>{p.proyecto_nombre_obra}</h3>
                    <small className="hito"><Flag size={15} />{d.hito || 'Sin hitos definidos'}</small>
                    <span className="grupo-btn">
                      <Link to="/evidencia" state={{ proyecto: codigo }}><Camera size={15} />Evidencias</Link>
                      <Link to="/bitacora" state={{ proyecto: codigo }}><BookOpen size={15} />Bitácora Diaria</Link>
                    </span>
                  </div>
                  {esAdmin && (
                    <div className="obra-costos">
                      {d.desviacion !== undefined && <EscalaDesviacion desviacion={d.desviacion} umbral={umbral} />}
                      <div className="obra-ppto"><span>Presupuesto</span><b>{pesos(p.proyecto_presupuesto_asignado)}</b></div>
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          {esAdmin && <ContratosPorVencer />}
        </div>

        <aside className="ini-lateral">
          <section className="pn notif">
            <PanelNotificaciones addToast={addToast} />
          </section>

          <section className="pn accesos">
            <div className="pn-cab"><h2>Accesos rápidos</h2></div>
            <div className="accesos-lista">
              {atajos.map(item => (
                <Link key={item.to} to={item.to}>
                  <IconoAti nombre={ICONO_RUTA[item.to]} size={24} />
                  <span>{item.label}</span>
                  <ChevronRight size={15} className="flecha" />
                </Link>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <h2 className="ini-sec">Módulos</h2>
      <section className="modulos">
        {modulos.map(m => (
          <button key={m.id} type="button" className="modulo" onClick={() => abrirModulo(m.id)}>
            <IconoAti nombre={m.icono} size={36} />
            <span>
              <b>{m.label}</b>
              <small>{m.items.length} {m.items.length === 1 ? 'función' : 'funciones'}</small>
            </span>
          </button>
        ))}
      </section>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
