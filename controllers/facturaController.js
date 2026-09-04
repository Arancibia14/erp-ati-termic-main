const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const OrdenCompra = require('../models/OrdenCompra');
const DetalleOrdenCompra = require('../models/DetalleOrdenCompra');
const GuiaDespacho = require('../models/GuiaDespacho');
const Proveedor = require('../models/Proveedor');
const Factura = require('../models/Factura');
const LogAuditoria = require('../models/LogAuditoria');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/facturas');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `factura_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos PDF'));
    }
  }
});

async function getOrdenesPendientesFact(req, res) {
  try {
    const ordenes = await OrdenCompra.findAll({
      where: { orden_compra_estado: { [Op.ne]: 'Facturado' } },
      include: [
        { model: Proveedor, attributes: ['proveedor_razon_social', 'proveedor_rut'] },
        { model: DetalleOrdenCompra },
        { model: GuiaDespacho, attributes: ['guia_despacho_id', 'guia_despacho_numero', 'guia_despacho_fecha', 'guia_despacho_estado'] }
      ],
      order: [['orden_compra_fecha', 'DESC']]
    });

    const data = ordenes.map(o => {
      const plain = o.toJSON();
      const total = (plain.DetalleOrdenCompras || []).reduce((sum, d) => {
        return sum + (parseFloat(d.detalle_orden_compra_cantidad) * parseFloat(d.detalle_orden_compra_precio_unitario));
      }, 0);
      return { ...plain, total_calculado: total };
    });

    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al obtener órdenes pendientes de facturación' });
  }
}

async function vincularFactura(req, res) {
  try {
    const { id } = req.params;
    const { factura_folio, factura_monto_total, factura_fecha } = req.body;

    if (!factura_folio || !factura_monto_total || !factura_fecha) {
      return res.status(400).json({ success: false, error: 'Folio, monto y fecha son requeridos' });
    }

    // Verificar folio duplicado
    const folioExistente = await Factura.findOne({ where: { factura_folio } });
    if (folioExistente) {
      return res.status(409).json({ success: false, error: `El folio ${factura_folio} ya fue registrado en el sistema` });
    }

    const orden = await OrdenCompra.findByPk(id, {
      include: [{ model: DetalleOrdenCompra }]
    });
    if (!orden) {
      return res.status(404).json({ success: false, error: 'Orden de compra no encontrada' });
    }

    // Validar que el monto de la factura coincida con el total de la OC (tolerancia 1 CLP)
    const totalOC = (orden.DetalleOrdenCompras || []).reduce((sum, d) => {
      return sum + (parseFloat(d.detalle_orden_compra_cantidad) * parseFloat(d.detalle_orden_compra_precio_unitario));
    }, 0);

    const montoFactura = parseFloat(factura_monto_total);
    if (totalOC > 0 && Math.abs(montoFactura - totalOC) > 1) {
      return res.status(400).json({
        success: false,
        error: `El monto de la factura (${montoFactura.toLocaleString('es-CL')}) no coincide con el total de la orden (${totalOC.toLocaleString('es-CL')})`
      });
    }

    const urlPdf = req.file ? `/uploads/facturas/${req.file.filename}` : null;

    const factura = await Factura.create({
      factura_folio,
      factura_monto_total: montoFactura,
      factura_fecha,
      factura_url_pdf: urlPdf,
      orden_compra_id: parseInt(id)
    });

    await orden.update({ orden_compra_estado: 'Facturado' });

    await LogAuditoria.create({
      log_auditoria_fecha_hora: new Date(),
      log_auditoria_accion: `Factura ${factura_folio} vinculada a OC ${id} por $${montoFactura.toLocaleString('es-CL')}`,
      log_auditoria_modulo: 'FACTURA',
      usuario_rut: req.user.rut
    });

    return res.status(201).json({ success: true, data: factura });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: 'Error al vincular factura' });
  }
}

module.exports = { getOrdenesPendientesFact, vincularFactura, upload };
