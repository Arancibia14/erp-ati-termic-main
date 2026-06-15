import { useState, useEffect } from 'react';
import {
  Settings, FolderPlus, Building2, UserPlus, Flag,
  ClipboardList, Truck, FileText, MapPin
} from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const TABS = [
  { id: 'proyecto',   label: 'Proyectos',       icon: FolderPlus },
  { id: 'proveedor',  label: 'Proveedores',      icon: Building2 },
  { id: 'trabajador', label: 'Trabajadores',     icon: UserPlus },
  { id: 'hito',       label: 'Hitos Técnicos',   icon: Flag },
  { id: 'sm',         label: 'Solicitudes Mat.', icon: ClipboardList },
  { id: 'guia',       label: 'Guías Despacho',   icon: Truck },
  { id: 'contrato',   label: 'Contratos',        icon: FileText },
];

const fieldStyle = { marginBottom: 0 };

export default function Configuracion() {
  const { toasts, addToast, removeToast } = useToast();
  const [tab, setTab] = useState('proyecto');
  const [estados,       setEstados]       = useState([]);
  const [especialidades,setEspecialidades] = useState([]);
  const [proyectos,     setProyectos]     = useState([]);
  const [trabajadores,  setTrabajadores]  = useState([]);
  const [ordenes,       setOrdenes]       = useState([]);
  const [loading, setLoading] = useState(false);

  const [fProyecto,   setFProyecto]   = useState({ codigo: '', nombre: '', presupuesto: '', correo: '', estado_id: '' });
  const [fCoords,     setFCoords]     = useState({ codigo: '', lat: '', lon: '' });
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [fProveedor,  setFProveedor]  = useState({ rut: '', razon_social: '', correo: '', telefono: '' });
  const [fTrabajador, setFTrabajador] = useState({ rut: '', nombres: '', correo: '', telefono: '', especialidad_id: '', proyecto_codigo: '' });
  const [fHito,       setFHito]       = useState({ nombre: '', proyecto_codigo: '', avance: '0' });
  const [fSM,         setFSM]         = useState({ descripcion: '', cantidad: '', proyecto_codigo: '' });
  const [fGuia,       setFGuia]       = useState({ numero: '', fecha: '', orden_id: '' });
  const [fContrato,   setFContrato]   = useState({ rut: '', sueldo: '', leyes: '', inicio: '', termino: '', proyecto_codigo: '' });

  useEffect(() => {
    api.get('/setup/estados').then(r => setEstados(r.data.data)).catch(() => {});
    api.get('/setup/especialidades').then(r => setEspecialidades(r.data.data)).catch(() => {});
    cargarProyectos();
  }, []);

  useEffect(() => {
    if (tab === 'guia')     api.get('/setup/ordenes').then(r => setOrdenes(r.data.data)).catch(() => {});
    if (tab === 'contrato') api.get('/setup/trabajadores').then(r => setTrabajadores(r.data.data)).catch(() => {});
  }, [tab]);

  const cargarProyectos = () =>
    api.get('/setup/proyectos').then(r => setProyectos(r.data.data)).catch(() => {});

  const send = async (endpoint, body, onSuccess) => {
    setLoading(true);
    try {
      await api.post(endpoint, body);
      addToast('Registrado correctamente', 'success');
      onSuccess();
      cargarProyectos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al guardar', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitProyecto = e => {
    e.preventDefault();
    if (!fProyecto.codigo || !fProyecto.nombre || !fProyecto.presupuesto || !fProyecto.correo || !fProyecto.estado_id)
      return addToast('Completa todos los campos', 'error');
    send('/setup/proyecto', {
      proyecto_codigo_correlativo: fProyecto.codigo.trim().toUpperCase(),
      proyecto_nombre_obra: fProyecto.nombre,
      proyecto_presupuesto_asignado: fProyecto.presupuesto,
      proyecto_correo_contacto: fProyecto.correo,
      estado_proyecto_id: fProyecto.estado_id
    }, () => setFProyecto({ codigo: '', nombre: '', presupuesto: '', correo: '', estado_id: '' }));
  };

  const submitCoords = async e => {
    e.preventDefault();
    if (!fCoords.codigo || !fCoords.lat || !fCoords.lon)
      return addToast('Selecciona un proyecto e ingresa latitud y longitud', 'error');
    const lat = parseFloat(fCoords.lat);
    const lon = parseFloat(fCoords.lon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180)
      return addToast('Coordenadas inválidas. Latitud: -90 a 90 / Longitud: -180 a 180', 'error');
    setLoadingCoords(true);
    try {
      await api.put(`/setup/proyecto/${fCoords.codigo}/coordenadas`, { latitud: lat, longitud: lon });
      addToast('Coordenadas GPS del proyecto guardadas', 'success');
      setFCoords({ codigo: '', lat: '', lon: '' });
      cargarProyectos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al guardar coordenadas', 'error');
    } finally {
      setLoadingCoords(false);
    }
  };

  const submitProveedor = e => {
    e.preventDefault();
    if (!fProveedor.rut || !fProveedor.razon_social || !fProveedor.correo)
      return addToast('RUT, razón social y correo son requeridos', 'error');
    send('/setup/proveedor', {
      proveedor_rut: fProveedor.rut.trim(),
      proveedor_razon_social: fProveedor.razon_social,
      proveedor_correo: fProveedor.correo,
      proveedor_telefono: fProveedor.telefono || null
    }, () => setFProveedor({ rut: '', razon_social: '', correo: '', telefono: '' }));
  };

  const submitTrabajador = e => {
    e.preventDefault();
    if (!fTrabajador.rut || !fTrabajador.nombres || !fTrabajador.correo || !fTrabajador.telefono || !fTrabajador.especialidad_id)
      return addToast('RUT, nombres, correo, teléfono y especialidad son requeridos', 'error');
    send('/setup/trabajador', {
      trabajador_rut: fTrabajador.rut.trim(),
      trabajador_nombres: fTrabajador.nombres,
      trabajador_correo: fTrabajador.correo,
      trabajador_telefono: fTrabajador.telefono,
      especialidad_id: fTrabajador.especialidad_id,
      proyecto_codigo_correlativo: fTrabajador.proyecto_codigo || null
    }, () => setFTrabajador({ rut: '', nombres: '', correo: '', telefono: '', especialidad_id: '', proyecto_codigo: '' }));
  };

  const submitHito = e => {
    e.preventDefault();
    if (!fHito.nombre || !fHito.proyecto_codigo)
      return addToast('Nombre del hito y proyecto son requeridos', 'error');
    send('/setup/hito', {
      hito_tecnico_nombre_hito: fHito.nombre,
      proyecto_codigo_correlativo: fHito.proyecto_codigo,
      hito_tecnico_avance_fisico: fHito.avance || 0
    }, () => setFHito({ nombre: '', proyecto_codigo: '', avance: '0' }));
  };

  const submitSM = e => {
    e.preventDefault();
    if (!fSM.descripcion || !fSM.cantidad || !fSM.proyecto_codigo)
      return addToast('Descripción, cantidad y proyecto son requeridos', 'error');
    send('/setup/solicitud-material', {
      solicitud_material_descripcion: fSM.descripcion,
      solicitud_material_cantidad: fSM.cantidad,
      proyecto_codigo_correlativo: fSM.proyecto_codigo
    }, () => setFSM({ descripcion: '', cantidad: '', proyecto_codigo: '' }));
  };

  const submitGuia = e => {
    e.preventDefault();
    if (!fGuia.numero || !fGuia.fecha || !fGuia.orden_id)
      return addToast('Número, fecha y orden de compra son requeridos', 'error');
    send('/setup/guia-despacho', {
      guia_despacho_numero: fGuia.numero.trim(),
      guia_despacho_fecha: fGuia.fecha,
      orden_compra_id: fGuia.orden_id
    }, () => {
      setFGuia({ numero: '', fecha: '', orden_id: '' });
      api.get('/setup/ordenes').then(r => setOrdenes(r.data.data)).catch(() => {});
    });
  };

  const submitContrato = e => {
    e.preventDefault();
    if (!fContrato.rut || !fContrato.sueldo || !fContrato.inicio)
      return addToast('Trabajador, sueldo base y fecha de inicio son requeridos', 'error');
    send('/setup/contrato', {
      trabajador_rut: fContrato.rut,
      contrato_laboral_sueldo_base: fContrato.sueldo,
      contrato_laboral_leyes_sociales: fContrato.leyes || 0,
      contrato_laboral_fecha_inicio: fContrato.inicio,
      contrato_laboral_fecha_termino: fContrato.termino || null,
      proyecto_codigo_correlativo: fContrato.proyecto_codigo || null
    }, () => setFContrato({ rut: '', sueldo: '', leyes: '', inicio: '', termino: '', proyecto_codigo: '' }));
  };

  const ProyectoSelect = ({ value, onChange, required = false }) => (
    <div className="form-group" style={fieldStyle}>
      <label className="form-label">Proyecto {!required && <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span>}</label>
      <select className="form-select" value={value} onChange={onChange}>
        <option value="">Sin proyecto asignado</option>
        {proyectos.map(p => (
          <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
            {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
          </option>
        ))}
      </select>
    </div>
  );

  const SectionTitle = ({ children }) => (
    <h3 style={{ marginBottom: 16, fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </h3>
  );

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Settings size={20} />
        Configuración — Datos Base
      </h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--color-border)', flexWrap: 'wrap' }}>
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', background: 'transparent', border: 'none',
            borderBottom: tab === id ? '2px solid var(--color-blue)' : '2px solid transparent',
            color: tab === id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: -1
          }}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 620 }}>

        {/* ── PROYECTOS ─────────────────────────────────────────── */}
        {tab === 'proyecto' && (
          <div className="card">
            <SectionTitle>Nuevo Proyecto</SectionTitle>
            <form onSubmit={submitProyecto}>
              <div className="form-grid-2">
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Código (ej: OBR-2024-001)</label>
                  <input className="form-input" placeholder="OBR-2024-001" value={fProyecto.codigo}
                    onChange={e => setFProyecto(f => ({ ...f, codigo: e.target.value }))} />
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Estado</label>
                  <select className="form-select" value={fProyecto.estado_id}
                    onChange={e => setFProyecto(f => ({ ...f, estado_id: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {estados.map(s => <option key={s.estado_proyecto_id} value={s.estado_proyecto_id}>{s.estado_proyecto_nombre}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Nombre de la Obra</label>
                <input className="form-input" placeholder="Nombre descriptivo..." value={fProyecto.nombre}
                  onChange={e => setFProyecto(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Presupuesto ($)</label>
                  <input type="number" className="form-input" placeholder="0" min="1" value={fProyecto.presupuesto}
                    onChange={e => setFProyecto(f => ({ ...f, presupuesto: e.target.value }))} />
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Correo de Contacto</label>
                  <input type="email" className="form-input" placeholder="contacto@empresa.cl" value={fProyecto.correo}
                    onChange={e => setFProyecto(f => ({ ...f, correo: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
                <FolderPlus size={15} /> {loading ? 'Creando...' : 'Crear Proyecto'}
              </button>
            </form>

            {proyectos.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                  Proyectos registrados ({proyectos.length})
                </p>
                <div className="table-container">
                  <table>
                    <thead><tr><th>Código</th><th>Nombre</th><th>Estado</th><th>GPS Obra</th></tr></thead>
                    <tbody>
                      {proyectos.map(p => (
                        <tr key={p.proyecto_codigo_correlativo}>
                          <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.proyecto_codigo_correlativo}</td>
                          <td style={{ fontSize: 13 }}>{p.proyecto_nombre_obra}</td>
                          <td><Badge value={p.EstadoProyecto?.estado_proyecto_nombre} /></td>
                          <td style={{ fontSize: 11, fontFamily: 'monospace', color: p.proyecto_latitud ? 'var(--color-green)' : 'var(--color-text-muted)' }}>
                            {p.proyecto_latitud ? `${parseFloat(p.proyecto_latitud).toFixed(4)}, ${parseFloat(p.proyecto_longitud).toFixed(4)}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Coordenadas GPS por proyecto */}
            <div style={{ marginTop: 28, borderTop: '1px solid var(--color-border)', paddingTop: 24 }}>
              <SectionTitle><MapPin size={12} style={{ marginRight: 6, display: 'inline' }} />Coordenadas GPS de la Obra</SectionTitle>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                Configura la ubicación GPS del sitio de cada proyecto. El sistema la usa para verificar la recepción de insumos en obra.
                Obtén las coordenadas desde Google Maps (clic derecho sobre el punto → copiar coordenadas).
              </p>
              <form onSubmit={submitCoords}>
                <div className="form-group">
                  <label className="form-label">Proyecto</label>
                  <select className="form-select" value={fCoords.codigo}
                    onChange={e => setFCoords(f => ({ ...f, codigo: e.target.value }))}>
                    <option value="">Selecciona un proyecto...</option>
                    {proyectos.map(p => (
                      <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                        {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                        {p.proyecto_latitud ? ' ✓' : ' (sin coords)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-grid-2">
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Latitud</label>
                    <input className="form-input" placeholder="-33.456789" value={fCoords.lat}
                      onChange={e => setFCoords(f => ({ ...f, lat: e.target.value }))} />
                  </div>
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Longitud</label>
                    <input className="form-input" placeholder="-70.648300" value={fCoords.lon}
                      onChange={e => setFCoords(f => ({ ...f, lon: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loadingCoords}>
                  <MapPin size={15} /> {loadingCoords ? 'Guardando...' : 'Guardar Coordenadas'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ── PROVEEDORES ───────────────────────────────────────── */}
        {tab === 'proveedor' && (
          <div className="card">
            <SectionTitle>Nuevo Proveedor / Subcontratista</SectionTitle>
            <form onSubmit={submitProveedor}>
              <div className="form-grid-2">
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">RUT (ej: 76543210-9)</label>
                  <input className="form-input" placeholder="12345678-9" value={fProveedor.rut}
                    onChange={e => setFProveedor(f => ({ ...f, rut: e.target.value }))} />
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" placeholder="+56 9 1234 5678" value={fProveedor.telefono}
                    onChange={e => setFProveedor(f => ({ ...f, telefono: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Razón Social</label>
                <input className="form-input" placeholder="Nombre de la empresa..." value={fProveedor.razon_social}
                  onChange={e => setFProveedor(f => ({ ...f, razon_social: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Correo</label>
                <input type="email" className="form-input" placeholder="empresa@correo.cl" value={fProveedor.correo}
                  onChange={e => setFProveedor(f => ({ ...f, correo: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Building2 size={15} /> {loading ? 'Creando...' : 'Crear Proveedor'}
              </button>
            </form>
          </div>
        )}

        {/* ── TRABAJADORES ──────────────────────────────────────── */}
        {tab === 'trabajador' && (
          <div className="card">
            <SectionTitle>Nuevo Trabajador</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Puedes registrar trabajadores sin asignarlos a un proyecto todavía. Podrás asignarlos más adelante.
            </p>
            <form onSubmit={submitTrabajador}>
              <div className="form-grid-2">
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">RUT</label>
                  <input className="form-input" placeholder="12345678-9" value={fTrabajador.rut}
                    onChange={e => setFTrabajador(f => ({ ...f, rut: e.target.value }))} />
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" placeholder="+56 9 1234 5678" value={fTrabajador.telefono}
                    onChange={e => setFTrabajador(f => ({ ...f, telefono: e.target.value }))} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: 14 }}>
                <label className="form-label">Nombres</label>
                <input className="form-input" placeholder="Nombre completo..." value={fTrabajador.nombres}
                  onChange={e => setFTrabajador(f => ({ ...f, nombres: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Correo</label>
                <input type="email" className="form-input" placeholder="trabajador@correo.cl" value={fTrabajador.correo}
                  onChange={e => setFTrabajador(f => ({ ...f, correo: e.target.value }))} />
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Especialidad</label>
                  <select className="form-select" value={fTrabajador.especialidad_id}
                    onChange={e => setFTrabajador(f => ({ ...f, especialidad_id: e.target.value }))}>
                    <option value="">Seleccionar...</option>
                    {especialidades.map(s => <option key={s.especialidad_id} value={s.especialidad_id}>{s.especialidad_nombre}</option>)}
                  </select>
                </div>
                <ProyectoSelect value={fTrabajador.proyecto_codigo}
                  onChange={e => setFTrabajador(f => ({ ...f, proyecto_codigo: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
                <UserPlus size={15} /> {loading ? 'Creando...' : 'Crear Trabajador'}
              </button>
            </form>
          </div>
        )}

        {/* ── HITOS ─────────────────────────────────────────────── */}
        {tab === 'hito' && (
          <div className="card">
            <SectionTitle>Nuevo Hito Técnico</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Los hitos son etapas del proyecto. Las evidencias fotográficas se asocian a un hito.
            </p>
            <form onSubmit={submitHito}>
              <div className="form-group">
                <label className="form-label">Nombre del Hito</label>
                <input className="form-input" placeholder="Ej: Instalación de ductos, Prueba final..." value={fHito.nombre}
                  onChange={e => setFHito(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="form-grid-2">
                <ProyectoSelect value={fHito.proyecto_codigo} required
                  onChange={e => setFHito(f => ({ ...f, proyecto_codigo: e.target.value }))} />
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Avance Físico (%)</label>
                  <input type="number" className="form-input" placeholder="0" min="0" max="100" value={fHito.avance}
                    onChange={e => setFHito(f => ({ ...f, avance: e.target.value }))} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
                <Flag size={15} /> {loading ? 'Creando...' : 'Crear Hito'}
              </button>
            </form>
          </div>
        )}

        {/* ── SOLICITUDES DE MATERIAL ───────────────────────────── */}
        {tab === 'sm' && (
          <div className="card">
            <SectionTitle>Nueva Solicitud de Material</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Las solicitudes pendientes aparecen en "Órdenes de Compra" para generar la OC.
            </p>
            <form onSubmit={submitSM}>
              <div className="form-group">
                <label className="form-label">Descripción del material</label>
                <textarea className="form-textarea" rows={3} placeholder="Describe qué materiales se necesitan..."
                  value={fSM.descripcion} onChange={e => setFSM(f => ({ ...f, descripcion: e.target.value }))} />
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Cantidad (unidades)</label>
                  <input type="number" className="form-input" placeholder="1" min="1" value={fSM.cantidad}
                    onChange={e => setFSM(f => ({ ...f, cantidad: e.target.value }))} />
                </div>
                <ProyectoSelect value={fSM.proyecto_codigo} required
                  onChange={e => setFSM(f => ({ ...f, proyecto_codigo: e.target.value }))} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
                <ClipboardList size={15} /> {loading ? 'Creando...' : 'Crear Solicitud'}
              </button>
            </form>
          </div>
        )}

        {/* ── GUÍAS DE DESPACHO ─────────────────────────────────── */}
        {tab === 'guia' && (
          <div className="card">
            <SectionTitle>Nueva Guía de Despacho</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Registra el despacho de materiales de una orden de compra. Aparecerá en "Recepción de Insumos" para confirmar su llegada en obra.
            </p>
            {ordenes.length === 0 ? (
              <div style={{ padding: '20px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                No hay órdenes de compra. Primero crea una desde la sección "Órdenes de Compra".
              </div>
            ) : (
              <form onSubmit={submitGuia}>
                <div className="form-grid-2">
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Número de Guía</label>
                    <input className="form-input" placeholder="GD-001" value={fGuia.numero}
                      onChange={e => setFGuia(f => ({ ...f, numero: e.target.value }))} />
                  </div>
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Fecha de Despacho</label>
                    <input type="date" className="form-input" value={fGuia.fecha}
                      onChange={e => setFGuia(f => ({ ...f, fecha: e.target.value }))} />
                  </div>
                </div>
                <div className="form-group" style={{ marginTop: 14 }}>
                  <label className="form-label">Orden de Compra asociada</label>
                  <select className="form-select" value={fGuia.orden_id}
                    onChange={e => setFGuia(f => ({ ...f, orden_id: e.target.value }))}>
                    <option value="">Seleccionar OC...</option>
                    {ordenes.map(o => (
                      <option key={o.orden_compra_id} value={o.orden_compra_id}>
                        OC #{o.orden_compra_id} — Folio: {o.orden_compra_folio} ({o.orden_compra_estado})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
                  <Truck size={15} /> {loading ? 'Creando...' : 'Crear Guía de Despacho'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── CONTRATOS LABORALES ───────────────────────────────── */}
        {tab === 'contrato' && (
          <div className="card">
            <SectionTitle>Nuevo Contrato Laboral</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Registra el sueldo y leyes sociales de un trabajador. Estos datos alimentan el módulo de Mano de Obra.
            </p>
            {trabajadores.length === 0 ? (
              <div style={{ padding: '20px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                No hay trabajadores registrados. Primero créalos en la pestaña "Trabajadores".
              </div>
            ) : (
              <form onSubmit={submitContrato}>
                <div className="form-group">
                  <label className="form-label">Trabajador</label>
                  <select className="form-select" value={fContrato.rut}
                    onChange={e => setFContrato(f => ({ ...f, rut: e.target.value }))}>
                    <option value="">Seleccionar trabajador...</option>
                    {trabajadores.map(t => (
                      <option key={t.trabajador_rut} value={t.trabajador_rut}>
                        {t.trabajador_nombres} — {t.trabajador_rut}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-grid-2">
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Sueldo Base ($)</label>
                    <input type="number" className="form-input" placeholder="0" min="0" value={fContrato.sueldo}
                      onChange={e => setFContrato(f => ({ ...f, sueldo: e.target.value }))} />
                  </div>
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Leyes Sociales ($)</label>
                    <input type="number" className="form-input" placeholder="0" min="0" value={fContrato.leyes}
                      onChange={e => setFContrato(f => ({ ...f, leyes: e.target.value }))} />
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Fecha Inicio</label>
                    <input type="date" className="form-input" value={fContrato.inicio}
                      onChange={e => setFContrato(f => ({ ...f, inicio: e.target.value }))} />
                  </div>
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Fecha Término <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                    <input type="date" className="form-input" value={fContrato.termino}
                      onChange={e => setFContrato(f => ({ ...f, termino: e.target.value }))} />
                  </div>
                </div>
                <ProyectoSelect value={fContrato.proyecto_codigo}
                  onChange={e => setFContrato(f => ({ ...f, proyecto_codigo: e.target.value }))} />
                <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loading}>
                  <FileText size={15} /> {loading ? 'Creando...' : 'Crear Contrato'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
