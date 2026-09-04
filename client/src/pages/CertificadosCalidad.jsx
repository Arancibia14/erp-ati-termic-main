import { useState, useEffect } from 'react';
import { BadgeCheck, Upload, Download } from 'lucide-react';
import api from '../api/axios';
import Toast, { useToast } from '../components/Toast';
import Badge from '../components/Badge';

export default function CertificadosCalidad() {
  const { toasts, addToast, removeToast } = useToast();
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [numero, setNumero] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const cargar = () => {
    setLoading(true);
    api.get('/certificado-calidad/ingresos')
      .then(r => setIngresos(r.data.data))
      .catch(() => addToast('Error al cargar los ingresos de materiales', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrir = ing => {
    setSel(ing);
    setNumero('');
    setFechaEmision('');
    setArchivo(null);
  };

  const subir = () => {
    if (!numero.trim() || !archivo) {
      addToast('Ingresa el número de certificado y adjunta el archivo', 'error');
      return;
    }
    const fd = new FormData();
    fd.append('guia_despacho_id', sel.guia_despacho_id);
    fd.append('numero', numero.trim());
    fd.append('fecha_emision', fechaEmision);
    fd.append('archivo', archivo);
    setSubiendo(true);
    api.post('/certificado-calidad', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(r => {
        addToast(r.data.data?.mensaje || 'Certificado almacenado exitosamente', 'success');
        setSel(null);
        cargar();
      })
      .catch(err => addToast(err.response?.data?.error || 'Error al cargar el certificado', 'error'))
      .finally(() => setSubiendo(false));
  };

  return (
    <div className="page-container">
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <BadgeCheck size={20} />
        Certificados de Calidad
      </h1>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ingresos de materiales recientes
          </h3>
        </div>
        {loading ? (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--color-text-muted)' }}>Cargando...</p>
        ) : ingresos.length === 0 ? (
          <p style={{ padding: 20, fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            No hay ingresos de materiales registrados. Créalos en "Ingreso por Guía".
          </p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>N° Guía</th>
                  <th>Material</th>
                  <th>Proveedor</th>
                  <th>Cantidad</th>
                  <th>Fecha</th>
                  <th>Certificación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ingresos.map(i => (
                  <tr key={i.guia_despacho_id}>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{i.guia_despacho_numero}</td>
                    <td style={{ fontSize: 13 }}>{i.material_nombre}</td>
                    <td style={{ fontSize: 13 }}>{i.proveedor}</td>
                    <td style={{ fontSize: 13 }}>{i.cantidad}</td>
                    <td style={{ fontSize: 13 }}>{i.guia_despacho_fecha}</td>
                    <td><Badge value={i.certificado ? 'Certificado' : 'Sin certificar'} /></td>
                    <td>
                      {i.certificado ? (
                        <a href={i.certificado.url} target="_blank" rel="noreferrer"
                           className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: 12, textDecoration: 'none' }}>
                          <Download size={13} /> Ver ({i.certificado.numero})
                        </a>
                      ) : (
                        <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}
                                onClick={() => abrir(i)}>
                          <Upload size={13} /> Cargar certificado
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

      {sel && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}
          onClick={() => !subiendo && setSel(null)}
        >
          <div className="card" style={{ maxWidth: 480, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: 4, fontSize: 15, fontWeight: 700 }}>Cargar Certificado de Calidad</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Guía {sel.guia_despacho_numero} · {sel.material_nombre} · {sel.cantidad} u.
            </p>
            <div className="form-group">
              <label className="form-label">Número de certificado</label>
              <input className="form-input" value={numero} onChange={e => setNumero(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha de emisión</label>
              <input type="date" className="form-input" value={fechaEmision} onChange={e => setFechaEmision(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Archivo (PDF o imagen)</label>
              <input type="file" className="form-input" accept=".pdf,.jpg,.jpeg,.png"
                     onChange={e => setArchivo(e.target.files[0] || null)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={subir} disabled={subiendo}>
                <Upload size={14} />
                {subiendo ? 'Cargando...' : 'Cargar Certificado'}
              </button>
              <button className="btn btn-secondary" onClick={() => setSel(null)} disabled={subiendo}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
