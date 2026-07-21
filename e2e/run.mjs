/**
 * E2E: ログイン → 店舗チェックイン → メインピース入手 → ワークで絵の具入手
 *      → 工房で修復 → 名画完成 → 鑑賞モードでBGM再生 まで一連を検証する。
 * 受け入れ基準(REQUIREMENTS §11)の主要項目もあわせて検証する。
 *
 * 前提: api(:4000) と mock-citras(:4100) が起動済み・DBがseed済み。
 * 実行: node e2e/run.mjs
 *
 * 注: 「1つの名画の全ピース収集」は通常プレイでは複数店舗/ワークにまたがるため、
 *     E2Eでは残りのピース入手を pg 直挿しでシミュレートする（テスト足場）。
 *     修復・完成判定・BGM解放・ゼンマイ消費はすべてHTTP経由で検証する。
 */
import pg from 'pg';

const API = process.env.API_URL ?? 'http://localhost:4000';
const MOCK = process.env.MOCK_URL ?? 'http://localhost:4100';
const DATABASE_URL =
  process.env.DATABASE_URL ?? 'postgres://museum:museum@127.0.0.1:5432/lost_museum';

let pass = 0;
let fail = 0;
function assert(cond, label) {
  if (cond) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.error(`  ✗ ${label}`);
  }
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = text;
  }
  return { status: res.status, json };
}

const loc = (lat, lng, extra = {}) => ({
  lat,
  lng,
  accuracy: 12,
  is_mock_location: false,
  client_timestamp: new Date().toISOString(),
  ...extra,
});

