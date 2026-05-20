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

Autenticação por **JWT**; após login o painel carrega inventários, computadores, utilizadores, perfis, localizações e histórico.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| Backend | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, Pydantic, PostgreSQL, JWT |
| Frontend | React 18, Vite 5, Material UI (MUI), Emotion, `xlsx` (export) |
| Infra | Docker Compose (`web-dev`, API e BD opcionais por perfil) |
| API docs | Swagger em `/docs`, ReDoc em `/redoc` |

## Estrutura do repositório

```text
backend/app/
  core/          # arranque, segurança, dependências
  database/      # acesso à BD
  models/        # SQLAlchemy
  routes/        # endpoints (auth, inventarios, computadores, …)
  schemas/       # contratos Pydantic
  services/      # scan de rede, logs Windows, etc.
frontend/src/
    pages/         # Dashboard, Inventários, Scan, Computadores, …
  components/    # Sidebar, Topbar, tabelas, modais
  api.js         # cliente HTTP
  App.jsx        # estado global e navegação por abas (#hash)
docs/            # requisitos, diagramas, comandos Docker
scripts/         # atalhos PowerShell para Docker
docker-compose.yml
```

## Requisitos

- Python 3.11+
- Node.js 18+ (npm)
- PostgreSQL acessível **ou** Docker Desktop

Variáveis importantes:

| Variável | Uso |
|----------|-----|
| `DATABASE_URL` | Ligação PostgreSQL (ex.: `postgresql+psycopg2://user:pass@localhost:5432/inventario`) |
| `SECRET_KEY` | Chave JWT (obrigatório alterar em produção) |
| `INVENTARIO_CORS_ORIGINS` | Origens do frontend separadas por vírgula (ex.: `http://localhost:5173`) |
| `INVENTARIO_ALLOW_SWAGGER_BYPASS` | `true` só em dev para testar no `/docs` sem JWT |
| `INVENTARIO_APP_ENV` | `development` ou `production` |
| `VITE_API_BASE` | URL da API no build do frontend (Docker) |

Exemplo completo: `backend/.env.example`. Tarefas futuras: `docs/pendencias-melhorias.txt`.

## Como executar (no teu PC)

Precisas de **dois processos** a correr em paralelo: **API** (porta 8000) e **frontend** (porta 5173). A base de dados PostgreSQL tem de estar acessível antes de arrancar a API.

### 1. Base de dados PostgreSQL

1. Instala e inicia o PostgreSQL (ou usa o que já tens no PC).
2. Cria a base de dados (exemplo no `psql` ou pgAdmin):

```sql
CREATE DATABASE inventario;
```

3. Ajusta utilizador, palavra-passe e porta aos teus dados. O backend usa por defeito (se não definires `DATABASE_URL`):

```text
postgresql+psycopg2://postgres:12345a.@127.0.0.1:5432/inventario
```

Altera em `backend/app/database/connection.py` ou define a variável de ambiente `DATABASE_URL` com os teus valores.

**Primeira execução da API:** ao arrancar, o FastAPI cria/atualiza as tabelas automaticamente (`create_all`). Precisas de **pelo menos um utilizador** na BD para fazer login (cria via pgAdmin, dump de outra máquina, ou endpoint admin no Swagger se já existir).

### 2. Backend (API)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Define a ligação (substitui user, password e porta):

```powershell
$env:DATABASE_URL = "postgresql+psycopg2://postgres:TU_PASSWORD@127.0.0.1:5432/inventario"
.venv\Scripts\python.exe -m uvicorn app.core.main:app --reload --host 127.0.0.1 --port 8000
```

Linux/macOS:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL="postgresql+psycopg2://postgres:TU_PASSWORD@127.0.0.1:5432/inventario"
python -m uvicorn app.core.main:app --reload --host 127.0.0.1 --port 8000
```

Confirma que a API responde: abre [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Frontend (interface web)

Noutro terminal:

```powershell
cd frontend
npm install
npm run dev
```

Abre [http://127.0.0.1:5173](http://127.0.0.1:5173) e faz login com um utilizador existente na BD.

### 4. Ordem de arranque (resumo)

| Passo | O quê | URL |
|-------|--------|-----|
| 1 | PostgreSQL a correr | — |
| 2 | `uvicorn` na pasta `backend` | [http://127.0.0.1:8000](http://127.0.0.1:8000) |
| 3 | `npm run dev` na pasta `frontend` | [http://127.0.0.1:5173](http://127.0.0.1:5173) |

Se o login falhar com erro de rede, verifica se o Swagger abre no browser — o frontend chama `http://localhost:8000` por defeito (`frontend/src/api.js`).

