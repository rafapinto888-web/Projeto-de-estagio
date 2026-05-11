# Sistema de inventario informatico

Painel web para gestao de inventario de TI: inventarios, computadores, localizacoes, utilizadores com perfis, descoberta na rede (scan) e consulta de logs. Projeto **full stack** com FastAPI e React, concebido para uso interno / demonstracao em contexto de estagio.

## Visão geral

- **Inventários** (tipos normal / sub-rede) agrupam equipamento e apoiam scans.
- **Computadores** ligam-se a inventário, localização opcional e responsável.
- **Scan** lista ativos do inventário selecionado e (admin) dispara scan de rede credenciado por modal, com escolha/criação de inventário no mesmo fluxo.
- **Utilizadores e perfis** controlam quem acede e o que pode alterar (operações administrativas condicionadas ao perfil).
- **Pesquisa global** e **logs** consultam dados agregados ou por filtros.

## Estado atual

| Área | Situação |
|------|-----------|
| **API** | Funcional para CRUD principal, auth por JWT e documentação Swagger. Rotas organizadas (`inventarios`, `computadores`, `utilizadores`, `perfis`, `localizacoes`, `pesquisa`, `auth`). |
| **Frontend** | SPA React (Vite) com navegação por abas, estado global em `App.jsx` e cliente em `api.js`. |
| **UX** | Criação/edição de entidades (**Inventários, Computadores, Utilizadores, Perfis, Localizações**) em **modais** com formulário em grelha; evita formulários inline “em linha” na página. Na área **Scan**, o fluxo principal é iniciar scan por modal (com separadores para inventário existente/criar inventário), pedir rede, credenciais e opções de logs. Em **Pesquisa global**, a interface foca resultados e filtros (sem ação de “ver detalhes” nem vista de JSON bruto). Em **Logs**, os filtros (por computador / por inventário) estão em modais e o resultado JSON aparece na página. |
| **Design** | Tema único (`styles.css`), tipografia definida nos tokens CSS, tabelas, cartões em perfis, feedback global de operações (`StatusAlert`). |
| **Produção / Docker** | Há **`docker-compose.yml`** na raiz com **PostgreSQL + API + frontend estático (Nginx)**. Para desenvolvimento rápido com hot reload continua válido correr **Vite + Uvicorn** à parte (secção abaixo). |
| **Testes / qualidade** | Sem suíte de testes automatizados documentada aqui; validação feita ao correr backend + frontend manualmente contra a API real. |

**Limitações esperáveis**: dependência de Postgres acessível, credenciais e `DATABASE_URL` corretos, e permissões rede/WMI para scans — falhas são tratidas no cliente com mensagens de erro da API.

## Stack tecnologico

- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, Pydantic, PostgreSQL (`psycopg2-binary`), JWT, hashing de passwords.
- **Frontend**: React 18, Vite 5, Material UI (MUI) e Emotion.
- **API**: OpenAPI/Swagger em `/docs`.

## Bibliotecas do frontend

- `react` e `react-dom`: base da interface (componentes, estado, renderizacao no browser).
- `vite`: bundler/dev server rapido para desenvolvimento e build.
- `@mui/material`: biblioteca de componentes UI (AppBar, Drawer, Dialog, Table, Alert, etc.) usada no remake visual.
- `@emotion/react` e `@emotion/styled`: motor de estilos CSS-in-JS usado internamente pelo MUI para tema e personalizacao.
- `@mui/icons-material`: pacote de icones Material para complementar interfaces MUI quando necessario.

## Estrutura do repositório

```text
backend/
  app/
    core/          # arranque, auth, deps, main
    database/      # sessão e ligação à BD
    models/        # modelos SQLAlchemy
    routes/        # endpoints FastAPI
    schemas/       # contratos entrada/saída
    services/      # scan, logs e lógica de domínio
frontend/
  src/
    components/    # Sidebar, Topbar, FormModal, tabelas, etc.
    pages/         # Dashboard, Inventários, Scan, Computadores, …
    api.js         # cliente HTTP para a API
    authz.js       # heurísticas perfil administrador
    App.jsx        # estado global e navegação por abas
    theme.js       # tema MUI global (paleta, tipografia, componentes)
    styles.css     # tema e layout
docker-compose.yml   # Postgres + api + web (raiz)
README.md
```

