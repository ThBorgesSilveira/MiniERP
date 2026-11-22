# MiniERP

Sistema de gestão para pequenos negócios online.

## Escopo

- Cadastro de produtos
- Gestão de estoque
- Gestão de compras
- Cálculo de custo direto e indireto
- Cálculo de preço
- Cadastro de clientes
- Gestão de vendas
- Relatórios

## Tecnologias

- Backend: NestJS, TypeORM e PostgreSQL
- Frontend: React e Vite
- Linguagem: TypeScript

## Estrutura

```
backend/    API (NestJS)
frontend/   Interface web (React + Vite)
docs/       Documentação e lista de atividades
```

## Requisitos

- Node.js `^22.22.3`, `^24.15.0` ou `>=26.0.0` e npm (desenvolvido com a versão 26)
- PostgreSQL (desenvolvido com a versão 18)

## Configuração

1. Copie `backend/.env.example` para `backend/.env` e preencha as senhas dos dois usuários do banco. Nunca envie o `.env` ao Git.
2. Instale as dependências de cada parte:

```bash
cd backend && npm install
cd ../frontend && npm install
```

3. Prepare o banco. O script cria o banco `minierp`, o usuário `minierp_owner` (dono, usado nas migrations) e o usuário `minierp_app` (usado pela aplicação, sem permissão de alterar a estrutura). Ele pede o usuário e a senha do administrador do PostgreSQL. Pode rodar de novo sem erro. Veja os detalhes em [backend/README.md](backend/README.md#banco-de-dados).

```bash
cd backend
npm run db:setup
```

4. Aplique as migrations. Elas criam as tabelas do banco com o usuário `minierp_owner`. Rode o comando de novo depois de cada `git pull`. Veja os detalhes em [backend/README.md](backend/README.md#migrations).

```bash
cd backend
npm run migration:run
```

## Atualizar o ambiente

Depois da primeira configuração, use o atualizador. Ele roda `git pull --ff-only`, o `npm ci` do backend e do frontend, as migrations e a conferência do dicionário. No fim, compila as duas partes. Feche o backend e o frontend antes de rodar.

```bash
.\atualizar.bat
```

Use `node backend/scripts/atualizar.js` em qualquer terminal. Se o `backend/.env` não existir, o atualizador cria o arquivo e para para você preencher as senhas. Se o login do `minierp_owner` falhar, ele roda o `db:setup`. O resultado fica em `backend/logs/atualizar.log`.

## Execução

```bash
# backend (http://localhost:3000)
cd backend
npm run start:dev

# frontend (http://localhost:5173)
cd frontend
npm run dev
```

## Atividades

O andamento do projeto fica em [docs/atividades.md](docs/atividades.md).
