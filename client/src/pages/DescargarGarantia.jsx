import { useState } from 'react';
import { ShieldCheck, Search, Download, AlertTriangle, X } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';

const FILTROS_VACIOS = { proyecto: '', modelo: '', numero_serie: '' };

export default function DescargarGarantia() {
  const { toasts, addToast, removeToast } = useToast();
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [resultados, setResultados] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirmar, setConfirmar] = useState(null);
  const [descargando, setDescargando] = useState(false);

  const buscar = () => {
    setLoading(true);
    api.get('/garantia', { params: filtros })
      .then(r => setResultados(r.data.data))
      .catch(() => addToast('Error al buscar garantías', 'error'))
      .finally(() => setLoading(false));
  };

  const limpiar = () => {
    setFiltros(FILTROS_VACIOS);
    setResultados(null);
  };

  // CU43 Paso 5/6 - Confirmar y descargar
  const confirmarDescarga = () => {
    setDescargando(true);
    api.post(`/garantia/${confirmar.equipo_hvac_numero_serie}/descargar`)
      .then(r => {
        window.open(r.data.data.url, '_blank');
        addToast('Descarga finalizada', 'success');
        setConfirmar(null);
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al descargar el certificado', 'error'))
      .finally(() => setDescargando(false));
  };

  const hayFiltrosActivos = Object.values(filtros).some(v => v);

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShieldCheck size={20} />
        Consulta de Garantías
      </h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="form-grid-2" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Proyecto</label>
            <input
              className="form-input"
              placeholder="Ej. PROY-2024-001"
              value={filtros.proyecto}
              onChange={e => setFiltros(f => ({ ...f, proyecto: e.target.value }))}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Modelo</label>
            <input
              className="form-input"
              placeholder="Ej. Split Muro 12000 BTU"
              value={filtros.modelo}
              onChange={e => setFiltros(f => ({ ...f, modelo: e.target.value }))}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Número de Serie</label>
          <input
            className="form-input"
            placeholder="Ej. SN-00234"
            value={filtros.numero_serie}
            onChange={e => setFiltros(f => ({ ...f, numero_serie: e.target.value }))}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={buscar} disabled={loading}>
            <Search size={15} />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
          {hayFiltrosActivos && (
            <button className="btn btn-secondary" onClick={limpiar}>
              <X size={15} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {resultados && (
        <div className="card" style={{ padding: 0 }}>
          {resultados.length === 0 ? (
            <div className="estado-vacio">
              <p>No se encontraron equipos que coincidan con los criterios de búsqueda.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>N° Serie</th>
                    <th>Modelo</th>
                    <th>Proyecto</th>
                    <th>Estado de Garantía</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map(eq => (
                    <tr key={eq.equipo_hvac_numero_serie}>
                      <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{eq.equipo_hvac_numero_serie}</td>
                      <td style={{ fontSize: 13 }}>{eq.modelo_hvac_nombre}</td>
                      <td style={{ fontSize: 13 }}>{eq.proyecto_nombre_obra || eq.proyecto_codigo_correlativo}</td>
                      <td>
                        {!eq.garantia ? (
                          // Excepción 1 - Garantía inexistente
                          <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                            No cuenta con certificado cargado
                          </span>
                        ) : eq.garantia.vigente ? (
                          <span style={{ fontSize: 12, color: 'var(--color-green)', fontWeight: 600 }}>
                            Vigente hasta {eq.garantia.fecha_vencimiento}
                          </span>
                        ) : (
                          // Excepción 2 - Garantía vencida
                          <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <AlertTriangle size={13} />
                            VENCIDA desde {eq.garantia.fecha_vencimiento}
                          </span>
                        )}
                      </td>
                      <td>
                        {eq.garantia && (
                          <button
                            className="btn btn-secondary"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => setConfirmar(eq)}
                          >
                            <Download size={12} />
                            Descargar Certificado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmación de descarga (paso explícito de la ficha) */}
      {confirmar && (
        <div
          onClick={() => !descargando && setConfirmar(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
          }}
        >
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, padding: 24 }}>
            <h2 style={{ fontSize: 16, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={16} />
              Confirmar Descarga
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              ¿Descargar el certificado de garantía del equipo <strong>{confirmar.equipo_hvac_numero_serie}</strong> ({confirmar.modelo_hvac_nombre})?
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setConfirmar(null)} disabled={descargando}>Cancelar</button>
              <button className="btn btn-primary" onClick={confirmarDescarga} disabled={descargando}>
                {descargando ? 'Descargando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
