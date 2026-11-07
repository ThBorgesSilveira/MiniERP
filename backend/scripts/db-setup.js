'use strict';

// Prepara o PostgreSQL para o MiniERP: cria os usuários, o banco e as permissões.
// Pode rodar quantas vezes precisar: o que já existe é ajustado, não duplicado.
//
//   npm run db:setup
//
// Lê a conexão do arquivo backend/.env.
// Pede o usuário e a senha do administrador do PostgreSQL na hora. Não grava essa senha.
// Para rodar sem perguntas, defina DB_ADMIN_USER e DB_ADMIN_PASSWORD no ambiente do processo.

const path = require('node:path');
const readline = require('node:readline');
const { Writable } = require('node:stream');
const { Client } = require('pg');

const ARQUIVO_ENV = path.join(__dirname, '..', '.env');
const NOME_VALIDO = /^[a-z_][a-z0-9_]*$/;
const TAMANHO_MINIMO_SENHA = 8;

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
    banco: env.DB_NAME,
    app: { usuario: env.DB_APP_USER, senha: env.DB_APP_PASSWORD },
    dono: { usuario: env.DB_OWNER_USER, senha: env.DB_OWNER_PASSWORD },
  };

  const erros = [];
  const faltando = [
    ['DB_NAME', cfg.banco],
    ['DB_APP_USER', cfg.app.usuario],
    ['DB_APP_PASSWORD', cfg.app.senha],
    ['DB_OWNER_USER', cfg.dono.usuario],
    ['DB_OWNER_PASSWORD', cfg.dono.senha],
  ].filter(([, valor]) => !valor);

  if (faltando.length > 0) {
    erros.push(`Variáveis vazias no .env: ${faltando.map(([nome]) => nome).join(', ')}.`);
  }

  for (const [nome, valor] of [
    ['DB_NAME', cfg.banco],
    ['DB_APP_USER', cfg.app.usuario],
    ['DB_OWNER_USER', cfg.dono.usuario],
  ]) {
    if (valor && !NOME_VALIDO.test(valor)) {
      erros.push(`${nome} deve ter só letras minúsculas, números e "_", e não começar com número.`);
    }
  }

  for (const [nome, valor] of [
    ['DB_APP_PASSWORD', cfg.app.senha],
    ['DB_OWNER_PASSWORD', cfg.dono.senha],
  ]) {
    if (valor && valor.length < TAMANHO_MINIMO_SENHA) {
      erros.push(`${nome} deve ter ao menos ${TAMANHO_MINIMO_SENHA} caracteres.`);
    }
  }

  if (cfg.app.usuario && cfg.app.usuario === cfg.dono.usuario) {
    erros.push('DB_APP_USER e DB_OWNER_USER devem ser usuários diferentes.');
  }

  if (cfg.app.senha && cfg.app.senha === cfg.dono.senha) {
    erros.push('DB_APP_PASSWORD e DB_OWNER_PASSWORD devem ser diferentes.');
  }

  if (erros.length > 0) {
    throw new Error(erros.join('\n'));
  }

  return cfg;
}

// Um só leitor para todas as perguntas. Abrir e fechar um leitor a cada pergunta
// perde a entrada em alguns terminais (como o Git Bash).
let leitor = null;
let ocultar = false;

function obterLeitor() {
  if (leitor === null) {
    const saida = new Writable({
      write(trecho, codificacao, pronto) {
        if (!ocultar) {
          process.stdout.write(trecho, codificacao);
        }
        pronto();
      },
    });

    leitor = readline.createInterface({ input: process.stdin, output: saida, terminal: Boolean(process.stdin.isTTY) });
  }

  return leitor;
}

function fecharLeitor() {
  if (leitor !== null) {
    leitor.close();
    leitor = null;
  }
}

function perguntar(texto, oculto = false) {
  return new Promise((resolve, reject) => {
    const atual = obterLeitor();
    const aoFechar = () => reject(new Error('A entrada do terminal foi encerrada antes da resposta.'));

    atual.once('close', aoFechar);
    atual.question(texto, (resposta) => {
      atual.off('close', aoFechar);
      if (ocultar) {
        ocultar = false;
        process.stdout.write('\n');
      }
      resolve(resposta);
    });

    // O texto da pergunta já foi escrito. A resposta digitada não aparece na tela.
    ocultar = oculto && Boolean(process.stdin.isTTY);
  });
}

// Monta o comando SQL no próprio servidor, com %I (nome) e %L (texto), para evitar erro de aspas.
async function montar(cliente, modelo, ...valores) {
  const { rows } = await cliente.query('SELECT format($1::text, VARIADIC $2::text[]) AS sql', [modelo, valores]);
  return rows[0].sql;
}

async function executar(cliente, modelo, ...valores) {
  await cliente.query(await montar(cliente, modelo, ...valores));
}

async function existe(cliente, consulta, valor) {
  const { rows } = await cliente.query(consulta, [valor]);
  return rows.length > 0;
}

async function garantirUsuario(cliente, { usuario, senha }) {
  const jaExiste = await existe(cliente, 'SELECT 1 FROM pg_roles WHERE rolname = $1', usuario);
  const verbo = jaExiste ? 'ALTER' : 'CREATE';

  await executar(
    cliente,
    `${verbo} ROLE %I LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION PASSWORD %L`,
    usuario,
    senha,
  );
  console.log(`  - usuário ${usuario}: ${jaExiste ? 'já existia, senha e atributos ajustados' : 'criado'}`);
}

