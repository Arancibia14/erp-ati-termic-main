// Formato común de los documentos PDF de ATI Termic SpA, con la identidad del
// sistema: tipografía Barlow (la misma de la aplicación) y el azul y verde de
// la marca.
// Criterios de lectura: escala tipográfica 1,25 (10,5 / 13 / 20,5 pt), párrafos
// de unos 75 caracteres alineados a la izquierda, contraste de texto sobre 4,5:1,
// mucho espacio en blanco, un solo elemento destacado por documento, y el
// estado siempre escrito en palabras además del color (se lee igual en una
// fotocopia en blanco y negro).
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const EMPRESA = require('../config/empresa');
const { ZONA_HORARIA } = require('./fecha');

const RAIZ = path.join(__dirname, '..');
const LOGO = path.join(RAIZ, 'AtiTermicSinFondo.png');
const FUENTES = path.join(RAIZ, 'assets', 'fuentes');

// Barlow es libre (SIL Open Font License); si faltara un archivo se usa Helvetica
const TIPOS = {
  texto: ['Barlow-Regular.ttf', 'Helvetica'],
  medio: ['Barlow-Medium.ttf', 'Helvetica'],
  fuerte: ['Barlow-SemiBold.ttf', 'Helvetica-Bold'],
  cursiva: ['Barlow-Italic.ttf', 'Helvetica-Oblique'],
  titulo: ['BarlowSemiCondensed-SemiBold.ttf', 'Helvetica-Bold']
};

const C = {
  noche: '#152033',
  azul: '#2563EB',
  verde: '#5DB835',
  verdeTexto: '#2F6B1A',
  gris: '#4E5A6B',
  etiqueta: '#5B6B82',
  linea: '#E3E8EF',
  arcoAzul: '#D6E2FB',
  arcoVerde: '#D4EDC8',
  fondoAzul: '#F3F7FE',
  fondoVerde: '#F2F9EE',
  ambar: '#8A4B05',
  fondoAmbar: '#FEF6E7'
};
const ANCHO_PAGINA = 595.28;
const M = 62;
const ANCHO = ANCHO_PAGINA - 2 * M;
const TOPE = 106;
const BASE = 76;
const TEXTO = 10.5;
const INTERLINEA = 3.4;
// Medida de los párrafos: unos 75 caracteres por línea
const MEDIDA = Math.round(ANCHO * 0.86);

