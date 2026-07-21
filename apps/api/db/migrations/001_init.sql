-- 失われた美術館の修復 — 初期スキーマ (REQUIREMENTS §7)
-- PostGIS 拡張を有効化。位置は GEOGRAPHY(POINT, 4326)。

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 楽曲マスタ（録音ライセンスは CC0/PD のみ許可）
CREATE TABLE IF NOT EXISTS music_masters (
  id                      TEXT PRIMARY KEY,
  title_ja                TEXT NOT NULL,
  composer                TEXT NOT NULL,
  composer_death_year     INT,
  recording_source        TEXT NOT NULL,
  recording_license       TEXT NOT NULL CHECK (recording_license IN ('CC0','PD')),
  audio_url               TEXT NOT NULL,
  global_clearance_checked BOOLEAN NOT NULL DEFAULT FALSE
);

-- 名画マスタ（license は CC0/PD のみ許可）
CREATE TABLE IF NOT EXISTS artwork_masters (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ja           TEXT NOT NULL,
  title_original     TEXT NOT NULL,
  artist             TEXT NOT NULL,
  artist_death_year  INT,
  year_created       TEXT,
  source_museum      TEXT NOT NULL,
  source_url         TEXT,
  license            TEXT NOT NULL CHECK (license IN ('CC0','PD')),
  image_url_high     TEXT NOT NULL,
  image_url_thumb    TEXT NOT NULL,
  piece_count        INT NOT NULL,
  linked_music_id    TEXT REFERENCES music_masters(id),
  description_ja     TEXT
);

-- ピースマスタ（crop座標は0.0〜1.0の相対値）
CREATE TABLE IF NOT EXISTS artwork_pieces (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  artwork_id     UUID NOT NULL REFERENCES artwork_masters(id) ON DELETE CASCADE,
  piece_index    INT NOT NULL,
  piece_type     TEXT NOT NULL CHECK (piece_type IN ('main','sub')),
  name           TEXT NOT NULL,
  crop_x         REAL NOT NULL,
  crop_y         REAL NOT NULL,
  crop_w         REAL NOT NULL,
  crop_h         REAL NOT NULL,
  acquire_source TEXT NOT NULL CHECK (acquire_source IN ('event','work','visit')),
  UNIQUE (artwork_id, piece_index)
);

-- プレイヤー
CREATE TABLE IF NOT EXISTS players (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citras_user_id     TEXT UNIQUE NOT NULL,
  curator_name       TEXT NOT NULL,
  level              INT NOT NULL DEFAULT 1,
  xp                 INT NOT NULL DEFAULT 0,
  coins              INT NOT NULL DEFAULT 0,
  coins_earned_today INT NOT NULL DEFAULT 0,
  paint_earned_today INT NOT NULL DEFAULT 0,
  restore_paint      INT NOT NULL DEFAULT 6,
  gramophone_spring  INT NOT NULL DEFAULT 10,
  spring_updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  daily_reset_on     DATE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  device_id          TEXT,
  suspended_until    TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- プレイヤーごとの名画進捗
CREATE TABLE IF NOT EXISTS player_artworks (
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  artwork_id   UUID NOT NULL REFERENCES artwork_masters(id) ON DELETE CASCADE,
  state        TEXT NOT NULL DEFAULT 'undiscovered'
               CHECK (state IN ('undiscovered','restoring','completed')),
  completed_at TIMESTAMPTZ,
  PRIMARY KEY (player_id, artwork_id)
);

-- プレイヤー所持ピース
CREATE TABLE IF NOT EXISTS player_pieces (
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  piece_id    UUID NOT NULL REFERENCES artwork_pieces(id) ON DELETE CASCADE,
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_restored BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (player_id, piece_id)
);

-- キャンペーン店舗（イベント店）
CREATE TABLE IF NOT EXISTS campaign_stores (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citras_store_id    TEXT UNIQUE NOT NULL,
  name               TEXT NOT NULL,
  location           GEOGRAPHY(POINT, 4326) NOT NULL,
  main_piece_id      UUID REFERENCES artwork_pieces(id),
  campaign_starts_at TIMESTAMPTZ,
  campaign_ends_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_campaign_stores_location ON campaign_stores USING GIST (location);

-- カーシェアST（地図表示用。mock citras 由来をキャッシュ）
CREATE TABLE IF NOT EXISTS carshare_stations (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  citras_station_id TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  location        GEOGRAPHY(POINT, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stations_location ON carshare_stations USING GIST (location);

-- 店舗訪問（リピート訪問カウント）
CREATE TABLE IF NOT EXISTS store_visits (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id       UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  store_id        UUID NOT NULL REFERENCES campaign_stores(id) ON DELETE CASCADE,
  visit_count     INT NOT NULL DEFAULT 0,
  last_visited_at TIMESTAMPTZ,
  last_checkin_at TIMESTAMPTZ,
  replica_unlocked BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE (player_id, store_id)
);

-- ワーク報酬受取（二重付与防止）
CREATE TABLE IF NOT EXISTS work_reward_claims (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id        UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  task_id          TEXT NOT NULL,
  idempotency_key  TEXT NOT NULL,
  paint_granted    INT NOT NULL DEFAULT 0,
  spring_granted   INT NOT NULL DEFAULT 0,
  special_piece_id UUID REFERENCES artwork_pieces(id),
  claimed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_idempotency ON work_reward_claims (idempotency_key);

-- 承認済みワーク（Webhook受信で記録。claim の前提）
-- 同一タスクを複数プレイヤーが完了しうるため PK は (task_id, player_id)。
CREATE TABLE IF NOT EXISTS approved_work_tasks (
  task_id     TEXT NOT NULL,
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  is_relay    BOOLEAN NOT NULL DEFAULT FALSE,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (task_id, player_id)
);

-- コイン交換履歴
CREATE TABLE IF NOT EXISTS coin_exchanges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  item_id      TEXT NOT NULL,
  coupon_code  TEXT,
  coins_spent  INT NOT NULL,
  exchanged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 交換レート（管理者が変更可能）
CREATE TABLE IF NOT EXISTS exchange_rates (
  item_id   TEXT PRIMARY KEY,
  item_name TEXT NOT NULL,
  coin_cost INT NOT NULL,
  daily_cap INT NOT NULL,
  enabled   BOOLEAN NOT NULL DEFAULT TRUE
);

-- 不正フラグ
CREATE TABLE IF NOT EXISTS fraud_flags (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  detail      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_fraud_player ON fraud_flags (player_id);

-- 監査ログ（位置情報。90日で匿名化）
CREATE TABLE IF NOT EXISTS actions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  location    GEOGRAPHY(POINT, 4326),
  accuracy    REAL,
  anonymized  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_actions_player_created ON actions (player_id, created_at DESC);
