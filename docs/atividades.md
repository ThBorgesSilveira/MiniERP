# MiniERP — Atividades

Este arquivo lista as atividades do projeto.
Use-o para voltar ao ponto certo depois de uma ramificação.

Legenda: `[x]` concluído · `[ ]` pendente · `[~]` em andamento

## Decisões

- Aplicação web local.
- Backend: NestJS + TypeORM + PostgreSQL (TypeScript).
- Frontend: React + Vite (TypeScript).
- Um repositório (monorepo) com as pastas `backend/` e `frontend/`.
- Branches: `main` estável e uma branch curta por mudança, só com os prefixos `feat/` e `fix/`.
- PostgreSQL: instalação do Windows, `localhost:5432` (sem Docker).
- Banco `minierp` com dois usuários: `minierp_owner` (dono, roda as migrations) e `minierp_app` (backend, só `SELECT/INSERT/UPDATE/DELETE`). Sem superusuário, sem criar bancos ou usuários, acesso público revogado.
- Senhas só no `.env`. Nunca no chat nem no Git.
- Criação do banco, dos usuários e das permissões por script (`npm run db:setup`), sem executar SQL à mão. Motivo: continuar o desenvolvimento em outro PC. Sem Docker.
- Tabelas por migrations geradas pelo TypeORM (`synchronize` desligado). As migrations rodam com `minierp_owner`.
- Nomes de tabelas e campos em inglês, com tabelas no plural.
- Regras de negócio: ver `docs/modelo-de-dados.md`.
- Diagrama do modelo em `docs/minierp-modelo-de-dados.mermaid`. Ele deriva do modelo: atualizar os dois juntos.
- O planejamento fecha em um commit só de `docs/`, antes da primeira entidade. O código começa depois, em uma branch própria. Motivo: não misturar contextos em um commit grande.
- Entidades TypeORM: um arquivo `.entity.ts` por tabela, na pasta do módulo. A entidade `field_dictionary` fica em `src/database/`.
- Auditoria nas entidades: quatro classes-base, uma por perfil do modelo. `created_at` e `updated_at` usam `default now()`, e o trigger os preenche. `deleted_at` usa `@DeleteDateColumn`. Os campos `_by` são inteiros opcionais com chave estrangeira para `users`, declarada pelo nome da entidade.
- Chave primária `id` do tipo `identity`. Nomes em snake_case por uma NamingStrategy própria, usada no `data-source.ts` e no `app.module.ts`. Os serviços apagam os filhos.
- Campos de valores fechados: `varchar` com CHECK. Motivo: o PostgreSQL não remove valor de enum, e o TypeORM recria o tipo quando o enum muda.
- Campos não inteiros: `numeric(18,6)`. O arredondamento a duas casas das taxas, do rateio e do frete rateado fica nos serviços.
- Nomes únicos sem diferenciar maiúsculas: tipo `citext` em `users.login`, `people.name`, `sales_channels.name`, `list_items.description` e `products.name`, com índices únicos parciais. A migration `CreateTables` ativa a extensão com `CREATE EXTENSION IF NOT EXISTS citext`, acrescentado à mão.
- CHECKs e índices no banco para as regras de uma linha. As regras que cruzam tabelas ficam nos serviços.
- `password_hash` com `select: false`.
- Nomes de migrations em inglês, no formato `CreateTables`.
- Auditoria no banco: uma função de campos por perfil e duas funções de log (genérica e de `users`), todas na migration `CreateAuditTriggers`. O `db:setup` revoga `UPDATE` e `DELETE` do `minierp_app` em `audit_logs`, `stock_movements` e `batch_movements`, quando as tabelas existem.
- Dicionário dos campos: uma linha por tabela e uma por campo, com `id` e campos de auditoria. As descrições são curtas, em português, sem valores nem exemplos. A migration `PopulateFieldDictionary` grava as linhas. A migration que cria ou remove uma tabela ou um campo ajusta o dicionário. O `npm run db:check-dictionary` grava a comparação com o banco em `backend/logs/check-dictionary.log`, fora do Git.
- Atualizador do ambiente local: `atualizar.bat` na raiz chama `backend/scripts/atualizar.js`. Passos: conferir Node, npm e Git; `git pull --ff-only`; conferir o `backend/.env`; `npm ci` no backend e no frontend; login do `minierp_owner` (com `db:setup` se falhar); migrations; dicionário dos campos; compilação das duas partes. O resultado fica em `backend/logs/atualizar.log`, fora do Git.
- Frontend: componentes, roteamento, nome do sistema, temas, layout e navegação em `docs/frontend-layout.md`.

