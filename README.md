# Sistema de Inventario Informatico

Aplicacao para gestao de ativos informaticos com foco em inventario de infraestrutura: computadores registados, dispositivos descobertos em rede, localizacoes, utilizadores e logs.

## Objetivo do Projeto

O sistema foi desenhado para suportar o ciclo completo de inventario tecnico:

- Criar e gerir inventarios (grupo logico ou sub-rede).
- Registar computadores e associar localizacao/utilizador responsavel.
- Executar scan de rede para descobrir dispositivos ativos.
- Enriquecer dispositivos descobertos com dados tecnicos (quando disponiveis).
- Consultar e pesquisar informacao de forma centralizada por API.

## Stack Tecnologico

- **Backend / Web Service**
  - Python
  - FastAPI
  - Uvicorn
- **Web Server**
  - Nginx
- **Base de Dados**
  - PostgreSQL
- **Frontend**
  - React
  - Vite
  - JavaScript (ES Modules)
- **Containerizacao**
  - Docker
  - Docker Compose
- **Documentacao e Testes de API**
  - Swagger / OpenAPI
- **Ferramentas de Desenvolvimento**
  - Visual Studio Code
  - Visual Paradigm

## Estrutura do Projeto

```text
backend/
  app/
    core/          # arranque da API e configuracao principal
    database/      # engine, sessao e funcoes de acesso a dados
    models/        # modelos SQLAlchemy
    routes/        # endpoints FastAPI
    schemas/       # contratos de request/response
    services/      # logica de scan de rede e logs Windows
frontend/          # frontend React (SPA) com Vite
docs/              # documentacao funcional e tecnica
script de rede/  # scripts utilitarios de teste de rede/logs
```

## Funcionalidades Principais

- Gestao de inventarios, computadores, localizacoes, utilizadores e perfis.
- Pesquisa por inventario com visao unificada de:
  - computadores registados
  - dispositivos descobertos
- Scan de rede por CIDR (ex: `192.168.1.0/24`) com:
  - deteccao de IPs ativos
  - tentativa de hostname e MAC address
  - atualizacao de dispositivos sem criar duplicados no mesmo inventario
- Endpoints para consulta de logs de dispositivo (seguranca e RDP).

## Requisitos

- Python 3.11+ (recomendado)
- Node.js 18+ com npm (para frontend React)
- PostgreSQL em execucao (local ou remoto)
- Dependencias em `backend/requirements.txt`
- Docker e Docker Compose (opcional, para ambiente containerizado)

## Dependencias do Projeto

### Backend (Python / pip)

Dependencias instaladas via `backend/requirements.txt`:

- `fastapi`
- `uvicorn[standard]`
- `pydantic`
- `sqlalchemy`
- `psycopg2-binary`
- `httpx`
- `pwdlib[argon2]`
- `PyJWT`
- `python-multipart`

Instalacao:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\backend"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### Frontend (React + Vite)

Dependencias declaradas em `frontend/package.json`:

- `react`
- `react-dom`
- `vite`
- `@vitejs/plugin-react`

### Script de rede (pasta `script de rede`)

O script de teste usa apenas modulos da biblioteca padrao do Python:

- `ipaddress`
- `getpass`
- `sys`
- `pathlib`
- `json`
- `os`
- `subprocess`
- `platform`
- `concurrent.futures`
- `ctypes`
- `queue`
- `threading`

Nota:
- Para gerar executavel do script, `pyinstaller` e opcional e deve ser instalado separadamente.

## Instalacao

### 0) Se o comando `npm` nao existir no Windows

Instalar Node.js LTS (inclui `npm`):

```bash
winget install --id OpenJS.NodeJS.LTS --exact --source winget --accept-package-agreements --accept-source-agreements
```

Depois fecha e abre o terminal novamente, e valida:

```bash
node -v
npm -v
```

Se mesmo assim o `npm` nao for reconhecido no terminal atual, usa diretamente:

```bash
& "C:\Program Files\nodejs\npm.cmd" -v
```

### 1) Backend (FastAPI)

No terminal, criar ambiente virtual dentro de `backend`:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio"
python -m venv backend\.venv
```

Ativar ambiente virtual:

- **PowerShell (Windows)**
```bash
.\backend\.venv\Scripts\Activate.ps1
```

Se der erro de politica PowerShell, usa diretamente o Python da venv (sem ativar):

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\backend"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Entrar na pasta do backend e instalar dependencias:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\backend"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

### 2) Frontend (React)

Entrar na pasta do frontend e instalar dependencias:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
npm install
```

Fallback no Windows (quando `npm` nao esta no PATH):

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
& "C:\Program Files\nodejs\npm.cmd" install
```

Executar em desenvolvimento:

```bash
npm run dev
```

Fallback no Windows:

```bash
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Build de producao:

```bash
npm run build
```

## Como Executar

### Arranque rapido (copiar e colar)

Backend:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\backend"
.\.venv\Scripts\python.exe -m uvicorn app.core.main:app --reload
```

Frontend:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
npm run dev
```

Fallback no Windows (quando `npm` nao for reconhecido no terminal):

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
& "C:\Program Files\nodejs\npm.cmd" run dev
```

### Primeira execucao (apenas uma vez)

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
npm install
```

Fallback no Windows:

```bash
cd "C:\Users\Jose\Desktop\Projeto de estagio\frontend"
& "C:\Program Files\nodejs\npm.cmd" install
```

API disponivel em:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Redoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Health basico: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

Frontend React (dev) disponivel em:

- [http://127.0.0.1:5173](http://127.0.0.1:5173)

## O que a Aplicacao Vai Fazer (na pratica)

1. Recebe pedidos HTTP para gerir inventario e ativos.
2. Persiste informacao no banco de dados.
3. O frontend React comunica com o backend FastAPI via HTTP (token Bearer).
4. Permite executar scan de rede por inventario do tipo sub-rede.
5. Guarda/atualiza dispositivos descobertos (IP, hostname, MAC e metadados disponiveis).
6. Disponibiliza pesquisa e endpoints de consulta para integracao com frontend.

## Configuracao de Base de Dados (PostgreSQL)

- Define a variavel `DATABASE_URL` antes de iniciar a API.
- Exemplo:

```bash
DATABASE_URL=postgresql+psycopg2://utilizador:password@localhost:5432/inventario
```

- A aplicacao usa esta ligacao para persistencia dos dados do sistema.

## Boas Praticas de Repositorio

- O projeto inclui `.gitignore` para evitar subir:
  - ambientes virtuais
  - ficheiros de build/dist
  - executaveis
  - caches e outputs temporarios
  - ficheiros sensiveis (`.env`)

## Troubleshooting Rapido

- **Erro de permissao PowerShell:** executar terminal com permissoes adequadas.
- **Scan sem dados de modelo/serie/logs:** validar credenciais, firewall e acessos remotos no host alvo.
- **Porta ocupada no backend:** mudar porta do Uvicorn (`--port 8001`, por exemplo).

## Estado Atual

Projeto com backend funcional para operacoes principais de inventario e scan, e frontend totalmente migrado para React mantendo compatibilidade com os endpoints existentes.

## Arquitetura de Deploy (Resumo)

- `FastAPI + Uvicorn` exposto internamente como servico da API.
- `Nginx` como web server/reverse proxy na frente do backend.
- `PostgreSQL` para armazenamento persistente.
- `Docker Compose` para orquestrar os servicos em ambiente de desenvolvimento/entrega.
