// Datos de la empresa que aparecen en los documentos PDF.
// Se configuran en el .env; los campos vacíos no se imprimen.
module.exports = {
  razonSocial: process.env.EMPRESA_RAZON_SOCIAL || 'ATI Termic SpA',
  rut: process.env.EMPRESA_RUT || '',
  giro: process.env.EMPRESA_GIRO || 'Ingeniería en climatización, ventilación y control centralizado',
  direccion: process.env.EMPRESA_DIRECCION || 'Almirante Pastene 185, Providencia',
  ciudad: process.env.EMPRESA_CIUDAD || 'Santiago',
  telefono: process.env.EMPRESA_TELEFONO || '',
  correo: process.env.EMPRESA_CORREO || '',
  representante: process.env.EMPRESA_REPRESENTANTE || '',
  representanteCargo: process.env.EMPRESA_REPRESENTANTE_CARGO || 'Representante legal',
  representanteRut: process.env.EMPRESA_REPRESENTANTE_RUT || ''
};
