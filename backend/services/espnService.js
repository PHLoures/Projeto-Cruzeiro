// Comunicação com a API pública da ESPN (única parte do projeto que conhece a API externa)
const config = require('../config');
const { remember } = require('../utils/cache');
const { mapEvent, mapSummary, mapStandings } = require('./matchMapper');

const { baseUrl, teamId } = config.espn;

async function getJson(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`ESPN respondeu ${res.status} para ${url}`);
  return res.json();
}

// Busca jogos já disputados + próximos de uma competição
async function fetchLeague(league) {
  const base = `${baseUrl}/${league}/teams/${teamId}/schedule?season=${config.season}`;
  const [played, upcoming] = await Promise.all([
    getJson(base).catch(() => ({ events: [] })),
    getJson(`${base}&fixture=true`).catch(() => ({ events: [] })),
  ]);

  const events = [...(played.events || []), ...(upcoming.events || [])];
  return events.map((e) => mapEvent(e, league));
}

// Todos os jogos da temporada, de todas as competições, em ordem cronológica
function getAllMatches() {
  return remember(`all-${config.season}`, config.cacheTtl, async () => {
    const leagues = Object.keys(config.competitions);
    const results = await Promise.all(leagues.map(fetchLeague));

    const byId = new Map();
    results.flat().forEach((m) => byId.set(m.id, m));

    return [...byId.values()]
      .filter((m) => new Date(m.date).getFullYear() === config.season)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  });
}

// Detalhes de uma partida (escalações, gols, cartões, substituições, estatísticas)
async function getMatchDetails(id) {
  const matches = await getAllMatches();
  const match = matches.find((m) => m.id === String(id));
  if (!match) return null;

  const live = match.status.state === 'in';
  const ttl = live ? 60 * 1000 : 60 * 60 * 1000;

  return remember(`summary-${id}`, ttl, async () => {
    const summary = await getJson(`${baseUrl}/${match.league}/summary?event=${id}`);
    return { ...match, ...mapSummary(summary) };
  });
}

// Classificação (tabela) de uma competição; copas só de mata-mata não têm tabela
function getStandings(league) {
  return remember(`standings-${league}-${config.season}`, config.cacheTtl, async () => {
    const url = `https://site.api.espn.com/apis/v2/sports/soccer/${league}/standings?season=${config.season}`;
    const data = await getJson(url);
    return mapStandings(data);
  });
}

module.exports = { getAllMatches, getMatchDetails, getStandings };