function aFecha(v) {
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T12:00:00Z`);
  return v instanceof Date ? v : new Date(v);
}
const fechaLarga = v => new Intl.DateTimeFormat('es-CL', { timeZone: ZONA_HORARIA, day: 'numeric', month: 'long', year: 'numeric' }).format(aFecha(v));
const fechaCorta = v => new Intl.DateTimeFormat('es-CL', { timeZone: ZONA_HORARIA, day: '2-digit', month: '2-digit', year: 'numeric' }).format(aFecha(v));
const fechaHora = v => new Intl.DateTimeFormat('es-CL', { timeZone: ZONA_HORARIA, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(aFecha(v)).replace(',', '');
const pesos = n => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`;

// "10 rollos", "2 pares", "1 unidad"; las abreviaturas (m, kg) no cambian
function cantidad(n, unidad) {
  const valor = Number(n);
  let u = (unidad || '').trim();
  if (valor !== 1 && /^[a-záéíóúñ]{3,}$/i.test(u) && !/s$/i.test(u)) u += /[aeiou]$/i.test(u) ? 's' : 'es';
  return `${valor.toLocaleString('es-CL')} ${u}`.trim();
}

function registrarFuentes(doc) {
  for (const [nombre, [archivo, respaldo]] of Object.entries(TIPOS)) {
    const ruta = path.join(FUENTES, archivo);
    doc.registerFont(nombre, fs.existsSync(ruta) ? ruta : respaldo);
  }
}

const limite = doc => doc.page.height - doc.page.margins.bottom;
function asegurar(doc, alto) {
  if (doc.y + alto > limite(doc)) doc.addPage();
}

// Etiqueta corta en mayúsculas con espaciado extra, como en la aplicación
function etiqueta(doc, texto, x, y, opciones = {}) {
  doc.font('medio').fontSize(6.8).fillColor(C.etiqueta)
    .text(texto.toUpperCase(), x, y, { characterSpacing: 0.7, lineBreak: false, ...opciones });
}

// Arcos concéntricos en la esquina superior derecha: un difusor de aire que
// recuerda las flechas circulares del logo
function decoracion(doc) {
  doc.save();
  const cx = ANCHO_PAGINA + 4, cy = -4;
  [44, 62, 80, 98, 116].forEach((r, i) => {
    doc.circle(cx, cy, r).lineWidth(i === 2 ? 4.5 : 1.1).strokeColor(i === 2 ? C.arcoVerde : C.arcoAzul).stroke();
  });
  doc.restore();
}

function encabezado(doc) {
  decoracion(doc);
  if (fs.existsSync(LOGO)) doc.image(LOGO, M - 5, 42, { width: 108 });
  doc.x = M;
  doc.y = TOPE;
}

function pie(doc, n, total) {
  const base = doc.page.margins.bottom;
  doc.page.margins.bottom = 0;
  const y = doc.page.height - 60;
  doc.moveTo(M, y).lineTo(M + ANCHO, y).lineWidth(0.5).strokeColor(C.linea).stroke();
  const detalle = [EMPRESA.rut && `RUT ${EMPRESA.rut}`, EMPRESA.giro].filter(Boolean).join('  ·  ');
  const contacto = [[EMPRESA.direccion, EMPRESA.ciudad].filter(Boolean).join(', '), EMPRESA.telefono, EMPRESA.correo].filter(Boolean).join('  ·  ');
  doc.font('fuerte').fontSize(7.5).fillColor(C.noche).text(EMPRESA.razonSocial, M, y + 11, { lineBreak: false, continued: !!detalle })
  if (detalle) doc.font('texto').fillColor(C.gris).text(`  ·  ${detalle}`, { lineBreak: false });
  doc.font('texto').fontSize(7.5).fillColor(C.gris).text(contacto, M, y + 23, { width: ANCHO - 50, lineBreak: false });
  doc.font('medio').fontSize(7.5).fillColor(C.etiqueta).text(`${n} / ${total}`, M + ANCHO - 50, y + 11, { width: 50, align: 'right', lineBreak: false });
  doc.page.margins.bottom = base;
}

// banda: [[etiqueta, valor, color?], ...] con el folio, la fecha y la referencia
function crearDocumento(filePath, { titulo, subtitulo, banda = [] }) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: TOPE, bottom: BASE, left: M, right: M },
    bufferPages: true,
    info: { Title: titulo, Author: EMPRESA.razonSocial, Creator: `Sistema ERP ${EMPRESA.razonSocial}`, Producer: `Sistema ERP ${EMPRESA.razonSocial}` }
  });
  registrarFuentes(doc);
  const stream = fs.createWriteStream(filePath);
  const listo = new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
    doc.on('error', reject);
  });
  doc.pipe(stream);
  encabezado(doc);
  doc.on('pageAdded', () => encabezado(doc));

  // Título y, debajo, los datos clave en una fila
  const y0 = TOPE + 8;
  doc.font('titulo').fontSize(20.5).fillColor(C.noche).text(titulo, M, y0, { width: ANCHO - 120, lineGap: 0 });
  if (subtitulo) doc.font('texto').fontSize(11).fillColor(C.gris).text(subtitulo, M, doc.y + 1, { width: ANCHO - 120 });
  if (banda.length) {
    const yb = doc.y + 12;
    const anchoCol = Math.min(150, ANCHO / banda.length);
    banda.forEach(([e, valor, color], i) => {
      const x = M + i * anchoCol;
      etiqueta(doc, e, x, yb, { width: anchoCol - 12 });
      doc.font('fuerte').fontSize(10).fillColor(color || C.noche)
        .text(String(valor), x, yb + 10, { width: anchoCol - 12, height: 14, ellipsis: true, features: ['tnum'] });
    });
    doc.y = yb + 30;
  }
  doc.moveTo(M, doc.y).lineTo(M + ANCHO, doc.y).lineWidth(0.5).strokeColor(C.linea).stroke();
  doc.x = M;
  doc.y += 16;
  return { doc, listo };
}

