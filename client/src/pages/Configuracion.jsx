import { useState, useEffect } from 'react';
import {
  Settings, FolderPlus, Building2, UserPlus, Flag,
  ClipboardList, Truck, FileText, MapPin, Edit3, Trash2, CalendarRange, DollarSign
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

// Fuera del componente: definido dentro, React lo recrearía en cada render
const SectionTitle = ({ children }) => (
  <h3 style={{ marginBottom: 16, fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
    {children}
  </h3>
);

export default function Configuracion() {
  const { toasts, addToast, removeToast } = useToast();
  const [tab, setTab] = useState('proyecto');
  const [especialidades,setEspecialidades] = useState([]);
  const [proyectos,     setProyectos]     = useState([]);
  const [trabajadores,  setTrabajadores]  = useState([]);
  const [ordenes,       setOrdenes]       = useState([]);
  const [contratos,     setContratos]     = useState([]);
  const [editandoContrato, setEditandoContrato] = useState(null);
  const [loading, setLoading] = useState(false);

  // CU08 - El código lo asigna el sistema y el estado inicial es fijo: no se piden en el formulario
  const [fProyecto,   setFProyecto]   = useState({ nombre: '', presupuesto: '', correo: '', ubicacion: '', tipo_sistema: '', inicio: '', termino: '' });
  // CU08 Excepción 1 - Campos a resaltar cuando el alta queda incompleta
  const [errProyecto, setErrProyecto] = useState([]);
  const [fCoords,     setFCoords]     = useState({ codigo: '', direccion: '', lat: '', lon: '' });
  const [coordsManual, setCoordsManual] = useState(false);
  const [loadingCoords, setLoadingCoords] = useState(false);
  const [fPlazo,      setFPlazo]      = useState({ codigo: '', inicio: '', termino: '' });
  const [loadingPlazo, setLoadingPlazo] = useState(false);
  const [fCaja,       setFCaja]       = useState({ codigo: '', monto: '' });
  const [loadingCaja, setLoadingCaja] = useState(false);
  const [fProveedor,  setFProveedor]  = useState({ rut: '', razon_social: '', correo: '', telefono: '' });
  const [fTrabajador, setFTrabajador] = useState({ rut: '', nombres: '', correo: '', telefono: '', especialidad_id: '', proyecto_codigo: '' });
  const [fHito,       setFHito]       = useState({ nombre: '', proyecto_codigo: '', avance: '0' });
  const [fSM,         setFSM]         = useState({ descripcion: '', cantidad: '', proyecto_codigo: '' });
  const [fGuia,       setFGuia]       = useState({ numero: '', fecha: '', orden_id: '' });
  const [fContrato,   setFContrato]   = useState({ rut: '', sueldo: '', leyes: '', inicio: '', termino: '', proyecto_codigo: '' });

  // Se declaran antes de los efectos que las llaman
  const cargarProyectos = () =>
    api.get('/setup/proyectos').then(r => setProyectos(r.data.data)).catch(() => {});

  const cargarContratos = () =>
    api.get('/setup/contratos').then(r => setContratos(r.data.data)).catch(() => {});

  useEffect(() => {
    api.get('/setup/especialidades').then(r => setEspecialidades(r.data.data)).catch(() => {});
    cargarProyectos();
  }, []);

  useEffect(() => {
    if (tab === 'guia') api.get('/setup/ordenes').then(r => setOrdenes(r.data.data)).catch(() => {});
    if (tab === 'contrato') {
      api.get('/setup/trabajadores').then(r => setTrabajadores(r.data.data)).catch(() => {});
      cargarContratos();
    }
  }, [tab]);

  // onError recibe los campos que el backend marcó como faltantes, para resaltarlos
  const send = async (endpoint, body, onSuccess, onError) => {
    setLoading(true);
    try {
      const r = await api.post(endpoint, body);
      addToast(r.data?.mensaje || 'Registrado correctamente', 'success');
      onSuccess();
      cargarProyectos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al guardar', 'error');
      if (onError) onError(err.response?.data?.campos || []);
    } finally {
      setLoading(false);
    }
  };

  const submitProyecto = e => {
    e.preventDefault();

    // CU08 Excepción 1 - Se marcan todos los campos faltantes de una vez
    const faltantes = [];
    if (!fProyecto.nombre.trim())       faltantes.push('proyecto_nombre_obra');
    if (!fProyecto.presupuesto)         faltantes.push('proyecto_presupuesto_asignado');
    if (!fProyecto.correo.trim())       faltantes.push('proyecto_correo_contacto');
    if (!fProyecto.ubicacion.trim())    faltantes.push('proyecto_ubicacion');
    if (!fProyecto.tipo_sistema.trim()) faltantes.push('proyecto_tipo_sistema');
    if (faltantes.length) {
      setErrProyecto(faltantes);
      return addToast('Completa los campos obligatorios resaltados', 'error');
    }
    if (!fProyecto.inicio !== !fProyecto.termino) {
      setErrProyecto(['proyecto_fecha_inicio', 'proyecto_fecha_termino']);
      return addToast('Indica la fecha de inicio y la de término del proyecto, o deja ambas vacías', 'error');
    }
    if (fProyecto.termino && fProyecto.termino < fProyecto.inicio) {
      setErrProyecto(['proyecto_fecha_termino']);
      return addToast('La fecha de término no puede ser anterior a la fecha de inicio', 'error');
    }

    setErrProyecto([]);
    send('/setup/proyecto', {
      proyecto_nombre_obra: fProyecto.nombre.trim(),
      proyecto_presupuesto_asignado: fProyecto.presupuesto,
      proyecto_correo_contacto: fProyecto.correo.trim(),
      proyecto_ubicacion: fProyecto.ubicacion.trim(),
      proyecto_tipo_sistema: fProyecto.tipo_sistema.trim(),
      proyecto_fecha_inicio: fProyecto.inicio || null,
      proyecto_fecha_termino: fProyecto.termino || null
    },
    () => setFProyecto({ nombre: '', presupuesto: '', correo: '', ubicacion: '', tipo_sistema: '', inicio: '', termino: '' }),
    campos => setErrProyecto(campos));
  };

  // Devuelve la clase del input según si el campo quedó marcado como faltante
  const claseProyecto = campo => 'form-input' + (errProyecto.includes(campo) ? ' is-invalid' : '');

  // Al elegir el proyecto se cargan sus fechas actuales para editarlas
  const elegirProyectoPlazo = codigo => {
    const p = proyectos.find(x => x.proyecto_codigo_correlativo === codigo);
    setFPlazo({ codigo, inicio: p?.proyecto_fecha_inicio || '', termino: p?.proyecto_fecha_termino || '' });
  };

  const submitPlazo = async e => {
    e.preventDefault();
    if (!fPlazo.codigo || !fPlazo.inicio || !fPlazo.termino)
      return addToast('Selecciona un proyecto e ingresa la fecha de inicio y la de término', 'error');
    if (fPlazo.termino < fPlazo.inicio)
      return addToast('La fecha de término no puede ser anterior a la fecha de inicio', 'error');
    setLoadingPlazo(true);
    try {
      await api.put(`/setup/proyecto/${fPlazo.codigo}/plazo`, { fecha_inicio: fPlazo.inicio, fecha_termino: fPlazo.termino });
      addToast('Plazo del proyecto guardado', 'success');
      setFPlazo({ codigo: '', inicio: '', termino: '' });
      cargarProyectos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al guardar el plazo', 'error');
    } finally {
      setLoadingPlazo(false);
    }
  };

  // Al elegir el proyecto se carga su fondo de caja chica actual para editarlo
  const elegirProyectoCaja = codigo => {
    const p = proyectos.find(x => x.proyecto_codigo_correlativo === codigo);
    setFCaja({ codigo, monto: p ? String(parseFloat(p.proyecto_presupuesto_caja_chica) || 0) : '' });
  };

  const submitCaja = async e => {
    e.preventDefault();
    if (!fCaja.codigo || fCaja.monto === '')
      return addToast('Selecciona un proyecto e ingresa el fondo de caja chica', 'error');
    const monto = parseFloat(fCaja.monto);
    if (isNaN(monto) || monto < 0)
      return addToast('El fondo de caja chica debe ser un monto igual o mayor a cero', 'error');
    setLoadingCaja(true);
    try {
      await api.put(`/setup/proyecto/${fCaja.codigo}/caja-chica`, { monto });
      addToast('Fondo de caja chica guardado', 'success');
      setFCaja({ codigo: '', monto: '' });
      cargarProyectos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al guardar el fondo de caja chica', 'error');
    } finally {
      setLoadingCaja(false);
    }
  };

  const submitCoords = async e => {
    e.preventDefault();
    if (!fCoords.codigo) return addToast('Selecciona un proyecto', 'error');

    let cuerpo;
    if (coordsManual) {
      const lat = parseFloat(fCoords.lat);
      const lon = parseFloat(fCoords.lon);
      if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180)
        return addToast('Coordenadas inválidas. Latitud: -90 a 90 / Longitud: -180 a 180', 'error');
      cuerpo = { latitud: lat, longitud: lon, direccion: fCoords.direccion.trim() || undefined };
    } else {
      if (!fCoords.direccion.trim()) return addToast('Escribe la dirección de la obra', 'error');
      cuerpo = { direccion: fCoords.direccion.trim() };
    }

    setLoadingCoords(true);
    try {
      const { data } = await api.put(`/setup/proyecto/${fCoords.codigo}/coordenadas`, cuerpo);
      const c = data.data;
      addToast(c?.origen === 'direccion'
        ? `Ubicación guardada — ${c.latitud.toFixed(5)}, ${c.longitud.toFixed(5)}`
        : 'Coordenadas GPS del proyecto guardadas', 'success');
      setFCoords({ codigo: '', direccion: '', lat: '', lon: '' });
      setCoordsManual(false);
      cargarProyectos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al guardar la ubicación', 'error');
      // Si el servicio de mapas falló o no reconoció la dirección, se ofrece el modo manual
      if (err.response?.data?.sugerir_manual) setCoordsManual(true);
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

  const contratoVacio = { rut: '', sueldo: '', leyes: '', inicio: '', termino: '', proyecto_codigo: '' };

  const submitContrato = async e => {
    e.preventDefault();
    if (!fContrato.rut || !fContrato.sueldo || !fContrato.inicio)
      return addToast('Trabajador, sueldo base y fecha de inicio son requeridos', 'error');
    if (fContrato.termino && fContrato.termino < fContrato.inicio)
      return addToast('La fecha de término no puede ser anterior a la fecha de inicio', 'error');
    const body = {
      trabajador_rut: fContrato.rut,
      contrato_laboral_sueldo_base: fContrato.sueldo,
      contrato_laboral_leyes_sociales: fContrato.leyes || 0,
      contrato_laboral_fecha_inicio: fContrato.inicio,
      contrato_laboral_fecha_termino: fContrato.termino || null,
      proyecto_codigo_correlativo: fContrato.proyecto_codigo || null
    };
    setLoading(true);
    try {
      if (editandoContrato) {
        await api.put(`/setup/contrato/${editandoContrato}`, body);
        addToast('Contrato actualizado correctamente', 'success');
      } else {
        await api.post('/setup/contrato', body);
        addToast('Contrato creado correctamente', 'success');
      }
      setFContrato(contratoVacio);
      setEditandoContrato(null);
      cargarContratos();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al guardar el contrato', 'error');
    } finally {
      setLoading(false);
    }
  };

  const editarContrato = c => {
    setFContrato({
      rut: c.trabajador_rut,
      sueldo: parseFloat(c.contrato_laboral_sueldo_base),
      leyes: parseFloat(c.contrato_laboral_leyes_sociales),
      inicio: c.contrato_laboral_fecha_inicio,
      termino: c.contrato_laboral_fecha_termino || '',
      proyecto_codigo: c.proyecto_codigo_correlativo || ''
    });
    setEditandoContrato(c.contrato_laboral_id_contrato);
  };

  const cancelarEdicionContrato = () => {
    setFContrato(contratoVacio);
    setEditandoContrato(null);
  };

  const eliminarContrato = id => {
    if (!window.confirm('¿Eliminar este contrato laboral? Esta acción no se puede deshacer.')) return;
    api.delete(`/setup/contrato/${id}`)
      .then(() => {
        addToast('Contrato eliminado', 'success');
        if (editandoContrato === id) cancelarEdicionContrato();
        cargarContratos();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al eliminar el contrato', 'error'));
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

      {/* La tabla de contratos necesita más ancho que los formularios */}
      <div style={{ maxWidth: tab === 'contrato' ? 960 : 620 }}>

        {/* ── PROYECTOS ─────────────────────────────────────────── */}
        {tab === 'proyecto' && (
          <div className="card">
            <SectionTitle>Nuevo Proyecto</SectionTitle>
            <form onSubmit={submitProyecto}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -6, marginBottom: 16 }}>
                El código correlativo y el estado inicial los asigna el sistema al guardar.
              </p>
              <div className="form-group">
                <label className="form-label">Nombre de la Obra</label>
                <input className={claseProyecto('proyecto_nombre_obra')} placeholder="Nombre descriptivo..." value={fProyecto.nombre}
                  onChange={e => setFProyecto(f => ({ ...f, nombre: e.target.value }))} />
              </div>
              <div className="form-grid-2">
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Presupuesto ($)</label>
                  <input type="number" className={claseProyecto('proyecto_presupuesto_asignado')} placeholder="0" min="1" value={fProyecto.presupuesto}
                    onChange={e => setFProyecto(f => ({ ...f, presupuesto: e.target.value }))} />
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Correo de Contacto</label>
                  <input type="email" className={claseProyecto('proyecto_correo_contacto')} placeholder="contacto@empresa.cl" value={fProyecto.correo}
                    onChange={e => setFProyecto(f => ({ ...f, correo: e.target.value }))} />
                </div>
              </div>
              <div className="form-grid-2" style={{ marginTop: 14 }}>
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Ubicación</label>
                  <input className={claseProyecto('proyecto_ubicacion')} placeholder="Av. Principal 1234, Comuna" value={fProyecto.ubicacion}
                    onChange={e => setFProyecto(f => ({ ...f, ubicacion: e.target.value }))} />
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Tipo de Sistema</label>
                  <input className={claseProyecto('proyecto_tipo_sistema')} placeholder="Ej: Split, VRF, Chiller..." value={fProyecto.tipo_sistema}
                    onChange={e => setFProyecto(f => ({ ...f, tipo_sistema: e.target.value }))} />
                </div>
              </div>
              <div className="form-grid-2" style={{ marginTop: 14 }}>
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Fecha de Inicio <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input type="date" className={claseProyecto('proyecto_fecha_inicio')} value={fProyecto.inicio}
                    onChange={e => setFProyecto(f => ({ ...f, inicio: e.target.value }))} />
                </div>
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Fecha de Término <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional)</span></label>
                  <input type="date" className={claseProyecto('proyecto_fecha_termino')} value={fProyecto.termino} min={fProyecto.inicio || undefined}
                    onChange={e => setFProyecto(f => ({ ...f, termino: e.target.value }))} />
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
              <SectionTitle><MapPin size={12} style={{ marginRight: 6, display: 'inline' }} />Ubicación de la Obra</SectionTitle>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                Escribe la dirección del sitio y el sistema obtiene sus coordenadas. Las usa para verificar la recepción de insumos en obra.
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
                <div className="form-group" style={fieldStyle}>
                  <label className="form-label">Dirección de la Obra</label>
                  <input className="form-input" placeholder="Av. Américo Vespucio 1737, Huechuraba, Santiago"
                    value={fCoords.direccion}
                    onChange={e => setFCoords(f => ({ ...f, direccion: e.target.value }))} />
                </div>

                {coordsManual && (
                  <>
                    <p style={{ fontSize: 12, color: 'var(--color-warning)', margin: '4px 0 12px' }}>
                      Ingreso manual: obtén las coordenadas desde Google Maps (clic derecho sobre el punto → copiar coordenadas).
                    </p>
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
                  </>
                )}

                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary" disabled={loadingCoords}>
                    <MapPin size={15} /> {loadingCoords ? 'Guardando...' : coordsManual ? 'Guardar Coordenadas' : 'Buscar Dirección y Guardar'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setCoordsManual(v => !v)} disabled={loadingCoords}>
                    {coordsManual ? 'Volver a buscar por dirección' : 'Ingresar coordenadas a mano'}
                  </button>
                </div>
              </form>
            </div>

            {/* Plazo de la obra por proyecto */}
            <div style={{ marginTop: 28, borderTop: '1px solid var(--color-border)', paddingTop: 24 }}>
              <SectionTitle><CalendarRange size={12} style={{ marginRight: 6, display: 'inline' }} />Plazo de la Obra</SectionTitle>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                Registra la fecha de inicio y de término de cada proyecto. Control de Costos reparte el presupuesto planificado
                en partes iguales entre los meses de la obra, aunque dure más de un año.
              </p>
              <form onSubmit={submitPlazo}>
                <div className="form-group">
                  <label className="form-label">Proyecto</label>
                  <select className="form-select" value={fPlazo.codigo}
                    onChange={e => elegirProyectoPlazo(e.target.value)}>
                    <option value="">Selecciona un proyecto...</option>
                    {proyectos.map(p => (
                      <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                        {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                        {p.proyecto_fecha_inicio ? ' ✓' : ' (sin plazo)'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-grid-2">
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Fecha de Inicio</label>
                    <input type="date" className="form-input" value={fPlazo.inicio}
                      onChange={e => setFPlazo(f => ({ ...f, inicio: e.target.value }))} />
                  </div>
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Fecha de Término</label>
                    <input type="date" className="form-input" value={fPlazo.termino} min={fPlazo.inicio || undefined}
                      onChange={e => setFPlazo(f => ({ ...f, termino: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loadingPlazo}>
                  <CalendarRange size={15} /> {loadingPlazo ? 'Guardando...' : 'Guardar Plazo'}
                </button>
              </form>
            </div>

            {/* Fondo de caja chica por proyecto (CU 39) */}
            <div style={{ marginTop: 28, borderTop: '1px solid var(--color-border)', paddingTop: 24 }}>
              <SectionTitle><DollarSign size={12} style={{ marginRight: 6, display: 'inline' }} />Fondo de Caja Chica</SectionTitle>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
                Monto que el proyecto puede gastar por caja chica. Los egresos se descuentan de este fondo y suman al gasto
                real en Control de Costos. No puede superar el presupuesto del proyecto ni ser menor a lo ya gastado.
              </p>
              <form onSubmit={submitCaja}>
                <div className="form-grid-2">
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Proyecto</label>
                    <select className="form-select" value={fCaja.codigo}
                      onChange={e => elegirProyectoCaja(e.target.value)}>
                      <option value="">Selecciona un proyecto...</option>
                      {proyectos.map(p => (
                        <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                          {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                          {parseFloat(p.proyecto_presupuesto_caja_chica) > 0 ? ' ✓' : ' (sin fondo)'}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={fieldStyle}>
                    <label className="form-label">Fondo de Caja Chica ($)</label>
                    <input type="number" className="form-input" min="0" placeholder="0" value={fCaja.monto}
                      onChange={e => setFCaja(f => ({ ...f, monto: e.target.value }))} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: 16 }} disabled={loadingCaja}>
                  <DollarSign size={15} /> {loadingCaja ? 'Guardando...' : 'Guardar Fondo'}
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
            <SectionTitle>{editandoContrato ? 'Editar Contrato Laboral' : 'Nuevo Contrato Laboral'}</SectionTitle>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              Registra el sueldo y leyes sociales de un trabajador. Estos datos alimentan el módulo de Mano de Obra.
            </p>
            {trabajadores.length === 0 ? (
              <div style={{ padding: '20px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                No hay trabajadores registrados. Primero créalos en la pestaña "Trabajadores".
              </div>
            ) : (
              <form onSubmit={submitContrato} style={{ maxWidth: 568 }}>
                <div className="form-group">
                  <label className="form-label">Trabajador</label>
                  <select className="form-select" value={fContrato.rut} disabled={!!editandoContrato}
                    onChange={e => setFContrato(f => ({ ...f, rut: e.target.value }))}>
                    <option value="">Seleccionar trabajador...</option>
                    {trabajadores.map(t => (
                      <option key={t.trabajador_rut} value={t.trabajador_rut}>
                        {t.trabajador_nombres} — {t.trabajador_rut}
                      </option>
                    ))}
                  </select>
                  {editandoContrato && (
                    <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      El trabajador de un contrato no se puede cambiar; elimina y crea uno nuevo si te equivocaste de persona.
                    </p>
                  )}
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
                    <input type="date" className="form-input" value={fContrato.termino} min={fContrato.inicio || undefined}
                      onChange={e => setFContrato(f => ({ ...f, termino: e.target.value }))} />
                  </div>
                </div>
                <ProyectoSelect value={fContrato.proyecto_codigo}
                  onChange={e => setFContrato(f => ({ ...f, proyecto_codigo: e.target.value }))} />
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    <FileText size={15} />
                    {loading ? 'Guardando...' : editandoContrato ? 'Guardar Cambios' : 'Crear Contrato'}
                  </button>
                  {editandoContrato && (
                    <button type="button" className="btn btn-secondary" onClick={cancelarEdicionContrato} disabled={loading}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )}

            {contratos.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 10 }}>
                  Contratos registrados ({contratos.length})
                </p>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Trabajador</th><th>Sueldo Base</th><th>Leyes Sociales</th>
                        <th>Inicio</th><th>Término</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {contratos.map(c => (
                        <tr key={c.contrato_laboral_id_contrato}>
                          <td style={{ fontSize: 13 }}>
                            {c.Trabajador ? `${c.Trabajador.trabajador_nombres} ${c.Trabajador.trabajador_apellidos || ''}`.trim() : c.trabajador_rut}
                            <span style={{ display: 'block', fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{c.trabajador_rut}</span>
                          </td>
                          <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>${parseFloat(c.contrato_laboral_sueldo_base).toLocaleString('es-CL')}</td>
                          <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>${parseFloat(c.contrato_laboral_leyes_sociales).toLocaleString('es-CL')}</td>
                          <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{c.contrato_laboral_fecha_inicio}</td>
                          <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{c.contrato_laboral_fecha_termino || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap', justifyContent: 'flex-end' }}>
                              <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}
                                onClick={() => editarContrato(c)}>
                                <Edit3 size={13} /> Editar
                              </button>
                              <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}
                                onClick={() => eliminarContrato(c.contrato_laboral_id_contrato)}>
                                <Trash2 size={13} /> Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
