/**
 * 位置情報匿名化バッチ（REQUIREMENTS §8: actions の位置情報は90日で匿名化）。
 * cron 等で日次実行する想定。90日を超えた actions の location を NULL 化する。
 */
import { pool } from '../infra/db';

export async function anonymizeOldActions(retentionDays = 90): Promise<number> {
  const res = await pool.query(
    `UPDATE actions
        SET location = NULL, accuracy = NULL, anonymized = true
      WHERE anonymized = false
        AND created_at < now() - ($1 || ' days')::interval`,
    [String(retentionDays)],
  );
  return res.rowCount ?? 0;
}

if (require.main === module) {
  anonymizeOldActions()
    .then((n) => {
      console.log(`anonymized ${n} action rows`);
      return pool.end();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
