import { useState, useEffect } from 'react';
import { Users, Plus, HeartPulse, Upload, Download } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const EXAMEN_VACIO = { tipo: 'fisica', fecha_emision: '', fecha_vencimiento: '', archivo: null };

const FORM_VACIO = {
  rut: '',
  nombres: '',
  apellidos: '',
  especialidad_id: '',
  correo: '',
  telefono: ''
};

export default function Trabajadores() {
  const { toasts, addToast, removeToast } = useToast();
  const [trabajadores, setTrabajadores] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [camposInvalidos, setCamposInvalidos] = useState({});
  const [errorRut, setErrorRut] = useState('');

  // CU25 - Certificados de exámenes médicos
  const [saludTrab, setSaludTrab] = useState(null);
  const [examenes, setExamenes] = useState([]);
  const [examenForm, setExamenForm] = useState(EXAMEN_VACIO);
  const [subiendoExamen, setSubiendoExamen] = useState(false);

  const abrirSalud = trab => {
    setSaludTrab(trab);
    setExamenes([]);
    setExamenForm(EXAMEN_VACIO);
    api.get(`/examen-medico/${trab.trabajador_rut}`)
      .then(r => setExamenes(r.data.data))
      .catch(() => addToast('Error al cargar los exámenes médicos', 'error'));
  };

  const subirExamen = () => {
    if (!examenForm.tipo || !examenForm.fecha_vencimiento || !examenForm.archivo) {
      addToast('Elige el tipo de examen, la fecha de vencimiento y adjunta el archivo', 'error');
      return;
    }
    const fd = new FormData();
    fd.append('trabajador_rut', saludTrab.trabajador_rut);
    fd.append('tipo', examenForm.tipo);
    fd.append('fecha_emision', examenForm.fecha_emision);
    fd.append('fecha_vencimiento', examenForm.fecha_vencimiento);
    fd.append('archivo', examenForm.archivo);

    setSubiendoExamen(true);
    api.post('/examen-medico', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => {
        addToast(r.data.data?.mensaje || 'Certificado médico cargado exitosamente', 'success');
        if (r.data.data?.vencido) {
          addToast('Atención: el certificado cargado ya está vencido.', 'warning');
        }
        setExamenForm(EXAMEN_VACIO);
        return api.get(`/examen-medico/${saludTrab.trabajador_rut}`);
      })
      .then(r => r && setExamenes(r.data.data))
      .catch(err => addToast(err.response?.data?.error || 'Error al cargar el certificado médico', 'error'))
      .finally(() => setSubiendoExamen(false));
  };

  const cargarTrabajadores = () => {
    setLoading(true);
    api.get('/trabajador')
      .then(r => setTrabajadores(r.data.data))
      .catch(() => addToast('Error al cargar los trabajadores', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarTrabajadores();
    api.get('/trabajador/especialidades')
      .then(r => setEspecialidades(r.data.data))
      .catch(() => addToast('Error al cargar especialidades', 'error'));
  }, []);

  const actualizarCampo = (campo, valor) => {
    setForm(prev => ({ ...prev, [campo]: valor }));
    setCamposInvalidos(prev => ({ ...prev, [campo]: false }));
    if (campo === 'rut') setErrorRut('');
  };

  const cancelarForm = () => {
    setForm(FORM_VACIO);
    setCamposInvalidos({});
    setErrorRut('');
    setMostrarForm(false);
  };

  const guardarTrabajador = () => {
    const obligatorios = ['rut', 'nombres', 'apellidos', 'especialidad_id'];
    const invalidos = {};
    obligatorios.forEach(campo => {
      if (!form[campo] || !form[campo].toString().trim()) invalidos[campo] = true;
    });

    if (Object.keys(invalidos).length > 0) {
      setCamposInvalidos(invalidos);
      addToast('Completa los campos obligatorios resaltados', 'error');
      return;
    }

    setGuardando(true);
    setErrorRut('');
    api.post('/trabajador', form)
      .then(() => {
        addToast('Expediente actualizado exitosamente', 'success');
        cancelarForm();
        cargarTrabajadores();
      })
      .catch(err => {
        const mensaje = err.response?.data?.error || 'Error al crear el expediente';
        setErrorRut(mensaje);
        setCamposInvalidos(prev => ({ ...prev, rut: true }));
        addToast(mensaje, 'error');
      })
      .finally(() => setGuardando(false));
  };

  const desactivarTrabajador = rut => {
    api.delete(`/trabajador/${rut}`)
      .then(() => {
        addToast('Trabajador desactivado', 'success');
        cargarTrabajadores();
      })
      .catch(() => addToast('Error al desactivar el trabajador', 'error'));
  };

  const inputStyle = campo => camposInvalidos[campo]
    ? { borderColor: 'var(--color-danger)' }
    : {};

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Users size={20} />
        Trabajadores
      </h1>

      <div style={{ marginBottom: 20 }}>
        {!mostrarForm && (
          <button className="btn btn-primary" onClick={() => setMostrarForm(true)}>
            <Plus size={15} />
            Nuevo Expediente
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="card" style={{ maxWidth: 640, marginBottom: 24 }}>
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">RUT</label>
              <input
                type="text"
                className="form-input"
                placeholder="12345678-9"
                style={inputStyle('rut')}
                value={form.rut}
                onChange={e => actualizarCampo('rut', e.target.value)}
              />
              {errorRut && (
                <p style={{ color: 'var(--color-danger)', fontSize: 12, marginTop: 4 }}>{errorRut}</p>
              )}
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Especialidad Técnica</label>
              <select
                className="form-select"
                style={inputStyle('especialidad_id')}
                value={form.especialidad_id}
                onChange={e => actualizarCampo('especialidad_id', e.target.value)}
              >
                <option value="">Selecciona...</option>
                {especialidades.map(e => (
                  <option key={e.especialidad_id} value={e.especialidad_id}>{e.especialidad_nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Nombres</label>
              <input
                type="text"
                className="form-input"
                style={inputStyle('nombres')}
                value={form.nombres}
                onChange={e => actualizarCampo('nombres', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Apellidos</label>
              <input
                type="text"
                className="form-input"
                style={inputStyle('apellidos')}
                value={form.apellidos}
                onChange={e => actualizarCampo('apellidos', e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Correo (opcional)</label>
              <input
                type="email"
                className="form-input"
                value={form.correo}
                onChange={e => actualizarCampo('correo', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Teléfono (opcional)</label>
              <input
                type="text"
                className="form-input"
                value={form.telefono}
                onChange={e => actualizarCampo('telefono', e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={guardarTrabajador} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
            <button className="btn btn-secondary" onClick={cancelarForm} disabled={guardando}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13 }}>Cargando...</p>
        ) : trabajadores.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--color-text-muted)', fontSize: 13, fontStyle: 'italic' }}>
            No hay trabajadores registrados
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>RUT</th>
                  <th>Nombre Completo</th>
                  <th>Especialidad</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {trabajadores.map(t => (
                  <tr key={t.trabajador_rut}>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{t.trabajador_rut}</td>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{t.trabajador_nombres} {t.trabajador_apellidos}</td>
                    <td style={{ fontSize: 13 }}>{t.Especialidad?.especialidad_nombre || '—'}</td>
                    <td style={{ fontSize: 13 }}>{t.trabajador_telefono || '—'}</td>
                    <td style={{ fontSize: 13 }}>{t.trabajador_correo || '—'}</td>
                    <td><Badge value={t.trabajador_activo ? 'Activo' : 'Inactivo'} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => abrirSalud(t)}
                        >
                          <HeartPulse size={13} /> Salud
                        </button>
                        {t.trabajador_activo && (
                          <button
                            className="btn btn-danger"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => desactivarTrabajador(t.trabajador_rut)}
                          >
                            Desactivar
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

      {saludTrab && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            zIndex: 500, padding: 24, overflowY: 'auto'
          }}
          onClick={() => !subiendoExamen && setSaludTrab(null)}
        >
          <div className="card" style={{ maxWidth: 620, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HeartPulse size={16} /> Documentos de Salud
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              {saludTrab.trabajador_nombres} {saludTrab.trabajador_apellidos} — {saludTrab.trabajador_rut} ·
              {' '}{saludTrab.Especialidad?.especialidad_nombre || 'Sin especialidad'}
            </p>

            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                Certificados cargados
              </p>
              {examenes.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                  Sin certificados de exámenes médicos.
                </p>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr><th>Tipo</th><th>Emisión</th><th>Vencimiento</th><th>Estado</th><th></th></tr>
                    </thead>
                    <tbody>
                      {examenes.map(e => (
                        <tr key={e.documento_legal_id}>
                          <td style={{ fontSize: 12 }}>
                            {e.documento_legal_tipo === 'ExamenAlturaFisica' ? 'Altura Física' : 'Altura Geográfica'}
                          </td>
                          <td style={{ fontSize: 12 }}>{e.documento_legal_fecha_emision || '—'}</td>
                          <td style={{ fontSize: 12 }}>{e.documento_legal_fecha_vencimiento || '—'}</td>
                          <td><Badge value={e.vencido ? 'Vencido' : 'Vigente'} /></td>
                          <td>
                            <a href={e.documento_legal_url_pdf} target="_blank" rel="noreferrer"
                               className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: 11, textDecoration: 'none' }}>
                              <Download size={12} /> Ver
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--color-text-secondary)', marginBottom: 10 }}>
              Cargar Documento de Salud
            </p>
            <div className="form-grid-2" style={{ marginBottom: 12 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tipo de examen</label>
                <select className="form-select" value={examenForm.tipo}
                        onChange={e => setExamenForm(f => ({ ...f, tipo: e.target.value }))}>
                  <option value="fisica">Altura Física</option>
                  <option value="geografica">Altura Geográfica</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Archivo (PDF o imagen)</label>
                <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png"
                       onChange={e => setExamenForm(f => ({ ...f, archivo: e.target.files[0] || null }))} />
              </div>
            </div>
            <div className="form-grid-2" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fecha de emisión</label>
                <input type="date" className="form-input" value={examenForm.fecha_emision}
                       onChange={e => setExamenForm(f => ({ ...f, fecha_emision: e.target.value }))} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Fecha de vencimiento</label>
                <input type="date" className="form-input" value={examenForm.fecha_vencimiento}
                       onChange={e => setExamenForm(f => ({ ...f, fecha_vencimiento: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={subirExamen} disabled={subiendoExamen}>
                <Upload size={14} />
                {subiendoExamen ? 'Cargando...' : 'Cargar Documento de Salud'}
              </button>
              <button className="btn btn-secondary" onClick={() => setSaludTrab(null)} disabled={subiendoExamen}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
