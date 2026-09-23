// Página de classificação: tabela por competição (ou campanha, no caso de mata-mata)
const conteudo = document.getElementById('conteudo');
const cacheDados = {};

// Faixas do Brasileirão (a ESPN não informa as zonas). Podem variar conforme os campeões das copas.
const ZONAS_BRASILEIRAO = [
  { de: 1, ate: 4, nome: 'Libertadores (fase de grupos)', cor: '#16a34a' },
  { de: 5, ate: 5, nome: 'Pré-Libertadores', cor: '#65c38a' },
  { de: 6, ate: 11, nome: 'Copa Sul-Americana', cor: '#3d7bff' },
  { de: 17, ate: 20, nome: 'Rebaixamento', cor: '#dc2626' },
];

function zonaDoTime(comp, t) {
  if (comp === 'bra.1') return ZONAS_BRASILEIRAO.find((z) => t.posicao >= z.de && t.posicao <= z.ate) || null;
  return t.zona ? { nome: t.zona.descricao, cor: t.zona.cor } : null;
}

function tabelaHtml(comp, grupo) {
  const linhas = grupo.times.map((t) => {
    const z = zonaDoTime(comp, t);
    return `
      <tr class="${t.cruzeiro ? 'linha-cruzeiro' : ''}">
        <td class="pos"><span style="${z ? `box-shadow: inset 3px 0 0 ${z.cor}` : ''}">${t.posicao ?? '-'}</span></td>
        <td class="clube-col"><div class="clube-cel">${escudoTime({ name: t.nome, logo: t.logo })}<span>${esc(t.nome)}</span></div></td>
        <td class="pts">${t.pontos}</td>
        <td>${t.jogos}</td><td>${t.vitorias}</td><td>${t.empates}</td><td>${t.derrotas}</td>
        <td class="opc">${t.golsPro}</td><td class="opc">${t.golsContra}</td><td>${esc(t.saldo)}</td>
      </tr>`;
  }).join('');

  return `
    <div class="card tabela-card">
      ${grupo.nome && !/^\d{4}$/.test(grupo.nome) ? `<h3 class="tabela-titulo">${esc(grupo.nome)}</h3>` : ''}
      <div class="tabela-rolagem">
        <table class="tabela">
          <thead><tr><th>#</th><th class="clube-col">Clube</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th class="opc">GP</th><th class="opc">GC</th><th>SG</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    </div>`;
}

function legendaHtml(comp, grupos) {
  let zonas = [];
  if (comp === 'bra.1') zonas = ZONAS_BRASILEIRAO;
  else {
    const vistas = new Map();
    grupos.forEach((g) => g.times.forEach((t) => t.zona && vistas.set(t.zona.descricao, { nome: t.zona.descricao, cor: t.zona.cor })));
    zonas = [...vistas.values()];
  }
  if (!zonas.length) return '';
  const traduz = (n) => n
    .replace(/Qualifies for Round of 16/i, 'Classificado às oitavas')
    .replace(/Qualifies for Sudamericana KO Playoffs/i, 'Vai para os playoffs da Sul-Americana')
    .replace(/Sudamericana/i, 'Sul-Americana')
    .replace(/Qualifies for/i, 'Classificado para');
  return `<div class="legenda">${zonas.map((z) => `<span><i style="background:${z.cor}"></i>${esc(traduz(z.nome))}</span>`).join('')}
    ${comp === 'bra.1' ? '<small>As vagas podem mudar conforme os campeões da Copa do Brasil e da Libertadores.</small>' : ''}</div>`;
}

function resumoCruzeiro(grupos) {
  for (const g of grupos) {
    const t = g.times.find((x) => x.cruzeiro);
    if (t) {
      const aprov = t.jogos ? Math.round((t.pontos / (t.jogos * 3)) * 100) : 0;
      return `
        <div class="stats-grid" style="margin-bottom:24px">
          <div class="card stat"><b>${t.posicao}º</b><span>Posição${g.nome && !/^\d{4}$/.test(g.nome) ? ` no ${esc(g.nome)}` : ''}</span></div>
          <div class="card stat"><b>${t.pontos}</b><span>Pontos</span></div>
          <div class="card stat"><b>${t.vitorias}-${t.empates}-${t.derrotas}</b><span>V - E - D</span></div>
          <div class="card stat"><b>${aprov}%</b><span>Aproveitamento</span></div>
        </div>`;
    }
  }
  return '';
}

