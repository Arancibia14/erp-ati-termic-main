import { useState, useEffect, useRef } from 'react';
import { Megaphone, Plus, X, Pencil, Send, Undo2, ImageOff } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';
import AvisoTarjeta from '../components/AvisoTarjeta';
import { fechaLocal } from '../utils/fecha';

// CU 46 - Gestionando avisos temporales (módulo "Avisos Internos")
const TITULO_MAX = 100;
const TEXTO_MAX = 500;
const IMAGEN_LIMITE_MB = 2;
const IMAGEN_MIN = 200;
const IMAGEN_MAX = 4000;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const FORMATO_NO_VALIDO = 'Formato de imagen no válido. Carga un archivo en formato web estándar: JPG, PNG o WEBP';
const ESTADOS = ['Borrador', 'Listo para publicar'];

const formVacio = () => ({ titulo: '', texto: '', fecha_inicio: fechaLocal(), fecha_termino: '', estado: 'Borrador' });
const fechaCorta = f => (f ? f.split('-').reverse().join('-') : '');

// Lee ancho y alto de la imagen en el navegador; null si no se puede abrir
const medirImagen = archivo => new Promise(resolve => {
  const url = URL.createObjectURL(archivo);
  const img = new Image();
  img.onload = () => { resolve({ ancho: img.naturalWidth, alto: img.naturalHeight, url }); };
  img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
  img.src = url;
});

