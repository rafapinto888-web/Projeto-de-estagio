# Sistema de Inventario Informatico

Aplicacao para gestao de ativos de TI, com foco em inventario de infraestrutura, descoberta em rede e consulta de logs tecnicos.

## Visao Geral

O sistema permite:
- gerir inventarios (normal e sub_rede)
- registar computadores com responsavel e localizacao
- executar scan de rede para descobrir dispositivos
- consultar dados tecnicos e logs por filtros
- pesquisar dados de forma centralizada

## Stack Tecnologica

- Backend: Python, FastAPI, Uvicorn, SQLAlchemy
- Base de dados: PostgreSQL
- Frontend: React + Vite
- API Docs: Swagger/OpenAPI
- Infra opcional: Docker + Docker Compose + Nginx

## Estrutura do Projeto

```text
backend/
  app/
    core/          # auth, deps, seguranca, arranque
    database/      # ligacao e sessao DB
    models/        # modelos SQLAlchemy
    routes/        # endpoints FastAPI
    schemas/       # contratos de request/response
    services/      # scan de rede e logs
frontend/
  src/
    components/    # componentes reutilizaveis
    pages/         # paginas por modulo
    api.js         # cliente HTTP
    App.jsx        # estado global e navegacao
    styles.css     # design system
docs/
script de rede/
```

## Requisitos

- Python 3.11+
- Node.js 18+ (com npm)
- PostgreSQL em execucao

## Dependencias

### Backend

Instaladas por `backend/requirements.txt`:
- `fastapi`
- `uvicorn[standard]`
- `pydantic`
- `sqlalchemy`
- `psycopg2-binary`
- `httpx`
- `pwdlib[argon2]`
- `bcrypt`
- `PyJWT`
- `python-multipart`

### Frontend

Definidas em `frontend/package.json`:
- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`

## Instalacao

### 1) Backend

Criar venv:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio"
python -m venv backend\.venv
```

Instalar dependencias:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\backend"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 2) Frontend

Instalar dependencias:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
npm install
```

Fallback no Windows quando `npm` nao estiver no PATH:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
& "C:\Program Files\nodejs\npm.cmd" install
```

## Execucao (Desenvolvimento)

### Backend

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\backend"
.\.venv\Scripts\python.exe -m uvicorn app.core.main:app --reload
```

### Frontend

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
npm run dev
```

Fallback no Windows:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Fallback final (quando `npm.cmd` nao encontra `node`):

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
& "C:\Program Files\nodejs\node.exe" ".\node_modules\vite\bin\vite.js"
```

## URLs

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- API base: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- Frontend Vite: [http://127.0.0.1:5173](http://127.0.0.1:5173) (ou porta alternativa indicada no terminal)

## Configuracao de Base de Dados

Definir `DATABASE_URL` antes de iniciar a API, exemplo:

```bash
DATABASE_URL=postgresql+psycopg2://utilizador:password@localhost:5432/inventario
```

## Troubleshooting Rapido

- PowerShell bloqueia scripts: evita `Activate.ps1` e usa diretamente `.\.venv\Scripts\python.exe`.
- `npm` nao reconhecido: usar `npm.cmd` por caminho completo.
- `npm.cmd` reclama de `node`: executar Vite com `node.exe` direto.
- Porta 5173 ocupada: usar a porta alternativa mostrada pelo Vite (ex: 5174).

## Estado Atual

Frontend React profissional com arquitetura componentizada (`components` + `pages`), backend FastAPI funcional e compatibilidade mantida com os endpoints atuais.