// Chaveamento: uma coluna por fase, com os confrontos alinhados aos que os alimentam
function confrontoChave(c) {
  const idaVolta = c.pernas.length > 1;
  const cabecalho = idaVolta
    ? `<div class="chave-cab"><span></span><span></span><span>Ida</span><span>Volta</span><span>Agr</span></div>`
    : '';
  const linha = (t) => {
    const classe = c.vencedor ? (t.id === c.vencedor ? 'passou' : 'caiu') : '';
    const pernas = idaVolta
      ? c.pernas.map((p) => `<span class="perna">${t.id && p.placar[t.id] !== undefined ? p.placar[t.id] : '–'}</span>`).join('')
      : '';
    return `<div class="chave-time ${idaVolta ? 'ida-volta' : ''} ${classe} ${t.id === '2022' ? 'eh-cruzeiro' : ''}">
      ${t.id ? escudoTime({ name: t.nome, logo: t.logo }) : '<span class="escudo-generico">?</span>'}
      <span class="nome">${esc(t.nome)}</span>
      ${pernas}<b>${t.gols ?? ''}</b>
    </div>`;
  };
  const conteudo = `${cabecalho}${linha(c.times[0])}${linha(c.times[1])}${c.penaltis && c.encerrado ? '<small class="pen">Decidido nos pênaltis</small>' : ''}`;
  if (c.cruzeiro && c.jogoIds.length) {
    return `<a class="chave-confronto destaque" href="partida.html?id=${encodeURIComponent(c.jogoIds[c.jogoIds.length - 1])}">${conteudo}</a>`;
  }
  return `<div class="chave-confronto">${conteudo}</div>`;
}

function campeaoHtml(fase) {
  const final = fase.confrontos.length === 1 && /final/i.test(fase.nome) && !/semi/i.test(fase.nome) ? fase.confrontos[0] : null;
  const campeao = final && final.vencedor && final.times.find((t) => t.id === final.vencedor);
  return campeao ? `<div class="campeao">🏆 Campeão<strong>${esc(campeao.nome)}</strong></div>` : '';
}

function chaveHtml(chave) {
  if (!chave || !chave.fases.some((f) => f.confrontos.length)) return '';
  const fases = chave.fases.filter((f) => f.confrontos.length);
  return `
    <div class="secao-titulo" style="margin-top:40px"><div><small>Mata-mata</small><h2>Chaveamento</h2></div></div>
    <div class="chave-rolagem">
      <div class="chave" style="--fases:${fases.length}">
        ${fases.map((f) => `
          <div class="chave-fase">
            <h4>${esc(f.nome)}</h4>
            <div class="chave-coluna">${f.confrontos.map((c) => `
              <div class="chave-slot"><div class="chave-item">${confrontoChave(c)}${campeaoHtml(f)}</div></div>`).join('')}</div>
          </div>`).join('')}
      </div>
    </div>
    <p class="vazio" style="margin-top:10px">Nos confrontos de ida e volta, aparecem os dois placares e o agregado (Agr.) em destaque. Clique no confronto do Cruzeiro para ver os detalhes.</p>`;
}

