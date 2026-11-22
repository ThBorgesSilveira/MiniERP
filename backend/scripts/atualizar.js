'use strict';

// Atualiza o ambiente local do MiniERP: código, dependências, banco e compilação.
//
//   atualizar.bat                       (na raiz do projeto)
//   node backend/scripts/atualizar.js
//
// Para no primeiro erro. Mostra cada passo na tela e grava o resultado em
// backend/logs/atualizar.log, que o Git ignora.
// Pode rodar quantas vezes precisar: o que já está atualizado não muda.

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const RAIZ = path.join(__dirname, '..', '..');
const BACKEND = path.join(RAIZ, 'backend');
const FRONTEND = path.join(RAIZ, 'frontend');
const ARQUIVO_ENV = path.join(BACKEND, '.env');
const ARQUIVO_ENV_EXEMPLO = path.join(BACKEND, '.env.example');
const ARQUIVO_LOG = path.join(BACKEND, 'logs', 'atualizar.log');
const ARQUIVO_LOG_DICIONARIO = path.join(BACKEND, 'logs', 'check-dictionary.log');
const VARIAVEIS_OBRIGATORIAS = ['DB_NAME', 'DB_APP_USER', 'DB_APP_PASSWORD', 'DB_OWNER_USER', 'DB_OWNER_PASSWORD'];
const CODIGOS_SERVIDOR_INACESSIVEL = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH'];

// Parada esperada: o usuário precisa agir antes de continuar. Não é falha do script.
class Parada extends Error {}

const linhasDoLog = [];

function registrar(texto) {
  console.log(texto);
  linhasDoLog.push(texto);
}

function gravarLog() {
  fs.mkdirSync(path.dirname(ARQUIVO_LOG), { recursive: true });
  fs.writeFileSync(ARQUIVO_LOG, `${linhasDoLog.join('\n')}\n`, 'utf8');
}

// Roda um comando. Com silencioso, captura a saída; sem ele, mostra na tela.
// Só o npm passa pelo shell, porque no Windows ele é um arquivo .cmd.
function rodar(comando, args, pasta, silencioso = false) {
  const opcoes = { cwd: pasta, stdio: silencioso ? 'pipe' : 'inherit', encoding: 'utf8' };
  const resultado =
    comando === 'npm'
      ? spawnSync(`npm ${args.join(' ')}`, { ...opcoes, shell: true })
      : spawnSync(comando, args, opcoes);

  if (resultado.error) {
    throw new Error(`Não foi possível executar "${comando}": ${resultado.error.message}`);
  }
  return resultado;
}

function exigir(resultado, descricao) {
  if (resultado.status !== 0) {
    throw new Error(`${descricao} falhou (código ${resultado.status}).`);
  }
}

function git(args) {
  const resultado = rodar('git', args, RAIZ, true);
  exigir(resultado, `"git ${args.join(' ')}"`);
  return resultado.stdout.trimEnd();
}

function maiorOuIgual(versao, minimo) {
  for (let i = 0; i < 3; i += 1) {
    if (versao[i] !== minimo[i]) return versao[i] > minimo[i];
  }
  return true;
}

function nodeAceito() {
  const versao = process.versions.node.split('.').map(Number);
  if (versao[0] >= 26) return true;
  if (versao[0] === 24) return maiorOuIgual(versao, [24, 15, 0]);
  if (versao[0] === 22) return maiorOuIgual(versao, [22, 22, 3]);
  return false;
}

function conferirFerramentas() {
  if (!nodeAceito()) {
    throw new Error(`O Node.js ${process.versions.node} não atende. Use ^22.22.3, ^24.15.0 ou >=26.0.0.`);
  }

  const npm = rodar('npm', ['--version'], RAIZ, true);
  exigir(npm, 'O npm');
  const versaoDoGit = rodar('git', ['--version'], RAIZ, true);
  exigir(versaoDoGit, 'O Git');

  registrar(`  Node ${process.versions.node}, npm ${npm.stdout.trim()}, ${versaoDoGit.stdout.trim()}`);
}

function atualizarCodigo(resumo) {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch === 'HEAD') {
    throw new Error('O Git está sem branch (HEAD solto). Volte para uma branch e rode de novo.');
  }

  const alteracoes = git(['status', '--porcelain', '--untracked-files=no']);
  if (alteracoes !== '') {
    throw new Error(`Há alterações locais sem commit. Faça o commit ou guarde-as antes de atualizar:\n${alteracoes}`);
  }

  const antes = git(['rev-parse', '--short', 'HEAD']);
  const scriptAntes = fs.readFileSync(__filename, 'utf8');

  exigir(rodar('git', ['pull', '--ff-only'], RAIZ), '"git pull --ff-only"');

  const depois = git(['rev-parse', '--short', 'HEAD']);
  resumo.commit = git(['log', '-1', '--format=%h %s']);
  registrar(`  Branch ${branch}: ${antes === depois ? `já estava em ${depois}` : `${antes} → ${depois}`}`);

  // O processo continua com o código lido antes do pull. Se o pull trocou este arquivo, recomeça.
  if (fs.readFileSync(__filename, 'utf8') !== scriptAntes) {
    throw new Parada('O pull atualizou o próprio atualizador. Rode de novo para usar a versão nova.');
  }
}

