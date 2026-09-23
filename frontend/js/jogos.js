// Página de jogos: lista completa da temporada com filtros por status e competição
const estado = { status: 'todos', competicao: '', jogos: [] };
const lista = document.getElementById('lista');
const select = document.getElementById('competicao');

function render() {
  let jogos = estado.jogos;
  if (estado.competicao) jogos = jogos.filter((m) => m.league === estado.competicao);
  if (estado.status === 'anteriores') jogos = jogos.filter((m) => m.status.completed).reverse();
  if (estado.status === 'proximos') jogos = jogos.filter((m) => !m.status.completed);

  if (!jogos.length) { lista.innerHTML = '<p class="vazio carregando">Nenhum jogo encontrado para este filtro.</p>'; return; }

  // Agrupa por mês
  const grupos = new Map();
  jogos.forEach((m) => {
    const mes = fmt.mes(m.date);
    if (!grupos.has(mes)) grupos.set(mes, []);
    grupos.get(mes).push(m);
  });

  lista.innerHTML = [...grupos].map(([mes, js]) => `
    <section class="grupo-mes">
      <h3>${esc(mes)}</h3>
      <div class="lista-jogos">${js.map(cardJogo).join('')}</div>
    </section>`).join('');
}

document.querySelectorAll('.abas button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.abas button').forEach((b) => b.classList.toggle('ativo', b === btn));
    estado.status = btn.dataset.status;
    render();
  });
});
select.addEventListener('change', () => { estado.competicao = select.value; render(); });

(async () => {
  try {
    const [{ jogos }, competicoes] = await Promise.all([api('/jogos'), api('/jogos/competicoes')]);
    estado.jogos = jogos;
    select.innerHTML += competicoes.map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join('');
    const feitos = jogos.filter((m) => m.status.completed).length;
    document.getElementById('subtitulo').textContent = `${jogos.length} partidas · ${feitos} disputadas · ${jogos.length - feitos} para disputar`;
    render();
  } catch (e) {
    lista.innerHTML = `<p class="erro">${esc(e.message)}</p>`;
  }
})();
