// Tabelas de classificação das competições do Cruzeiro
const config = require('../config');
const espn = require('../services/espnService');
const { getBracket } = require('../services/bracketService');

// GET /api/classificacao/:competicao  (ex.: bra.1, conmebol.libertadores)
exports.tabela = async (req, res) => {
  const { competicao } = req.params;
  if (!config.competitions[competicao]) {
    return res.status(404).json({ erro: 'Competição não encontrada.' });
  }
  try {
    const [grupos, chave] = await Promise.all([
      espn.getStandings(competicao),
      getBracket(competicao).catch((err) => { console.error('[chave]', err.message); return null; }),
    ]);
    res.json({ competicao, nome: config.competitions[competicao], grupos, chave });
  } catch (err) {
    console.error('[classificacao]', err.message);
    res.status(502).json({ erro: 'Não foi possível obter a classificação.' });
  }
};
