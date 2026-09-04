const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const DocumentoLegal = require('../models/DocumentoLegal');
const Trabajador = require('../models/Trabajador');

async function buscarDocumentos(req, res) {
  try {
    const { rut, codigo_obra } = req.query;

    if (!rut && !codigo_obra) {
      return res.status(400).json({ success: false, error: 'Se requiere RUT del trabajador o código de obra' });
    }

    const where = {};
    if (rut && codigo_obra) {
      where[Op.or] = [{ trabajador_rut: rut }, { proyecto_codigo_correlativo: codigo_obra }];
    } else if (rut) {
      where.trabajador_rut = rut;
    } else {
      where.proyecto_codigo_correlativo = codigo_obra;
    }

    const documentos = await DocumentoLegal.findAll({ where });

    const documentosConEstado = documentos.map(doc => {
      const rutaAbsoluta = path.join(__dirname, '..', doc.documento_legal_url_pdf);
      const archivoExiste = fs.existsSync(rutaAbsoluta);
      return { ...doc.toJSON(), archivo_disponible: archivoExiste };
    });

    return res.json({ success: true, data: documentosConEstado });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al buscar documentos legales' });
  }
}

module.exports = { buscarDocumentos };
