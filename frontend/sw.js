// Service worker do app (PWA): deixa o site instalável, rápido e com conteúdo offline
const VERSAO = 'cruzeiro-v2';
const ESSENCIAIS = [
  '/', '/index.html', '/jogos.html', '/classificacao.html', '/historia.html', '/titulos.html', '/partida.html',
  '/css/style.css', '/js/common.js', '/js/home.js', '/js/jogos.js', '/js/classificacao.js', '/js/partida.js',
  '/manifest.json', '/assets/images/raposa.svg', '/assets/images/trofeus.png', '/assets/icons/icon-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ESSENCIAIS)).then(() => self.skipWaiting()));
});

// Apaga caches de versões antigas
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
    .then(() => self.clients.claim()));
});

// Rede primeiro (dados sempre atualizados); sem internet, usa a última cópia salva
async function redePrimeiro(req) {
  const cache = await caches.open(VERSAO);
  try {
    const resp = await fetch(req);
    if (resp.ok) cache.put(req, resp.clone());
    return resp;
  } catch {
    const salvo = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (salvo) return salvo;
    if (req.url.includes('/api/')) {
      return new Response(JSON.stringify({ erro: 'Sem internet. Conecte-se para ver os dados mais recentes.' }),
        { status: 503, headers: { 'Content-Type': 'application/json' } });
    }
    return caches.match('/index.html');
  }
}

// Arquivos estáticos (CSS, JS, imagens): cache primeiro e atualiza em segundo plano
async function cachePrimeiro(req) {
  const cache = await caches.open(VERSAO);
  // Sem a versão exata (?v=...), serve a cópia mais recente do mesmo arquivo
  const salvo = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true }));
  const atualizar = fetch(req).then((resp) => { if (resp.ok) cache.put(req, resp.clone()); return resp; }).catch(() => salvo);
  return salvo || atualizar;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === location.origin) {
    const ehPagina = req.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/';
    e.respondWith(ehPagina || url.pathname.startsWith('/api/') ? redePrimeiro(req) : cachePrimeiro(req));
  } else if (/espncdn\.com|fonts\.(googleapis|gstatic)\.com/.test(url.host)) {
    e.respondWith(cachePrimeiro(req)); // escudos dos times e fontes
  }
});
