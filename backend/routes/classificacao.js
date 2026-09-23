const express = require('express');
const ctrl = require('../controllers/classificacaoController');

const router = express.Router();

router.get('/:competicao', ctrl.tabela);

module.exports = router;
