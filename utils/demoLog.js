// Log de demo: muestra en la terminal del backend cada petición HTTP y las
// consultas SQL que ejecuta, agrupadas bajo la petición que las originó.
// Sirve para mostrar en vivo el flujo Vista → endpoint → controlador → BD de
// los diagramas de secuencia. Se activa con `npm run demo` (flag --demo-log)
// o con DEMO_LOG=true en el .env; apagado, no imprime nada nuevo.
const { AsyncLocalStorage } = require('async_hooks');

const activo = process.env.DEMO_LOG === 'true' || process.argv.includes('--demo-log');
const contexto = new AsyncLocalStorage();

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  rojo: '\x1b[31m', verde: '\x1b[32m', amarillo: '\x1b[33m',
  azul: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', gris: '\x1b[90m'
};

const COLOR_METODO = { GET: C.azul, POST: C.verde, PUT: C.amarillo, PATCH: C.amarillo, DELETE: C.rojo };
const CAMPOS_SENSIBLES = /contrase|password|clave|token|secret/i;
const MAX_SQL = 220;
const MAX_VALOR = 40;

function hora() {
  return new Date().toLocaleTimeString('es-CL', { hour12: false });
}

// La validación de sesión del middleware (CU05) consulta y actualiza la tabla
// `sesion` en cada petición; se omite para que se vea el flujo propio del CU.
function esRuidoDeSesion(sql) {
  return /`sesion`/i.test(sql) && /(SELECT|UPDATE)\s/i.test(sql.replace(/^Execut(?:ing|ed) \([^)]*\):\s*/, '').slice(0, 7));
}

function compactarSql(sql) {
  let s = sql.replace(/^Execut(?:ing|ed) \([^)]*\):\s*/, '').replace(/\s+/g, ' ').trim();
  s = s.replace(/^SELECT\s+.+?\s+FROM\s+/i, 'SELECT … FROM ');
  return s.length > MAX_SQL ? `${s.slice(0, MAX_SQL)}…` : s;
}

function colorSql(sql) {
  const verbo = sql.split(' ')[0].toUpperCase();
  if (verbo === 'SELECT') return C.cyan;
  if (verbo === 'INSERT') return C.verde;
  if (verbo === 'UPDATE') return C.amarillo;
  if (verbo === 'DELETE') return C.rojo;
  return C.magenta;
}

function resumirDatos(body) {
  if (!body || typeof body !== 'object') return null;
  const partes = Object.entries(body).map(([k, v]) => {
    if (CAMPOS_SENSIBLES.test(k)) return `${k}: ****`;
    let valor = typeof v === 'object' ? JSON.stringify(v) : String(v);
    if (valor.length > MAX_VALOR) valor = `${valor.slice(0, MAX_VALOR)}…`;
    return `${k}: ${valor}`;
  });
  return partes.length ? `{ ${partes.join(', ')} }` : null;
}

function resumirArchivos(req) {
  const archivos = req.file ? [req.file] : Array.isArray(req.files) ? req.files : Object.values(req.files || {}).flat();
  return archivos.length ? archivos.map(f => f.originalname).join(', ') : null;
}

// Función `logging` de Sequelize. Solo imprime consultas hechas dentro de una
// petición, así no aparecen las migraciones del arranque.
function logSql(sql, ms) {
  const ctx = contexto.getStore();
  if (!ctx || esRuidoDeSesion(sql)) return;
  ctx.consultas++;
  const s = compactarSql(sql);
  const tiempo = typeof ms === 'number' ? ` ${C.gris}(${ms} ms)${C.reset}` : '';
  console.log(`   ${C.gris}│${C.reset} ${colorSql(s)}${s}${C.reset}${tiempo}`);
}

function middleware(req, res, next) {
  if (!activo) return next();

  const inicio = Date.now();
  const color = COLOR_METODO[req.method] || C.reset;
  const ruta = req.originalUrl.split('?')[0];
  const query = req.originalUrl.includes('?') ? `${C.gris}?${req.originalUrl.split('?')[1]}${C.reset}` : '';
  console.log(`\n${C.gris}${hora()}${C.reset} ${C.bold}${color}${req.method}${C.reset} ${C.bold}${ruta}${C.reset}${query}`);

  // Guarda el mensaje de error de la respuesta para mostrar la excepción del CU
  const jsonOriginal = res.json.bind(res);
  res.json = (cuerpo) => {
    if (cuerpo && typeof cuerpo === 'object') res.locals.demoError = cuerpo.error;
    return jsonOriginal(cuerpo);
  };

  const ctx = { consultas: 0 };

  res.on('finish', () => {
    const datos = ['POST', 'PUT', 'PATCH'].includes(req.method) ? resumirDatos(req.body) : null;
    const archivos = resumirArchivos(req);
    if (datos) console.log(`   ${C.gris}│ datos:${C.reset} ${datos}`);
    if (archivos) console.log(`   ${C.gris}│ archivo:${C.reset} ${archivos}`);

    const st = res.statusCode;
    const colorSt = st >= 500 ? C.rojo : st >= 400 ? C.amarillo : C.verde;
    const usuario = req.user ? `${req.user.nombre || req.user.rut} (${req.user.rol})` : 'sin sesión';
    const error = st >= 400 && res.locals.demoError ? `  ${colorSt}→ ${res.locals.demoError}${C.reset}` : '';
    console.log(
      `   ${C.gris}└${C.reset} ${colorSt}${C.bold}${st}${C.reset} ${C.gris}·${C.reset} ${Date.now() - inicio} ms ` +
      `${C.gris}·${C.reset} ${ctx.consultas} consulta(s) SQL ${C.gris}·${C.reset} ${usuario}${error}`
    );
  });

  contexto.run(ctx, next);
}

function anunciar() {
  if (activo) {
    console.log(`${C.bold}${C.magenta}[DEMO LOG]${C.reset} activo: se muestran las peticiones HTTP y sus consultas SQL.`);
  }
}

module.exports = { activo, middleware, logSql, anunciar };
