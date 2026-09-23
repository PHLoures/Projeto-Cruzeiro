// Carrega o arquivo .env (recurso nativo do Node >= 20.12, sem precisar da lib dotenv)
try {
  process.loadEnvFile();
} catch {
  // .env é opcional: sem ele usamos os valores padrão abaixo
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  season: Number(process.env.SEASON) || 2026,
  cacheTtl: (Number(process.env.CACHE_TTL_SECONDS) || 600) * 1000,

  espn: {
    baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/soccer',
    teamId: '2022', // ID do Cruzeiro na ESPN
  },

  // Fases de mata-mata exibidas no chaveamento (slug da ESPN -> nome exibido)
  knockoutRounds: {
    'bra.copa_do_brazil': { 'round-of-16': 'Oitavas', quarterfinals: 'Quartas', semifinals: 'Semifinal', final: 'Final' },
    'conmebol.libertadores': { 'round-of-16': 'Oitavas', quarterfinals: 'Quartas', semifinals: 'Semifinal', final: 'Final' },
    'bra.camp.mineiro': { 'playoffs---semifinals': 'Semifinal', 'playoffs---final': 'Final' },
  },

  // Competições consultadas (slug da ESPN -> nome exibido)
  competitions: {
    'bra.1': 'Brasileirão Série A',
    'bra.copa_do_brazil': 'Copa do Brasil',
    'conmebol.libertadores': 'Copa Libertadores',
    'conmebol.sudamericana': 'Copa Sul-Americana',
    'bra.camp.mineiro': 'Campeonato Mineiro',
  },
};
