# Sistema de Inventario Informatico

Aplicacao web para gestao de inventario de TI, desenvolvida no contexto de estagio. O sistema combina um backend em FastAPI com um frontend em React para suportar autenticacao, operacoes de inventario, administracao de utilizadores e recolha de informacao tecnica em ambientes Windows.

## Sumario

- [Visao Geral](#visao-geral)
- [Principais Funcionalidades](#principais-funcionalidades)
- [Arquitetura e Stack](#arquitetura-e-stack)
- [Estrutura do Repositorio](#estrutura-do-repositorio)
- [Pre-requisitos](#pre-requisitos)
- [Configuracao](#configuracao)
- [Execucao em Desenvolvimento](#execucao-em-desenvolvimento)
- [Execucao com Docker](#execucao-com-docker)
- [Autenticacao e Sessao](#autenticacao-e-sessao)
- [Testes E2E](#testes-e2e)
- [Rotas e Modulos Principais](#rotas-e-modulos-principais)
- [Notas Operacionais](#notas-operacionais)
- [Documentacao Adicional](#documentacao-adicional)
- [Limitacoes Atuais](#limitacoes-atuais)

## Visao Geral

O projeto tem como objetivo centralizar a gestao de ativos informaticos, permitindo acompanhar inventarios, computadores, utilizadores, perfis e localizacoes a partir de uma interface web unica. O sistema inclui ainda pesquisa global, historico de atividade da conta autenticada, exportacao de dados e funcionalidades de scan/logs para cenarios suportados.

## Principais Funcionalidades

- Dashboard com indicadores resumidos do inventario.
- CRUD de inventarios, incluindo inventarios do tipo sub-rede.
- CRUD de computadores e vista unificada com dispositivos detetados por scan.
- CRUD de utilizadores, perfis e localizacoes.
- Pesquisa global por texto.
- Historico de atividade associado ao utilizador autenticado.
- Exportacao de dados para Excel no frontend.
- Autenticacao por sessao com cookie `HttpOnly`.
- Recolha de informacao tecnica e operacoes de scan em ambiente Windows.

## Arquitetura e Stack

| Camada | Tecnologias |
| --- | --- |
| Backend | Python, FastAPI, Uvicorn, SQLAlchemy, Pydantic, PostgreSQL, `pwdlib[argon2]` |
| Frontend | React 18, Vite 5, Material UI, Emotion, `xlsx` |
| Testes | Playwright |
| Infraestrutura | Docker Compose |

Arquitetura logica:

- `frontend/` consome a API REST e gere a interface do utilizador.
- `backend/` expoe os endpoints, valida sessoes, aplica regras de negocio e comunica com a base de dados.
- `PostgreSQL` persiste os dados de dominio e as sessoes autenticadas.

## Estrutura do Repositorio

```text
backend/
  app/
    core/         # arranque da app, configuracao, seguranca e OpenAPI
    database/     # ligacao SQLAlchemy
    models/       # modelos ORM
    routes/       # endpoints REST
    schemas/      # schemas Pydantic
    services/     # scan de rede, logs e logica tecnica auxiliar
frontend/
  src/
    components/   # componentes reutilizaveis
    pages/        # vistas principais do painel
    domain/       # helpers e labels por dominio
    api.js        # cliente HTTP da aplicacao
  tests/          # testes E2E com Playwright
docs/             # requisitos, diagramas e notas operacionais
scripts/          # scripts PowerShell e SQL auxiliares
docker-compose.yml
```

## Pre-requisitos

Para desenvolvimento local:

- Python 3.11 ou superior
- Node.js e npm
- PostgreSQL acessivel localmente ou via Docker
- Microsoft Edge instalado, caso pretendas correr os testes Playwright tal como estao configurados

## Configuracao

O backend carrega automaticamente o ficheiro `backend/.env`.

Variaveis principais do backend:

| Variavel | Obrigatorio | Descricao |
| --- | --- | --- |
| `DATABASE_URL` | Sim | string de ligacao ao PostgreSQL |
| `SECRET_KEY` | Recomendado | segredo da aplicacao; em producao nao deve usar o valor por defeito |
| `INVENTARIO_APP_ENV` | Nao | `development` ou `production` |
| `INVENTARIO_CORS_ORIGINS` | Nao | lista de origens permitidas para o frontend |
| `SESSION_EXPIRE_MINUTES` | Nao | duracao base da sessao autenticada |
| `SESSION_COOKIE_NAME` | Nao | nome do cookie de sessao |
| `SESSION_COOKIE_SECURE` | Nao | ativa cookie seguro |
| `SESSION_COOKIE_SAMESITE` | Nao | politica `SameSite` do cookie |

Variavel relevante do frontend:

| Variavel | Obrigatorio | Descricao |
| --- | --- | --- |
| `VITE_API_BASE` | Nao | URL base da API usada pelo frontend |

Exemplo minimo de `backend/.env`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:TU_PASSWORD@127.0.0.1:5432/inventario
SECRET_KEY=troca-este-valor
```

## Execucao em Desenvolvimento

### 1. Preparar a base de dados

O projeto assume que o schema principal ja existe na base de dados. A criacao automatica das tabelas de dominio nao faz parte do arranque normal da aplicacao.

Exemplo de criacao da base:

```sql
CREATE DATABASE inventario;
```

Nota:

- no arranque, a aplicacao garante apenas a tabela `sessoes_utilizador`, caso ainda nao exista

### 2. Arrancar o backend

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
.venv\Scripts\python.exe -m uvicorn app.core.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Arrancar o frontend

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

URLs locais:

- frontend: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`

Conta inicial criada automaticamente, se ainda nao existir:

- utilizador: `admin`
- password: `inventario123`

Recomendacao:

- usa o mesmo hostname no frontend e na API, por exemplo `127.0.0.1` em ambos, para evitar problemas com cookies de sessao

## Execucao com Docker

O `docker-compose.yml` define tres perfis principais:

| Perfil | Servico | Finalidade |
| --- | --- | --- |
| `dev-live` | `web-dev` | frontend Vite com hot reload |
| `docker-api` | `api` | backend FastAPI em container |
| `bundled-db` | `db` | PostgreSQL em container |

Scripts incluidos no repositorio:

- `.\scripts\docker-subir-dev.ps1`
- `.\scripts\docker-subir-tudo.ps1`

Cenarios comuns:

- frontend em Docker + API no host
- frontend, API e PostgreSQL em Docker
- apenas PostgreSQL em Docker

Notas operacionais:

- se a API correr no host e o PostgreSQL em Docker, a `DATABASE_URL` deve apontar para `127.0.0.1:5433`
- se a API e a base correrem ambas no Compose, a API deve usar `db:5432`
- funcionalidades de scan e certos acessos tecnicos funcionam melhor com a API a correr diretamente no Windows host

## Autenticacao e Sessao

O sistema usa autenticacao por sessao no servidor, identificada por cookie `HttpOnly`.

Fluxo resumido:

1. `POST /auth/login` valida `username/email` e `password`.
2. O backend cria uma sessao na tabela `sessoes_utilizador`.
3. A resposta define um cookie de sessao no browser.
4. Os pedidos seguintes enviam esse cookie automaticamente com `credentials: "include"`.
5. Cada rota protegida valida a sessao e renova a expiracao.
6. `POST /auth/logout` revoga a sessao atual e limpa o cookie.

Caracteristicas relevantes:

- o frontend nao guarda tokens em `localStorage`
- a expiracao e renovada em cada pedido autenticado
- o `SameSite` por defeito do cookie e `lax`
- em producao deve ser usado `SESSION_COOKIE_SECURE=true`

## Testes E2E

Os testes end-to-end estao em `frontend/tests`.

Comandos disponiveis:

```powershell
cd frontend
npm run test:e2e
npm run test:e2e:auth
npm run test:e2e:inventarios
npm run test:e2e:localizacoes
npm run test:e2e:utilizadores
npm run test:e2e:computadores
```

Notas de execucao:

- o Playwright usa `http://127.0.0.1:5173` como `baseURL`
- o frontend e arrancado automaticamente pela configuracao `webServer`
- a API tem de estar disponivel em `http://127.0.0.1:8000`
- a configuracao atual usa o canal `msedge`

## Rotas e Modulos Principais

Principais areas do backend:

- `auth` - login, logout, sessao atual e historico
- `inventarios` - CRUD, scan, ativos e logs por inventario
- `computadores` - CRUD, vista unificada e logs por dispositivo
- `localizacoes` - CRUD
- `perfis` - CRUD
- `utilizadores` - CRUD e historico por utilizador
- `pesquisa` - pesquisa global

No frontend, a navegacao principal esta organizada a partir de `frontend/src/App.jsx` e das paginas em `frontend/src/pages`.

## Notas Operacionais

- `GET /computadores/` devolve por defeito apenas computadores manuais
- `GET /computadores/?com_scan=true` inclui tambem dispositivos descobertos por scan
- respostas `401` fazem o frontend regressar ao ecra de login
- operacoes administrativas dependem do perfil do utilizador autenticado
- o frontend usa navegacao por vistas/abas, nao React Router

## Documentacao Adicional

- [`docs/comandos.txt`](docs/comandos.txt)
- [`docs/estrutura de requisitos do projeto.txt`](docs/estrutura%20de%20requisitos%20do%20projeto.txt)
- [`docs/diagramas/`](docs/diagramas/)
- [`docs/servidor-proxy-vm-passo-a-passo.txt`](docs/servidor-proxy-vm-passo-a-passo.txt)
- [`scripts/sql/add_criado_em_dispositivos_descobertos.sql`](scripts/sql/add_criado_em_dispositivos_descobertos.sql)

## Limitacoes Atuais

- o schema principal da base de dados nao esta automatizado por migracoes no repositorio
- funcionalidades de scan e logs dependem de rede, credenciais e contexto Windows
- parte da documentacao complementar continua distribuida por ficheiros `.txt`

## Licenca

Projeto academico / de estagio para uso interno, demonstracao e aprendizagem.
