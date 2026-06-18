# Sistema de inventario informatico

Aplicacao web para gestao de inventario de TI, com frontend React e backend FastAPI. O projeto cobre autenticacao por sessao com cookie HttpOnly, gestao de inventarios, computadores, utilizadores, perfis, localizacoes, pesquisa global, auditoria e operacoes de scan/logs em ambiente Windows.

## O que a aplicacao faz

- Dashboard com metricas do inventario.
- CRUD de inventarios, incluindo inventarios do tipo sub-rede.
- Gestao de computadores manuais e vista unificada com ativos detetados por scan.
- Gestao de utilizadores, perfis e localizacoes.
- Pesquisa global por texto.
- Historico da conta autenticada e logs associados.
- Exportacao para Excel no frontend.
- Autenticacao por sessao guardada no backend, sem `access_token` nem `refresh_token` no browser.

## Stack

| Camada | Tecnologias |
| --- | --- |
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy, Pydantic, PostgreSQL, `pwdlib[argon2]` |
| Frontend | React 18, Vite 5, Material UI, Emotion, `xlsx` |
| Testes | Playwright |
| Infra | Docker Compose com perfis separados para frontend, API e Postgres |

## Estrutura do repositorio

```text
backend/
  app/
    core/         # arranque FastAPI, config, seguranca, OpenAPI
    database/     # ligacao SQLAlchemy
    models/       # modelos ORM
    routes/       # endpoints REST
    schemas/      # schemas Pydantic
    services/     # scan de rede e logs Windows
frontend/
  src/
    components/   # UI reutilizavel
    pages/        # paginas do painel
    domain/       # labels e helpers por dominio
    api.js        # cliente HTTP com sessao por cookie
  tests/          # testes E2E Playwright
docs/             # requisitos, comandos e diagramas
scripts/          # scripts PowerShell e SQL auxiliares
docker-compose.yml
```

## Autenticacao

O fluxo atual usa sessao tradicional no servidor:

1. `POST /auth/login` valida `username/email + password`.
2. O backend cria um token aleatorio e guarda apenas o hash na tabela `sessoes_utilizador`.
3. A resposta define um cookie `HttpOnly` no browser.
4. Os pedidos seguintes enviam esse cookie automaticamente com `credentials: "include"`.
5. Cada rota protegida valida a sessao e renova a expiracao (`sliding session`).
6. `POST /auth/logout` revoga a sessao atual e limpa o cookie.

Notas importantes:

- O frontend nao guarda tokens em `localStorage`.
- O nome do cookie e configuravel por `SESSION_COOKIE_NAME`.
- A politica `SameSite` do cookie e configuravel por `SESSION_COOKIE_SAMESITE` e por defeito fica em `lax`.
- Em producao deve ser usado `SESSION_COOKIE_SECURE=true`.

## Variaveis de ambiente

O backend carrega `backend/.env` no arranque.

| Variavel | Obrigatorio | Uso |
| --- | --- | --- |
| `DATABASE_URL` | Sim | Ligacao SQLAlchemy ao PostgreSQL |
| `SECRET_KEY` | Recomendado | Segredo geral da aplicacao; em producao nao uses o valor por defeito |
| `INVENTARIO_APP_ENV` | Nao | `development` ou `production` |
| `INVENTARIO_CORS_ORIGINS` | Nao | Lista separada por virgulas com as origens permitidas |
| `SESSION_EXPIRE_MINUTES` | Nao | Duracao base da sessao, renovada em cada pedido autenticado |
| `SESSION_COOKIE_NAME` | Nao | Nome do cookie de sessao; default `inventario_session` |
| `SESSION_COOKIE_SECURE` | Nao | `true/false`; em producao deve ficar `true` |
| `SESSION_COOKIE_SAMESITE` | Nao | Politica `SameSite`; default `lax` |

O frontend pode receber:

| Variavel | Uso |
| --- | --- |
| `VITE_API_BASE` | URL base da API usada pelo frontend |

Defaults relevantes do projeto:

- API local: `http://127.0.0.1:8000`
- Frontend Vite: `http://127.0.0.1:5173`
- CORS por defeito aceita `localhost:5173`, `127.0.0.1:5173`, `localhost:5174`, `127.0.0.1:5174` e `localhost:80`

## Base de dados e conta inicial

- O dominio principal da base de dados nao e criado automaticamente.
- A tabela `sessoes_utilizador` e criada no arranque, se ainda nao existir.
- Ao arrancar, o backend tenta garantir um utilizador inicial `admin`.
- Credenciais iniciais esperadas: `admin` / `inventario123`.
- Depois do primeiro login, altera a password se fores usar isto fora de ambiente local.

## Arranque local

### 1. Preparar a base de dados

Cria a base no PostgreSQL e aplica o schema principal do projeto pelas tuas scripts ou pela modelacao que estiveres a usar no teu ambiente.

Exemplo de base:

