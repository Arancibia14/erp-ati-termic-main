import { useState, useEffect, useCallback } from 'react';
import { FileSignature, Eye, ArrowLeft, CheckCircle, Download, Send, Ban, TriangleAlert, AirVent, Boxes } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';
import Select from '../components/Select';
import EstadoVacio from '../components/EstadoVacio';
import PanelFirma from '../components/PanelFirma';

// CU 68 - Generando acta de recepción final de obra
const FORM_VACIO = {
  cliente_nombre: '',
  cliente_rut: '',
  cliente_cargo: '',
  cliente_correo: '',
  trabajos: '',
  conformidad: 'Conforme',
  observaciones: ''
};

const OBLIGATORIOS = ['cliente_nombre', 'cliente_rut', 'cliente_cargo', 'cliente_correo', 'trabajos'];
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const fechaHora = f => new Date(f).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });

function Subtitulo({ icon: Icono, children }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', margin: '4px 0 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
      {Icono && <Icono size={13} />}{children}
    </p>
  );
}

function Dato({ etiqueta, children }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{etiqueta}</p>
      <p style={{ fontSize: 13, whiteSpace: 'pre-wrap' }}>{children || '—'}</p>
    </div>
  );
}

function ListaEquiposMateriales({ datos }) {
  return (
    <div className="form-grid-2" style={{ marginBottom: 16 }}>
      <div>
        <Subtitulo icon={AirVent}>Equipos de la obra ({datos.equipos.length})</Subtitulo>
        {datos.equipos.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>La obra no tiene equipos HVAC registrados.</p>
        ) : (
          <ul style={{ fontSize: 12, paddingLeft: 18, margin: 0 }}>
            {datos.equipos.map(e => <li key={e.numero_serie}>{e.modelo || 'Equipo HVAC'} · N° serie {e.numero_serie}</li>)}
          </ul>
        )}
      </div>
      <div>
        <Subtitulo icon={Boxes}>Materiales utilizados ({datos.materiales.length})</Subtitulo>
        {datos.materiales.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No hay materiales recibidos en la obra.</p>
        ) : (
          <ul style={{ fontSize: 12, paddingLeft: 18, margin: 0 }}>
            {datos.materiales.map(m => <li key={m.material_id}>{m.nombre} · {Number(m.cantidad)} {m.unidad}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ActaRecepcion() {
  const { toasts, addToast, removeToast } = useToast();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const esAdmin = usuario.rol === 'admin';

  const [obras, setObras] = useState([]);
  const [actas, setActas] = useState([]);
  const [cargandoActas, setCargandoActas] = useState(true);

  const [codigo, setCodigo] = useState('');
  const [datosObra, setDatosObra] = useState(null);
  const [aceptaTransito, setAceptaTransito] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [invalidos, setInvalidos] = useState({});

  // formulario → firma → listo
  const [paso, setPaso] = useState('formulario');
  const [panel, setPanel] = useState(null);
  const [hayFirma, setHayFirma] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const [anulando, setAnulando] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [motivoInvalido, setMotivoInvalido] = useState(false);
  const [procesando, setProcesando] = useState(null);

  const cargarObras = () => api.get('/acta-recepcion/obras')
    .then(r => setObras(r.data.data))
    .catch(() => addToast('Error al cargar las obras habilitadas', 'error'));

  const cargarActas = () => api.get('/acta-recepcion')
    .then(r => setActas(r.data.data))
    .catch(() => addToast('Error al cargar las actas emitidas', 'error'))
    .finally(() => setCargandoActas(false));

  useEffect(() => {
    cargarObras();
    cargarActas();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const elegirObra = valor => {
    setCodigo(valor);
    setDatosObra(null);
    setAceptaTransito(false);
    setForm(FORM_VACIO);
    setInvalidos({});
    if (!valor) return;
    api.get(`/acta-recepcion/obras/${encodeURIComponent(valor)}`)
      .then(r => {
        setDatosObra(r.data.data);
        setForm(f => ({ ...f, cliente_correo: r.data.data.obra.correo_contacto || '' }));
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al cargar los datos de la obra', 'error'));
  };

  const actualizar = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
    if (invalidos[campo]) setInvalidos(i => ({ ...i, [campo]: false }));
  };

  const clase = (base, campo) => `${base}${invalidos[campo] ? ' is-invalid' : ''}`;

  const irAVistaPrevia = () => {
    const faltan = {};
    OBLIGATORIOS.forEach(c => { if (!form[c].trim()) faltan[c] = true; });
    if (form.cliente_correo.trim() && !CORREO_REGEX.test(form.cliente_correo.trim())) faltan.cliente_correo = true;
    if (form.conformidad === 'Conforme con observaciones' && !form.observaciones.trim()) faltan.observaciones = true;
    if (Object.keys(faltan).length > 0) {
      setInvalidos(faltan);
      addToast('Completa los campos marcados en rojo', 'error');
      return;
    }
    if (datosObra.guias_en_transito > 0 && !aceptaTransito) {
      addToast('Confirma que deseas continuar con guías en tránsito', 'error');
      return;
    }
    setHayFirma(false);
    setPaso('firma');
  };

  const onPanelListo = useCallback(p => setPanel(p), []);

  const generar = () => {
    if (!panel || panel.isEmpty()) {
      addToast('El panel de firma está vacío. El cliente debe firmar para generar el acta.', 'error');
      return;
    }
    setGenerando(true);
    api.post('/acta-recepcion', { proyecto_codigo_correlativo: codigo, ...form, firma: panel.toDataURL() })
      .then(r => {
        setResultado({ ...r.data.data, obra: datosObra.obra.nombre, correo: form.cliente_correo });
        setPaso('listo');
        cargarObras();
        cargarActas();
      })
      .catch(err => {
        const data = err.response?.data;
        addToast(data?.error || 'Error al generar el acta', 'error');
        // Datos rechazados por el servidor: se vuelve al formulario con los campos marcados
        if (data?.campos?.length) {
          setInvalidos(Object.fromEntries(data.campos.map(c => [c, true])));
          setPaso('formulario');
        }
      })
      .finally(() => setGenerando(false));
  };

  const nuevaActa = () => {
    setPaso('formulario');
    setResultado(null);
    setCodigo('');
    setDatosObra(null);
    setForm(FORM_VACIO);
  };

  const reenviar = acta => {
    setProcesando(acta.acta_recepcion_id);
    api.post(`/acta-recepcion/${acta.acta_recepcion_id}/reenviar`)
      .then(r => addToast(r.data.data.mensaje, 'success'))
      .catch(err => addToast(err.response?.data?.error || 'No se pudo reenviar el acta', 'error'))
      .finally(() => setProcesando(null));
  };

  const confirmarAnulacion = () => {
    if (!motivo.trim()) {
      setMotivoInvalido(true);
      addToast('Debes indicar el motivo de la anulación', 'error');
      return;
    }
    setProcesando(anulando.acta_recepcion_id);
    api.post(`/acta-recepcion/${anulando.acta_recepcion_id}/anular`, { motivo })
      .then(r => {
        addToast(r.data.data.mensaje, 'success');
        setAnulando(null);
        cargarObras();
        cargarActas();
      })
      .catch(err => addToast(err.response?.data?.error || 'No se pudo anular el acta', 'error'))
      .finally(() => setProcesando(null));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <FileSignature size={20} />
        Acta de Recepción Final
      </h1>

      {/* ── NUEVA ACTA ─────────────────────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        {paso === 'listo' && resultado ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <CheckCircle size={40} style={{ color: 'var(--tone-green)', marginBottom: 8 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Acta N° {resultado.acta_recepcion_id} generada</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>{resultado.obra}</p>
            <p style={{ fontSize: 13, marginBottom: 12 }}>
              La garantía de los equipos rige desde el <strong>{resultado.fecha_inicio_garantia}</strong>.
            </p>
            {resultado.correo_enviado ? (
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>Se envió una copia a {resultado.correo}.</p>
            ) : (
              // Excepción 5 - Falla el envío del correo
              <p style={{ fontSize: 12, color: 'var(--tone-amber)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <TriangleAlert size={14} /> El acta quedó generada, pero no se pudo enviar el correo. Usa Reenviar en el historial.
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href={resultado.url_pdf} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                <Download size={14} /> Ver acta PDF
              </a>
              <button className="btn btn-secondary" onClick={nuevaActa}>Generar otra acta</button>
            </div>
          </div>
        ) : paso === 'firma' && datosObra ? (
          <>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Vista previa del acta</h3>
            <div className="form-grid-2">
              <div>
                <Subtitulo>Obra</Subtitulo>
                <Dato etiqueta="Nombre">{datosObra.obra.nombre} · {datosObra.obra.codigo}</Dato>
                <Dato etiqueta="Dirección">{datosObra.obra.direccion}</Dato>
              </div>
              <div>
                <Subtitulo>Cliente que recibe</Subtitulo>
                <Dato etiqueta="Nombre y RUT">{form.cliente_nombre} · {form.cliente_rut}</Dato>
                <Dato etiqueta="Cargo y correo">{form.cliente_cargo} · {form.cliente_correo}</Dato>
              </div>
            </div>
            <Dato etiqueta="Trabajos realizados">{form.trabajos}</Dato>
            <Dato etiqueta="Conformidad">{form.conformidad}{form.observaciones ? `: ${form.observaciones}` : ''}</Dato>
            <ListaEquiposMateriales datos={datosObra} />
            <p style={{ fontSize: 13, marginBottom: 16 }}>
              Al firmar, la garantía de los equipos comenzará a regir desde hoy.
            </p>

            <Subtitulo>Firma del cliente</Subtitulo>
            <PanelFirma onReady={onPanelListo} onTrazo={setHayFirma} />

            <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
              {/* Excepción 3 - Sin firma no se puede generar */}
              <button className="btn btn-primary" onClick={generar} disabled={generando || !hayFirma}>
                <FileSignature size={14} /> {generando ? 'Generando...' : 'Generar acta'}
              </button>
              <button className="btn btn-secondary" onClick={() => setPaso('formulario')} disabled={generando}>
                <ArrowLeft size={14} /> Volver a editar
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Nueva acta</h3>
            <div className="form-group" style={{ maxWidth: 420 }}>
              <label className="form-label">Obra En Ejecución</label>
              <Select className="form-select" value={codigo} onChange={e => elegirObra(e.target.value)}>
                <option value="">Selecciona una obra...</option>
                {obras.map(o => <option key={o.codigo} value={o.codigo}>{o.codigo} · {o.nombre}</option>)}
              </Select>
              {obras.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                  No hay obras En Ejecución sin acta firmada.
                </p>
              )}
            </div>

            {datosObra && (
              <>
                <div className="form-grid-2" style={{ marginBottom: 8 }}>
                  <Dato etiqueta="Obra">{datosObra.obra.nombre}</Dato>
                  <Dato etiqueta="Dirección">{datosObra.obra.direccion}</Dato>
                </div>
                <ListaEquiposMateriales datos={datosObra} />

                {/* Excepción 4 - Guías en tránsito */}
                {datosObra.guias_en_transito > 0 && (
                  <div style={{
                    border: '1px solid color-mix(in srgb, var(--tone-amber) 45%, transparent)',
                    background: 'color-mix(in srgb, var(--tone-amber) 10%, transparent)',
                    borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13
                  }}>
                    <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 6 }}>
                      <TriangleAlert size={15} style={{ color: 'var(--tone-amber)' }} />
                      La obra tiene {datosObra.guias_en_transito} guía{datosObra.guias_en_transito > 1 ? 's' : ''} en tránsito
                    </p>
                    <p style={{ fontSize: 12, marginBottom: 8 }}>Esos materiales aún no llegan a la obra y no aparecerán en el acta.</p>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                      <input type="checkbox" checked={aceptaTransito} onChange={e => setAceptaTransito(e.target.checked)} />
                      Entiendo y deseo continuar
                    </label>
                  </div>
                )}

                <Subtitulo>Cliente que recibe</Subtitulo>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Nombre completo</label>
                    <input className={clase('form-input', 'cliente_nombre')} value={form.cliente_nombre}
                           onChange={e => actualizar('cliente_nombre', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">RUT</label>
                    <input className={clase('form-input', 'cliente_rut')} placeholder="12345678-9" value={form.cliente_rut}
                           onChange={e => actualizar('cliente_rut', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cargo</label>
                    <input className={clase('form-input', 'cliente_cargo')} placeholder="Administrador del edificio" value={form.cliente_cargo}
                           onChange={e => actualizar('cliente_cargo', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correo</label>
                    <input type="email" className={clase('form-input', 'cliente_correo')} value={form.cliente_correo}
                           onChange={e => actualizar('cliente_correo', e.target.value)} />
                  </div>
                </div>

                <Subtitulo>Recepción</Subtitulo>
                <div className="form-group">
                  <label className="form-label">Trabajos realizados</label>
                  <textarea className={clase('form-textarea', 'trabajos')} rows={4} value={form.trabajos}
                            placeholder="Describe los trabajos entregados al cliente..."
                            onChange={e => actualizar('trabajos', e.target.value)} />
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Conformidad</label>
                    <Select className="form-select" value={form.conformidad} onChange={e => actualizar('conformidad', e.target.value)}>
                      <option value="Conforme">Conforme</option>
                      <option value="Conforme con observaciones">Conforme con observaciones</option>
                    </Select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">
                      Observaciones{form.conformidad === 'Conforme con observaciones' ? '' : ' (opcional)'}
                    </label>
                    <textarea className={clase('form-textarea', 'observaciones')} rows={2} value={form.observaciones}
                              onChange={e => actualizar('observaciones', e.target.value)} />
                  </div>
                </div>

                <button className="btn btn-primary" onClick={irAVistaPrevia}>
                  <Eye size={14} /> Vista previa y firma
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* ── ACTAS EMITIDAS ─────────────────────────────────────── */}
      <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Actas emitidas</h3>
      <div className="card" style={{ padding: 0 }}>
        {cargandoActas ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
        ) : actas.length === 0 ? (
          <EstadoVacio icon={FileSignature}>Todavía no se han emitido actas de recepción.</EstadoVacio>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>N°</th><th>Obra</th><th>Cliente</th><th>Fecha</th><th>Estado</th><th>Emitida por</th><th></th>
                </tr>
              </thead>
              <tbody>
                {actas.map(a => (
                  <tr key={a.acta_recepcion_id}>
                    <td style={{ fontSize: 12 }}>{a.acta_recepcion_id}</td>
                    <td style={{ fontSize: 12 }}>
                      <strong>{a.proyecto_nombre_obra}</strong><br />
                      <span style={{ color: 'var(--color-text-muted)' }}>{a.proyecto_codigo_correlativo}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{a.acta_recepcion_cliente_nombre}<br />
                      <span style={{ color: 'var(--color-text-muted)' }}>{a.acta_recepcion_cliente_correo}</span>
                    </td>
                    <td style={{ fontSize: 12 }}>{fechaHora(a.acta_recepcion_fecha_hora)}</td>
                    <td>
                      <Badge value={a.acta_recepcion_estado} />
                      {a.acta_recepcion_estado === 'Anulada' && (
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, maxWidth: 220 }}>
                          {a.acta_recepcion_motivo_anulacion}
                        </p>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>{a.emisor}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {a.acta_recepcion_url_pdf && (
                          <a href={a.acta_recepcion_url_pdf} target="_blank" rel="noreferrer"
                             className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12, textDecoration: 'none' }}>
                            <Download size={13} /> PDF
                          </a>
                        )}
                        {a.acta_recepcion_estado === 'Firmada' && (
                          <button className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}
                                  disabled={procesando === a.acta_recepcion_id} onClick={() => reenviar(a)}>
                            <Send size={13} /> Reenviar correo
                          </button>
                        )}
                        {esAdmin && a.acta_recepcion_estado === 'Firmada' && (
                          <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }}
                                  onClick={() => { setAnulando(a); setMotivo(''); setMotivoInvalido(false); }}>
                            <Ban size={13} /> Anular
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── ANULACIÓN ──────────────────────────────────────────── */}
      {anulando && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 500, padding: 24, overflowY: 'auto'
          }}
          onClick={() => !procesando && setAnulando(null)}
        >
          <div className="card" style={{ maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Ban size={16} /> Anular acta N° {anulando.acta_recepcion_id}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              {anulando.proyecto_nombre_obra}. El acta conserva su PDF y la obra queda habilitada para emitir una nueva.
            </p>
            <div className="form-group">
              <label className="form-label">Motivo de la anulación</label>
              <textarea className={`form-textarea${motivoInvalido ? ' is-invalid' : ''}`} rows={3} value={motivo}
                        onChange={e => { setMotivo(e.target.value); setMotivoInvalido(false); }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" onClick={confirmarAnulacion} disabled={!!procesando}>
                {procesando ? 'Anulando...' : 'Anular acta'}
              </button>
              <button className="btn btn-secondary" onClick={() => setAnulando(null)} disabled={!!procesando}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
