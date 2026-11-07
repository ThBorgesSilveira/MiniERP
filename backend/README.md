# MiniERP — Backend

API do MiniERP. Usa NestJS, TypeORM e PostgreSQL, em TypeScript.

## Instalação

```bash
npm install
```

## Banco de dados

O script `npm run db:setup` prepara o PostgreSQL. Rode-o antes de iniciar o backend pela primeira vez, inclusive em outro computador.

Antes de rodar, confirme que:

- O PostgreSQL está instalado e em execução.
- O arquivo `backend/.env` existe, criado a partir do `.env.example`, com todos os campos preenchidos.

```bash
npm run db:setup
```

O script pergunta o usuário administrador do PostgreSQL (padrão `postgres`) e a senha dele. Ele usa essas informações só durante a execução e não as grava.

### O que o script cria

- **Banco:** `minierp`, sem acesso público.
- **Usuário dono** (`DB_OWNER_USER`): é dono do banco e do schema `public`. Cria e altera tabelas. As migrations usam este usuário.
- **Usuário da aplicação** (`DB_APP_USER`): é usado pelo backend. Pode apenas ler e gravar dados (`SELECT`, `INSERT`, `UPDATE` e `DELETE`). Não altera a estrutura do banco.

Os nomes e as senhas vêm do `.env`. Os nomes aceitam só letras minúsculas, números e `_`. As senhas têm 8 caracteres ou mais e são diferentes entre si.

### Rodar de novo

O script pode rodar quantas vezes você precisar. O que já existe é ajustado, não duplicado. Para trocar uma senha, altere o `.env` e rode o script de novo. Ele atualiza a senha no PostgreSQL.

### Rodar sem perguntas

Defina o usuário e a senha do administrador no ambiente do processo. Não coloque essas duas variáveis no `.env`.

```bash
DB_ADMIN_USER=postgres DB_ADMIN_PASSWORD=sua-senha npm run db:setup
```

Neste formato, a senha fica no histórico do terminal. Use-o só em ambientes de teste.

### Erros comuns

- **Arquivo .env não encontrado:** copie o `.env.example` para `.env`.
- **Variáveis vazias no .env:** preencha os campos indicados na mensagem.
- **Não é superusuário:** informe um administrador do PostgreSQL, como o `postgres`.
- **Falha de autenticação:** confira a senha do administrador.
- **ECONNREFUSED:** o PostgreSQL não está em execução, ou o host e a porta do `.env` estão errados.

## Execução

```bash
# desenvolvimento (recarrega ao salvar)
npm run start:dev

# produção
npm run start:prod
```

## Testes

```bash
# testes unitários
npm run test

# testes e2e
npm run test:e2e

# cobertura
npm run test:cov
```