// "1. Datos de la obra": el número en azul y el título en Barlow Semi Condensed
function seccion(doc, texto) {
  asegurar(doc, 70);
  const y = doc.y + 8;
  const m = /^(\d+)\.\s+(.*)$/.exec(texto);
  if (m) {
    doc.font('titulo').fontSize(13).fillColor(C.azul).text(m[1], M, y, { lineBreak: false });
    doc.font('titulo').fontSize(13).fillColor(C.noche).text(m[2], M + 16, y, { width: ANCHO - 16 });
  } else {
    doc.font('titulo').fontSize(13).fillColor(C.noche).text(texto, M, y, { width: ANCHO });
  }
  doc.x = M;
  doc.y += 7;
}

// Pares etiqueta/valor en una o dos columnas, sin cajas: etiqueta pequeña sobre
// el valor y una línea fina bajo cada fila. Omite valores vacíos.
function datos(doc, filas, columnas = 2) {
  const celdas = filas.filter(f => f && f[1] !== undefined && f[1] !== null && String(f[1]).trim() !== '');
  const separacion = 26;
  for (let i = 0; i < celdas.length; i += columnas) {
    const grupo = celdas.slice(i, i + columnas);
    const anchoCol = grupo.length === 1 ? ANCHO : (ANCHO - separacion * (columnas - 1)) / columnas;
    const alto = Math.max(...grupo.map(([, v]) => doc.font('texto').fontSize(TEXTO).heightOfString(String(v), { width: anchoCol, lineGap: 1.5 }))) + 22;
    asegurar(doc, alto);
    const y = doc.y;
    grupo.forEach(([e, v], j) => {
      const x = M + j * (anchoCol + separacion);
      etiqueta(doc, e, x, y, { width: anchoCol });
      doc.font('texto').fontSize(TEXTO).fillColor(C.noche).text(String(v), x, y + 10, { width: anchoCol, lineGap: 1.5 });
      doc.moveTo(x, y + alto - 4).lineTo(x + anchoCol, y + alto - 4).lineWidth(0.5).strokeColor(C.linea).stroke();
    });
    doc.x = M;
    doc.y = y + alto + 5;
  }
  doc.y += 2;
}

// columnas: [{ titulo, ancho (fracción del ancho útil), alinear }]
function tabla(doc, columnas, filas, textoVacio) {
  if (!filas.length) {
    parrafo(doc, textoVacio, { color: C.gris, cursiva: true });
    return;
  }
  const anchos = columnas.map(c => c.ancho * ANCHO);
  const pad = 4;
  const cabecera = () => {
    asegurar(doc, 48);
    const y = doc.y + 2;
    let x = M;
    columnas.forEach((c, i) => {
      etiqueta(doc, c.titulo, x + pad, y, { width: anchos[i] - 2 * pad, align: c.alinear || 'left' });
      x += anchos[i];
    });
    doc.moveTo(M, y + 13).lineTo(M + ANCHO, y + 13).lineWidth(0.8).strokeColor(C.noche).stroke();
    doc.y = y + 13;
  };
  cabecera();
  filas.forEach(fila => {
    const h = Math.max(...fila.map((v, i) => doc.font('texto').fontSize(10).heightOfString(String(v), { width: anchos[i] - 2 * pad }))) + 15;
    if (doc.y + h > limite(doc)) {
      doc.addPage();
      cabecera();
    }
    const y = doc.y;
    let x = M;
    fila.forEach((v, i) => {
      const indice = i === 0 && columnas[0].alinear === 'center';
      doc.font(indice ? 'medio' : 'texto').fontSize(10).fillColor(indice ? C.etiqueta : C.noche)
        .text(String(v), x + pad, y + 7.5, { width: anchos[i] - 2 * pad, align: columnas[i].alinear || 'left', features: ['tnum'] });
      x += anchos[i];
    });
    doc.moveTo(M, y + h).lineTo(M + ANCHO, y + h).lineWidth(0.5).strokeColor(C.linea).stroke();
    doc.y = y + h;
  });
  doc.x = M;
  doc.y += 10;
}

function parrafo(doc, texto, { color = C.noche, cursiva = false, negrita = false, tamano = TEXTO } = {}) {
  asegurar(doc, 30);
  doc.font(negrita ? 'fuerte' : cursiva ? 'cursiva' : 'texto').fontSize(tamano).fillColor(color)
    .text(texto, M, doc.y, { width: MEDIDA, lineGap: INTERLINEA });
  doc.x = M;
  doc.y += 8;
}