async function main() {
  const uid = `e2e-${Date.now()}`;
  const db = new pg.Client({ connectionString: DATABASE_URL });
  await db.connect();

  console.log('\n[1] ログイン');
  const login = await api('/api/v1/auth/login', {
    method: 'POST',
    body: { citras_user_id: uid, curator_name: 'E2E学芸員' },
  });
  assert(login.status === 200 && login.json.token, 'JWTトークン取得');
  const token = login.json.token;
  const playerId = login.json.player.id;

  console.log('\n[2] 地図スポット取得');
  const spots = await api('/api/v1/map/spots?bbox=139.6,35.6,139.85,35.75', { token });
  assert(spots.status === 200, 'spots 200');
  const eventStore = spots.json.spots.find((s) => s.kind === 'event_store');
  const stations = spots.json.spots.filter((s) => s.kind === 'carshare_station');
  assert(!!eventStore, 'イベント店舗が存在');
  assert(stations.length > 0, `カーシェアST ${stations.length}件`);

  console.log('\n[3] 80m圈外からのチェックインは403');
  const farCheckin = await api(`/api/v1/events/${eventStore.id}/checkin`, {
    method: 'POST',
    token,
    body: loc(eventStore.lat + 0.02, eventStore.lng),
  });
  assert(farCheckin.status === 403 && farCheckin.json.error === 'too_far', '圈外は403 too_far');

  console.log('\n[4] 店舗チェックイン → メインピース入手');
  const checkin = await api(`/api/v1/events/${eventStore.id}/checkin`, {
    method: 'POST',
    token,
    body: loc(eventStore.lat, eventStore.lng),
  });
  assert(checkin.status === 200 && !!checkin.json.mainPieceAwarded, 'メインピース入手');
  const artworkId = checkin.json.artworkId ?? checkin.json.mainPieceAwarded?.artworkId;

  console.log('\n[5] 同一店舗の当日再チェックインは付与なし');
  const checkin2 = await api(`/api/v1/events/${eventStore.id}/checkin`, {
    method: 'POST',
    token,
    body: loc(eventStore.lat, eventStore.lng),
  });
  assert(checkin2.json.alreadyCheckedInToday === true, '当日2回目はalreadyCheckedInToday');

  console.log('\n[6] 速度チェック: 150km/h超の移動後はfraud_flag記録');
  // 直前の位置(先のチェックイン)から短時間で遠方の別店にアクション
  const otherStore = spots.json.spots.find(
    (s) => s.kind === 'event_store' && s.id !== eventStore.id,
  );
  const before = await db.query('SELECT COUNT(*)::int AS c FROM fraud_flags WHERE player_id=$1', [playerId]);
  await api(`/api/v1/stores/${otherStore.id}/visit`, {
    method: 'POST',
    token,
    body: loc(otherStore.lat, otherStore.lng),
  });
  const after = await db.query('SELECT COUNT(*)::int AS c FROM fraud_flags WHERE player_id=$1', [playerId]);
  assert(after.rows[0].c > before.rows[0].c, `fraud_flag記録 (${before.rows[0].c}→${after.rows[0].c})`);

  console.log('\n[7] ワーク: 承認Webなしのclaimは403');
  const noApprove = await api('/api/v1/work/tasks/task-002/claim-reward', {
    method: 'POST',
    token,
    body: { idempotency_key: `noapprove-${uid}` },
  });
  assert(noApprove.status === 403, '未承認は403');

  console.log('\n[8] ワーク完了(mock) → Webhook → 報酬claim');
  await fetch(`${MOCK}/work-tasks/task-002/complete`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ player_id: playerId, citras_user_id: uid }),
  });
  await new Promise((r) => setTimeout(r, 600));
  const claim = await api('/api/v1/work/tasks/task-002/claim-reward', {
    method: 'POST',
    token,
    body: { idempotency_key: `task-002:${playerId}` },
  });
  assert(claim.status === 200 && claim.json.paintGranted > 0, `絵の具${claim.json.paintGranted}入手`);

  console.log('\n[9] 同一idempotency_keyでの二重claimは重複扱い');
  const claimDup = await api('/api/v1/work/tasks/task-002/claim-reward', {
    method: 'POST',
    token,
    body: { idempotency_key: `task-002:${playerId}` },
  });
  assert(claimDup.json.alreadyClaimed === true, 'alreadyClaimed=true (二重付与なし)');

  console.log('\n[10] 全ピースを収集(テスト足場: 残りのpg直挿) → 工房で全修復');
  // 絵の具を十分に付与（上限は日次なので直挿）
  await db.query('UPDATE players SET restore_paint=99 WHERE id=$1', [playerId]);
  const allPieces = await db.query('SELECT id FROM artwork_pieces WHERE artwork_id=$1 ORDER BY piece_index', [artworkId]);
  for (const p of allPieces.rows) {
    await db.query(
      'INSERT INTO player_pieces (player_id, piece_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [playerId, p.id],
    );
  }
  // 全ピースをHTTP経由で修復
  let completed = false;
  let unlockedMusicId = null;
  for (const p of allPieces.rows) {
    const r = await api(`/api/v1/artworks/${artworkId}/restore`, {
      method: 'POST',
      token,
      body: { piece_id: p.id },
    });
    if (r.status === 200 && r.json.artworkCompleted) {
      completed = true;
      unlockedMusicId = r.json.unlockedMusicId;
    }
  }
  assert(completed, '全ピース修復で名画完成');
  assert(!!unlockedMusicId, `BGM解放 (music=${unlockedMusicId})`);

  console.log('\n[11] 美術館: 名画がcompletedに');
  const detail = await api(`/api/v1/artworks/${artworkId}`, { token });
  assert(detail.json.artwork.state === 'completed', 'state=completed');

  console.log('\n[12] 鑑賞モード: 蓄音機BGM再生(ゼンマイ消費)');
  const invBefore = (await api('/api/v1/inventory', { token })).json;
  const play = await api('/api/v1/gramophone/play', {
    method: 'POST',
    token,
    body: { artwork_id: artworkId },
  });
  assert(play.status === 200 && !!play.json.music?.audioUrl, `BGM再生(${play.json.music?.titleJa})`);
  assert(play.json.remainingSpring === invBefore.gramophoneSpring - 1, 'ゼンマイ1消費');

  console.log('\n[13] コインショップ: 絵の具交換');
  await db.query('UPDATE players SET coins=2000, paint_earned_today=0 WHERE id=$1', [playerId]);
  const exchange = await api('/api/v1/shop/exchange', {
    method: 'POST',
    token,
    body: { item_id: 'paint_x10' },
  });
  assert(exchange.status === 200 && exchange.json.paintGranted === 10, '絵の具×10交換');

  console.log('\n[14] クーポン交換(mock citras 発行)');
  const coupon = await api('/api/v1/shop/exchange', {
    method: 'POST',
    token,
    body: { item_id: 'carshare_10off' },
  });
  assert(coupon.status === 200 && !!coupon.json.couponCode, `クーポン発行(${coupon.json.couponCode})`);

  console.log('\n[15] リピート訪問5回でレプリカ常設');
  const uid2 = `e2e-visit-${Date.now()}`;
  const login2 = await api('/api/v1/auth/login', {
    method: 'POST',
    body: { citras_user_id: uid2, curator_name: '訪問テスト' },
  });
  const token2 = login2.json.token;
  const pid2 = login2.json.player.id;
  let replicaUnlocked = false;
  let replicaMusicId = null;
  for (let i = 0; i < 5; i++) {
    // 同日1回制限を回避するため last_visited_at を前日に巻き戻す
    await db.query(
      `UPDATE store_visits SET last_visited_at = now() - interval '1 day' WHERE player_id=$1 AND store_id=$2`,
      [pid2, eventStore.id],
    );
    const v = await api(`/api/v1/stores/${eventStore.id}/visit`, {
      method: 'POST',
      token: token2,
      body: loc(eventStore.lat, eventStore.lng),
    });
    if (v.json.replicaUnlocked) replicaUnlocked = true;
    if (v.json.replicaJustUnlocked) replicaMusicId = v.json.replicaMusicId;
  }
  assert(replicaUnlocked, '5回訪問でレプリカ常設');

  console.log('\n[16] レプリカ店は地図で replica_store に');
  const spots2 = await api('/api/v1/map/spots?bbox=139.6,35.6,139.85,35.75', { token: token2 });
  const replicaSpot = spots2.json.spots.find((s) => s.id === eventStore.id);
  assert(replicaSpot?.kind === 'replica_store', 'replica_store化');

  await db.end();
  console.log(`\n=== E2E結果: ${pass} passed, ${fail} failed ===`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
