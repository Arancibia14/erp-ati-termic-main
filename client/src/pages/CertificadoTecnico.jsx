import { useState, useEffect } from 'react';
import { Award, FileCheck, Wrench, Download } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

export default function CertificadoTecnico() {
  const { toasts, addToast, removeToast } = useToast();
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [form, setForm] = useState({
    proyecto_codigo_correlativo: '',
    tecnico_nombre: '',
    fecha_instalacion: '',
    observaciones: ''
  });

  useEffect(() => {
    api.get('/portafolio')
      .then(r => setProyectos(r.data.data))
      .catch(() => addToast('Error al cargar proyectos', 'error'));
  }, []);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.proyecto_codigo_correlativo) {
      addToast('Selecciona un proyecto', 'error'); return;
    }
    if (!form.tecnico_nombre.trim() || !form.fecha_instalacion) {
      addToast('Nombre del técnico y fecha de instalación son obligatorios', 'error'); return;
    }

    setLoading(true);
    setResultado(null);
    try {
      const r = await api.post('/certificado', {
        proyecto_codigo_correlativo: form.proyecto_codigo_correlativo,
        datos_certificado: {
          tecnico_nombre: form.tecnico_nombre,
          fecha_instalacion: form.fecha_instalacion,
          observaciones: form.observaciones
        }
      });
      setResultado(r.data.data);
      addToast('Certificado generado — pendiente de firma', 'success');
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al generar certificado', 'error');
    } finally {
      setLoading(false);
    }
  };

  const proyectoSeleccionado = proyectos.find(p => p.proyecto_codigo_correlativo === form.proyecto_codigo_correlativo);

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Award size={20} />
        Certificado de Instalación Técnica
      </h1>

      <div className="layout-split" style={{ maxWidth: 860 }}>
        {/* Formulario */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Datos del Certificado
          </h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Proyecto Finalizado</label>
              <select
                className="form-select"
                value={form.proyecto_codigo_correlativo}
                onChange={e => {
                  setForm(f => ({ ...f, proyecto_codigo_correlativo: e.target.value }));
                  setResultado(null);
                }}
              >
                <option value="">Selecciona un proyecto...</option>
                {proyectos
                  .filter(p => p.EstadoProyecto?.estado_proyecto_nombre === 'Finalizado')
                  .map(p => (
                    <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                      {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                    </option>
                  ))
                }
              </select>
              {proyectos.length > 0 && proyectos.filter(p => p.EstadoProyecto?.estado_proyecto_nombre === 'Finalizado').length === 0 && (
                <span style={{ fontSize: 12, color: 'var(--color-warning)', display: 'block', marginTop: 6 }}>
                  No hay proyectos en estado "Finalizado". Cambia el estado en Configuración.
                </span>
              )}
            </div>

            {proyectoSeleccionado && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Estado:</span>
                <Badge value={proyectoSeleccionado.EstadoProyecto?.estado_proyecto_nombre} />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nombre del Técnico Responsable</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre completo del técnico..."
                value={form.tecnico_nombre}
                onChange={e => setForm(f => ({ ...f, tecnico_nombre: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de Instalación</label>
              <input
                type="date"
                className="form-input"
                value={form.fecha_instalacion}
                onChange={e => setForm(f => ({ ...f, fecha_instalacion: e.target.value }))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Observaciones Técnicas (opcional)</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Condiciones de instalación, materiales utilizados, etc."
                value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              <FileCheck size={15} />
              {loading ? 'Generando...' : 'Generar Certificado'}
            </button>
          </form>
        </div>

        {/* Panel de resultado */}
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Certificado Generado
          </h3>

          {!resultado && (
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              Completa el formulario y presiona "Generar Certificado" para crear el documento.
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
                  <Award size={18} color="var(--color-green)" />
                  <span style={{ fontWeight: 700, color: 'var(--color-green)', fontSize: 14 }}>
                    Certificado creado exitosamente
                  </span>
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Estado: </span>
                    <Badge value={resultado.certificado?.documento_legal_estado} />
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--color-text-muted)' }}>Emisión: </span>
                    <span>{resultado.certificado?.documento_legal_fecha_emision}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Proyecto
                </p>
                <div style={{ fontWeight: 600 }}>{resultado.proyecto?.proyecto_nombre_obra}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  {resultado.proyecto?.proyecto_codigo_correlativo}
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                  Técnico Responsable
                </p>
                <div style={{ fontWeight: 600 }}>{resultado.datos_certificado?.tecnico_nombre}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Instalación: {resultado.datos_certificado?.fecha_instalacion}
                </div>
              </div>

              {resultado.equipos?.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                    Equipos Instalados ({resultado.equipos.length})
                  </p>
                  {resultado.equipos.map((eq, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '8px 0',
                        borderBottom: i < resultado.equipos.length - 1 ? '1px solid var(--color-border)' : 'none',
                        fontSize: 13
                      }}
                    >
                      <Wrench size={13} color="var(--color-text-muted)" />
                      <span>{eq.equipo_hvac_modelo || eq.equipo_hvac_id}</span>
                    </div>
                  ))}
                </div>
              )}

              <a
                href={resultado.certificado?.documento_legal_url_pdf}
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
