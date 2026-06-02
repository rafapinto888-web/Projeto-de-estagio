# Sistema de inventário informático

Aplicação web para **gestão de inventário de TI**: inventários, computadores, localizações, utilizadores com perfis, descoberta na rede (scan), pesquisa global, logs e exportação para Excel. Projeto **full stack** (FastAPI + React + PostgreSQL), desenvolvido em contexto de estágio.

## Funcionalidades

| Área | Descrição |
|------|-----------|
| **Dashboard** | Resumo e métricas do inventário |
| **Inventários** | CRUD de inventários (normal / sub-rede) |
| **Scan** | Listagem de ativos e scan de rede com credenciais (admin) |
| **Computadores** | Registo e gestão de equipamento; export Excel |
| **Utilizadores / perfis** | Contas e permissões (operações admin condicionadas ao perfil) |
| **Localizações** | CRUD de localizações físicas |
| **Pesquisa global** | Pesquisa por texto e filtros (tipo, estado, localização) |
| **Histórico** | Auditoria das ações da conta autenticada |
| **Logs** | Consulta de logs por computador ou inventário |

Autenticação por **JWT** (Bearer). O painel, após login, carrega inventários, computadores, utilizadores, perfis, localizações e histórico.

**API:** `GET /computadores/?com_scan=true` inclui dispositivos do scan; sem o parâmetro, só manuais.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Backend | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, Pydantic, PostgreSQL, JWT, Argon2 (hash de passwords) |
| Frontend | React 18, Vite 5, Material UI (MUI), Emotion, `xlsx` (export) |
| Infra | Docker Compose (perfis opcionais: frontend, API, Postgres) |
| API docs | Swagger em `/docs` — obtém token em `POST /auth/login` e usa **Authorize** com Bearer JWT nas restantes rotas |

## Estrutura do repositório

```text
backend/app/
  core/          # arranque FastAPI, segurança, CORS, seed admin
  database/      # ligação SQLAlchemy, sessão
  models/        # ORM
  routes/        # endpoints (auth, inventários, computadores, …)
  schemas/       # Pydantic
  services/      # scan de rede, logs Windows, …
frontend/src/
  pages/         # Dashboard, Inventários, Scan, …
  components/    # layout, tabelas, modais
  api.js         # cliente HTTP
  App.jsx        # estado global e navegação por abas (#hash)
docs/            # requisitos, diagramas, comandos Docker
scripts/         # atalhos PowerShell (Docker)
docker-compose.yml
```

## Variáveis de ambiente

Cria **`backend/.env`** (não commits com passwords em repositório público). O backend carrega este ficheiro ao arrancar.

| Variável | Obrigatório | Uso |
|----------|-------------|-----|
| `DATABASE_URL` | Sim | Ligação SQLAlchemy ao PostgreSQL, ex.: `postgresql+psycopg2://USER:PASS@HOST:PORT/NOME_BD` |
| `SECRET_KEY` | Recomendado em produção | Assinatura dos JWT (há valor de desenvolvimento no código se omitires) |
| `INVENTARIO_CORS_ORIGINS` | Opcional | Origens do frontend separadas por vírgula; por defeito inclui `http://localhost:5173` e `127.0.0.1` equivalentes (ver `app/core/config.py`) |
| `INVENTARIO_APP_ENV` | Opcional | `development` ou `production` (avisos, ex.: `SECRET_KEY` por defeito) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | Opcional | Validade dos tokens (ver `app/core/security.py`) |

No **frontend** em Docker, `VITE_API_BASE` define a URL da API (por defeito no compose: `http://localhost:8000`).

## Base de dados e conta inicial

1. **Schema** — As tabelas e constraints devem existir na base **antes** de usares a API (criação em SQL/pgAdmin ou migração; o projeto não corre `create_all` automático).
2. **`DATABASE_URL`** — Aponta para essa base (PostgreSQL).
3. **Utilizador `admin`** — Ao arranque, se não existir username `admin`, o backend cria conta **admin** / **inventario123**, email `admin@inventario.local`, com perfil de administrador (ou cria o perfil `Admin` se não houver perfil reconhecido como admin). Ver `backend/app/core/bootstrap.py`. **Em produção altera a password** após o primeiro login.

## Como executar (desenvolvimento no PC)

Precisas de **PostgreSQL acessível**, **API** (porta 8000) e **frontend** (porta 5173) em paralelo.

