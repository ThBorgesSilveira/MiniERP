# MiniERP — Atividades

Este arquivo lista as atividades do projeto.
Use-o para voltar ao ponto certo depois de uma ramificação.

Legenda: `[x]` concluído · `[ ]` pendente · `[~]` em andamento

## Decisões

- Aplicação web local.
- Backend: NestJS + TypeORM + PostgreSQL (TypeScript).
- Frontend: React + Vite (TypeScript).
- Um repositório (monorepo) com as pastas `backend/` e `frontend/`.
- Branches: `main` estável e uma branch curta por funcionalidade (`feat/...`, `fix/...`).
- PostgreSQL: instalação do Windows, `localhost:5432` (sem Docker).
- Banco `minierp` com dois usuários: `minierp_owner` (dono, roda as migrations) e `minierp_app` (backend, só `SELECT/INSERT/UPDATE/DELETE`). Sem superusuário, sem criar bancos ou usuários, acesso público revogado.
- Senhas só no `.env`. Nunca no chat nem no Git.
- Criação do banco, dos usuários e das permissões por script (`npm run db:setup`), sem executar SQL à mão. Motivo: continuar o desenvolvimento em outro PC. Sem Docker.
- Tabelas por migrations geradas pelo TypeORM (`synchronize` desligado). As migrations rodam com `minierp_owner`.

## Trilha principal

### 1. Preparação do ambiente
- [x] Criar o repositório no GitHub
- [x] Clonar o repositório na pasta do projeto
- [x] Instalar o Node.js (v26) e o npm
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
- [ ] Documentar as migrations no `backend/README.md` (depois da primeira migration)

### 4. Modelo de dados
- [ ] Definir as entidades e as relações
- [ ] Registrar o modelo em `docs/`

### 5. Módulos do backend
- [ ] Produtos
- [ ] Estoque
- [ ] Compras
- [ ] Custos (direto e indireto)
- [ ] Preço
- [ ] Clientes
- [ ] Vendas
- [ ] Relatórios

### 6. Frontend
- [ ] Definir o layout e a navegação
- [ ] Telas de cada módulo

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

## Ramificações abertas

- [ ] Revisar o `npm audit` do backend quando sair uma versão nova do Jest (restam 20 vulnerabilidades moderadas e baixas, só nas ferramentas de teste)