### 5. Parar

- `Ctrl+C` nos terminais da API e do frontend.
- PostgreSQL pode ficar sempre ligado (serviço Windows).

---

## Como executar com Docker

Útil para **demonstrar só a interface** ou para **não instalar Node** no PC. O cenário habitual em estágio mantém a **API no Windows** (scan e logs WMI/RDP funcionam melhor no host).

### Modo recomendado (frontend Docker + API local)

Terminal 1 — frontend em container (Vite, hot reload):

```powershell
cd "caminho\para\Projeto de estagio"
docker compose --profile dev-live up -d --build web-dev
```

Ou o atalho: `.\scripts\docker-subir-dev.ps1`

Terminal 2 — API no host (como na secção anterior):

```powershell
cd backend
$env:DATABASE_URL = "postgresql+psycopg2://postgres:TU_PASSWORD@127.0.0.1:5432/inventario"
.venv\Scripts\python.exe -m uvicorn app.core.main:app --reload --host 127.0.0.1 --port 8000
```

- Site: [http://localhost:5173](http://localhost:5173) (container `web-dev`)
- API: [http://localhost:8000](http://localhost:8000) (no PC)

### Modo desenvolvimento (hot reload no browser)

```powershell
.\scripts\docker-subir-dev.ps1
```

Abre [http://localhost:5173](http://localhost:5173). Continua a precisar da API em `localhost:8000` (local ou em Docker).

### Stack completo em Docker (outro PC sem Postgres instalado)

```powershell
.\scripts\docker-subir-tudo.ps1
```

Sobe frontend dev + API + Postgres:

| Serviço | URL / porta |
|---------|-------------|
| Frontend | [http://localhost:5173](http://localhost:5173) |
| API | [http://localhost:8000](http://localhost:8000) |
| Postgres | `localhost:5433` — user `postgres`, password `inventario-docker`, BD `inventario` |

Neste modo, define `DATABASE_URL` no Compose ou usa o valor por defeito do perfil `bundled-db`. BD nova = tabelas criadas ao arrancar a API; **cria utilizadores** para login.

### Perfis Compose (referência)

| Perfil | Serviço | Uso |
|--------|---------|-----|
| `dev-live` | `web-dev` | Frontend Vite com hot reload (porta `5173`) |
| `docker-api` | `api` | Backend em container |
| `bundled-db` | `db` | Postgres em container (host `5433`) |

Mais comandos (logs, parar, volumes): [`docs/comandos.txt`](docs/comandos.txt).

---

## Executar noutro computador

### O que levar / copiar

- **Git:** `git clone <url-do-repositorio>` (recomendado).
- **Ou pasta ZIP** com o projeto completo, incluindo obrigatoriamente:
  - `frontend/package.json` e `frontend/package-lock.json`
  - `backend/requirements.txt`
  - `docker-compose.yml`
- **Não é obrigatório** copiar `node_modules/`, `frontend/dist/` nem `backend/.venv/` — voltam a ser criados no destino.

### Software a instalar no PC novo

Escolhe **um** dos caminhos:

| Caminho | Instalar |
|---------|----------|
| **A — Desenvolvimento clássico** | Python 3.11+, Node 18+, PostgreSQL |
| **B — Só Docker (demo)** | [Docker Desktop](https://www.docker.com/products/docker-desktop/) |
| **C — Docker completo** | Docker Desktop (frontend + API + BD em containers) |

### Primeira vez no PC novo (passo a passo)

1. **Copiar/clonar** o repositório para uma pasta local (ex.: `C:\Projetos\Projeto de estagio`).
2. **Base de dados**
   - *Com PostgreSQL no PC:* criar BD `inventario` e importar dump se quiseres os mesmos dados do PC antigo (`pg_dump` / `pg_restore`).
   - *Só Docker:* usar `.\scripts\docker-subir-tudo.ps1` — Postgres fica na porta **5433** com BD vazia; a API cria tabelas no primeiro arranque.
3. **Backend**
   - `cd backend` → criar `.venv` → `pip install -r requirements.txt`.
   - Definir `DATABASE_URL` com host, user e password **deste** PC (não assumes que é `12345a.` — confirma no pgAdmin ou no `docker-compose.yml`).
   - Arrancar uvicorn (ver secção «Como executar»).
4. **Frontend**
   - *Sem Docker:* `cd frontend` → `npm install` → `npm run dev`.
   - *Com Docker:* `.\scripts\docker-subir-dev.ps1` (usa `npm ci` com o lock file dentro do container).
5. **Testar:** Swagger em `:8000/docs` → site em `:5173` → login.

### Cenários típicos noutro PC

| Objetivo | O que fazer |
|----------|-------------|
| **Programar / alterar código** | `docker-subir-dev.ps1` + API local com `uvicorn` |
| **Mostrar ao orientador (sem instalar Node)** | `.\scripts\docker-subir-dev.ps1` ou `docker compose --profile dev-live up -d --build web-dev` + API local |
| **Máquina limpa, tudo isolado** | `docker-subir-tudo.ps1` + criar utilizador na BD nova |
| **Mesmos dados do teu PC** | Exportar Postgres (`pg_dump`) e importar no PC novo **ou** apontar `DATABASE_URL` para um servidor de rede partilhado |

### Variáveis a rever no PC novo

| Variável | Onde | Notas |
|----------|------|--------|
| `DATABASE_URL` | Terminal / Docker `api` | User, password, host (`127.0.0.1` vs `host.docker.internal` vs `db` no Compose) |
| `SECRET_KEY` | API em produção | Alterar valor por defeito |
| `VITE_API_BASE` | Build Docker do frontend | Por defeito `http://localhost:8000`; o browser no PC novo tem de conseguir chegar a esta URL |

### Problemas comuns noutro PC

| Sintoma | Solução |
|---------|---------|
| Login / «Sem ligação à API» | API não está em `:8000` ou firewall bloqueia; abre `http://localhost:8000/docs` |
| Erro de password PostgreSQL | Ajustar `DATABASE_URL` aos dados locais |
| Export Excel falha | Correr `npm install` no `frontend` ou rebuild do container `web-dev` (dependência `xlsx` no lock) |
| Scan / logs não funcionam | API deve correr no **Windows** com acesso à rede; credenciais de domínio corretas no modal de scan |
| BD Docker vazia, sem login | Criar utilizador na BD ou restaurar dump do PC de desenvolvimento |

### Checklist rápida (outro PC)

```
[ ] Projeto copiado (com package-lock.json)
[ ] PostgreSQL OU docker-subir-tudo.ps1
[ ] DATABASE_URL correto
[ ] API a responder em /docs
[ ] Frontend em :5173
[ ] Utilizador existe na BD para login
```

## Documentação do projeto

- [`docs/estrutura de requisitos do projeto.txt`](docs/estrutura%20de%20requisitos%20do%20projeto.txt) — requisitos funcionais (RF) com critérios de aceitação
- [`docs/diagramas-sequencia/`](docs/diagramas-sequencia/) — diagramas UML PlantUML (login, CRUD, scan, pesquisa, logs, …)
- [`docs/comandos.txt`](docs/comandos.txt) — referência rápida Docker

## Regras de negócio relevantes

- **Apagar computador**: bloqueado se existir utilizador responsável associado.
- **Delete com logs**: sem responsável, logs técnicos do computador são removidos antes do delete (evita bloqueio por FK).
- **Scan**: credenciais de rede no momento do scan (não são as do login da aplicação).

## Estado e limitações

- Sem suíte de testes automatizada documentada; validação manual via UI e Swagger.
- Scan e consulta de logs dependem de rede acessível, credenciais corretas e ambiente Windows onde aplicável.
- Navegação por **abas** em `App.jsx` (sem React Router nesta fase).

## Licença

Projeto académico / estágio — uso interno e demonstração.
