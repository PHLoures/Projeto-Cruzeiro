# ⭐ Projeto Cruzeiro

Site sobre o **Cruzeiro Esporte Clube** focado nos jogos da **temporada 2026**: partidas já disputadas, próximos jogos, placares, escalações, gols, cartões, substituições e estatísticas.

Frontend em HTML/CSS/JavaScript puro e uma API própria em Node.js + Express que consome dados da ESPN.

## Funcionalidades

- **Início:** hero com escudo, próximo jogo com contagem regressiva, último resultado, resumo da temporada (V/E/D, gols, aproveitamento, últimos 5), próximos jogos e seção sobre o clube.
- **Jogos 2026:** todas as partidas do ano agrupadas por mês, com filtros *Todos / Resultados / Próximos* e por competição.
- **Detalhes da partida:** ficha técnica (estádio, cidade, árbitro, público), gols e assistências, cartões, substituições, estatísticas comparativas e escalações com formação e reservas.
- Competições: Brasileirão Série A, Copa do Brasil, Libertadores, Sul-Americana e Campeonato Mineiro.
- Layout responsivo (celular, tablet e desktop).

## Tecnologias

| Camada   | Tecnologia |
|----------|-----------|
| Frontend | HTML5, CSS3, JavaScript (sem frameworks) |
| Backend  | Node.js (≥ 20.12) + Express 4 |
| Dados    | API pública da ESPN |

A única dependência é o **Express**. O `.env` é lido com `process.loadEnvFile()`, recurso nativo do Node, por isso não é preciso instalar o `dotenv`.

## Estrutura

```text
ProjetoCruzeiro/
├── backend/
│   ├── server.js                  # Sobe o Express, a API e serve o frontend
│   ├── config.js                  # Lê o .env e define as competições
│   ├── routes/jogos.js            # Define as rotas /api/jogos
│   ├── controllers/jogosController.js  # Filtros, resumo, tratamento de erros
│   ├── services/espnService.js    # ÚNICO ponto que conversa com a API externa
│   ├── services/matchMapper.js    # Converte o JSON da ESPN para o nosso formato
│   └── utils/cache.js             # Cache em memória
├── frontend/
│   ├── index.html · jogos.html · partida.html
│   ├── css/style.css
│   ├── js/common.js · home.js · jogos.js · partida.js
│   └── assets/images/             # Imagens do site (veja LEIA-ME.md)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Instalação e execução

Pré-requisito: [Node.js](https://nodejs.org) 20.12 ou superior.

```bash
git clone https://github.com/PHLoures/Projeto-Cruzeiro.git
cd Projeto-Cruzeiro
cp .env.example .env    # opcional
npm install
npm start
```

Abra **http://localhost:3000**. Para reiniciar automaticamente ao editar o código, use `npm run dev`.

## Configuração (.env) e API Key

**A API da ESPN não exige chave.** O `.env` é opcional e só guarda configurações:

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `PORT` | `3000` | Porta do servidor |
| `SEASON` | `2026` | Temporada exibida |
| `CACHE_TTL_SECONDS` | `600` | Tempo de cache da lista de jogos |

Se no futuro você trocar para uma API com chave (ex.: API-Football), coloque-a **somente** no `.env` (ex.: `API_FOOTBALL_KEY=...`) e leia com `process.env` em `backend/config.js`. O `.env` está no `.gitignore` e nunca vai para o GitHub.

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/api/jogos` | Todos os jogos de 2026. Filtros: `?competicao=bra.1`, `?status=anteriores\|proximos` |
| GET | `/api/jogos/proximos` | Próximos jogos (`?limite=5`) |
| GET | `/api/jogos/anteriores` | Jogos disputados, mais recente primeiro (`?limite=5`) |
| GET | `/api/jogos/resumo` | Vitórias, empates, derrotas, gols, aproveitamento, últimos 5 |
| GET | `/api/jogos/competicoes` | Competições com jogos na temporada |
| GET | `/api/jogos/:id` | Detalhes da partida: gols, cartões, substituições, escalações, estatísticas |
| GET | `/api/status` | Verifica se o servidor está no ar |

## API externa: ESPN

Por que a ESPN:

- **Sem chave e sem cadastro**, com dados da temporada atual (2026).
- Cobre todas as competições do Cruzeiro, incluindo o Mineiro.
- Traz escalações, gols com assistências, cartões, substituições, árbitro e estatísticas.

Alternativas avaliadas:

- **API-Football (api-sports.io):** muito completa, mas o plano gratuito tem 100 requisições/dia e não libera a temporada atual.
- **football-data.org:** gratuita com chave, mas o plano grátis não tem Copa do Brasil nem Mineiro e não traz escalações e cartões.

**Limitações da ESPN:**

- A API é pública mas **não oficial nem documentada**, e pode mudar sem aviso. Todo o acesso a ela fica isolado em `services/espnService.js` e `matchMapper.js`, então uma troca de API só mexe nesses arquivos.
- Não há limite de requisições publicado. O backend usa cache (10 min para a lista, 1 h para partidas encerradas e 1 min para jogos ao vivo) para evitar chamadas em excesso.
- Escalações só aparecem perto do horário do jogo, e alguns jogos do Mineiro têm menos detalhes.

## Imagens

As imagens ficam em `frontend/assets/images/` com nomes fixos (`escudo.png`, `hero.jpg`, `estadio.jpg`, `torcida.jpg`, `partida.jpg`). Veja o `LEIA-ME.md` da pasta. Enquanto uma imagem não existir, o site usa um fundo em degradê azul ou o escudo servido pela ESPN.

## Como contribuir

1. Faça um fork e crie uma branch: `git checkout -b minha-melhoria`
2. Faça commits pequenos e descritivos.
3. Nunca envie o `.env` nem chaves de API.
4. Abra um Pull Request explicando o que mudou.

---

Projeto de fã, sem vínculo oficial com o Cruzeiro Esporte Clube. Escudos e marcas pertencem aos seus donos.
