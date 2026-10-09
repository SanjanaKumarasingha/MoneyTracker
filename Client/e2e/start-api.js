// Boots an isolated copy of the Server/ API for the Playwright suite:
// a fresh `moneytracker_e2e` database (dropped and recreated every run),
// the real migrations, and the API on port 5001 - so e2e runs never touch
// the dev database or a dev server already running on 5000.
//
// Reads DB host/credentials from Server/.env (or the environment, in CI).
const path = require('path');
const { execSync, spawn } = require('child_process');

const serverDir = path.resolve(__dirname, '../../Server');
require(path.join(serverDir, 'node_modules/dotenv')).config({
  path: path.join(serverDir, '.env'),
});
const mysql = require(path.join(serverDir, 'node_modules/mysql2/promise'));

const E2E_DB = process.env.DB_E2E_DATABASE || 'moneytracker_e2e';
const PORT = process.env.E2E_API_PORT || '5001';

if (!E2E_DB.endsWith('_e2e')) {
  throw new Error(
    `Refusing to run: DB_E2E_DATABASE "${E2E_DB}" must end in "_e2e" - it is dropped on every run.`,
  );
}

async function main() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
  });
  await conn.query(`DROP DATABASE IF EXISTS \`${E2E_DB}\``);
  await conn.query(`CREATE DATABASE \`${E2E_DB}\``);
  await conn.end();

  const env = {
    ...process.env,
    DB_DATABASE: E2E_DB,
    PORT,
    NODE_ENV: 'development',
  };
  const run = (cmd) => execSync(cmd, { cwd: serverDir, env, stdio: 'inherit' });

  run('npm run build');
  run('npx typeorm migration:run -d dist/datasource.js');

  const api = spawn('node', ['dist/main.js'], {
    cwd: serverDir,
    env,
    stdio: 'inherit',
  });
  const stop = () => api.kill('SIGTERM');
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  api.on('exit', (code) => process.exit(code ?? 0));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
