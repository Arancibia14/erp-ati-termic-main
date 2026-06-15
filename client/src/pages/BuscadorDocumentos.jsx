import { useState } from 'react';
import { Search, Download, AlertTriangle, FileText, Eye, X } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

const TIPO_LABELS = {
  poliza: 'Póliza de Seguro',
  certificado: 'Certificado de Instalación',
  contrato: 'Contrato',
  otro: 'Otro'
};

export default function BuscadorDocumentos() {
  const { toasts, addToast, removeToast } = useToast();
  const [rut, setRut] = useState('');
  const [codigoObra, setCodigoObra] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscado, setBuscado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  const handleBuscar = async e => {
    e.preventDefault();
    if (!rut.trim() && !codigoObra.trim()) {
      addToast('Ingresa al menos un criterio de búsqueda', 'error'); return;
    }
    setLoading(true);
    setBuscado(false);
    try {
      const params = {};
      if (rut.trim()) params.rut = rut.trim();
      if (codigoObra.trim()) params.codigo_obra = codigoObra.trim();
      const r = await api.get('/documentos/buscar', { params });
      setResultados(r.data.data);
      setBuscado(true);
      if (r.data.data.length === 0) {
        addToast('No se encontraron documentos con ese criterio', 'warning');
      }
    } catch (err) {
      addToast(err.response?.data?.error || 'Error al buscar documentos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const limpiar = () => {
    setRut('');
    setCodigoObra('');
    setResultados([]);
    setBuscado(false);
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Search size={20} />
        Buscador de Documentos Legales
      </h1>

      <div className="card" style={{ maxWidth: 680, marginBottom: 24 }}>
        <form onSubmit={handleBuscar}>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
            Busca por RUT del trabajador, por código de obra, o por ambos simultáneamente.
          </p>
          <div className="form-grid-2">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">RUT Trabajador</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: 12345678-9"
                value={rut}
                onChange={e => setRut(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Código de Obra</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: OBR-2024-001"
                value={codigoObra}
                onChange={e => setCodigoObra(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Search size={15} />
              {loading ? 'Buscando...' : 'Buscar'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={limpiar}>
              Limpiar
            </button>
          </div>
        </form>
      </div>

      {buscado && (
        <div className="card" style={{ maxWidth: 900, padding: 0 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resultados ({resultados.length})
            </h3>
          </div>

          {resultados.length === 0 ? (
            <p style={{ padding: 20, color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 13 }}>
              No se encontraron documentos vinculados a ese criterio.
            </p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Trabajador RUT</th>
                    <th>Proyecto</th>
                    <th>Emisión</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {resultados.map(doc => (
                    <tr key={doc.documento_legal_id} style={{ background: previewDoc?.documento_legal_id === doc.documento_legal_id ? 'var(--color-bg-elevated)' : undefined }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FileText size={13} color="var(--color-text-muted)" />
                          <span style={{ fontSize: 13 }}>
                            {TIPO_LABELS[doc.documento_legal_tipo] || doc.documento_legal_tipo}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                        {doc.trabajador_rut || '—'}
                      </td>
                      <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                        {doc.proyecto_codigo_correlativo || '—'}
                      </td>
                      <td style={{ fontSize: 13 }}>{doc.documento_legal_fecha_emision}</td>
                      <td style={{ fontSize: 13, color: doc.documento_legal_fecha_vencimiento ? 'inherit' : 'var(--color-text-muted)' }}>
                        {doc.documento_legal_fecha_vencimiento || '—'}
                      </td>
                      <td><Badge value={doc.documento_legal_estado} /></td>
                      <td>
                        {doc.archivo_disponible ? (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn btn-secondary"
                              style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                              onClick={() => setPreviewDoc(previewDoc?.documento_legal_id === doc.documento_legal_id ? null : doc)}
                            >
                              <Eye size={12} />
                              {previewDoc?.documento_legal_id === doc.documento_legal_id ? 'Cerrar' : 'Vista Previa'}
                            </button>
                            <a
                              href={doc.documento_legal_url_pdf}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ height: 30, padding: '0 10px', fontSize: 12 }}
                            >
                              <Download size={12} />
                              Descargar
                            </a>
                          </div>
                        ) : (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-danger)' }}>
                            <AlertTriangle size={12} />
                            No disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Panel de vista previa PDF */}
          {previewDoc && (
            <div style={{ borderTop: '1px solid var(--color-border)', padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Eye size={14} />
                  Vista Previa — {TIPO_LABELS[previewDoc.documento_legal_tipo] || previewDoc.documento_legal_tipo}
                  {previewDoc.proyecto_codigo_correlativo && ` · ${previewDoc.proyecto_codigo_correlativo}`}
                </div>
                <button
                  className="btn btn-secondary"
                  style={{ height: 28, padding: '0 10px', fontSize: 12 }}
                  onClick={() => setPreviewDoc(null)}
                >
                  <X size={12} /> Cerrar
                </button>
              </div>
              <iframe
                src={previewDoc.documento_legal_url_pdf}
                title="Vista previa del documento"
                style={{
                  width: '100%',
                  height: 560,
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  background: '#fff'
                }}
              />
            </div>
          )}
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