// Texto con partes destacadas: [['texto normal'], ['texto destacado', true], ...]
function parrafoMixto(doc, partes) {
  asegurar(doc, 40);
  doc.fontSize(TEXTO).fillColor(C.noche);
  const y = doc.y;
  partes.forEach(([t, destacado], i) => {
    doc.font(destacado ? 'fuerte' : 'texto');
    const sigue = i < partes.length - 1;
    if (i === 0) doc.text(t, M, y, { width: MEDIDA, lineGap: INTERLINEA, continued: sigue });
    else doc.text(t, { continued: sigue });
  });
  doc.x = M;
  doc.y += 10;
}

// Constancia destacada sobre un fondo muy suave. tipo: 'ok', 'aviso' o 'info'
function recuadro(doc, texto, tipo = 'info') {
  const [fondo, color, punto] = { ok: [C.fondoVerde, C.verdeTexto, C.verde], aviso: [C.fondoAmbar, C.ambar, C.ambar], info: [C.fondoAzul, C.azul, C.azul] }[tipo];
  doc.font('medio').fontSize(10);
  const h = doc.heightOfString(texto, { width: ANCHO - 40 }) + 22;
  asegurar(doc, h + 10);
  const y = doc.y + 4;
  doc.roundedRect(M, y, ANCHO, h, 4).fill(fondo);
  doc.circle(M + 16, y + h / 2, 3).fill(punto);
  doc.font('medio').fontSize(10).fillColor(color).text(texto, M + 28, y + 11, { width: ANCHO - 40 });
  doc.x = M;
  doc.y = y + h + 12;
}

// bloques: [{ titulo, nombre, lineas: [], imagen (data URL de la firma) }]
function firmas(doc, bloques) {
  const lineas = Math.max(...bloques.map(b => (b.lineas || []).filter(Boolean).length));
  const alto = 96 + lineas * 11;
  asegurar(doc, alto + 12);
  const y = doc.y + 6;
  const w = 186;
  const separacion = bloques.length > 1 ? (ANCHO - bloques.length * w) / (bloques.length - 1) : 0;
  bloques.forEach((b, i) => {
    const x = bloques.length === 1 ? M + (ANCHO - w) / 2 : M + i * (w + separacion);
    if (b.titulo) etiqueta(doc, b.titulo, x, y, { width: w });
    const yl = y + 70;
    if (b.imagen) {
      try {
        const buf = Buffer.from(String(b.imagen).split(',')[1], 'base64');
        doc.image(buf, x, y + 10, { fit: [w - 20, 58], valign: 'bottom' });
      } catch (_) { /* firma ilegible: queda la línea */ }
    }
    doc.moveTo(x, yl).lineTo(x + w, yl).lineWidth(0.7).strokeColor(C.noche).stroke();
    doc.font('fuerte').fontSize(10).fillColor(C.noche).text(b.nombre || ' ', x, yl + 7, { width: w });
    doc.font('texto').fontSize(8.5).fillColor(C.gris);
    (b.lineas || []).filter(Boolean).forEach(l => doc.text(l, x, doc.y + 0.5, { width: w }));
  });
  doc.x = M;
  doc.y = y + alto;
}

// Firma de la empresa: el representante configurado en el .env. Si no hay uno,
// queda la línea en blanco para firmar en representación de la empresa.
function firmaEmpresa(titulo) {
  if (!EMPRESA.representante) return { titulo, nombre: ' ', lineas: [`p.p. ${EMPRESA.razonSocial}`] };
  return {
    titulo,
    nombre: EMPRESA.representante,
    lineas: [EMPRESA.representanteRut && `RUT ${EMPRESA.representanteRut}`, `${EMPRESA.representanteCargo} · ${EMPRESA.razonSocial}`]
  };
}

function nota(doc, texto) {
  asegurar(doc, 16);
  doc.font('texto').fontSize(7.5).fillColor(C.etiqueta).text(texto, M, doc.y + 2, { width: ANCHO });
  doc.x = M;
}

function finalizar(doc) {
  const paginas = doc.bufferedPageRange();
  for (let i = 0; i < paginas.count; i++) {
    doc.switchToPage(paginas.start + i);
    pie(doc, i + 1, paginas.count);
  }
  doc.end();
}

module.exports = {
  EMPRESA, COLORES: C, crearDocumento, seccion, datos, tabla, parrafo, parrafoMixto, recuadro, firmas, firmaEmpresa, nota, finalizar,
  fechaLarga, fechaCorta, fechaHora, pesos, cantidad
};
