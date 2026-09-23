// Funções compartilhadas entre as páginas
const ESCUDO_FALLBACK = 'https://a.espncdn.com/i/teamlogos/soccer/500/2022.png';
const TZ = 'America/Sao_Paulo';

async function api(path) {
  const res = await fetch(`/api${path}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erro || 'Erro ao carregar dados.');
  return data;
}

const fmt = {
  data: (iso) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit', year: 'numeric' }),
  dataCurta: (iso) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'short', day: '2-digit', month: 'short' }).replace(/\./g, ''),
  dataLonga: (iso) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ, weekday: 'long', day: '2-digit', month: 'long' }),
  hora: (iso) => new Date(iso).toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }),
  mes: (iso) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: TZ, month: 'long', year: 'numeric' }),
};

// Evita injeção de HTML com textos vindos da API
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function isCruzeiro(team) { return team?.id === '2022'; }

function statusChip(m) {
  if (m.status.state === 'in') return `<span class="chip ao-vivo">● AO VIVO ${esc(m.status.clock || '')}</span>`;
  if (m.status.completed) return '<span class="chip">Encerrado</span>';
  if (/postpon|adiad/i.test(m.status.description)) return '<span class="chip">Adiado</span>';
  return '';
}

function placar(m) {
  if (m.status.state === 'pre') return `<span class="placar futuro">${fmt.hora(m.date)}</span>`;
  return `<span class="placar">${esc(m.home.score ?? '-')} × ${esc(m.away.score ?? '-')}</span>`;
}

// Escudo do time; se a API não tiver a imagem, mostra um escudo genérico com as iniciais
function iniciais(nome) {
  return String(nome || '?').split(/\s+/).filter((p) => p.length > 2 || /^[A-Z]/.test(p)).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function escudoTime(team) {
  const alt = `<span class="escudo-generico" role="img" aria-label="${esc(team.name)}">${esc(iniciais(team.name))}</span>`;
  if (!team.logo) return alt;
  return `<img src="${esc(team.logo)}" alt="" loading="lazy" onerror="this.outerHTML=this.nextElementSibling.innerHTML"><template>${alt}</template>`;
}

function lado(team, nomePrimeiro = false) {
  const img = escudoTime(team);
  const nome = `<span class="${isCruzeiro(team) ? 'cruzeiro' : ''}">${esc(team.name)}</span>`;
  return nomePrimeiro ? nome + img : img + nome;
}

// Card de partida usado na home e na página de jogos
function cardJogo(m) {
  const res = m.result ? `<span class="badge ${m.result}" title="${{ V: 'Vitória', E: 'Empate', D: 'Derrota' }[m.result]}">${m.result}</span>` : '';
  return `
    <a class="card jogo" href="partida.html?id=${encodeURIComponent(m.id)}">
      <div class="jogo-data"><strong>${fmt.dataCurta(m.date)}</strong>${fmt.hora(m.date)} · ${fmt.data(m.date).slice(-4)}</div>
      <div class="jogo-times">
        <div class="lado">${lado(m.home, true)}</div>
        ${placar(m)}
        <div class="lado">${lado(m.away)}</div>
      </div>
      <div class="jogo-meta">${statusChip(m)} <span class="chip">${esc(m.competition)}</span><br>${esc(m.venue || 'Local a definir')} ${res}</div>
    </a>`;
}

// Escudo: usa assets/images/escudo.png e, se não existir, o escudo da ESPN
document.querySelectorAll('img[data-escudo]').forEach((img) => {
  img.addEventListener('error', () => { if (img.src !== ESCUDO_FALLBACK) img.src = ESCUDO_FALLBACK; }, { once: true });
  if (img.complete && img.naturalWidth === 0) img.src = ESCUDO_FALLBACK;
});

const anoRodape = document.getElementById('ano');
if (anoRodape) anoRodape.textContent = new Date().getFullYear();