export default function AvisosInternos() {
  const { toasts, addToast, removeToast } = useToast();
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // aviso que se está editando, o null si es nuevo
  const [form, setForm] = useState(formVacio);
  const [archivo, setArchivo] = useState(null);
  const [vistaImagen, setVistaImagen] = useState(null);
  const [quitarImagen, setQuitarImagen] = useState(false);
  const [invalidos, setInvalidos] = useState([]);
  const [errorImagen, setErrorImagen] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cambiando, setCambiando] = useState(null);
  const inputArchivo = useRef(null);

  const cargar = () => {
    api.get('/aviso')
      .then(r => setAvisos(r.data.data))
      .catch(() => addToast('Error al cargar los avisos', 'error'))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const limpiarArchivo = () => {
    if (vistaImagen && archivo) URL.revokeObjectURL(vistaImagen);
    setArchivo(null);
    setVistaImagen(null);
    if (inputArchivo.current) inputArchivo.current.value = '';
  };

  // Paso 1 - "Nuevo Aviso" despliega el editor vacío
  const abrirNuevo = () => {
    limpiarArchivo();
    setEditando(null);
    setForm(formVacio());
    setQuitarImagen(false);
    setInvalidos([]);
    setErrorImagen(null);
    setAbierto(true);
  };

  const abrirEdicion = a => {
    limpiarArchivo();
    setEditando(a);
    setForm({ titulo: a.aviso_titulo, texto: a.aviso_texto, fecha_inicio: a.aviso_fecha_inicio, fecha_termino: a.aviso_fecha_termino, estado: a.aviso_estado });
    setVistaImagen(a.aviso_url_imagen);
    setQuitarImagen(false);
    setInvalidos([]);
    setErrorImagen(null);
    setAbierto(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cerrar = () => {
    limpiarArchivo();
    setAbierto(false);
    setEditando(null);
  };

  const cambiar = (campo, valor) => {
    setForm(f => ({ ...f, [campo]: valor }));
    setInvalidos(prev => prev.filter(c => c !== campo));
  };

  // Pasos 4 y 5 - Formato web estándar y dimensiones para optimización web
  const elegirImagen = async e => {
    const nuevo = e.target.files[0];
    if (!nuevo) return;
    setErrorImagen(null);
    setInvalidos(prev => prev.filter(c => c !== 'imagen'));
    const rechazar = mensaje => {
      e.target.value = '';
      setErrorImagen(mensaje);
      setInvalidos(prev => [...prev, 'imagen']);
      addToast(mensaje, 'error');
    };
    if (!TIPOS.includes(nuevo.type)) return rechazar(FORMATO_NO_VALIDO);
    if (nuevo.size > IMAGEN_LIMITE_MB * 1024 * 1024) return rechazar(`La imagen supera el límite de ${IMAGEN_LIMITE_MB} MB`);
    const medida = await medirImagen(nuevo);
    if (!medida) return rechazar(FORMATO_NO_VALIDO);
    if (medida.ancho < IMAGEN_MIN || medida.alto < IMAGEN_MIN) {
      URL.revokeObjectURL(medida.url);
      return rechazar(`La imagen es muy pequeña (${medida.ancho}×${medida.alto} px): debe medir al menos ${IMAGEN_MIN}×${IMAGEN_MIN} px`);
    }
    if (medida.ancho > IMAGEN_MAX || medida.alto > IMAGEN_MAX) {
      URL.revokeObjectURL(medida.url);
      return rechazar(`La imagen es muy grande (${medida.ancho}×${medida.alto} px): debe medir como máximo ${IMAGEN_MAX}×${IMAGEN_MAX} px`);
    }
    if (vistaImagen && archivo) URL.revokeObjectURL(vistaImagen);
    setArchivo(nuevo);
    setVistaImagen(medida.url);
    setQuitarImagen(false);
  };

  const quitar = () => {
    limpiarArchivo();
    setQuitarImagen(true);
  };

  // Paso 3 - Se revisan todos los campos de una vez para marcarlos juntos
  const validar = () => {
    const faltan = [];
    let mensaje = null;
    const fallar = (campo, texto) => { faltan.push(campo); if (!mensaje) mensaje = texto; };
    const titulo = form.titulo.trim();
    const texto = form.texto.trim();
    if (!titulo) fallar('titulo', 'El título es obligatorio');
    else if (titulo.length > TITULO_MAX) fallar('titulo', `El título no puede superar los ${TITULO_MAX} caracteres`);
    if (!texto) fallar('texto', 'El texto del aviso es obligatorio');
    else if (texto.length > TEXTO_MAX) fallar('texto', `El texto supera el límite de ${TEXTO_MAX} caracteres de la vista principal`);
    if (!form.fecha_inicio) fallar('fecha_inicio', 'Indica la fecha de inicio');
    if (!form.fecha_termino) fallar('fecha_termino', 'Indica hasta cuándo se mostrará el aviso');
    else if (form.fecha_inicio && form.fecha_termino < form.fecha_inicio) fallar('fecha_termino', 'La fecha de término no puede ser anterior a la de inicio');
    else if (form.fecha_termino < fechaLocal()) fallar('fecha_termino', 'La fecha de término ya pasó: el aviso nunca se mostraría');
    if (errorImagen) fallar('imagen', errorImagen);
    return { faltan, mensaje };
  };

  const guardar = e => {
    e.preventDefault();
    const { faltan, mensaje } = validar();
    if (faltan.length) {
      setInvalidos(faltan);
      return addToast(mensaje, 'error');
    }
    const datos = new FormData();
    datos.append('titulo', form.titulo.trim());
    datos.append('texto', form.texto.trim());
    datos.append('fecha_inicio', form.fecha_inicio);
    datos.append('fecha_termino', form.fecha_termino);
    datos.append('estado', form.estado);
    if (archivo) datos.append('imagen', archivo);
    if (editando && quitarImagen) datos.append('quitar_imagen', 'true');

    setGuardando(true);
    const peticion = editando ? api.put(`/aviso/${editando.aviso_id}`, datos) : api.post('/aviso', datos);
    peticion
      .then(r => {
        addToast(r.data.mensaje, 'success');
        cerrar();
        cargar();
      })
      .catch(err => {
        const data = err.response?.data;
        setInvalidos(data?.campos || []);
        if (data?.campos?.includes('imagen')) setErrorImagen(data.error);
        addToast(data?.error || 'Error al guardar el aviso', 'error');
      })
      .finally(() => setGuardando(false));
  };

  const cambiarEstado = (a, estado) => {
    setCambiando(a.aviso_id);
    api.put(`/aviso/${a.aviso_id}/estado`, { estado })
      .then(r => {
        addToast(r.data.mensaje, 'success');
        cargar();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al cambiar el estado', 'error'))
      .finally(() => setCambiando(null));
  };

  const clase = (base, campo) => base + (invalidos.includes(campo) ? ' is-invalid' : '');
  const contador = (valor, max) => (
    <span style={{ float: 'right', fontWeight: 400, color: valor.trim().length > max ? 'var(--color-danger)' : 'var(--color-text-muted)' }}>
      {valor.trim().length}/{max}
    </span>
  );
  const publicados = avisos.filter(a => a.aviso_estado === 'Listo para publicar' && a.vigencia === 'Vigente').length;

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Megaphone size={20} />
        Avisos Internos
      </h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
        <button type="button" className="btn btn-primary" onClick={abrirNuevo}>
          <Plus size={15} /> Nuevo Aviso
        </button>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
          {publicados} visible{publicados === 1 ? '' : 's'} hoy en Inicio
        </span>
      </div>

      {/* CU 46 pasos 1 a 6 - Editor del aviso */}
      {abierto && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
              {editando ? `Editar aviso #${editando.aviso_id}` : 'Nuevo aviso'}
            </h3>
            <button type="button" className="btn btn-secondary" style={{ padding: '6px 10px' }} onClick={cerrar}>
              <X size={14} />
            </button>
          </div>

          <form onSubmit={guardar}>
            <div className="form-grid-2" style={{ alignItems: 'start' }}>
              <div>
                <div className="form-group">
                  <label className="form-label">Título {contador(form.titulo, TITULO_MAX)}</label>
                  <input className={clase('form-input', 'titulo')} placeholder="Ej. Reunión de seguridad el lunes"
                    value={form.titulo} onChange={e => cambiar('titulo', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Texto {contador(form.texto, TEXTO_MAX)}</label>
                  <textarea className={clase('form-textarea', 'texto')} rows={5} placeholder="Escribe el mensaje para el equipo..."
                    value={form.texto} onChange={e => cambiar('texto', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Imagen o icono <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(opcional · JPG, PNG o WEBP · máx. {IMAGEN_LIMITE_MB} MB)</span>
                  </label>
                  <input ref={inputArchivo} type="file" accept=".jpg,.jpeg,.png,.webp" className={clase('form-input', 'imagen')}
                    onChange={elegirImagen} />
                  {errorImagen && <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 6 }}>{errorImagen}</p>}
                  {vistaImagen && (
                    <button type="button" className="btn btn-secondary" style={{ marginTop: 8, padding: '5px 10px', fontSize: 12 }} onClick={quitar}>
                      <ImageOff size={13} /> Quitar imagen
                    </button>
                  )}
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Mostrar desde</label>
                    <input type="date" className={clase('form-input', 'fecha_inicio')}
                      value={form.fecha_inicio} onChange={e => cambiar('fecha_inicio', e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mostrar hasta</label>
                    <input type="date" className={clase('form-input', 'fecha_termino')} min={form.fecha_inicio || undefined}
                      value={form.fecha_termino} onChange={e => cambiar('fecha_termino', e.target.value)} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select className={clase('form-select', 'estado')} value={form.estado} onChange={e => cambiar('estado', e.target.value)}>
                    {ESTADOS.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 6 }}>
                    {form.estado === 'Borrador'
                      ? 'El borrador no lo ve nadie más: puedes seguir editándolo.'
                      : 'Se mostrará en Inicio a todos los usuarios entre las fechas indicadas.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="form-label">Vista previa en Inicio</label>
                <AvisoTarjeta titulo={form.titulo.trim()} texto={form.texto.trim()} imagen={vistaImagen} fechaTermino={form.fecha_termino} />
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: 8 }} disabled={guardando}>
              <Megaphone size={15} /> {guardando ? 'Guardando...' : 'Guardar Aviso'}
            </button>
          </form>
        </div>
      )}

      {/* Lista de avisos con su estado y vigencia */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Avisos registrados ({avisos.length})
          </h3>
        </div>
        {cargando ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
        ) : avisos.length === 0 ? (
          <div className="estado-vacio">
            <p>Todavía no hay avisos. Crea el primero con "Nuevo Aviso".</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Título</th>
                  <th>Vigencia</th>
                  <th>Estado</th>
                  <th>En Inicio</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {avisos.map(a => (
                  <tr key={a.aviso_id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>#{a.aviso_id}</td>
                    <td style={{ fontWeight: 600, fontSize: 13, overflowWrap: 'anywhere' }}>{a.aviso_titulo}</td>
                    <td style={{ fontSize: 13 }}>{fechaCorta(a.aviso_fecha_inicio)} al {fechaCorta(a.aviso_fecha_termino)}</td>
                    <td><Badge value={a.aviso_estado} /></td>
                    <td>
                      <Badge value={a.aviso_estado === 'Borrador' ? 'No visible' : a.vigencia} />
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => abrirEdicion(a)}>
                          <Pencil size={13} /> Editar
                        </button>
                        {a.aviso_estado === 'Borrador' ? (
                          a.vigencia !== 'Vencido' && (
                            <button type="button" className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }}
                              disabled={cambiando === a.aviso_id} onClick={() => cambiarEstado(a, 'Listo para publicar')}>
                              <Send size={13} /> Publicar
                            </button>
                          )
                        ) : (
                          <button type="button" className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: 12 }}
                            disabled={cambiando === a.aviso_id} onClick={() => cambiarEstado(a, 'Borrador')}>
                            <Undo2 size={13} /> Pasar a borrador
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

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
