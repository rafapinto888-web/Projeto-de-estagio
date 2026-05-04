# Sistema de inventário informático

Painel web para gestão de inventário de TI: inventários, computadores, localizações, utilizadores com perfis, descoberta na rede (scan) e consulta de logs. Projeto **full stack** com FastAPI e React, concebido para uso interno / demonstração em contexto de estágio.

## Visão geral

- **Inventários** (tipos normal / sub-rede) agrupam equipamento e apoiam scans.
- **Computadores** ligam-se a inventário, localização opcional e responsável.
- **Scan** lista ativos do inventário selecionado, permite filtrar na lista e (admin) disparar scan de rede credenciado.
- **Utilizadores e perfis** controlam quem acede e o que pode alterar (operações administrativas condicionadas ao perfil).
- **Pesquisa global** e **logs** consultam dados agregados ou por filtros.

## Estado atual (realista)

| Área | Situação |
|------|-----------|
| **API** | Funcional para CRUD principal, auth por JWT e documentação Swagger. Rotas organizadas (`inventarios`, `computadores`, `utilizadores`, `perfis`, `localizacoes`, `pesquisa`, `auth`). |
| **Frontend** | SPA React (Vite) com navegação por abas, estado global em `App.jsx` e cliente em `api.js`. |
| **UX** | Criação/edição de entidades (**Inventários, Computadores, Utilizadores, Perfis, Localizações**) em **modais** com formulário em grelha; evita formulários inline “em linha” na página. Na área **Scan**, pesquisa na lista e **scan de rede** abrem modais; seleção do inventário para a tabela mantém-se visível. Em **Logs**, os filtros (por computador / por inventário) estão em modais e o resultado JSON aparece na página. |
| **Design** | Tema único (`styles.css`), tipografia definida nos tokens CSS, tabelas, cartões em perfis, feedback global de operações (`StatusAlert`). |
| **Produção** | Pensado sobretudo para **desenvolvimento local**: Postgres manual, servidor Vite/Uvicorn. Não há pipeline de CI/CD ou empacotamento definitivo neste repositório. |
| **Testes / qualidade** | Sem suíte de testes automatizados documentada aqui; validação feita ao correr backend + frontend manualmente contra a API real. |

**Limitações esperáveis**: dependência de Postgres acessível, credenciais e `DATABASE_URL` corretos, e permissões rede/WMI para scans — falhas são tratidas no cliente com mensagens de erro da API.

## Stack tecnológica

- **Backend**: Python 3.11+, FastAPI, Uvicorn, SQLAlchemy, Pydantic, PostgreSQL (`psycopg2-binary`), JWT, hashing de passwords.
- **Frontend**: React 18, Vite 5.
- **API**: OpenAPI/Swagger em `/docs`.

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
    styles.css     # tema e layout
README.md
```

Pastas opcionais (scripts, Docker, docs) podem existir conforme tens no disco; não são obrigatórias ao arranque mínimo.

## Requisitos

- Python 3.11+
- Node.js 18+ (npm)
- PostgreSQL em execução com base de dados criada

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

## Dependências principais

- Backend: ver `backend/requirements.txt` (FastAPI, Uvicorn, SQLAlchemy, psycopg2-binary, PyJWT, httpx, hashing de passwords, etc.).
- Frontend: ver `frontend/package.json` (React, react-dom, Vite).

## Troubleshooting rápido

- **PowerShell e scripts**: podes usar `.\.venv\Scripts\python.exe` sem executar `Activate.ps1`.
- **`npm` não reconhecido** (Windows): usar `"%ProgramFiles%\nodejs\npm.cmd"` ou garantir Node no PATH.
- **Porta 5173 ocupada**: aceitar a porta alternativa que o Vite mostrar.

## Histórico de contexto no README

- A aba de inventário de rede aparece como **«Scan»** na interface (ID interno de navegação pode continuar `ativos`).
- Esta secção deve ser atualizada quando adicionares testes automatizados, Docker fixo ou deploy.