function conferirEnv() {
  if (!fs.existsSync(ARQUIVO_ENV)) {
    fs.copyFileSync(ARQUIVO_ENV_EXEMPLO, ARQUIVO_ENV);
    throw new Parada('Criei o backend/.env a partir do .env.example. Preencha as senhas nele e rode de novo.');
  }

  process.loadEnvFile(ARQUIVO_ENV);

  const vazias = VARIAVEIS_OBRIGATORIAS.filter((nome) => !process.env[nome]);
  if (vazias.length > 0) {
    throw new Parada(`Há variáveis vazias no backend/.env: ${vazias.join(', ')}. Preencha e rode de novo.`);
  }

  registrar('  backend/.env: ok');
}

function instalarDependencias() {
  registrar('  Feche o backend e o frontend em execução. O "npm ci" apaga a pasta node_modules.');
  registrar('  Backend:');
  exigir(rodar('npm', ['ci'], BACKEND), 'O "npm ci" do backend');
  registrar('  Frontend:');
  exigir(rodar('npm', ['ci'], FRONTEND), 'O "npm ci" do frontend');
}

// Conecta com o usuário dono. O pacote pg vem do "npm ci" do passo anterior.
async function testarLoginDoDono() {
  const { Client } = require('pg');
  const cliente = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_OWNER_USER,
    password: process.env.DB_OWNER_PASSWORD,
  });
  await cliente.connect();
  await cliente.end();
}

function servidorInacessivel(erro) {
  return [erro, ...(erro.errors ?? [])].some((item) => CODIGOS_SERVIDOR_INACESSIVEL.includes(item.code));
}

async function prepararBanco() {
  const alvo = `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`;
  const dono = process.env.DB_OWNER_USER;

  try {
    await testarLoginDoDono();
    registrar(`  login de ${dono} em ${process.env.DB_NAME}: ok`);
    return;
  } catch (erro) {
    if (servidorInacessivel(erro)) {
      throw new Error(`O PostgreSQL não responde em ${alvo}. Inicie o serviço do PostgreSQL e rode de novo.`);
    }
    registrar(`  login de ${dono} falhou (${erro.message}). Rodando o db:setup:`);
  }

  exigir(rodar('npm', ['run', 'db:setup'], BACKEND), 'O db:setup');

  try {
    await testarLoginDoDono();
  } catch (erro) {
    throw new Error(`O login de ${dono} continua falhando depois do db:setup: ${erro.message}`);
  }
  registrar(`  login de ${dono} em ${process.env.DB_NAME}: ok`);
}

function aplicarMigrations(resumo) {
  exigir(rodar('npm', ['run', 'migration:run'], BACKEND), 'O migration:run');

  const lista = rodar('npm', ['run', 'migration:show'], BACKEND, true);
  const aplicadas = (lista.stdout.match(/\[X\]/g) || []).length;
  const pendentes = (lista.stdout.match(/\[ \]/g) || []).length;

  if (pendentes > 0) {
    throw new Error(`Ainda há ${pendentes} migration(s) pendente(s) depois do migration:run.`);
  }
  exigir(lista, 'O migration:show');

  resumo.migrations = aplicadas;
  registrar(`  migrations aplicadas: ${aplicadas}, pendentes: 0`);
}

function conferirDicionario() {
  const resultado = rodar('npm', ['run', 'db:check-dictionary'], BACKEND);
  if (resultado.status !== 0) {
    throw new Error(`O dicionário dos campos está incompleto. Veja ${ARQUIVO_LOG_DICIONARIO}.`);
  }
}

function compilar() {
  registrar('  Backend:');
  exigir(rodar('npm', ['run', 'build'], BACKEND), 'A compilação do backend');
  registrar('  Frontend:');
  exigir(rodar('npm', ['run', 'build'], FRONTEND), 'A compilação do frontend');
}

function mostrarResumo(resumo) {
  const segundos = Math.round((Date.now() - resumo.inicio) / 1000);
  registrar(`  Commit: ${resumo.commit}`);
  registrar(`  Migrations aplicadas: ${resumo.migrations}`);
  registrar('  Dicionário dos campos: completo');
  registrar('  Compilação do backend e do frontend: ok');
  registrar(`  Tempo: ${segundos} s`);
  registrar(`  Registro: ${ARQUIVO_LOG}`);
}

const PASSOS = [
  ['Conferir o Node, o npm e o Git', conferirFerramentas],
  ['Atualizar o código', atualizarCodigo],
  ['Conferir o backend/.env', conferirEnv],
  ['Instalar as dependências', instalarDependencias],
  ['Preparar o banco', prepararBanco],
  ['Aplicar as migrations', aplicarMigrations],
  ['Conferir o dicionário dos campos', conferirDicionario],
  ['Compilar o backend e o frontend', compilar],
  ['Resumo', mostrarResumo],
];

async function principal() {
  const resumo = { inicio: Date.now(), commit: '', migrations: 0 };
  registrar(`Atualização do ambiente, ${new Date().toLocaleString('pt-BR')}`);

  for (const [indice, [titulo, executar]] of PASSOS.entries()) {
    registrar(`\n[${indice + 1}/${PASSOS.length}] ${titulo}`);
    await executar(resumo);
  }

  gravarLog();
}

principal().catch((erro) => {
  registrar(`\n${erro instanceof Parada ? 'PARADO' : 'ERRO'}: ${erro.message}`);
  gravarLog();
  process.exit(1);
});