```sql
CREATE DATABASE inventario;
```

### 2. Arrancar o backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Cria `backend/.env` com pelo menos:

```env
DATABASE_URL=postgresql+psycopg2://postgres:TU_PASSWORD@127.0.0.1:5432/inventario
SECRET_KEY=troca-este-valor-em-producao
```

Depois arranca a API:

```powershell
.venv\Scripts\python.exe -m uvicorn app.core.main:app --reload --host 127.0.0.1 --port 8000
```

Pontos uteis:

- API root: `http://127.0.0.1:8000/`
- Swagger: `http://127.0.0.1:8000/docs`

### 3. Arrancar o frontend

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Abre:

- Frontend: `http://127.0.0.1:5173`

Para evitar problemas com cookies, usa o mesmo hostname no frontend e na API:

- `localhost` com `localhost`
- `127.0.0.1` com `127.0.0.1`

O cliente em `frontend/src/api.js` ja tenta alinhar automaticamente a API com o host visivel da pagina quando a configuracao aponta para loopback.

## Docker Compose

Perfis definidos em `docker-compose.yml`:

| Perfil | Servico | Descricao |
| --- | --- | --- |
| `dev-live` | `web-dev` | Frontend Vite com hot reload na porta `5173` |
| `docker-api` | `api` | Backend FastAPI em container |
| `bundled-db` | `db` | PostgreSQL 16 exposto no host em `localhost:5433` |

Cenarios comuns:

- So frontend em Docker: `.\scripts\docker-subir-dev.ps1`
- Frontend + API + Postgres em Docker: `.\scripts\docker-subir-tudo.ps1`
- So Postgres em Docker: `docker compose --profile bundled-db up -d`

Ligacoes uteis:

- Se a API correr no host Windows e o Postgres em Docker, usa `127.0.0.1:5433` na `DATABASE_URL`.
- Se API e Postgres correrem ambos no Compose, a API deve usar `db:5432` como host interno.

Importante para scan e logs:

- O scan de rede e a recolha de alguns logs funcionam melhor com a API a correr no host Windows.
- Dentro do container, a API pode nao ter a mesma visibilidade da LAN.

## Testes E2E

O frontend tem testes Playwright em `frontend/tests`.

Scripts disponiveis:

```powershell
cd frontend
npm run test:e2e
npm run test:e2e:auth
npm run test:e2e:inventarios
npm run test:e2e:localizacoes
npm run test:e2e:utilizadores
npm run test:e2e:computadores
```

Notas:

- A config usa `http://127.0.0.1:5173` como `baseURL`.
- O `webServer` do Playwright arranca o frontend automaticamente.
- A API continua de fora e tem de estar disponivel em `127.0.0.1:8000`.
- O projeto Playwright usa o canal `msedge`, por isso convem ter Microsoft Edge instalado no Windows.
- Podes sobrepor credenciais dos testes com `PLAYWRIGHT_LOGIN` e `PLAYWRIGHT_PASSWORD`.

## API e areas principais

Rotas/areas mais relevantes do backend:

- `auth` - login, logout, `me` e historico da conta
- `inventarios` - CRUD, scan, ativos e logs por inventario
- `computadores` - CRUD, vista unificada e logs por dispositivo
- `localizacoes` - CRUD
- `perfis` - CRUD
- `utilizadores` - CRUD e historico por utilizador
- `pesquisa` - pesquisa global

No frontend, a navegacao principal esta em `frontend/src/App.jsx` e nas paginas de `frontend/src/pages`.

## Regras e comportamento relevantes

- `GET /computadores/` devolve por defeito apenas computadores manuais.
- `GET /computadores/?com_scan=true` inclui tambem dispositivos do scan.
- A sessao expira se ficar inativa alem de `SESSION_EXPIRE_MINUTES`, mas cada pedido autenticado renova esse prazo.
- Um `401` no frontend faz a app voltar ao ecra de login e limpar o estado de sessao da interface.
- Operacoes administrativas dependem do perfil do utilizador autenticado.

## Documentacao adicional

- [`docs/estrutura de requisitos do projeto.txt`](docs/estrutura%20de%20requisitos%20do%20projeto.txt)
- [`docs/comandos.txt`](docs/comandos.txt)
- [`docs/diagramas/`](docs/diagramas/)
- [`docs/servidor-proxy-vm-passo-a-passo.txt`](docs/servidor-proxy-vm-passo-a-passo.txt)
- [`scripts/sql/add_criado_em_dispositivos_descobertos.sql`](scripts/sql/add_criado_em_dispositivos_descobertos.sql)

## Limitacoes atuais

- O schema principal da base nao esta automatizado por migracoes no repositorio.
- Funcionalidades de scan/logs dependem de rede, credenciais e contexto Windows.
- O projeto usa navegacao por vistas/abas na app, nao React Router.

## Licenca

Projeto academico / de estagio para uso interno, demonstracao e aprendizagem.
