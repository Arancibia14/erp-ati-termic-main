import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FolderOpen, ArrowLeft, HeartPulse, ShieldCheck, Wrench, Briefcase, Download, AlertTriangle } from 'lucide-react';
import api from '../api/axios';
import Badge from '../components/Badge';
import EstadoVacio from '../components/EstadoVacio';

// CU 67 - Visualizar documentación del trabajador (solo lectura)
const AREAS = [
  { id: 'salud', label: 'Salud', icon: HeartPulse },
  { id: 'seguridad', label: 'Seguridad', icon: ShieldCheck },
  { id: 'operaciones', label: 'Operaciones', icon: Wrench },
  { id: 'laboral', label: 'Laboral', icon: Briefcase }
];

const celda = { fontSize: 12 };

function Subtitulo({ children }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', margin: '4px 0 8px' }}>
      {children}
    </p>
  );
}

// Excepción 2: el archivo del documento ya no está disponible
function BotonVer({ doc }) {
  if (!doc.url) return <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Sin archivo</span>;
  if (!doc.archivo_disponible) {
    return (
      <button className="btn btn-secondary" disabled title="El archivo no se encuentra en el servidor"
              style={{ padding: '4px 8px', fontSize: 11 }}>
        Archivo no disponible
      </button>
    );
  }
  return (
    <a href={doc.url} target="_blank" rel="noreferrer"
       className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11, textDecoration: 'none' }}>
      <Download size={12} /> Ver
    </a>
  );
}

