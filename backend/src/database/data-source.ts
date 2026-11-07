import { join } from 'node:path';
import { DataSource } from 'typeorm';

// Conexão usada pelo CLI do TypeORM (migrations).
// Usa o usuário dono do banco, que pode alterar a estrutura.
// A aplicação usa outro usuário, configurado no app.module.ts.

const arquivoEnv = join(__dirname, '..', '..', '.env');

try {
  process.loadEnvFile(arquivoEnv);
} catch {
  throw new Error(`Arquivo .env não encontrado em ${arquivoEnv}. Copie o .env.example para .env e preencha.`);
}

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  database: process.env.DB_NAME,
  username: process.env.DB_OWNER_USER,
  password: process.env.DB_OWNER_PASSWORD,
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