## Trilha principal

### 1. Preparação do ambiente
- [x] Criar o repositório no GitHub
- [x] Clonar o repositório na pasta do projeto
- [x] Instalar o Node.js (v26.13.0) e o npm
- [x] Verificar se o PostgreSQL está instalado no PC
- [x] Criar os usuários `minierp_owner` e `minierp_app` e o banco `minierp` (Parte 1 do SQL)
- [x] Aplicar as permissões dentro do banco `minierp` (Parte 2 do SQL)
- [x] Confirmar as permissões dos dois usuários (`minierp_app` não cria tabelas: `permissão negada para esquema public`)

### 2. Estrutura do projeto
- [x] Criar o backend (NestJS)
- [x] Instalar TypeORM, `pg` e `@nestjs/config`
- [x] Criar a pasta `docs/`
- [x] Criar o frontend (React + Vite + TypeScript, linter Oxlint) e instalar as dependências
- [x] Testar o frontend (`npm run dev`: página padrão do Vite abre em `localhost:5173`)
- [x] Atualizar o `README.md` da raiz
- [x] Criar o script de preparação do banco (`backend/scripts/db-setup.js`, comando `npm run db:setup`)
- [x] Executar o `npm run db:setup` e confirmar o resultado (PowerShell: usuários, banco, permissões e logins ok)
- [x] Documentar o script (seção "Banco de dados" em `backend/README.md`, com ligação no `README.md` da raiz)
- [x] Primeiro commit (`11ebe4d`, 44 arquivos, autor `t.borges@live.com`)
- [x] Push do primeiro commit (`c33c2cf..11ebe4d` em `main`, conta `ThBorgesSilveira`)

### 3. Conexão com o banco
- [x] Criar o `backend/.env.example` (conexão da aplicação e conexão das migrations)
- [x] Criar o `backend/.env` real a partir do `.env.example` e preencher as senhas (feito por Thiago)
- [x] Configurar `ConfigModule` e `TypeOrmModule` no `app.module.ts` (usuário `minierp_app`, `synchronize` desligado)
- [x] Testar a conexão (`npm run start:dev`: `TypeOrmCoreModule` iniciou sem erro)
- [x] Configurar as migrations com `minierp_owner` (`src/database/data-source.ts` e comandos `migration:generate`, `migration:run`, `migration:revert` e `migration:show`)
- [x] Testar a conexão das migrations com `npm run migration:show` (sem erro, sem migrations)
- [x] Documentar as migrations no `backend/README.md` e no `README.md` da raiz

### 4. Modelo de dados

#### Revisão do modelo
- [x] Levantar as regras do negócio (kit, estoque, custos indiretos, canais)
- [x] Registrar o modelo genérico em `docs/modelo-de-dados.md`
- [x] Planejar o movimento de estoque e o movimento de lote
- [x] Definir as entidades e as relações
  - [x] Revisar o bloco 1: cadastros
  - [x] Revisar o bloco 2: compras, lotes e estoque
  - [x] Revisar o bloco 3: vendas
  - [x] Revisar o bloco 4: custos, preço e relatórios

#### Decisões
- [x] Decidir o rateio das despesas (regra no modelo)
- [x] Decidir a margem alvo do canal (fora do modelo)
- [x] Decidir o idioma dos nomes das tabelas e campos (inglês, tabelas no plural)
- [x] Definir o tipo do produto composto (regra no modelo)
- [x] Definir a auditoria dos registros e a tabela de usuários (regra no modelo)
- [x] Definir a tabela de dicionário dos campos (regra no modelo)
- [x] Definir as regras de cobrança de cada canal (regras no modelo; mensalidade como despesa)
- [x] Definir os tipos de kit (cada tipo é um produto composto; regra no modelo)
- [x] Definir o cancelamento de vendas (não existe; devolução entra como compra normal)
- [x] Definir a edição de vendas (regra no modelo)
- [x] Aprovar o glossário português → inglês dos nomes do modelo (glossário no modelo)

