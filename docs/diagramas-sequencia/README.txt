Diagramas de sequência UML — Sistema de Inventário IT
======================================================

Documentação dos fluxos principais do projeto (frontend React + API FastAPI).
Cada pasta tem diagrama.puml (PlantUML) e especificacao.txt (mapeamento ao código).


Molde UML (usar em todos os diagramas)
--------------------------------------
Referência: DS-01-autenticacao-sessao/diagrama.puml

Participantes (títulos curtos):
  Utilizador (ator)
  UI
  Controller
  Service
  Repository
  BD

Regras:
  - Métodos nas setas: nomes reais do código quando possível
  - Passos numerados (1, 2, 3…)
  - Retornos tracejados (-->)
  - alt / else para erros quando aplicável
  - skinparam sequenceMessageAlign center
  - skinparam responseMessageBelowArrow true

Mapeamento às camadas do código:
  UI         → páginas React (formulários, botões, grelhas)
  Controller → App.jsx (handleLogin, withAction, refreshAtivos, callbacks)
               + chamadas api.* em frontend/src/api.js (HTTP)
  Service    → rotas FastAPI (routes/*.py) e funções de negócio
               (ex.: autenticar_utilizador, executar_scan_do_inventario)
  Repository → acesso à BD (db.query, funções em database/*.py)
  BD         → PostgreSQL / SQLite

Nota: na caixa Repository alguns rótulos são descritivos do que a BD faz
(ex.: SELECT, INSERT). Nem todos existem como função com esse nome exacto
no repositório — o fluxo e os métodos Service/Controller estão alinhados
ao código. Ver especificacao.txt de cada pasta.


Índice de diagramas
-------------------

DS-01-autenticacao-sessao
  Título: Login (= autenticação / início de sessão)
  Fluxo: handleLogin → login → autenticar_utilizador → token → me → loadAllData
  Ficheiros: auth.py, security.py, deps.py, App.jsx, api.js

DS-02-crud-inventario
  Título: Criar inventário
  Fluxo: withAction → criar_inventario → INSERT inventarios
  Ficheiros: InventariosPage, App.jsx, inventarios.py

DS-03-listagem-ativos-inventario
  Título: Listar ativos do inventário
  Fluxo: refreshAtivos → listar_computadores_do_inventario / pesquisar_computadores_do_inventario
  Ficheiros: ComputadoresPage, App.jsx, inventarios.py

DS-04-scan-rede-inventario
  Título: Scan de rede (inventário sub-rede)
  Fluxo: api.inventarios.scan → executar_scan_do_inventario → descobrir_dispositivos_enriquecidos
  Ficheiros: App.jsx, inventarios.py, services/scan_rede.py

DS-05-crud-computador
  Título: Registar computador
  Fluxo: withAction → adicionar_computador → criar_computador_db
  Ficheiros: ComputadoresPage, App.jsx, computadores.py, database/computadores.py

DS-06-pesquisa-global
  Título: Pesquisa global
  Fluxo: onPesquisar → pesquisar_global → SELECT em várias tabelas
  Ficheiros: PesquisaPage, App.jsx, pesquisa.py

DS-07-consulta-logs
  Título: Consultar logs por computador
  Fluxo: onLogsComputador → consultar_logs_dispositivo
  Ficheiros: LogsPage, App.jsx, computadores.py

DS-08-auditoria-historico
  Título: Histórico de auditoria da conta
  Fluxo: historico_do_utilizador + registar_evento_historico / registar_log_sistema
  Ficheiros: HistoricoContaPage, App.jsx, auth.py

DS-09-gestao-utilizadores
  Título: Criar utilizador (admin)
  Fluxo: withAction → criar_utilizador → validar_perfil → INSERT utilizadores
  Ficheiros: UtilizadoresPage, App.jsx, utilizadores.py

DS-10-exportacao-excel
  Título: Exportar inventário para Excel
  Fluxo: exportInventarioComputadoresParaExcel (só cliente; sem novo pedido à BD)
  Ficheiros: ComputadoresPage, utils/exportInventarioComputadores.js


Estrutura de cada pasta
-----------------------
  diagrama.puml      → diagrama UML (copiar para PlantUML / Visual Paradigm)
  especificacao.txt  → resumo do mapeamento UI / Controller / Service / Repository


Como gerar imagem para o relatório
------------------------------------
1. Abrir https://www.plantuml.com/plantuml ou Visual Paradigm
2. Importar / colar o conteúdo de diagrama.puml
3. Exportar PNG ou PDF
4. Inserir no relatório com legenda (ex.: Figura X — Diagrama de sequência do login)


Ordem sugerida no relatório
-----------------------------
1. DS-01 (login / autenticação)
2. DS-04 (scan — diferenciador do projeto)
3. DS-02 ou DS-05 (CRUD)
4. DS-06 (pesquisa global)
5. DS-07 (logs)
6. Restantes conforme espaço


Outros ficheiros
----------------
  CONVENCAO-UML.txt     → regras curtas do molde
  COMO-FAZER-UM-DIAGRAMA.txt → como seguir o código ao desenhar um fluxo novo
