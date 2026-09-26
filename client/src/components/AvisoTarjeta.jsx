import { Megaphone } from 'lucide-react';

const fechaCorta = f => (f ? f.split('-').reverse().join('-') : '');

// CU 46 - Tarjeta del aviso tal como se ve en Inicio. La usa también la vista
// previa del módulo "Avisos Internos", para que el admin vea el resultado real.
export default function AvisoTarjeta({ titulo, texto, imagen, fechaTermino }) {
  return (
    <article style={{
      display: 'flex', gap: 16, padding: 18, alignItems: 'flex-start', flexWrap: 'wrap',
      background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)',
      borderLeft: '4px solid var(--color-blue)', borderRadius: 16, boxShadow: 'var(--shadow-sm)', minWidth: 0
    }}>
      {imagen ? (
        <img src={imagen} alt="" style={{ width: 96, height: 96, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
      ) : (
        <span className="dash-tile-icon" style={{ flexShrink: 0 }}><Megaphone size={22} strokeWidth={1.7} /></span>
      )}
      <div style={{ flex: '1 1 200px', minWidth: 0 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, overflowWrap: 'anywhere' }}>
          {titulo || 'Título del aviso'}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'pre-line', overflowWrap: 'anywhere', margin: 0 }}>
          {texto || 'El texto del aviso aparecerá aquí.'}
        </p>
        {fechaTermino && (
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 10, marginBottom: 0 }}>
            Vigente hasta el {fechaCorta(fechaTermino)}
          </p>
        )}
      </div>
    </article>
  );
}
