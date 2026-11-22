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

## Migrations

As tabelas do banco nascem de migrations, na pasta `src/database/migrations`. As migrations rodam com o usuário dono (`DB_OWNER_USER`, no `.env`). A aplicação não altera a estrutura do banco (`synchronize` desligado). Rode o `db:setup` antes da primeira migration.

Depois de cada `git pull`, rode `npm run migration:run`. O comando aplica só as migrations novas.

```bash
# aplicar as migrations pendentes
npm run migration:run

# listar as migrations e o estado de cada uma
npm run migration:show

# desfazer a última migration
npm run migration:revert
```

### Criar uma migration

1. Altere as entidades (`*.entity.ts`).
2. Gere a migration. O TypeORM compara as entidades com o banco e escreve o SQL.

```bash
npm run migration:generate -- src/database/migrations/NomeDaMigration
```

3. Revise o arquivo gerado antes de aplicar.

O `migration:generate` não cria funções nem triggers: escreva essas migrations à mão. Nomeie as migrations em inglês, no formato `CreateTables`.

A migration `CreateAuditTriggers` revoga `UPDATE` e `DELETE` do usuário da aplicação em `audit_logs`, `stock_movements` e `batch_movements`. O `db:setup` mantém essa revogação.

## Dicionário dos campos

Cada tabela e cada campo do banco tem uma linha na tabela `field_dictionary`. O dicionário só muda por migration: a migration que cria ou remove uma tabela ou um campo ajusta as linhas dele.

O comando abaixo compara o banco com o dicionário. Ele usa o usuário dono (`DB_OWNER_USER`) e grava o resultado em `backend/logs/check-dictionary.log`, fora do Git.

```bash
npm run db:check-dictionary
```

O resultado é "Dicionário completo." ou a lista dos itens que faltam ou sobram no dicionário.

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
