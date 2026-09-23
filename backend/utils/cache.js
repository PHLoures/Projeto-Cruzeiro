// Cache simples em memória para não repetir chamadas à API externa a cada requisição
const store = new Map();

async function remember(key, ttlMs, loader) {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value;

  const value = await loader();
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

module.exports = { remember };
