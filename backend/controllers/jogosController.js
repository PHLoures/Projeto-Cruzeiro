// Regras de negócio das rotas de jogos (filtros, resumo da temporada, erros)
const espn = require('../services/espnService');

function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error('[jogos]', err.message);
      res.status(502).json({ erro: 'Não foi possível obter os dados da API de futebol.' });
    }
  };
}

const isPast = (m) => m.status.completed;
const isUpcoming = (m) => !m.status.completed;

// GET /api/jogos?competicao=bra.1&status=anteriores|proximos
exports.listar = handle(async (req, res) => {
  let jogos = await espn.getAllMatches();
  const { competicao, status } = req.query;
  if (competicao) jogos = jogos.filter((m) => m.league === competicao);
  if (status === 'anteriores') jogos = jogos.filter(isPast);
  if (status === 'proximos') jogos = jogos.filter(isUpcoming);
  res.json({ total: jogos.length, jogos });
});

// GET /api/jogos/proximos?limite=5
exports.proximos = handle(async (req, res) => {
  const limite = Number(req.query.limite) || undefined;
  const jogos = (await espn.getAllMatches()).filter(isUpcoming).slice(0, limite);
  res.json({ total: jogos.length, jogos });
});

// GET /api/jogos/anteriores?limite=5  (mais recente primeiro)
exports.anteriores = handle(async (req, res) => {
  const limite = Number(req.query.limite) || undefined;
  const jogos = (await espn.getAllMatches()).filter(isPast).reverse().slice(0, limite);
  res.json({ total: jogos.length, jogos });
});

// GET /api/jogos/resumo  -> números da temporada
exports.resumo = handle(async (req, res) => {
  const jogos = await espn.getAllMatches();
  const disputados = jogos.filter(isPast);
  const r = { jogos: disputados.length, vitorias: 0, empates: 0, derrotas: 0, golsPro: 0, golsContra: 0 };
  const porCompeticao = {};

  disputados.forEach((m) => {
    const pro = Number(m.cruzeiroHome ? m.home.score : m.away.score) || 0;
    const contra = Number(m.cruzeiroHome ? m.away.score : m.home.score) || 0;
    r.golsPro += pro;
    r.golsContra += contra;
    if (m.result === 'V') r.vitorias++;
    else if (m.result === 'E') r.empates++;
    else if (m.result === 'D') r.derrotas++;
    porCompeticao[m.competition] = (porCompeticao[m.competition] || 0) + 1;
  });

  r.aproveitamento = r.jogos ? Math.round(((r.vitorias * 3 + r.empates) / (r.jogos * 3)) * 100) : 0;
  r.ultimos5 = disputados.slice(-5).map((m) => m.result);
  r.restantes = jogos.length - disputados.length;
  r.porCompeticao = porCompeticao;
  res.json(r);
});

// GET /api/jogos/competicoes -> lista de competições com jogos
exports.competicoes = handle(async (req, res) => {
  const jogos = await espn.getAllMatches();
  const map = new Map();
  jogos.forEach((m) => map.set(m.league, m.competition));
  res.json([...map].map(([id, nome]) => ({ id, nome })));
});

// GET /api/jogos/:id
exports.detalhe = handle(async (req, res) => {
  const jogo = await espn.getMatchDetails(req.params.id);
  if (!jogo) return res.status(404).json({ erro: 'Partida não encontrada na temporada.' });
  res.json(jogo);
});
