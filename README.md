# Sistema de Inventario Informatico

Aplicacao web para gestao de inventario de TI, desenvolvida com FastAPI no backend e React no frontend. O sistema permite gerir inventarios, computadores, utilizadores, perfis e localizacoes, com autenticacao por sessao, pesquisa global, historico de atividade e operacoes de scan/logs em ambiente Windows.

## Visao Geral

O projeto esta dividido em duas partes:

- `backend/`: API REST em FastAPI ligada a PostgreSQL
- `frontend/`: painel web em React + Vite

Funcionalidades principais:

- dashboard com metricas
- CRUD de inventarios
- CRUD de computadores
- CRUD de utilizadores, perfis e localizacoes
- pesquisa global
- historico da conta autenticada
- exportacao para Excel
- descoberta de ativos e recolha de logs em cenarios suportados

## Stack

| Camada | Tecnologias |
| --- | --- |
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy, Pydantic, PostgreSQL, `pwdlib[argon2]` |
| Frontend | React 18, Vite 5, Material UI, Emotion, `xlsx` |
| Testes | Playwright |
| Infra | Docker Compose |

## Arranque Rapido

### Backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Cria `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:TU_PASSWORD@127.0.0.1:5432/inventario
SECRET_KEY=troca-este-valor
```

Arranca a API:

```powershell
.venv\Scripts\python.exe -m uvicorn app.core.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

URLs locais:

- frontend: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

## Conta Inicial

Ao arrancar, o backend tenta garantir um utilizador inicial:

- utilizador: `admin`
- password: `inventario123`

Se fores usar isto fora de ambiente local, muda a password logo no inicio.

## Autenticacao

O sistema usa sessao no servidor com cookie `HttpOnly`.

Fluxo resumido:

1. `POST /auth/login` valida as credenciais.
2. O backend cria uma sessao na tabela `sessoes_utilizador`.
3. O browser recebe um cookie de sessao.
4. Os pedidos seguintes enviam esse cookie automaticamente.
5. Cada rota protegida valida a sessao e renova a expiracao.
6. `POST /auth/logout` revoga a sessao atual e limpa o cookie.

Notas:

- o frontend nao guarda tokens em `localStorage`
- a expiracao e renovada a cada pedido autenticado
- em producao usa `SESSION_COOKIE_SECURE=true`
- o `SameSite` por defeito e `lax`

## Variaveis de Ambiente

O backend carrega automaticamente `backend/.env`.

| Variavel | Obrigatorio | Descricao |
| --- | --- | --- |
| `DATABASE_URL` | Sim | ligacao ao PostgreSQL |
| `SECRET_KEY` | Recomendado | segredo da aplicacao |
| `INVENTARIO_APP_ENV` | Nao | `development` ou `production` |
| `INVENTARIO_CORS_ORIGINS` | Nao | origens permitidas para o frontend |
| `SESSION_EXPIRE_MINUTES` | Nao | duracao base da sessao |
| `SESSION_COOKIE_NAME` | Nao | nome do cookie de sessao |
| `SESSION_COOKIE_SECURE` | Nao | ativa cookie seguro |
| `SESSION_COOKIE_SAMESITE` | Nao | politica `SameSite` do cookie |

No frontend:

| Variavel | Descricao |
| --- | --- |
| `VITE_API_BASE` | URL base da API |

## Base de Dados

O projeto espera que o schema principal da base ja exista. A criacao automatica das tabelas do dominio principal nao esta documentada como parte do arranque da app.

No arranque, a aplicacao garante apenas a tabela `sessoes_utilizador` se ainda nao existir.

Exemplo de criacao da base:

```sql
CREATE DATABASE inventario;
```

## Estrutura do Repositorio

```text
backend/
  app/
    core/         # configuracao, seguranca, OpenAPI, arranque
    database/     # ligacao SQLAlchemy
    models/       # modelos ORM
    routes/       # endpoints REST
    schemas/      # schemas Pydantic
    services/     # scan de rede e logs
frontend/
  src/
    components/   # componentes UI
    pages/        # paginas principais
    domain/       # labels e helpers de dominio
    api.js        # cliente HTTP
  tests/          # testes E2E Playwright
docs/
scripts/
docker-compose.yml
```

## Docker

O `docker-compose.yml` define tres perfis principais:

| Perfil | Servico | Uso |
| --- | --- | --- |
| `dev-live` | `web-dev` | frontend Vite com hot reload |
| `docker-api` | `api` | backend em container |
| `bundled-db` | `db` | PostgreSQL em container |

Scripts uteis:

- `.\scripts\docker-subir-dev.ps1`
- `.\scripts\docker-subir-tudo.ps1`

Notas importantes:

- se a API correr no host e o Postgres em Docker, usa `127.0.0.1:5433`
- se API e DB correrem ambos no Compose, a API deve apontar para `db:5432`
- o scan de rede funciona melhor com a API a correr no Windows host

## Testes E2E

Os testes E2E estao em `frontend/tests`.

Comandos principais:

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

- o Playwright usa `http://127.0.0.1:5173` como `baseURL`
- o frontend e arrancado automaticamente pelo `webServer`
- a API tem de estar disponivel em `http://127.0.0.1:8000`
- o projeto usa o canal `msedge`

## Areas da API

Principais grupos de rotas:

- `auth`
- `inventarios`
- `computadores`
- `localizacoes`
- `perfis`
- `utilizadores`
- `pesquisa`

## Regras e Notas do Projeto

- `GET /computadores/` devolve por defeito apenas computadores manuais
- `GET /computadores/?com_scan=true` inclui tambem dispositivos do scan
- um `401` no frontend faz regressar ao ecra de login
- operacoes administrativas dependem do perfil do utilizador
- o frontend usa vistas/abas e nao React Router

## Documentacao Adicional

- [`docs/comandos.txt`](docs/comandos.txt)
- [`docs/estrutura de requisitos do projeto.txt`](docs/estrutura%20de%20requisitos%20do%20projeto.txt)
- [`docs/diagramas/`](docs/diagramas/)
- [`docs/servidor-proxy-vm-passo-a-passo.txt`](docs/servidor-proxy-vm-passo-a-passo.txt)
- [`scripts/sql/add_criado_em_dispositivos_descobertos.sql`](scripts/sql/add_criado_em_dispositivos_descobertos.sql)

## Limitacoes Atuais

- o schema principal nao esta automatizado por migracoes no repositorio
- scan e logs dependem de rede, credenciais e contexto Windows
- parte da documentacao externa do projeto continua em ficheiros `.txt`

## Licenca

Projeto academico / de estagio para uso interno, demonstracao e aprendizagem.
