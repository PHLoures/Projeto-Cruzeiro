// Converte o formato da ESPN para um formato simples e em português usado pelo nosso frontend
const config = require('../config');

const CRUZEIRO_ID = config.espn.teamId;

function mapTeam(c) {
  if (!c) return null;
  const score = c.score && typeof c.score === 'object' ? c.score.displayValue : c.score;
  return {
    id: c.team?.id ?? c.id,
    name: c.team?.displayName ?? c.team?.name,
    shortName: c.team?.abbreviation ?? c.team?.shortDisplayName,
    logo: c.team?.logos?.[0]?.href ?? c.team?.logo ?? null,
    score: score ?? null,
    winner: c.winner ?? null,
  };
}

function mapEvent(event, league) {
  const comp = event.competitions?.[0] || {};
  const competitors = comp.competitors || [];
  const home = mapTeam(competitors.find((c) => c.homeAway === 'home'));
  const away = mapTeam(competitors.find((c) => c.homeAway === 'away'));
  const type = comp.status?.type || event.status?.type || {};

  const cruzeiroHome = home?.id === CRUZEIRO_ID;
  const cruz = cruzeiroHome ? home : away;
  const rival = cruzeiroHome ? away : home;

  let result = null;
  if (type.completed && cruz?.score != null && rival?.score != null) {
    const a = Number(cruz.score);
    const b = Number(rival.score);
    result = a > b ? 'V' : a < b ? 'D' : 'E';
  }

  return {
    id: String(event.id),
    league,
    competition: config.competitions[league] || league,
    date: event.date,
    status: {
      state: type.state || 'pre', // pre | in | post
      completed: Boolean(type.completed),
      description: type.description || '',
      clock: comp.status?.displayClock || null,
    },
    venue: comp.venue?.fullName || null,
    city: comp.venue?.address?.city || null,
    home,
    away,
    cruzeiroHome,
    opponent: rival,
    result,
  };
}

function athleteName(p) {
  return p?.athlete?.displayName || p?.athlete?.fullName || null;
}

function mapKeyEvents(keyEvents = []) {
  const events = { goals: [], cards: [], substitutions: [] };

  keyEvents.forEach((k) => {
    const kind = k.type?.type || '';
    const text = k.type?.text || '';
    const base = {
      minute: k.clock?.displayValue || '',
      teamId: k.team?.id || null,
      team: k.team?.displayName || null,
      description: k.text || '',
    };
    const [first, second] = k.participants || [];

    if (k.scoringPlay || kind.startsWith('goal') || text.startsWith('Goal') || text.startsWith('Own Goal') || text.startsWith('Penalty - Scored')) {
      events.goals.push({
        ...base,
        player: athleteName(first),
        assist: athleteName(second),
        ownGoal: /own goal/i.test(text),
        penalty: /penalty/i.test(text),
      });
    } else if (/card/i.test(text)) {
      events.cards.push({ ...base, player: athleteName(first), color: /red/i.test(text) ? 'vermelho' : 'amarelo' });
    } else if (/substitution/i.test(text)) {
      events.substitutions.push({ ...base, playerIn: athleteName(first), playerOut: athleteName(second) });
    }
  });

  return events;
}

function mapRoster(r) {
  const players = (r.roster || []).map((p) => ({
    name: athleteName(p),
    number: p.jersey || '',
    position: p.position?.abbreviation || p.position?.name || '',
    starter: Boolean(p.starter),
    subbedIn: Boolean(p.subbedIn),
  }));
  return {
    teamId: r.team?.id,
    team: r.team?.displayName,
    logo: r.team?.logos?.[0]?.href || r.team?.logo || null,
    formation: r.formation || null,
    starters: players.filter((p) => p.starter),
    bench: players.filter((p) => !p.starter),
  };
}

const STAT_LABELS = {
  possessionPct: 'Posse de bola (%)',
  totalShots: 'Finalizações',
  shotsOnTarget: 'Chutes no gol',
  wonCorners: 'Escanteios',
  foulsCommitted: 'Faltas',
  offsides: 'Impedimentos',
  saves: 'Defesas',
  yellowCards: 'Cartões amarelos',
  redCards: 'Cartões vermelhos',
};

function mapStats(teams = []) {
  return teams.map((t) => ({
    teamId: t.team?.id,
    team: t.team?.displayName,
    stats: (t.statistics || [])
      .filter((s) => STAT_LABELS[s.name])
      .map((s) => ({ key: s.name, label: STAT_LABELS[s.name], value: s.displayValue })),
  }));
}

function mapSummary(summary) {
  const info = summary.gameInfo || {};
  const referee = (info.officials || [])[0];
  return {
    details: {
      attendance: info.attendance || null,
      referee: referee?.fullName || referee?.displayName || null,
      venue: info.venue?.fullName || null,
      city: info.venue?.address?.city || null,
    },
    events: mapKeyEvents(summary.keyEvents),
    lineups: (summary.rosters || []).map(mapRoster),
    stats: mapStats(summary.boxscore?.teams),
  };
}

module.exports = { mapEvent, mapSummary };
