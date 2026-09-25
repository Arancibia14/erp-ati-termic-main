// CU48 - Plantillas de correo: qué eventos existen, qué etiquetas dinámicas
// acepta cada uno, y las funciones para insertarlas y validar el HTML.

// Cada evento es un tipo de correo automático que el sistema sabe enviar.
// Hoy solo existe el de CU06 (recuperación de credenciales); agregar uno nuevo
// es agregar una entrada aquí y sembrar su fila por defecto en index.js.
const EVENTOS_CORREO = [
  {
    evento: 'recuperacion_credenciales',
    nombre: 'Recuperación de credenciales',
    etiquetas: ['nombre', 'token', 'link', 'minutos']
  }
];

const PLANTILLAS_POR_DEFECTO = {
  recuperacion_credenciales: {
    nombre: 'Recuperación de credenciales',
    asunto: 'Recuperación de credenciales — ATI Termic',
    html: '<p>Hola {{nombre}}.</p><p>Tu token de recuperación es:</p><p style="font-size:22px;font-weight:700;letter-spacing:2px">{{token}}</p><p><a href="{{link}}">Haz clic aquí para restablecer tu contraseña</a></p><p>Este token vence en {{minutos}} minutos. Si no solicitaste este cambio, ignora este correo.</p>',
    texto: 'Hola {{nombre}}.\n\nTu token de recuperación es: {{token}}\n\nPara restablecer tu contraseña, entra a: {{link}}\n\nEste token vence en {{minutos}} minutos. Si no solicitaste este cambio, ignora este correo.'
  }
};

const ETIQUETA_REGEX = /\{\{\s*(\w+)\s*\}\}/g;

function etiquetasDe(evento) {
  const def = EVENTOS_CORREO.find(e => e.evento === evento);
  return def ? def.etiquetas : [];
}

function extraerEtiquetas(texto) {
  if (!texto) return [];
  const encontradas = new Set();
  let m;
  const regex = new RegExp(ETIQUETA_REGEX);
  while ((m = regex.exec(texto))) encontradas.add(m[1]);
  return Array.from(encontradas);
}

// Sustituye {{clave}} por su valor. Si la clave no viene en `valores`, la deja igual.
function aplicarPlantilla(contenido, valores) {
  if (!contenido) return contenido;
  return contenido.replace(ETIQUETA_REGEX, (m, clave) => (clave in valores ? String(valores[clave]) : m));
}

// Verifica que cada etiqueta de apertura tenga su cierre correspondiente.
// No es un parser HTML completo, pero detecta el caso que pide la ficha:
// etiquetas mal cerradas o que no calzan.
const ETIQUETAS_VACIAS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function htmlBalanceado(html) {
  const regex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
  const pila = [];
  let m;
  while ((m = regex.exec(html))) {
    const etiquetaCompleta = m[0];
    const nombre = m[1].toLowerCase();
    if (ETIQUETAS_VACIAS.has(nombre) || etiquetaCompleta.endsWith('/>')) continue;
    if (etiquetaCompleta.startsWith('</')) {
      if (pila.length === 0 || pila[pila.length - 1] !== nombre) return false;
      pila.pop();
    } else {
      pila.push(nombre);
    }
  }
  return pila.length === 0;
}

module.exports = { EVENTOS_CORREO, PLANTILLAS_POR_DEFECTO, etiquetasDe, extraerEtiquetas, aplicarPlantilla, htmlBalanceado };