Pastas opcionais (`script de rede`, `docs`) podem existir conforme tens no disco; não são obrigatórias ao arranque mínimo.

## Requisitos

- Python 3.11+
- Node.js 18+ (npm)
- PostgreSQL em execução com base de dados criada **ou** [Docker Desktop](https://www.docker.com/products/docker-desktop/) para subir o Postgres (e opcionalmente API + frontend) via Compose

### Opcional: só sincronizar o lock do frontend

Se quiseres voltar a usar `npm ci` dentro do Docker (imagens mais reproduzíveis), corre uma vez na pasta `frontend`:

```bash
npm install
```

e faz commit do `package-lock.json` atualizado.

## Instalação

Na **raiz do repositório** (ajusta os caminhos ao teu SO).

### Backend

```bash
cd backend
python -m venv .venv
```

Windows (ativação opcional não necessária se usas o interpreter direto):

```bash
cd backend
.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Linux/macOS:

```bash
cd backend
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Execução com Docker (stack completo)

Na **raiz do repositório** (onde está `docker-compose.yml`). Primeira vez ou após mudar Dockerfile/código incluído na imagem:

```powershell
cd "caminho\para\Projeto de estagio"
docker compose up -d --build
```

Só iniciar (imagens já construídas):

```powershell
docker compose up -d
```

Parar os containers:

```powershell
docker compose stop
```

Parar e remover containers + rede (mantém o volume da base de dados):

```powershell
docker compose down
```

Ver logs:

```powershell
docker compose logs -f
```

**URLs com Compose**: frontend servido pelo container em [http://localhost:5173](http://localhost:5173), API em [http://localhost:8000](http://localhost:8000). Postgres exposto em `localhost:5432` (credenciais definidas no `docker-compose.yml`: utilizador `postgres`, password `inventario-docker`, base `inventario`).

Variáveis opcionais no ambiente do host antes do `up`:

- `SECRET_KEY` — chave JWT (por defeito há um valor de exemplo no compose; altera em produção).
- `VITE_API_BASE` — URL da API embutida no build do frontend (por defeito `http://localhost:8000`, adequada ao browser aceder ao host).

**Após alterar código React** (imagem `web` usa build de produção): reconstrói o serviço frontend:

```powershell
docker compose up -d --build web
```

**Scan de rede / logs Windows**: a API no container Linux **não garante** o mesmo comportamento que no Windows (PowerShell remoto, WMI/CIM). Para testes pesados de scan, continua útil correr o **backend localmente** no Windows contra a mesma base de dados.

---

## Execução (desenvolvimento)

Definir **`DATABASE_URL`** (exemplo):

```bash
set DATABASE_URL=postgresql+psycopg2://utilizador:password@localhost:5432/inventario
```

Linux/macOS: `export DATABASE_URL=...`

**Backend** (na pasta `backend`):

```bash
.venv\Scripts\python.exe -m uvicorn app.core.main:app --reload
```

ou `./.venv/bin/python -m uvicorn app.core.main:app --reload`

**Frontend** (na pasta `frontend`):

```bash
npm run dev
```

## URLs úteis

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- API base: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Frontend Vite: [http://127.0.0.1:5173](http://127.0.0.1:5173) (ou porta indicada no terminal)

## Dependencias principais

- Backend: ver `backend/requirements.txt` (FastAPI, Uvicorn, SQLAlchemy, psycopg2-binary, PyJWT, httpx, hashing de passwords, etc.).
- Frontend: ver `frontend/package.json` (React, Vite, MUI, Emotion).

## Notas de arquitetura frontend 

- O shell principal (`Sidebar` + `Topbar`) e componentes base estao em MUI.
- O tema global fica centralizado em `frontend/src/theme.js`.
- A navegacao continua por `activeTab` em `frontend/src/App.jsx` (sem React Router nesta fase).
- O consumo de dados reais continua centralizado em `frontend/src/api.js` sem alteracoes de contrato backend.

## Regras funcionais recentes

- **Apagar computador**: a API bloqueia o delete quando existe **utilizador responsável associado** ao computador.
- **Delete com logs técnicos**: quando não existe utilizador associado, os logs técnicos desse computador são removidos antes do delete para evitar bloqueio por chave estrangeira.
- **Scan de rede**: usa credenciais de rede fornecidas no momento de execução (não usa credenciais de login da aplicação).

