const express = require('express');
const router = express.Router();
const { getProyectos, registrarBitacora, getBitacorasByProyecto } = require('../controllers/bitacoraController');
const { verifyToken } = require('../middleware/auth');

router.get('/proyectos', verifyToken, getProyectos);
router.get('/:codigo', verifyToken, getBitacorasByProyecto);
router.post('/', verifyToken, registrarBitacora);

module.exports = router;