### 5. Módulos do backend
- [x] Revisar a lista de módulos e definir a ordem (lista e ordem confirmadas abaixo)
- [x] Criar as 19 entidades TypeORM e gerar a primeira migration (antes dos módulos)
  - [x] Criar a branch `feat/entidades`
  - [x] Criar as classes-base de auditoria e a NamingStrategy
  - [x] Criar as entidades por módulo (19 tabelas, `tsc` sem erro, colunas conferidas com o glossário)
  - [x] Gerar a migration `CreateTables` e acrescentar o `CREATE EXTENSION` do `citext`
  - [x] Executar `migration:run` e conferir as 19 tabelas (20 com a tabela `migrations`)
- [x] Criar as funções e os triggers (log e campos de auditoria) e a revogação de `UPDATE` e `DELETE` em `audit_logs`, `stock_movements` e `batch_movements` em uma migration escrita à mão (o `migration:generate` não gera funções)
  - [x] Escrever a migration `CreateAuditTriggers` (`tsc` sem erro)
  - [x] Ajustar o `db:setup` para manter a revogação e documentar no `backend/README.md`
  - [x] Executar `migration:run` e conferir triggers, log e permissões (insert, update e exclusão lógica em `list_items` geram os campos e as duas linhas de log; `minierp_app` sem `UPDATE` e `DELETE` nas três tabelas)
  - [x] Executar `npm run db:setup` e confirmar que a revogação continua
- [x] Preencher as linhas do dicionário dos campos (`field_dictionary`)
  - [x] Escrever a migration `PopulateFieldDictionary` (217 linhas: 19 de tabela e 198 de campo, com `id` e campos de auditoria)
  - [x] Criar o script `db:check-dictionary`, que compara o banco com o dicionário, e documentá-lo no `backend/README.md`
  - [x] Executar `migration:run` e `npm run db:check-dictionary` (dicionário completo)