async function garantirBanco(cliente, cfg) {
  const jaExiste = await existe(cliente, 'SELECT 1 FROM pg_database WHERE datname = $1', cfg.banco);

  if (jaExiste) {
    await executar(cliente, 'ALTER DATABASE %I OWNER TO %I', cfg.banco, cfg.dono.usuario);
  } else {
    await executar(cliente, 'CREATE DATABASE %I OWNER %I', cfg.banco, cfg.dono.usuario);
  }

  await executar(cliente, 'REVOKE ALL ON DATABASE %I FROM PUBLIC', cfg.banco);
  await executar(cliente, 'GRANT CONNECT ON DATABASE %I TO %I', cfg.banco, cfg.app.usuario);
  console.log(`  - banco ${cfg.banco}: ${jaExiste ? 'já existia, dono e acesso ajustados' : 'criado'}`);
}

async function aplicarPermissoes(cliente, cfg) {
  const dono = cfg.dono.usuario;
  const app = cfg.app.usuario;

  await executar(cliente, 'ALTER SCHEMA public OWNER TO %I', dono);
  await executar(cliente, 'REVOKE ALL ON SCHEMA public FROM PUBLIC');
  await executar(cliente, 'GRANT USAGE ON SCHEMA public TO %I', app);

  // Objetos que o dono criar daqui para frente
  await executar(
    cliente,
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO %I',
    dono,
    app,
  );
  await executar(
    cliente,
    'ALTER DEFAULT PRIVILEGES FOR ROLE %I IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO %I',
    dono,
    app,
  );

  // Objetos que já existem
  await executar(cliente, 'GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO %I', app);
  await executar(cliente, 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO %I', app);
  console.log('  - permissões do schema public aplicadas');
}

async function testarLogin(cfg, { usuario, senha }) {
  const cliente = new Client({ host: cfg.host, port: cfg.port, database: cfg.banco, user: usuario, password: senha });
  await cliente.connect();
  await cliente.end();
  console.log(`  - login de ${usuario} em ${cfg.banco}: ok`);
}

async function confirmarPermissoes(cliente, cfg) {
  const { rows } = await cliente.query(
    `SELECT has_schema_privilege($1, 'public', 'USAGE') AS app_usa,
            has_schema_privilege($1, 'public', 'CREATE') AS app_cria,
            has_schema_privilege($2, 'public', 'CREATE') AS dono_cria`,
    [cfg.app.usuario, cfg.dono.usuario],
  );
  const { app_usa: appUsa, app_cria: appCria, dono_cria: donoCria } = rows[0];

  if (!appUsa || appCria || !donoCria) {
    throw new Error('As permissões finais não ficaram como esperado. Revise o schema public.');
  }
  console.log(`  - ${cfg.app.usuario} usa o schema e não cria tabelas; ${cfg.dono.usuario} cria tabelas`);
}

async function principal() {
  carregarEnv();
  const cfg = lerConfiguracao();

  const usuarioAdmin = process.env.DB_ADMIN_USER || (await perguntar('Usuário administrador do PostgreSQL [postgres]: ')) || 'postgres';
  const senhaAdmin = process.env.DB_ADMIN_PASSWORD ?? (await perguntar(`Senha de ${usuarioAdmin}: `, true));
  fecharLeitor();

  if (!process.stdin.isTTY && process.env.DB_ADMIN_PASSWORD === undefined) {
    console.warn('Aviso: este terminal pode exibir a senha digitada. Use o PowerShell ou o CMD para ocultá-la.');
  }

  const conexao = { host: cfg.host, port: cfg.port, user: usuarioAdmin, password: senhaAdmin };

  console.log(`\nPreparando ${cfg.banco} em ${cfg.host}:${cfg.port}...`);

  const manutencao = new Client({ ...conexao, database: 'postgres' });
  await manutencao.connect();

  try {
    const { rows } = await manutencao.query('SELECT rolsuper FROM pg_roles WHERE rolname = current_user');
    if (!rows[0]?.rolsuper) {
      throw new Error(`${usuarioAdmin} não é superusuário. Use um usuário administrador do PostgreSQL.`);
    }

    // Evita que o servidor registre as senhas nos comandos CREATE/ALTER ROLE
    await manutencao.query("SET log_statement = 'none'");

    await garantirUsuario(manutencao, cfg.dono);
    await garantirUsuario(manutencao, cfg.app);
    await garantirBanco(manutencao, cfg);
  } finally {
    await manutencao.end();
  }

  const alvo = new Client({ ...conexao, database: cfg.banco });
  await alvo.connect();

  try {
    await aplicarPermissoes(alvo, cfg);
    await confirmarPermissoes(alvo, cfg);
  } finally {
    await alvo.end();
  }

  await testarLogin(cfg, cfg.dono);
  await testarLogin(cfg, cfg.app);

  console.log('\nBanco pronto.');
}

principal().catch((erro) => {
  console.error(`\nERRO: ${erro.message}`);
  process.exit(1);
});
