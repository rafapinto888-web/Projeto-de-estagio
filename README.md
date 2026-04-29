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
  - HTML
  - CSS
  - JavaScript
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
frontend/          # interface web estatica (HTML/CSS/JS)
docs/              # documentacao funcional e tecnica
script de rede defenitivo/  # scripts utilitarios de teste de rede/logs
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
- PostgreSQL em execucao (local ou remoto)
- Dependencias em `backend/requirements.txt`
- Docker e Docker Compose (opcional, para ambiente containerizado)

## Instalacao

### 1) Backend (FastAPI)

No terminal, a partir da raiz do projeto:

```bash
cd "c:\Users\Jose\Desktop\Projeto de estagio\Projeto de estagio\backend"
python -m venv venv
```

Ativar ambiente virtual:

- **PowerShell (Windows)**
```bash
.\venv\Scripts\Activate.ps1
```

Instalar dependencias:

```bash
pip install -r requirements.txt
```

### 2) Frontend (modo simples)

O frontend atual e estatico e pode ser aberto diretamente:

- abrir `frontend/index.html` no browser

ou servir por um servidor simples:

```bash
cd frontend
python -m http.server 5500
```

## Como Executar

Com o ambiente virtual ativo dentro de `backend`:

```bash
cd "c:\Users\Jose\Desktop\Projeto de estagio\Projeto de estagio\backend"
.\venv\Scripts\python.exe -m uvicorn app.core.main:app --reload
```

API disponivel em:

- Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Redoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)
- Health basico: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## O que a Aplicacao Vai Fazer (na pratica)

1. Recebe pedidos HTTP para gerir inventario e ativos.
2. Persiste informacao no banco de dados.
3. Permite executar scan de rede por inventario do tipo sub-rede.
4. Guarda/atualiza dispositivos descobertos (IP, hostname, MAC e metadados disponiveis).
5. Disponibiliza pesquisa e endpoints de consulta para integracao com frontend.

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

Projeto em evolucao, com backend funcional para operacoes principais de inventario e scan, e frontend em fase de melhoria visual/ux.

## Arquitetura de Deploy (Resumo)

- `FastAPI + Uvicorn` exposto internamente como servico da API.
- `Nginx` como web server/reverse proxy na frente do backend.
- `PostgreSQL` para armazenamento persistente.
- `Docker Compose` para orquestrar os servicos em ambiente de desenvolvimento/entrega.
