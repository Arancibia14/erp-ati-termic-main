// CU 46 - Gestionando avisos temporales (módulo "Avisos Internos").
// El Administrador Total redacta el aviso y lo deja en "Borrador" o "Listo
// para publicar"; los listos se muestran en Inicio mientras estén vigentes.
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Op } = require('sequelize');
const Aviso = require('../models/Aviso');
const LogAuditoria = require('../models/LogAuditoria');
const { leerImagen } = require('../utils/imagen');
const { fechaHoy, esFechaValida } = require('../utils/fecha');

const ESTADOS = ['Borrador', 'Listo para publicar'];
const TITULO_MAX = 100;
const TEXTO_MAX = 500;
const IMAGEN_LIMITE_MB = 2;
const IMAGEN_MIN = 200;
const IMAGEN_MAX = 4000;
const FORMATOS = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const FORMATO_NO_VALIDO = 'Formato de imagen no válido. Carga un archivo en formato web estándar: JPG, PNG o WEBP';

const audit = async (accion, rut) => {
  try {
    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: accion,
      log_auditoria_modulo: 'AVISOS_INTERNOS',
      usuario_rut: rut
    });
  } catch (_) { /* no bloquear la operación principal */ }
};

const uploadImagen = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(__dirname, '../uploads/avisos');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, `aviso_${Date.now()}${path.extname(file.originalname).toLowerCase()}`);
    }
  }),
  limits: { fileSize: IMAGEN_LIMITE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Excepción 1 - La extensión y el tipo informado deben ser de imagen web
    const ext = path.extname(file.originalname).toLowerCase();
    if (FORMATOS[ext] && FORMATOS[ext] === file.mimetype) return cb(null, true);
    cb(new Error(FORMATO_NO_VALIDO));
  }
});

// Traduce los fallos de multer a mensajes para el actor
function recibirImagen(req, res, next) {
  uploadImagen.single('imagen')(req, res, err => {
    if (!err) return next();
    const error = err.code === 'LIMIT_FILE_SIZE'
      ? `La imagen supera el límite de ${IMAGEN_LIMITE_MB} MB`
      : err.message || 'Error al procesar la imagen';
    return res.status(400).json({ success: false, error, campos: ['imagen'] });
  });
}

// Pasos 2 y 3 - Todos los campos se revisan de una vez para marcarlos juntos
function validarCampos(body) {
  const titulo = String(body.titulo || '').trim();
  const texto = String(body.texto || '').trim();
  const { fecha_inicio, fecha_termino, estado } = body;
  const campos = [];
  let error = null;
  const fallar = (campo, mensaje) => { campos.push(campo); if (!error) error = mensaje; };

  if (!titulo) fallar('titulo', 'El título es obligatorio');
  else if (titulo.length > TITULO_MAX) fallar('titulo', `El título no puede superar los ${TITULO_MAX} caracteres`);
  if (!texto) fallar('texto', 'El texto del aviso es obligatorio');
  else if (texto.length > TEXTO_MAX) fallar('texto', `El texto supera el límite de ${TEXTO_MAX} caracteres de la vista principal`);
  if (!esFechaValida(fecha_inicio)) fallar('fecha_inicio', 'Indica una fecha de inicio válida');
  if (!esFechaValida(fecha_termino)) fallar('fecha_termino', 'Indica una fecha de término válida');
  else if (esFechaValida(fecha_inicio) && fecha_termino < fecha_inicio) fallar('fecha_termino', 'La fecha de término no puede ser anterior a la de inicio');
  else if (fecha_termino < fechaHoy()) fallar('fecha_termino', 'La fecha de término ya pasó: el aviso nunca se mostraría');
  if (!ESTADOS.includes(estado)) fallar('estado', 'Selecciona si el aviso queda como Borrador o Listo para publicar');

  return { error, campos, datos: { titulo, texto, fecha_inicio, fecha_termino, estado } };
}

// Paso 5 - Verifica el formato real y las dimensiones para optimización web
function validarImagen(archivo) {
  const info = leerImagen(fs.readFileSync(archivo.path));
  if (!info) return FORMATO_NO_VALIDO;
  if (info.ancho < IMAGEN_MIN || info.alto < IMAGEN_MIN) {
    return `La imagen es muy pequeña (${info.ancho}×${info.alto} px): debe medir al menos ${IMAGEN_MIN}×${IMAGEN_MIN} px`;
  }
  if (info.ancho > IMAGEN_MAX || info.alto > IMAGEN_MAX) {
    return `La imagen es muy grande (${info.ancho}×${info.alto} px): debe medir como máximo ${IMAGEN_MAX}×${IMAGEN_MAX} px`;
  }
  return null;
}

const borrarArchivo = url => {
  if (url) fs.unlink(path.join(__dirname, '..', url), () => {});
};

// Vigencia calculada según la fecha de hoy, para mostrarla en la lista
function conVigencia(aviso) {
  const hoy = fechaHoy();
  const a = aviso.toJSON();
  a.vigencia = a.aviso_fecha_termino < hoy ? 'Vencido' : a.aviso_fecha_inicio > hoy ? 'Programado' : 'Vigente';
  return a;
}

