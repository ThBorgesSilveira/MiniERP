'use strict';

// Confere se o dicionário dos campos cobre todas as tabelas e colunas do banco.
//
//   npm run db:check-dictionary
//
// Lê a conexão do arquivo backend/.env e conecta com o usuário dono.
// Grava o resultado em backend/logs/check-dictionary.log, que o Git ignora.

const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');

const ARQUIVO_ENV = path.join(__dirname, '..', '.env');
const ARQUIVO_SAIDA = path.join(__dirname, '..', 'logs', 'check-dictionary.log');

// Compara o banco com o dicionário. A linha da tabela tem campo vazio.
const CONSULTA = `
SELECT c.table_name AS banco_tabela, c.column_name AS banco_campo,
       d.table_name AS dicionario_tabela, d.field_name AS dicionario_campo
FROM (
  SELECT table_name, column_name FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name <> 'migrations'
  UNION ALL
  SELECT table_name, NULL FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE' AND table_name <> 'migrations'
) c
FULL JOIN field_dictionary d
  ON d.table_name = c.table_name
 AND COALESCE(d.field_name, '') = COALESCE(c.column_name, '')
WHERE c.table_name IS NULL OR d.table_name IS NULL
ORDER BY COALESCE(c.table_name, d.table_name), COALESCE(c.column_name, d.field_name) NULLS FIRST
`;

function carregarEnv() {
  try {
    process.loadEnvFile(ARQUIVO_ENV);
  } catch {
    throw new Error(`Arquivo .env não encontrado em ${ARQUIVO_ENV}. Copie o .env.example para .env e preencha.`);
  }
}

function lerConfiguracao() {
  const env = process.env;
  const cfg = {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 5432),
    database: env.DB_NAME,
    user: env.DB_OWNER_USER,
    password: env.DB_OWNER_PASSWORD,
  };

  const faltando = [
    ['DB_NAME', cfg.database],
    ['DB_OWNER_USER', cfg.user],
    ['DB_OWNER_PASSWORD', cfg.password],
  ]
    .filter(([, valor]) => !valor)
    .map(([nome]) => nome);

  if (faltando.length > 0) {
    throw new Error(`Variáveis vazias no .env: ${faltando.join(', ')}.`);
  }

  return cfg;
}

async function consultar(cfg) {
  const cliente = new Client(cfg);
  await cliente.connect();
  try {
    const { rows } = await cliente.query(CONSULTA);
    return rows;
  } finally {
    await cliente.end();
  }
}

function nomeDoItem(tabela, campo) {
  return campo ? `${tabela}.${campo}` : `${tabela} (descrição da tabela)`;
}

function montarRelatorio(linhas) {
  const faltando = linhas
    .filter((l) => l.dicionario_tabela === null)
    .map((l) => nomeDoItem(l.banco_tabela, l.banco_campo));
  const sobrando = linhas
    .filter((l) => l.banco_tabela === null)
    .map((l) => nomeDoItem(l.dicionario_tabela, l.dicionario_campo));

  if (faltando.length === 0 && sobrando.length === 0) {
    return { completo: true, texto: 'Dicionário completo.' };
  }

  const partes = [];
  if (faltando.length > 0) {
    partes.push(`Faltam no dicionário (${faltando.length}):`, ...faltando.map((item) => `- ${item}`));
  }
  if (sobrando.length > 0) {
    partes.push(`Sobram no dicionário (${sobrando.length}):`, ...sobrando.map((item) => `- ${item}`));
  }
  return { completo: false, texto: partes.join('\n') };
}

function gravar(texto) {
  fs.mkdirSync(path.dirname(ARQUIVO_SAIDA), { recursive: true });
  fs.writeFileSync(ARQUIVO_SAIDA, `${texto}\n`, 'utf8');
}

async function main() {
  const cabecalho = `Conferência do dicionário dos campos, ${new Date().toLocaleString('pt-BR')}`;
  let corpo;
  let completo = false;

  try {
    carregarEnv();
    const linhas = await consultar(lerConfiguracao());
    ({ texto: corpo, completo } = montarRelatorio(linhas));
  } catch (erro) {
    corpo = `Erro: ${erro.message || erro.code || erro}`;
  }

  const texto = `${cabecalho}\n${corpo}`;
  gravar(texto);
  console.log(texto);
  console.log(`\nResultado gravado em ${ARQUIVO_SAIDA}`);
  if (!completo) process.exitCode = 1;
}

main();