// Copa do Brasil (só mata-mata): agrupa os jogos do Cruzeiro por adversário = cada confronto
function campanhaHtml(jogos, chave) {
  if (!jogos.length) return '<p class="vazio">O Cruzeiro não tem jogos nesta competição em 2026.</p>';
  const confrontos = [];
  jogos.forEach((m) => {
    const ultimo = confrontos[confrontos.length - 1];
    if (ultimo && ultimo.rival === m.opponent.id) ultimo.jogos.push(m);
    else confrontos.push({ rival: m.opponent.id, nome: m.opponent.name, jogos: [m] });
  });

  return confrontos.map((c, i) => {
    const feitos = c.jogos.filter((m) => m.status.completed);
    const soma = (lado) => feitos.reduce((acc, m) => acc + Number((lado === 'pro') === m.cruzeiroHome ? m.home.score : m.away.score), 0);
    const pro = soma('pro'), contra = soma('contra');
    const encerrado = feitos.length === c.jogos.length;
    let status = '<span class="chip">Em andamento</span>';
    if (encerrado) {
      const passou = pro > contra || (pro === contra && c.jogos.some((m) => (m.cruzeiroHome ? m.home : m.away).winner));
      status = passou ? '<span class="chip chip-v">Classificado</span>' : '<span class="chip chip-d">Eliminado</span>';
    }
    const todas = chave ? [...chave.anteriores.map((x) => ({ nome: x.fase, confrontos: [x] })), ...chave.fases] : [];
    const fase = todas.find((f) => f.confrontos.some((x) => x.cruzeiro && x.times.some((t) => t.id === c.rival)));
    return `
      <div class="confronto-copa">
        <div class="fase"><b>${esc(fase ? fase.nome : `${i + 1}º confronto`)}</b> · contra <strong>${esc(c.nome)}</strong> ${status}
          ${feitos.length > 1 ? `<span class="agregado">Agregado: Cruzeiro ${pro} × ${contra}</span>` : ''}</div>
        <div class="lista-jogos">${c.jogos.map(cardJogo).join('')}</div>
      </div>`;
  }).join('');
}

async function carregar(comp) {
  conteudo.innerHTML = '<div class="carregando">Carregando classificação…</div>';
  try {
    if (!cacheDados[comp]) {
      const [tab, jogos] = await Promise.all([api(`/classificacao/${comp}`), api(`/jogos?competicao=${comp}`)]);
      cacheDados[comp] = { tab, jogos: jogos.jogos };
    }
    const { tab, jogos } = cacheDados[comp];
    const grupos = tab.grupos;

    if (!grupos.length) {
      conteudo.innerHTML = `
        ${chaveHtml(tab.chave)}
        <div class="secao-titulo" style="margin-top:48px"><div><small>${esc(tab.nome)}</small><h2>Campanha do Cruzeiro</h2></div></div>
        ${campanhaHtml(jogos, tab.chave)}`;
      return;
    }

    const doCruzeiro = grupos.filter((g) => g.temCruzeiro);
    const outros = grupos.filter((g) => !g.temCruzeiro);
    conteudo.innerHTML = `
      ${resumoCruzeiro(grupos)}
      ${doCruzeiro.map((g) => tabelaHtml(comp, g)).join('')}
      ${legendaHtml(comp, grupos)}
      ${outros.length ? `
        <details class="outros-grupos">
          <summary>Ver os outros ${outros.length} grupos</summary>
          <div class="grupos-grid">${outros.map((g) => tabelaHtml(comp, g)).join('')}</div>
        </details>` : ''}
      ${chaveHtml(tab.chave)}
      ${grupos.length > 1 || comp !== 'bra.1' ? `
        <div class="secao-titulo" style="margin-top:40px"><div><small>${esc(tab.nome)}</small><h2>Jogos do Cruzeiro</h2></div></div>
        <div class="lista-jogos">${jogos.map(cardJogo).join('') || '<p class="vazio">Sem jogos.</p>'}</div>` : ''}`;
  } catch (e) {
    conteudo.innerHTML = `<p class="erro">${esc(e.message)}</p>`;
  }
}

document.querySelectorAll('#abas-comp button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#abas-comp button').forEach((b) => b.classList.toggle('ativo', b === btn));
    history.replaceState(null, '', `?comp=${btn.dataset.comp}`);
    carregar(btn.dataset.comp);
  });
});

// Permite abrir direto numa competição: classificacao.html?comp=conmebol.libertadores
const inicial = new URLSearchParams(location.search).get('comp');
const botaoInicial = document.querySelector(`#abas-comp button[data-comp="${inicial}"]`) || document.querySelector('#abas-comp button');
botaoInicial.click();
