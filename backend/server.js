const path = require('path');
const express = require('express');
const config = require('./config');
const jogosRoutes = require('./routes/jogos');
const classificacaoRoutes = require('./routes/classificacao');

const app = express();

// API própria do projeto
app.use('/api/jogos', jogosRoutes);
app.use('/api/classificacao', classificacaoRoutes);
app.get('/api/status', (req, res) => res.json({ ok: true, temporada: config.season }));
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Frontend estático
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.listen(config.port, () => {
  console.log(`⭐ Projeto Cruzeiro rodando em http://localhost:${config.port}`);
});
