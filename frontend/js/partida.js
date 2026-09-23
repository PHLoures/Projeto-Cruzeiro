// Página de detalhes da partida
const id = new URLSearchParams(location.search).get('id');
const cab = document.getElementById('cabecalho');
const det = document.getElementById('detalhes');

const icone = { gol: '⚽', troca: '🔁' };

function nomeTime(m, teamId) {
  return [m.home, m.away].find((t) => t.id === teamId)?.name || '';
}

function blocoGols(m) {
  const itens = m.events.goals.map((g) => `
    <li><span class="min">${esc(g.minute)}</span><span>${icone.gol}</span>
      <div><strong>${esc(g.player || 'Gol')}</strong>${g.penalty ? ' (pênalti)' : ''}${g.ownGoal ? ' (contra)' : ''}
      <small>${esc(g.team || nomeTime(m, g.teamId))}${g.assist && !g.ownGoal && !g.penalty ? ` · assistência de ${esc(g.assist)}` : ''}</small></div></li>`).join('');
  return `<div class="card bloco"><h3>⚽ Gols</h3>${itens ? `<ul class="eventos">${itens}</ul>` : '<p class="vazio">Nenhum gol registrado.</p>'}</div>`;
}

function blocoCartoes(m) {
  const itens = m.events.cards.map((c) => `
    <li><span class="min">${esc(c.minute)}</span><span class="cartao ${c.color}" title="Cartão ${c.color}"></span>
      <div><strong>${esc(c.player || '')}</strong><small>${esc(c.team || '')}</small></div></li>`).join('');
  return `<div class="card bloco"><h3>🟨 Cartões</h3>${itens ? `<ul class="eventos">${itens}</ul>` : '<p class="vazio">Nenhum cartão registrado.</p>'}</div>`;
}

function blocoSubs(m) {
  const itens = m.events.substitutions.map((s) => `
    <li><span class="min">${esc(s.minute)}</span><span>${icone.troca}</span>
      <div><strong style="color:var(--vitoria)">▲ ${esc(s.playerIn || '')}</strong> <strong style="color:var(--derrota)">▼ ${esc(s.playerOut || '')}</strong><small>${esc(s.team || '')}</small></div></li>`).join('');
  return `<div class="card bloco"><h3>🔁 Substituições</h3>${itens ? `<ul class="eventos">${itens}</ul>` : '<p class="vazio">Nenhuma substituição registrada.</p>'}</div>`;
}

function blocoEstatisticas(m) {
  const [a, b] = m.stats;
  if (!a || !b || !a.stats.length) return '<div class="card bloco"><h3>📊 Estatísticas</h3><p class="vazio">Estatísticas indisponíveis.</p></div>';
  // garante mandante à esquerda
  const [casa, fora] = a.teamId === m.home.id ? [a, b] : [b, a];
  const linhas = casa.stats.map((s) => {
    const v2 = fora.stats.find((x) => x.key === s.key)?.value ?? '0';
    const n1 = parseFloat(s.value) || 0, n2 = parseFloat(v2) || 0, tot = n1 + n2 || 1;
    return `<div class="estatistica"><div class="valores"><span>${esc(s.value)}</span><span>${esc(s.label)}</span><span>${esc(v2)}</span></div>
      <div class="barra"><i style="width:${(n1 / tot) * 100}%"></i><i style="width:${(n2 / tot) * 100}%"></i></div></div>`;
  }).join('');
  return `<div class="card bloco"><h3>📊 Estatísticas</h3>${linhas}</div>`;
}

function blocoEscalacoes(m) {
  if (!m.lineups.length || !m.lineups.some((l) => l.starters.length)) {
    return '<div class="card bloco largo"><h3>👕 Escalações</h3><p class="vazio">As escalações ficam disponíveis perto do horário da partida.</p></div>';
  }
  const ordem = [...m.lineups].sort((x, y) => (y.teamId === m.home.id) - (x.teamId === m.home.id));
  const jogador = (p) => `<li><b>${esc(p.number)}</b><span>${esc(p.name)}</span><span>${esc(p.position)}</span></li>`;
  const col = (l) => `
    <div class="escalacao">
      <h4>${l.logo ? `<img src="${esc(l.logo)}" alt="" onerror="this.remove()">` : ''}${esc(l.team)} ${l.formation ? `<em>${esc(l.formation)}</em>` : ''}</h4>
      <ul>${l.starters.map(jogador).join('')}</ul>
      ${l.bench.length ? `<p class="reservas">Reservas</p><ul>${l.bench.map(jogador).join('')}</ul>` : ''}
    </div>`;
  return `<div class="card bloco largo"><h3>👕 Escalações</h3><div class="escalacoes">${ordem.map(col).join('')}</div></div>`;
}

function blocoFicha(m) {
  const campos = [
    ['Competição', m.competition],
    ['Data', fmt.dataLonga(m.date) + ' · ' + fmt.data(m.date)],
    ['Horário (Brasília)', fmt.hora(m.date)],
    ['Estádio', m.details?.venue || m.venue],
    ['Cidade', m.details?.city || m.city],
    ['Mandante', m.home.name],
    ['Visitante', m.away.name],
    ['Árbitro', m.details?.referee],
    ['Público', m.details?.attendance ? m.details.attendance.toLocaleString('pt-BR') : null],
  ].filter(([, v]) => v);
  return `<div class="card bloco largo"><h3>📋 Ficha da partida</h3><div class="ficha">${campos.map(([k, v]) => `<div><small>${k}</small><strong>${esc(v)}</strong></div>`).join('')}</div></div>`;
}

(async () => {
  if (!id) { cab.innerHTML += '<p class="erro">Partida não informada.</p>'; return; }
  try {
    const m = await api(`/jogos/${encodeURIComponent(id)}`);
    document.title = `${m.home.name} x ${m.away.name} · Cruzeiro`;
    const time = (t) => `<div class="time">${escudoTime(t)}<span>${esc(t.name)}</span></div>`;
    const meio = m.status.state === 'pre'
      ? `<div><div class="vs">VS</div><div>${fmt.hora(m.date)}</div></div>`
      : `<div class="placar-grande">${esc(m.home.score)} × ${esc(m.away.score)}</div>`;
    cab.innerHTML = `
      <a class="voltar" href="jogos.html">← Voltar para os jogos</a>
      <div><span class="chip">${esc(m.competition)}</span> ${statusChip(m)}</div>
      <div class="confronto">${time(m.home)}${meio}${time(m.away)}</div>
      <div class="info-linha"><span>📅 ${fmt.dataLonga(m.date)}</span><span>⏰ ${fmt.hora(m.date)}</span><span>🏟️ ${esc(m.venue || 'A definir')}</span></div>`;

    det.innerHTML = [
      blocoFicha(m),
      blocoGols(m),
      blocoCartoes(m),
      blocoSubs(m),
      blocoEstatisticas(m),
      blocoEscalacoes(m),
    ].join('');
  } catch (e) {
    cab.innerHTML = `<a class="voltar" href="jogos.html">← Voltar para os jogos</a><p class="erro" style="color:#fff">${esc(e.message)}</p>`;
  }
})();
