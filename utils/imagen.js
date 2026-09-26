// Lee el tipo real y las dimensiones de una imagen JPG, PNG o WEBP desde sus
// bytes, sin librerías externas. Devuelve null si el contenido no es ninguna
// de esas tres, aunque la extensión diga lo contrario.
function leerImagen(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 30) return null;

  // PNG: firma de 8 bytes y el bloque IHDR con ancho y alto
  if (buf.readUInt32BE(0) === 0x89504e47 && buf.toString('ascii', 12, 16) === 'IHDR') {
    return { tipo: 'png', ancho: buf.readUInt32BE(16), alto: buf.readUInt32BE(20) };
  }

  // JPEG: se recorren los marcadores hasta el SOF, que trae alto y ancho
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) { i++; continue; }
      const marcador = buf[i + 1];
      if (marcador === 0xff) { i++; continue; }
      if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
        return { tipo: 'jpeg', alto: buf.readUInt16BE(i + 5), ancho: buf.readUInt16BE(i + 7) };
      }
      if (marcador === 0xd8 || marcador === 0x01 || (marcador >= 0xd0 && marcador <= 0xd7)) { i += 2; continue; }
      i += 2 + buf.readUInt16BE(i + 2);
    }
    return null;
  }

  // WEBP: contenedor RIFF con uno de sus tres formatos (con pérdida, sin pérdida o extendido)
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const formato = buf.toString('ascii', 12, 16);
    if (formato === 'VP8 ') return { tipo: 'webp', ancho: buf.readUInt16LE(26) & 0x3fff, alto: buf.readUInt16LE(28) & 0x3fff };
    if (formato === 'VP8L') {
      const b = buf.readUInt32LE(21);
      return { tipo: 'webp', ancho: (b & 0x3fff) + 1, alto: ((b >> 14) & 0x3fff) + 1 };
    }
    if (formato === 'VP8X') return { tipo: 'webp', ancho: buf.readUIntLE(24, 3) + 1, alto: buf.readUIntLE(27, 3) + 1 };
  }
  return null;
}

module.exports = { leerImagen };
