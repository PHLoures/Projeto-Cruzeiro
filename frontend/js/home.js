// Página inicial: próximo jogo, último resultado, resumo e próximos jogos

function confronto(m, mostrarPlacar) {
  const meio = mostrarPlacar
    ? `<div class="placar-grande">${esc(m.home.score)} × ${esc(m.away.score)}</div>`
    : '<div class="vs">VS</div>';
  const time = (t) => `<div class="time"><img src="${esc(t.logo || '')}" alt=""><span>${esc(t.name)}</span></div>`;
  return `<div class="confronto">${time(m.home)}${meio}${time(m.away)}</div>`;
}

function iniciarContagem(el, iso) {
  const tick = () => {
    const diff = Math.max(0, new Date(iso) - Date.now());
    const d = Math.floor(diff / 864e5), h = Math.floor(diff / 36e5) % 24, min = Math.floor(diff / 6e4) % 60;
    el.innerHTML = [[d, 'dias'], [h, 'horas'], [min, 'min']].map(([v, l]) => `<div><b>${v}</b><small>${l}</small></div>`).join('');
  };
  tick();
  setInterval(tick, 30000);
}

async function carregarProximo() {
  const el = document.getElementById('proximo-jogo');
  try {
    const { jogos } = await api('/jogos/proximos?limite=1');
    const m = jogos[0];
    if (!m) { el.innerHTML = '<span class="rotulo">Próximo jogo</span><p style="margin-top:16px">Não há jogos futuros cadastrados em 2026.</p>'; return; }
    el.innerHTML = `
      <span class="rotulo">Próximo jogo · ${esc(m.competition)}</span>
      ${confronto(m, m.status.state === 'in')}
      <div class="info-linha"><span>📅 ${fmt.dataLonga(m.date)}</span><span>⏰ ${fmt.hora(m.date)}</span><span>🏟️ ${esc(m.venue || 'A definir')}</span></div>
      <div class="contagem"></div>
      <div class="botoes" style="justify-content:center;margin-top:20px"><a class="btn btn-contorno" href="partida.html?id=${m.id}">Detalhes da partida</a></div>`;
    if (m.status.state === 'pre') iniciarContagem(el.querySelector('.contagem'), m.date);
  } catch (e) { el.innerHTML = `<p class="erro">${esc(e.message)}</p>`; }
}

async function carregarUltimo() {
  const el = document.getElementById('ultimo-resultado');
  try {
    const { jogos } = await api('/jogos/anteriores?limite=1');
    const m = jogos[0];
    if (!m) { el.innerHTML = '<span class="rotulo">Último resultado</span><p>Nenhum jogo disputado ainda.</p>'; return; }
    const txt = { V: 'Vitória', E: 'Empate', D: 'Derrota' }[m.result] || '';
    el.innerHTML = `
      <span class="rotulo">Último resultado · ${esc(m.competition)}</span>
      ${confronto(m, true)}
      <div class="info-linha" style="color:var(--texto-suave)"><span>${fmt.data(m.date)}</span><span>${esc(m.venue || '')}</span></div>
      <div class="botoes" style="justify-content:center;margin-top:20px;align-items:center">
        ${m.result ? `<span class="badge ${m.result}">${m.result}</span><strong>${txt}</strong>` : ''}
        <a class="btn btn-azul" href="partida.html?id=${m.id}">Ver gols e escalações</a>
      </div>`;
  } catch (e) { el.innerHTML = `<p class="erro">${esc(e.message)}</p>`; }
}

async function carregarResumo() {
  const el = document.getElementById('resumo');
  try {
    const r = await api('/jogos/resumo');
    const item = (v, l) => `<div class="card stat"><b>${v}</b><span>${l}</span></div>`;
    el.innerHTML = [
      item(r.jogos, 'Jogos disputados'),
      item(r.vitorias, 'Vitórias'),
      item(r.empates, 'Empates'),
      item(r.derrotas, 'Derrotas'),
      item(`${r.golsPro}<small style="font-size:1.2rem;color:var(--texto-suave)">:${r.golsContra}</small>`, 'Gols pró : contra'),
      item(`${r.aproveitamento}%`, 'Aproveitamento'),
      `<div class="card stat"><div class="forma" style="min-height:42px;align-items:center">${r.ultimos5.map((x) => `<span class="badge ${x}">${x}</span>`).join('')}</div><span>Últimos 5 jogos</span></div>`,
    ].join('');
  } catch (e) { el.innerHTML = `<p class="erro">${esc(e.message)}</p>`; }
}

async function carregarProximos() {
  const el = document.getElementById('proximos');
  try {
    const { jogos } = await api('/jogos/proximos?limite=5');
    el.innerHTML = jogos.length ? jogos.map(cardJogo).join('') : '<p class="vazio">Sem próximos jogos no momento.</p>';
  } catch (e) { el.innerHTML = `<p class="erro">${esc(e.message)}</p>`; }
}

carregarProximo();
carregarUltimo();
carregarResumo();
carregarProximos();
