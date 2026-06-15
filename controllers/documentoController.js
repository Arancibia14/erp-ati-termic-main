const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize'); // Op contiene operadores de Sequelize como OR, AND, NOT, etc.
const DocumentoLegal = require('../models/DocumentoLegal');
const Trabajador = require('../models/Trabajador');

// CU47 - C_Documento: Buscando Documentos Legales
// Permite buscar documentos filtrando por RUT del trabajador, código de obra, o ambos
async function buscarDocumentos(req, res) {
  try {
    const { rut, codigo_obra } = req.query; // parámetros de búsqueda en la URL (?rut=...&codigo_obra=...)

    if (!rut && !codigo_obra) {
      return res.status(400).json({ success: false, error: 'Se requiere RUT del trabajador o código de obra' });
    }

    // Construye el filtro WHERE dinámicamente según los parámetros recibidos
    const where = {};
    if (rut && codigo_obra) {
      // Op.or: devuelve documentos que coincidan con el RUT O con el código de obra
      where[Op.or] = [{ trabajador_rut: rut }, { proyecto_codigo_correlativo: codigo_obra }];
    } else if (rut) {
      where.trabajador_rut = rut;
    } else {
      where.proyecto_codigo_correlativo = codigo_obra;
    }

    const documentos = await DocumentoLegal.findAll({ where });

    // Enriquece cada documento con un campo que indica si el archivo PDF existe físicamente en disco
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