async function getAvisos(req, res) {
  try {
    const avisos = await Aviso.findAll({ order: [['aviso_fecha_creacion', 'DESC'], ['aviso_id', 'DESC']] });
    return res.json({ success: true, data: avisos.map(conVigencia) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los avisos' });
  }
}

// Avisos que se muestran en Inicio: listos para publicar y dentro de su vigencia
async function getAvisosVigentes(req, res) {
  try {
    const hoy = fechaHoy();
    const avisos = await Aviso.findAll({
      where: {
        aviso_estado: 'Listo para publicar',
        aviso_fecha_inicio: { [Op.lte]: hoy },
        aviso_fecha_termino: { [Op.gte]: hoy }
      },
      attributes: ['aviso_id', 'aviso_titulo', 'aviso_texto', 'aviso_url_imagen', 'aviso_fecha_inicio', 'aviso_fecha_termino'],
      order: [['aviso_fecha_inicio', 'DESC'], ['aviso_id', 'DESC']]
    });
    return res.json({ success: true, data: avisos });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener los avisos vigentes' });
  }
}

async function crearAviso(req, res) {
  const borrarSubido = () => { if (req.file) fs.unlink(req.file.path, () => {}); };
  try {
    const { error, campos, datos } = validarCampos(req.body);
    const errorImagen = req.file ? validarImagen(req.file) : null;
    if (error || errorImagen) {
      borrarSubido();
      return res.status(400).json({ success: false, error: error || errorImagen, campos: errorImagen ? [...campos, 'imagen'] : campos });
    }

    const aviso = await Aviso.create({
      aviso_titulo: datos.titulo,
      aviso_texto: datos.texto,
      aviso_url_imagen: req.file ? `/uploads/avisos/${req.file.filename}` : null,
      aviso_estado: datos.estado,
      aviso_fecha_inicio: datos.fecha_inicio,
      aviso_fecha_termino: datos.fecha_termino,
      usuario_rut: req.user.rut
    });
    await audit(`Aviso interno #${aviso.aviso_id} "${aviso.aviso_titulo}" creado en estado "${aviso.aviso_estado}"`, req.user.rut);

    return res.status(201).json({
      success: true,
      data: conVigencia(aviso),
      mensaje: `Aviso #${aviso.aviso_id} guardado como "${aviso.aviso_estado}"`
    });
  } catch (err) {
    borrarSubido();
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al guardar el aviso' });
  }
}

async function actualizarAviso(req, res) {
  const borrarSubido = () => { if (req.file) fs.unlink(req.file.path, () => {}); };
  try {
    const aviso = await Aviso.findByPk(req.params.id);
    if (!aviso) {
      borrarSubido();
      return res.status(404).json({ success: false, error: 'El aviso ya no existe' });
    }
    const { error, campos, datos } = validarCampos(req.body);
    const errorImagen = req.file ? validarImagen(req.file) : null;
    if (error || errorImagen) {
      borrarSubido();
      return res.status(400).json({ success: false, error: error || errorImagen, campos: errorImagen ? [...campos, 'imagen'] : campos });
    }

    // La imagen anterior se borra solo después de guardar el cambio
    const imagenAnterior = aviso.aviso_url_imagen;
    let imagen = imagenAnterior;
    if (req.file) imagen = `/uploads/avisos/${req.file.filename}`;
    else if (req.body.quitar_imagen === 'true') imagen = null;

    await aviso.update({
      aviso_titulo: datos.titulo,
      aviso_texto: datos.texto,
      aviso_url_imagen: imagen,
      aviso_estado: datos.estado,
      aviso_fecha_inicio: datos.fecha_inicio,
      aviso_fecha_termino: datos.fecha_termino
    });
    if (imagenAnterior && imagenAnterior !== imagen) borrarArchivo(imagenAnterior);
    await audit(`Aviso interno #${aviso.aviso_id} "${aviso.aviso_titulo}" editado (estado "${aviso.aviso_estado}")`, req.user.rut);

    return res.json({ success: true, data: conVigencia(aviso), mensaje: `Aviso #${aviso.aviso_id} actualizado` });
  } catch (err) {
    borrarSubido();
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al actualizar el aviso' });
  }
}

// Cambio rápido de estado desde la lista (publicar o volver a borrador)
async function cambiarEstado(req, res) {
  try {
    const { estado } = req.body;
    if (!ESTADOS.includes(estado)) {
      return res.status(400).json({ success: false, error: 'Estado no válido' });
    }
    const aviso = await Aviso.findByPk(req.params.id);
    if (!aviso) return res.status(404).json({ success: false, error: 'El aviso ya no existe' });
    if (aviso.aviso_estado === estado) {
      return res.status(400).json({ success: false, error: `El aviso ya está como "${estado}"` });
    }
    await aviso.update({ aviso_estado: estado });
    await audit(`Aviso interno #${aviso.aviso_id} "${aviso.aviso_titulo}" cambiado a "${estado}"`, req.user.rut);
    return res.json({ success: true, data: conVigencia(aviso), mensaje: `Aviso #${aviso.aviso_id} ahora está como "${estado}"` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al cambiar el estado del aviso' });
  }
}

module.exports = { recibirImagen, getAvisos, getAvisosVigentes, crearAviso, actualizarAviso, cambiarEstado };
