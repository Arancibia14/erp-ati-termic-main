const express = require('express');
const router = express.Router();
const { getMateriales, getMaterial, crearMaterial, actualizarMaterial, desactivarMaterial } = require('../controllers/materialController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', verifyToken, getMateriales);
router.get('/:id', verifyToken, getMaterial);
router.post('/', verifyToken, requireAdmin, crearMaterial);
router.put('/:id', verifyToken, requireAdmin, actualizarMaterial);
router.delete('/:id', verifyToken, requireAdmin, desactivarMaterial);

module.exports = router;
