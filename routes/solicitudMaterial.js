const express = require('express');
const router = express.Router();
const { getMisSolicitudes, crearSolicitud, getSolicitudesPendientes, aprobarSolicitud, rechazarSolicitud } = require('../controllers/solicitudMaterialController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/mis-solicitudes', verifyToken, getMisSolicitudes);
router.get('/pendientes', verifyToken, requireAdmin, getSolicitudesPendientes);
router.post('/', verifyToken, crearSolicitud);
router.put('/:id/aprobar', verifyToken, requireAdmin, aprobarSolicitud);
router.put('/:id/rechazar', verifyToken, requireAdmin, rechazarSolicitud);

module.exports = router;
