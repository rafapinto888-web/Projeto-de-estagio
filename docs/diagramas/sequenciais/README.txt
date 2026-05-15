Diagramas de sequencia (PlantUML) - alinhados ao codigo do projeto (maio 2026)

Ficheiros:
  01-login.puml           - Login e carga inicial do painel
  02-bootstrap-sessao.puml - Recarregar pagina com token
  03-scan-rede.puml       - Scan sub-rede (AtivosPage / API)
  04-pesquisa-global.puml - GET /pesquisar + UI PesquisaPage
  05-crud-computador.puml - CRUD computador + withAction + historico
  06-consulta-logs.puml   - Logs por PC e logs de inventario
  07-exportar-csv.puml    - Export CSV no browser (sem API)

Como gerar imagem:
  https://www.plantuml.com/plantuml/uml/
  ou extensao PlantUML no VS Code

Codigo fonte principal:
  frontend/src/App.jsx, frontend/src/api.js
  backend/app/routes/auth.py, inventarios.py, pesquisa.py, computadores.py