function Tabla({ columnas, filas, vacio }) {
  if (filas.length === 0) {
    return <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: 20 }}>{vacio}</p>;
  }
  return (
    <div className="table-container" style={{ marginBottom: 20 }}>
      <table>
        <thead>
          <tr>{columnas.map(c => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>{filas}</tbody>
      </table>
    </div>
  );
}

function AreaSalud({ datos }) {
  return (
    <>
      <Subtitulo>Exámenes médicos</Subtitulo>
      <Tabla
        columnas={['Tipo', 'Emisión', 'Vencimiento', 'Estado', '']}
        vacio="Sin exámenes médicos cargados."
        filas={datos.examenes.map(e => (
          <tr key={e.id}>
            <td style={celda}>{e.tipo}</td>
            <td style={celda}>{e.fecha_emision || '—'}</td>
            <td style={celda}>{e.fecha_vencimiento || '—'}</td>
            <td><Badge value={e.estado} /></td>
            <td><BotonVer doc={e} /></td>
          </tr>
        ))}
      />
    </>
  );
}

function AreaSeguridad({ datos }) {
  return (
    <>
      <Subtitulo>Entregas de EPP</Subtitulo>
      <Tabla
        columnas={['Fecha', 'EPP', 'Cantidad', 'Firma', 'Comprobante']}
        vacio="Sin entregas de EPP registradas."
        filas={datos.entregas_epp.map(e => (
          <tr key={e.id}>
            <td style={celda}>{e.fecha || '—'}</td>
            <td style={celda}>{e.epp}</td>
            <td style={celda}>{e.cantidad}</td>
            <td><Badge value={e.firmado ? 'Firmado' : 'PendienteFirma'} /></td>
            <td><BotonVer doc={e} /></td>
          </tr>
        ))}
      />
      <Subtitulo>Accidentes registrados</Subtitulo>
      <Tabla
        columnas={['Fecha', 'Descripción', 'Gravedad', 'Días perdidos', 'Proyecto']}
        vacio="Sin accidentes registrados."
        filas={datos.accidentes.map(a => (
          <tr key={a.id}>
            <td style={celda}>{a.fecha ? new Date(a.fecha).toLocaleDateString('es-CL') : '—'}</td>
            <td style={celda}>{a.descripcion || '—'}</td>
            <td>{a.gravedad ? <Badge value={a.gravedad} /> : '—'}</td>
            <td style={celda}>{a.dias_perdidos ?? '—'}</td>
            <td style={celda}>{a.proyecto || '—'}</td>
          </tr>
        ))}
      />
    </>
  );
}

function AreaOperaciones({ datos }) {
  return (
    <>
      <Subtitulo>Especialidad</Subtitulo>
      <p style={{ fontSize: 13, marginBottom: 20 }}>{datos.especialidad || 'Sin especialidad registrada'}</p>
      <Subtitulo>Herramientas asignadas</Subtitulo>
      <Tabla
        columnas={['Código', 'Herramienta', 'Entrega', 'Estado entrega', 'Devolución', 'Estado devolución']}
        vacio="Sin herramientas asignadas."
        filas={datos.herramientas.map(h => (
          <tr key={h.id}>
            <td style={{ ...celda, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{h.codigo}</td>
            <td style={celda}>{h.nombre}</td>
            <td style={celda}>{h.fecha_entrega || '—'}</td>
            <td style={celda}>{h.estado_entrega || '—'}</td>
            <td style={celda}>{h.fecha_devolucion || 'En uso'}</td>
            <td style={celda}>{h.estado_devolucion || '—'}</td>
          </tr>
        ))}
      />
    </>
  );
}

function AreaLaboral({ datos }) {
  const pesos = n => `$${Number(n).toLocaleString('es-CL')}`;
  return (
    <>
      <Subtitulo>Contratos</Subtitulo>
      <Tabla
        columnas={['Proyecto', 'Sueldo base', 'Inicio', 'Término', 'Estado']}
        vacio="Sin contratos registrados."
        filas={datos.contratos.map(c => (
          <tr key={c.id}>
            <td style={celda}>{c.proyecto || '—'}</td>
            <td style={celda}>{pesos(c.sueldo_base)}</td>
            <td style={celda}>{c.fecha_inicio}</td>
            <td style={celda}>{c.fecha_termino || 'Indefinido'}</td>
            <td><Badge value={c.estado} /></td>
          </tr>
        ))}
      />
      <Subtitulo>Anexos de traslado</Subtitulo>
      <Tabla
        columnas={['Proyecto destino', 'Emisión', 'Estado', '']}
        vacio="Sin anexos de contrato."
        filas={datos.anexos.map(a => (
          <tr key={a.id}>
            <td style={celda}>{a.proyecto || '—'}</td>
            <td style={celda}>{a.fecha_emision}</td>
            <td><Badge value={a.estado} /></td>
            <td><BotonVer doc={a} /></td>
          </tr>
        ))}
      />
      <Subtitulo>Liquidaciones de sueldo</Subtitulo>
      <Tabla
        columnas={['Período', 'Fecha de carga', '']}
        vacio="Sin liquidaciones cargadas."
        filas={datos.liquidaciones.map(l => (
          <tr key={l.id}>
            <td style={celda}>{l.periodo}</td>
            <td style={celda}>{l.fecha_carga}</td>
            <td><BotonVer doc={l} /></td>
          </tr>
        ))}
      />
      <Subtitulo>Pólizas de seguro</Subtitulo>
      <Tabla
        columnas={['Proyecto', 'Emisión', 'Vencimiento', 'Estado', '']}
        vacio="Sin pólizas registradas."
        filas={datos.polizas.map(p => (
          <tr key={p.id}>
            <td style={celda}>{p.proyecto || '—'}</td>
            <td style={celda}>{p.fecha_emision}</td>
            <td style={celda}>{p.fecha_vencimiento || '—'}</td>
            <td><Badge value={p.estado} /></td>
            <td><BotonVer doc={p} /></td>
          </tr>
        ))}
      />
    </>
  );
}

const CONTENIDO = {
  salud: AreaSalud,
  seguridad: AreaSeguridad,
  operaciones: AreaOperaciones,
  laboral: AreaLaboral
};

export default function DocumentacionTrabajador() {
  const { rut } = useParams();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('salud');

  useEffect(() => {
    api.get(`/trabajador/${encodeURIComponent(rut)}/documentacion`)
      .then(r => setDatos(r.data.data))
      .catch(err => setError(err.response?.data?.error || 'Error al cargar la documentación del trabajador'));
  }, [rut]);

  const volver = (
    <button className="btn btn-secondary" style={{ marginBottom: 16 }} onClick={() => navigate('/trabajadores')}>
      <ArrowLeft size={14} /> Volver a Trabajadores
    </button>
  );

  // Excepción 4: trabajador inexistente o error de carga
  if (error) {
    return (
      <div className="page-container">
        {volver}
        <div className="card"><EstadoVacio icon={AlertTriangle}>{error}</EstadoVacio></div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
      </div>
    );
  }

  const { trabajador, areas, resumen } = datos;
  const Contenido = CONTENIDO[tab];
  const resumenActual = resumen[tab];

  return (
    <div className="page-container">
      {volver}

      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FolderOpen size={20} />
        Documentación del Trabajador
      </h1>

      <div className="card" style={{ marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700 }}>{trabajador.nombres} {trabajador.apellidos}</p>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{trabajador.rut}</p>
        </div>
        <div>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Especialidad</p>
          <p style={{ fontSize: 13 }}>{trabajador.especialidad || '—'}</p>
        </div>
        <Badge value={trabajador.activo ? 'Activo' : 'Inactivo'} />
      </div>

      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
        {AREAS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', background: 'transparent', border: 'none',
            borderBottom: tab === id ? '2px solid var(--color-blue)' : '2px solid transparent',
            color: tab === id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: -1
          }}>
            <Icon size={13} />{label}
            <span style={{
              fontSize: 11, padding: '1px 7px', borderRadius: 10,
              background: 'color-mix(in srgb, var(--color-text-muted) 15%, transparent)'
            }}>
              {resumen[id].total}
            </span>
            {resumen[id].vencidos > 0 && (
              <AlertTriangle size={13} style={{ color: 'var(--tone-red)' }} aria-label="Tiene documentos vencidos" />
            )}
          </button>
        ))}
      </div>

      <div className="card">
        {/* Excepción 1: el área no tiene documentos */}
        {resumenActual.total === 0 && !(tab === 'operaciones' && areas.operaciones.especialidad) ? (
          <EstadoVacio icon={FolderOpen}>No hay documentos registrados en esta área.</EstadoVacio>
        ) : (
          <Contenido datos={areas[tab]} />
        )}
      </div>
    </div>
  );
}
