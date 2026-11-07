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

- Node.js 22.12 ou superior e npm
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
