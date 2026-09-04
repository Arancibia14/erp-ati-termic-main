const express = require('express');
const router = express.Router();
const { getEnTransito } = require('../controllers/transitoController');
const { verifyToken } = require('../middleware/auth');

// CU31 - Monitoreando materiales en tránsito (Supervisor de Obra)
router.get('/', verifyToken, getEnTransito);

module.exports = router;
