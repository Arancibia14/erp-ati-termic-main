import { useState, useEffect } from 'react';
import { ArrowRightLeft, ClipboardCheck, Send, Download, User, MapPin } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

export default function AnexoContrato() {
  const { toasts, addToast, removeToast } = useToast();
  const [trabajadores, setTrabajadores] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [trabajadorRut, setTrabajadorRut] = useState('');
  const [infoContractual, setInfoContractual] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [mostrarDestino, setMostrarDestino] = useState(false);
  const [form, setForm] = useState({ proyecto_destino_codigo: '', fecha_inicio: '' });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    api.get('/trabajador')
      .then(r => setTrabajadores(r.data.data))
      .catch(() => addToast('Error al cargar trabajadores', 'error'));
    api.get('/portafolio')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  const proyectosActivos = proyectos.filter(p => p.EstadoProyecto?.estado_proyecto_nombre === 'En Ejecución');

  const handleTrabajador = e => {
    const rut = e.target.value;
    setTrabajadorRut(rut);
    setInfoContractual(null);
    setMostrarDestino(false);
    setForm({ proyecto_destino_codigo: '', fecha_inicio: '' });
    setResultado(null);
    if (!rut) return;
    setLoadingInfo(true);
    api.get(`/anexo-contrato/trabajador/${rut}`)
      .then(r => setInfoContractual(r.data.data))
      .catch(err => addToast(err.response?.data?.error || 'Error al obtener la información contractual', 'error'))
      .finally(() => setLoadingInfo(false));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.proyecto_destino_codigo || !form.fecha_inicio) {
      addToast('Selecciona la obra de destino y confirma la fecha de inicio', 'error'); return;
    }

    setLoading(true);
    setResultado(null);
    try {
      const r = await api.post('/anexo-contrato', { trabajador_rut: trabajadorRut, ...form });
      setResultado(r.data.data);
      addToast('Anexo de contrato generado exitosamente', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al generar el anexo de contrato', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ArrowRightLeft size={20} />
        Anexo de Contrato por Traslado
      </h1>

      <div className="layout-split" style={{ maxWidth: 860 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Datos del Traslado
          </h3>

          <div className="form-group">
            <label className="form-label">Trabajador a Trasladar</label>
            <select className="form-select" value={trabajadorRut} onChange={handleTrabajador}>
              <option value="">Selecciona un trabajador...</option>
              {trabajadores.map(t => (
                <option key={t.trabajador_rut} value={t.trabajador_rut}>
                  {t.trabajador_nombres} ({t.trabajador_rut})
                </option>
              ))}
            </select>
          </div>

          {loadingInfo && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 16 }}>Cargando información contractual...</p>
          )}

          {infoContractual && !loadingInfo && (
            <div style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              padding: '10px 14px',
              marginBottom: 16
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <User size={13} color="var(--color-text-muted)" />
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Obra actual: {infoContractual.proyecto_actual?.proyecto_nombre_obra || 'Sin obra asignada'}
                </span>
              </div>
              {infoContractual.contrato_vigente ? (
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Sueldo base: ${parseFloat(infoContractual.contrato_vigente.contrato_laboral_sueldo_base).toLocaleString('es-CL')}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-warning)' }}>
                  Este trabajador no tiene un contrato vigente registrado
                </div>
              )}
            </div>
          )}

          {infoContractual && !loadingInfo && !mostrarDestino && (
            <button type="button" className="btn btn-secondary" onClick={() => setMostrarDestino(true)}>
              <ClipboardCheck size={15} />
              Generar Anexo por Traslado
            </button>
          )}

          {mostrarDestino && (
            <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
              <div className="form-group">
                <label className="form-label">Obra de Destino</label>
                <select
                  className="form-select"
                  value={form.proyecto_destino_codigo}
                  onChange={e => setForm(f => ({ ...f, proyecto_destino_codigo: e.target.value }))}
                >
                  <option value="">Selecciona un proyecto activo...</option>
                  {proyectosActivos.map(p => (
                    <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                      {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                      {!p.proyecto_ubicacion ? ' (sin dirección)' : ''}
                    </option>
                  ))}
                </select>
                {proyectosActivos.length === 0 && (
                  <span style={{ fontSize: 12, color: 'var(--color-warning)', display: 'block', marginTop: 6 }}>
                    No hay proyectos en estado "En Ejecución" disponibles como destino.
                  </span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Fecha de Inicio en la Nueva Obra</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.fecha_inicio}
                  onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                <Send size={15} />
                {loading ? 'Generando...' : 'Generar Documento'}
              </button>
            </form>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Anexo Generado
          </h3>

          {!resultado && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Completa el formulario y presiona "Generar Documento" para crear el anexo de traslado.
            </p>
          )}

          {resultado && (
            <div>
              <div style={{
                background: 'var(--color-bg-elevated)',
                border: '1px solid var(--color-green)',
                borderRadius: 6,
                padding: 16,
                marginBottom: 20
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <ArrowRightLeft size={18} color="var(--color-green)" />
                  <span style={{ fontWeight: 700, color: 'var(--color-green)', fontSize: 14 }}>
                    Anexo creado exitosamente
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Estado: </span>
                    <Badge value={resultado.documento?.documento_legal_estado} />
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Emisión: </span>
                    <span>{resultado.documento?.documento_legal_fecha_emision}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Trabajador
                </p>
                <div style={{ fontWeight: 600 }}>{resultado.trabajador?.trabajador_nombres}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{resultado.trabajador?.trabajador_rut}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                  Traslado
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 4 }}>
                  <MapPin size={13} color="var(--color-text-muted)" />
                  <span>Origen: {resultado.proyecto_origen?.proyecto_nombre_obra || 'Sin obra asignada'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <MapPin size={13} color="var(--color-green)" />
                  <span>Destino: {resultado.proyecto_destino?.proyecto_nombre_obra}</span>
                </div>
              </div>

              <a
                href={resultado.documento?.documento_legal_url_pdf}
                target="_blank"
                rel="noreferrer"
                download
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, textDecoration: 'none' }}
              >
                <Download size={15} />
                Descargar PDF
              </a>

              <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(212, 147, 10, 0.1)', border: '1px solid var(--color-warning)', borderRadius: 4, fontSize: 12, color: 'var(--color-warning)' }}>
                Documento pendiente de firma. Descárgalo, fírmalo y guárdalo.
              </div>
            </div>
          )}
        </div>
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
