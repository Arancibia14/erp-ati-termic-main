import { useState, useEffect, useRef, useCallback } from 'react';
import { ClipboardList, PenTool, FileText, Download, Eraser, CheckCircle } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

function SignaturePad({ onReady }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasStroke = useRef(false);
  const last = useRef({ x: 0, y: 0 });

  const pos = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - rect.left, y: t.clientY - rect.top };
  };

  const start = e => {
    e.preventDefault();
    drawing.current = true;
    last.current = pos(e);
  };

  const move = e => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const p = pos(e);
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    hasStroke.current = true;
  };

  const end = () => { drawing.current = false; };

  const limpiar = useCallback(() => {
    const c = canvasRef.current;
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
    hasStroke.current = false;
  }, []);

  useEffect(() => {
    onReady({
      isEmpty: () => !hasStroke.current,
      toDataURL: () => canvasRef.current.toDataURL('image/png'),
      clear: limpiar
    });
  }, [onReady, limpiar]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={460}
        height={180}
        style={{
          border: '1px dashed var(--color-border)',
          borderRadius: 6,
          background: '#fff',
          touchAction: 'none',
          width: '100%',
          maxWidth: 460,
          cursor: 'crosshair'
        }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button type="button" className="btn btn-secondary" style={{ marginTop: 8 }} onClick={limpiar}>
        <Eraser size={14} /> Limpiar
      </button>
    </div>
  );
}

export default function HistorialEntregasEpp() {
  const { toasts, addToast, removeToast } = useToast();
  const [trabajadores, setTrabajadores] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [trabajadorRut, setTrabajadorRut] = useState('');
  const [proyectoCodigo, setProyectoCodigo] = useState('');
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalLote, setModalLote] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const padRef = useRef(null);

  useEffect(() => {
    api.get('/entrega-epp/trabajadores')
      .then(r => setTrabajadores(r.data.data))
      .catch(() => addToast('Error al cargar trabajadores', 'error'));
    api.get('/portafolio')
      .then(r => setProyectos(r.data.data))
      .catch(() => setProyectos([]));
  }, []);

  const cargarHistorial = () => {
    setLoading(true);
    const params = {};
    if (trabajadorRut) params.trabajador_rut = trabajadorRut;
    else if (proyectoCodigo) params.proyecto_codigo = proyectoCodigo;
    api.get('/entrega-epp/historial', { params })
      .then(r => setLotes(r.data.data))
      .catch(() => addToast('Error al cargar el historial de entregas', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargarHistorial(); }, [trabajadorRut, proyectoCodigo]);

  const validar = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      addToast('El panel de firma está vacío. Registra el trazo antes de validar.', 'error');
      return;
    }
    setEnviando(true);
    try {
      const r = await api.post(`/entrega-epp/${encodeURIComponent(modalLote.lote)}/validar`, {
        firma: padRef.current.toDataURL()
      });
      addToast(r.data.data?.mensaje || 'Entrega Registrada con Éxito', 'success');
      setModalLote(null);
      cargarHistorial();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al validar la entrega', 'error');
    } finally {
      setEnviando(false);
    }
  };

  const generarComprobante = async lote => {
    try {
      const r = await api.post(`/entrega-epp/${encodeURIComponent(lote.lote)}/comprobante`);
      addToast('Comprobante generado correctamente', 'success');
      window.open(r.data.data.url_pdf, '_blank');
      cargarHistorial();
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al generar el comprobante. Intenta nuevamente.', 'error');
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ClipboardList size={20} />
        Historial de Entregas de EPP
      </h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="form-group" style={{ minWidth: 240, marginBottom: 0 }}>
            <label className="form-label">Filtrar por Trabajador</label>
            <select
              className="form-select"
              value={trabajadorRut}
              onChange={e => { setTrabajadorRut(e.target.value); setProyectoCodigo(''); }}
            >
              <option value="">Todos</option>
              {trabajadores.map(t => (
                <option key={t.trabajador_rut} value={t.trabajador_rut}>
                  {t.trabajador_nombres} ({t.trabajador_rut})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ minWidth: 240, marginBottom: 0 }}>
            <label className="form-label">Filtrar por Obra</label>
            <select
              className="form-select"
              value={proyectoCodigo}
              onChange={e => { setProyectoCodigo(e.target.value); setTrabajadorRut(''); }}
            >
              <option value="">Todas</option>
              {proyectos.map(p => (
                <option key={p.proyecto_codigo_correlativo} value={p.proyecto_codigo_correlativo}>
                  {p.proyecto_codigo_correlativo} — {p.proyecto_nombre_obra}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando...</p>
        ) : lotes.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            No hay entregas de EPP registradas. Créalas en "Entrega de EPP".
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Trabajador</th>
                  <th>Artículos</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lotes.map(l => (
                  <tr key={l.lote}>
                    <td style={{ fontSize: 13 }}>{l.fecha}</td>
                    <td style={{ fontSize: 13 }}>{l.trabajador_nombre}</td>
                    <td style={{ fontSize: 12 }}>
                      {l.items.map((it, i) => (
                        <div key={i}>{it.cantidad}× {it.material_nombre}</div>
                      ))}
                    </td>
                    <td><Badge value={l.estado} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {l.estado === 'Pendiente' && (
                          <button
                            className="btn btn-primary"
                            style={{ height: 30, fontSize: 12 }}
                            onClick={() => { setModalLote(l); }}
                          >
                            <PenTool size={13} /> Finalizar y Validar
                          </button>
                        )}
                        {l.estado === 'Validado' && (
                          <button
                            className="btn btn-secondary"
                            style={{ height: 30, fontSize: 12 }}
                            onClick={() => generarComprobante(l)}
                          >
                            <FileText size={13} /> Generar Comprobante
                          </button>
                        )}
                        {l.url_comprobante && (
                          <a
                            href={l.url_comprobante}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            style={{ height: 30, fontSize: 12, textDecoration: 'none' }}
                          >
                            <Download size={13} /> Ver / Descargar PDF
                          </a>
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

      {modalLote && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16
          }}
          onClick={() => !enviando && setModalLote(null)}
        >
          <div className="card" style={{ maxWidth: 520, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 6, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <PenTool size={16} /> Firma del Receptor
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
              {modalLote.trabajador_nombre} — {modalLote.items.map(i => `${i.cantidad}× ${i.material_nombre}`).join(', ')}
            </p>

            <SignaturePad onReady={padApi => { padRef.current = padApi; }} />

            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="btn btn-primary" onClick={validar} disabled={enviando}>
                <CheckCircle size={15} />
                {enviando ? 'Validando...' : 'Finalizar y Validar'}
              </button>
              <button className="btn btn-secondary" onClick={() => setModalLote(null)} disabled={enviando}>
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
