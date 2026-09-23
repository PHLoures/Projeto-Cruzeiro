// Monta o chaveamento (mata-mata) de uma competição a partir de todos os jogos do ano
const config = require('../config');
const { remember } = require('../utils/cache');

const { baseUrl, teamId: CRUZEIRO_ID } = config.espn;

const NOMES_FASES = {
  'first-round': '1ª fase', 'second-round': '2ª fase', 'third-round': '3ª fase', 'fourth-round': '4ª fase', 'fifth-round': '5ª fase',
  'first-stage': '1ª fase preliminar', 'second-stage': '2ª fase preliminar', 'third-stage': '3ª fase preliminar',
};

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`ESPN respondeu ${res.status} para ${url}`);
  return res.json();
}

// A ESPN só aceita consultar o placar geral por dia ou por mês, então buscamos os 12 meses
async function fetchSeasonEvents(league) {
  const meses = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const respostas = await Promise.all(meses.map((m) =>
    getJson(`${baseUrl}/${league}/scoreboard?dates=${config.season}${m}&limit=300`).catch(() => ({ events: [] }))));
  const porId = new Map();
  respostas.forEach((r) => (r.events || []).forEach((e) => porId.set(e.id, e)));
  return [...porId.values()].sort((a, b) => new Date(a.date) - new Date(b.date));
}

function timeDoJogo(c) {
  const tbd = /^TBD/i.test(c.team?.displayName || '');
  return {
    id: tbd ? null : c.team?.id,
    nome: tbd ? 'A definir' : c.team?.displayName,
    logo: tbd ? null : c.team?.logos?.[0]?.href || c.team?.logo || null,
  };
}

// Agrupa os jogos de uma fase em confrontos (ida e volta entre os mesmos dois times)
function montarConfrontos(jogos) {
  const confrontos = new Map();
  jogos.forEach((e, idx) => {
    const cp = e.competitions[0];
    const [a, b] = cp.competitors.map(timeDoJogo);
    const chave = a.id && b.id ? [a.id, b.id].sort().join('-') : `tbd-${idx}`;
    if (!confrontos.has(chave)) confrontos.set(chave, { times: [a, b], gols: {}, jogos: [], vencedor: null });
    const c = confrontos.get(chave);
    const done = cp.status?.type?.completed;
    c.ultimoVencedor = null;
    const placar = {};
    if (done || cp.status?.type?.state === 'in') cp.competitors.forEach((x) => { placar[x.team?.id] = Number(x.score || 0); });
    c.jogos.push({ id: e.id, data: e.date, encerrado: Boolean(done), placar });
    cp.competitors.forEach((x) => {
      const t = timeDoJogo(x);
      if (!t.id) return;
      if (done) c.gols[t.id] = (c.gols[t.id] || 0) + Number(x.score || 0);
      if (done && x.winner) c.ultimoVencedor = t.id; // vencedor do último jogo (usado só nos pênaltis)
    });
    c.penaltis = c.penaltis || /penalt/i.test(cp.notes?.[0]?.headline || '');
  });

  return [...confrontos.values()].map((c) => {
    const encerrado = c.jogos.every((j) => j.encerrado);
    // Quem fez mais gols no agregado passa; empatado, vale o vencedor dos pênaltis no último jogo
    if (encerrado) {
      const [x, y] = c.times;
      const gx = c.gols[x.id] || 0;
      const gy = c.gols[y.id] || 0;
      c.vencedor = gx !== gy ? (gx > gy ? x.id : y.id) : c.ultimoVencedor;
    }
    return {
      times: c.times.map((t) => ({ ...t, gols: t.id && c.jogos.some((j) => j.encerrado) ? c.gols[t.id] || 0 : null })),
      vencedor: encerrado ? c.vencedor : null,
      penaltis: c.penaltis,
      encerrado,
      cruzeiro: c.times.some((t) => t.id === CRUZEIRO_ID),
      jogoIds: c.jogos.map((j) => j.id),
      // Placar de cada jogo (ida e volta), na ordem em que aconteceram
      pernas: c.jogos.map((j) => ({ data: j.data, placar: j.placar })),
    };
  });
}

// Ordena as fases para que cada confronto fique alinhado com os que o alimentam
function ordenarChave(fases) {
  let base = -1;
  fases.forEach((f, i) => { if (f.confrontos.length && f.confrontos.every((c) => c.times.every((t) => t.id))) base = i; });
  for (let i = base - 1; i >= 0; i--) {
    const usados = new Set();
    const ordenados = [];
    fases[i + 1].confrontos.forEach((prox) => {
      prox.times.forEach((t) => {
        const idx = fases[i].confrontos.findIndex((c, k) => !usados.has(k) && c.times.some((x) => x.id && x.id === t.id));
        if (idx >= 0) { usados.add(idx); ordenados.push(fases[i].confrontos[idx]); }
      });
    });
    fases[i].confrontos.forEach((c, k) => { if (!usados.has(k)) ordenados.push(c); });
    fases[i].confrontos = ordenados;
  }
  return fases;
}

function getBracket(league) {
  const rounds = config.knockoutRounds[league];
  if (!rounds) return Promise.resolve(null);

  return remember(`bracket-${league}-${config.season}`, config.cacheTtl, async () => {
    const eventos = await fetchSeasonEvents(league);
    const fases = Object.entries(rounds).map(([slug, nome]) => ({
      slug,
      nome,
      confrontos: montarConfrontos(eventos.filter((e) => e.season?.slug === slug)),
    }));

    // Confrontos do Cruzeiro em fases anteriores ao chaveamento (ex.: 5ª fase da Copa do Brasil)
    const doCruzeiro = eventos.filter((e) => !rounds[e.season?.slug]
      && !/group|regular|inconfidencia/i.test(e.season?.slug || '')
      && e.competitions[0].competitors.some((c) => c.team?.id === CRUZEIRO_ID));
    const slugsAnteriores = [...new Set(doCruzeiro.map((e) => e.season?.slug))];
    const anteriores = slugsAnteriores.flatMap((slug) => montarConfrontos(doCruzeiro.filter((e) => e.season?.slug === slug))
      .map((c) => ({ ...c, fase: NOMES_FASES[slug] || slug })));

    return { fases: ordenarChave(fases), anteriores };
  });
}

module.exports = { getBracket };
