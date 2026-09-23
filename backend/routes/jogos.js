const express = require('express');
const ctrl = require('../controllers/jogosController');

const router = express.Router();

router.get('/', ctrl.listar);
router.get('/proximos', ctrl.proximos);
router.get('/anteriores', ctrl.anteriores);
router.get('/resumo', ctrl.resumo);
router.get('/competicoes', ctrl.competicoes);
router.get('/:id', ctrl.detalhe); // sempre por último (captura qualquer id)

module.exports = router;