- [x] Definir cada módulo: operações, regras do modelo e validações
  - [x] Usuários (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Auditoria (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Listas (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Canais de venda (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Pessoas, no lugar de Fornecedores e Clientes (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Produtos, com as unidades do produto (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Preços (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Estoque (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Compras (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Vendas, em três partes
    - [x] Rascunho da venda (operações e validações em `docs/modulos-do-backend.md`)
    - [x] Efetivar a venda (operações e validações em `docs/modulos-do-backend.md`)
    - [x] Devolução (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Despesas, com o fechamento do mês (operações e validações em `docs/modulos-do-backend.md`)
  - [x] Relatórios (operações e validações em `docs/modulos-do-backend.md`)

### 6. Frontend
- [~] Definir o layout e a navegação (definição em `docs/frontend-layout.md`, protótipo em `docs/prototipos/layout-navegacao.html`; aguardando confirmação)
  - [x] Definir o estilo e os temas (Padrão e Fofo, cada um com modo claro e escuro)
  - [~] Definir as telas de cada módulo, um módulo por vez
    - [x] Usuários, com o login
    - [x] Auditoria (fluxo em `docs/frontend-layout.md`)
    - [ ] Listas
    - [ ] Canais de venda
    - [ ] Pessoas
    - [ ] Produtos
    - [ ] Preços
    - [ ] Estoque
    - [ ] Compras
    - [x] Vendas
    - [ ] Despesas, com o fechamento do mês
    - [ ] Relatórios
- [ ] Implementar o layout e a navegação (MUI, React Router, menu e rotas)
- [ ] Telas de cada módulo (a tela de login entra em Usuários)

### 7. Evoluções futuras
- [ ] Preço sugerido por fórmula configurável (descrição em `docs/evolucoes.md`)
- [ ] Recuperação de senha por e-mail (descrição em `docs/evolucoes.md`)

## Ramificações resolvidas

- [x] Prisma 8 mudou o fluxo → trocado por TypeORM
- [x] Observe (telemetria do Nest) → removido do código e do `package.json`
- [x] Node não encontrado no Git Bash → instalado com `winget`
- [x] Pasta `MiniERP` duplicada → conteúdo movido para a raiz
- [x] `package.json` vazios na raiz → removidos
- [x] `backend/README.md` e `backend/AGENTS.md` citavam o Observe → seção removida e README reescrito
- [x] `db-setup.js` não mostrava as perguntas nem avisava o fim da entrada → leitor único e erro claro; funciona no PowerShell e no Git Bash
- [x] `psql` fora do PATH do Git Bash → usado o caminho completo (PostgreSQL 18)
- [x] Fim de linha (CRLF × LF) em `.gitignore` e `README.md` → `.gitattributes` na raiz com `* text=auto eol=lf`
- [x] Trava `.git/index.lock` deixada por um `git add -n` → renomeada para `.git/stale-index-lock` (pode ser apagada)
- [x] Identidade automática do Git no primeiro commit → nome e e-mail pessoais configurados só neste repositório (conta `ThBorgesSilveira`) e commit refeito antes do push
- [x] `npm audit` no backend (25 vulnerabilidades, 2 altas) → removido `@nestjs/mau` e o script `deploy`; `npm audit fix` sem `--force` aplicado; sobram 20 (16 moderadas, 4 baixas) no Jest, `glob`, `minimatch` e `deepmerge`. Risco aceito: são só dependências de desenvolvimento e `npm audit --omit=dev` mostra 0. Nunca usar `--force` (downgrade do Jest para a v25)
- [x] Aviso de `install-scripts` do npm → `@parcel/watcher` negado (`allowScripts` no `backend/package.json`); `npm run start:dev` confirmado; o `esbuild` saiu com o `@nestjs/mau`
- [x] O log gravaria o `password_hash` dos usuários → log por função no banco (trigger) que omite o campo; regra no modelo
- [x] A compra movia o estoque na hora → compra com status pedida ou recebida; a conferência edita os itens e a confirmação do recebimento grava os lotes
- [x] Fornecedor da compra de devolução → fica vazio; a devolução nasce no módulo Vendas
- [x] O modelo não dizia se o cliente é obrigatório na venda → obrigatório para efetivar; o rascunho aceita cliente vazio
- [x] O que volta ao estoque na devolução → itens simples e componentes dos kits; os materiais não voltam; a compra nasce recebida e sem fornecedor
- [x] Clientes e Fornecedores em tabelas separadas → unificados na tabela de pessoas, com papel de cliente e papel de fornecedor (19 tabelas)
- [x] Branches obsoletas, locais e remotas → apagadas; restam `main` e `origin/main`
- [x] Atualizar o ambiente local exigia vários procedimentos manuais → `atualizar.bat` na raiz chama `backend/scripts/atualizar.js` (regra em Decisões; PR #8)

## Ramificações abertas

- [ ] Definir a configuração do tema no backend: onde o banco a guarda, as operações, a consulta aberta para a tela de login e o perfil de auditoria.
- [ ] Criar a operação "Criar com preço e saldo inicial" no módulo Produtos, usada pelo cadastro rápido de produto da tela de venda (definição em `docs/modulos-do-backend.md`)
- [ ] Aceitar cliente vazio no rascunho da venda: ajustar `customerId` em `backend/src/sales/sale.entity.ts` e gerar uma migration que remove o `NOT NULL` de `sales.customer_id` (a `CreateTables` já rodou)
- [ ] Revisar o `npm audit` do backend quando sair uma versão nova do Jest (restam 20 vulnerabilidades moderadas e baixas, só nas ferramentas de teste)
- [ ] Definir o contrato de listagem das operações Listar (página, busca, filtros e total) para todos os módulos em `docs/modulos-do-backend.md`
- [ ] Acrescentar ao dicionário dos campos a linha de `password_changed` em `users` (migration nova) e ajustar o `db:check-dictionary` para aceitá-la sem coluna correspondente