### 1. Criar a base e o schema

```sql
CREATE DATABASE inventario;
```

Depois aplica o script ou modelo físico que tiveres (tabelas `perfis`, `utilizadores`, `inventarios`, etc.).

### 2. Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Define `DATABASE_URL` em `backend/.env` **ou** no terminal, por exemplo:

```powershell
$env:DATABASE_URL = "postgresql+psycopg2://postgres:TU_PASSWORD@127.0.0.1:5432/inventario"
.venv\Scripts\python.exe -m uvicorn app.core.main:app --reload --host 127.0.0.1 --port 8000
```

Linux/macOS: ativa o venv, `export DATABASE_URL=...`, mesmo comando `uvicorn`.

- API: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Login na UI ou `POST /auth/login` com `admin` / `inventario123` (se o seed tiver corrido).

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
```

- Site: [http://127.0.0.1:5173](http://127.0.0.1:5173) (ou `localhost`)

Por defeito o cliente usa `http://localhost:8000` como API (`frontend/src/api.js`); se a API estiver só em `127.0.0.1`, confirma que o browser consegue resolver (ou alinha host/porta).

## Docker Compose

Perfis úteis (ver `docker-compose.yml`):

| Perfil | Serviço | Descrição |
|--------|---------|-----------|
| `dev-live` | `web-dev` | Frontend Vite com hot reload, porta **5173** |
| `docker-api` | `api` | Backend no contentor (lê `backend/.env`) |
| `bundled-db` | `db` | Postgres 16, no host **localhost:5433**, user `postgres`, password `inventario-docker`, BD `inventario` |

**Postgres só em Docker, API no Windows (caso comum):** no `.env` / terminal usa host `127.0.0.1` e porta **5433**:

`postgresql+psycopg2://postgres:inventario-docker@127.0.0.1:5433/inventario`

**API e Postgres ambos em Docker** (mesmo `docker compose`): dentro da rede Docker o hostname do serviço é `db` e a porta interna é **5432** (não uses `localhost:5433` dentro do contentor da API):

`postgresql+psycopg2://postgres:inventario-docker@db:5432/inventario`

O serviço `api` monta `./backend` e usa `env_file: ./backend/.env` — tens de ter `DATABASE_URL` (e `SECRET_KEY` em produção) definidos aí.

### Atalhos

- Só frontend em Docker: `.\scripts\docker-subir-dev.ps1` (continua a precisar da API em `localhost:8000`, normalmente no host Windows para scan/logs na rede).
- Frontend + API + Postgres: `.\scripts\docker-subir-tudo.ps1` — ver mensagens do script para URLs.

Scan e consulta de logs Windows funcionam melhor com a **API a correr no host Windows**, não só dentro do contentor.

Mais comandos: [`docs/comandos.txt`](docs/comandos.txt).

## Clonar noutro PC (resumo)

1. Clonar ou copiar o repo (com `frontend/package-lock.json`).
2. PostgreSQL local **ou** `docker compose --profile bundled-db up -d` e `DATABASE_URL` com porta **5433** se acederes do host.
3. Criar/importar **schema** na base; arrancar API e frontend como acima.
4. Login inicial: **admin** / **inventario123** (se o utilizador ainda não existir).

## Documentação adicional

- [`docs/estrutura de requisitos do projeto.txt`](docs/estrutura%20de%20requisitos%20do%20projeto.txt) — requisitos funcionais
- [`docs/diagramas/`](docs/diagramas/) — diagramas (sequência em PDF, ER, etc.)
- [`docs/comandos.txt`](docs/comandos.txt) — Docker
- [`docs/pendencias-melhorias.txt`](docs/pendencias-melhorias.txt) — ideias / trabalho futuro

## Regras de negócio relevantes

- **Apagar computador**: bloqueado se existir utilizador responsável associado.
- **Delete com logs**: sem responsável, logs técnicos do computador podem ser removidos antes do delete (evita bloqueio por FK).
- **Scan**: credenciais de rede no momento do scan (não são as do login da aplicação).

## Estado e limitações

- Sem suíte de testes automatizada documentada; validação manual via UI e Swagger.
- Scan e logs dependem de rede, credenciais e, onde aplicável, ambiente Windows.
- Navegação por **abas** em `App.jsx` (sem React Router nesta fase).

## Licença

Projeto académico / estágio — uso interno e demonstração.
