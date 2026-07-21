/** マイグレーション実行スクリプト。db/migrations/*.sql を昇順に適用する。 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pool } from './db';

async function migrate(): Promise<void> {
  const dir = join(__dirname, '../../db/migrations');
  await pool.query(
    'CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())',
  );
  const applied = new Set(
    (await pool.query('SELECT name FROM _migrations')).rows.map((r) => r.name),
  );
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip  ${file}`);
      continue;
    }
    const sql = readFileSync(join(dir, file), 'utf8');
    console.log(`apply ${file}`);
    await pool.query('BEGIN');
    try {
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
      await pool.query('COMMIT');
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }
  console.log('migrations done');
}

migrate()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
