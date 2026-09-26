const TONOS = {
  'En Ejecución': 'green',
  'Planificación': 'amber',
  'Finalizado': 'blue',
  'Detenido': 'red',
  'pendiente': 'amber',
  'Pendiente': 'amber',
  'aprobado': 'green',
  'Aprobado': 'green',
  'rechazado': 'red',
  'Rechazado': 'red',
  're_captura': 'blue',
  'leve': 'blue',
  'grave': 'amber',
  'fatal': 'red',
  'Vigente': 'green',
  'Activo': 'green',
  'Inactivo': 'gray',
  'PendienteFirma': 'amber',
  'Recibido': 'green',
  'Facturado': 'blue',
  'Emitida': 'blue',
  'Aprobada': 'green',
  'Reunión': 'blue',
  'Correo': 'purple',
  'Llamada': 'teal',
  'Acta': 'blue',
  'Visita a Terreno': 'orange',
  'Otro': 'gray',
  // CU 46 - Avisos internos
  'Borrador': 'gray',
  'Listo para publicar': 'blue',
  'Programado': 'amber',
  'Vencido': 'red',
  'No visible': 'gray'
};

export default function Badge({ value }) {
  const color = `var(--tone-${TONOS[value] || 'gray'})`;
  return (
    <span style={{
      display: 'inline-block',
      background: `color-mix(in srgb, ${color} 16%, transparent)`,
      color,
      border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
      borderRadius: '6px',
      padding: '3px 9px',
      fontSize: '12px',
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      whiteSpace: 'nowrap'
    }}>
      {value}
    </span>
  );
}
