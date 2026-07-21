# 失われた美術館の修復 (Lost Museum)

citras モビリティプラットフォーム（カーシェア・サイクルシェア・ワーク）と連携する、
パブリックドメインの名画・クラシック音楽を集めて修復する**コレクション型 位置情報ゲーム**。

プレイヤーは**時空美術館の学芸員**。街に散った「名画のピース」と「音楽の旋律」を、
ステーションや加盟店を巡って回収・修復し、自分だけの美術館を完成させる。
**対戦・陣取り要素はない**（非対戦の収集・育成体験）。

> 要件定義: [`REQUIREMENTS_lost_museum.md`](./REQUIREMENTS_lost_museum.md)
> 素材確定リスト: [`PUBLIC_DOMAIN_ASSETS.md`](./PUBLIC_DOMAIN_ASSETS.md)

---

## アーキテクチャ

```
┌──────────────┐        ┌─────────────────────┐        ┌──────────────────┐
│ mobile (Expo)│ ─────▶ │ api (Fastify/TS)    │ ─────▶ │ postgres+postgis │
│ RN / M1〜M10 │  JWT   │ /api/v1/*           │  SQL   │ (位置情報クエリ) │
└──────────────┘        │  ├ domain(純粋関数) │        └──────────────────┘
                        │  ├ routes           │        ┌──────────────────┐
┌──────────────┐        │  └ jobs(匿名化)     │ ─────▶ │ redis(レート制御)│
│ admin (SPA)  │ ─────▶ │ /admin/*            │        └──────────────────┘
└──────────────┘        └─────────┬───────────┘
                                   │ REST / Webhook
                         ┌─────────▼───────────┐
                         │ mock-citras (§6.2)  │  カーシェアST/店舗/ワーク/クーポン
                         └─────────────────────┘
```

### コアループ

```
店舗イベントでメインピース入手 → ワーク完了で修復絵の具を集める
  → 工房でピースを絵の具修復 → 名画完成・美術館に収蔵・クラシックBGM解放
  → 同じ店に5回通うとレプリカ常設(来店BGM) → 次の名画へ
```

### 3つのシステム連動

| 連動 | トリガー | 報酬 |
|---|---|---|
| ① イベント訪問 | キャンペーン店舗に来店チェックイン | その店限定メインピース |
| ② ワーク連携 | すきまバイト完了（承認済Webhook） | 修復絵の具 + ゼンマイ（回送は高報酬+特別ピース抽選） |
| ③ リピート訪問 | 同一店5回来店 | レプリカ常設 + 来店BGM自動再生 |

---

## リポジトリ構成

```
.
├── docker-compose.yml        # postgres+postgis / redis / api / mock-citras
├── packages/shared/          # 型・定数(閾値)・日本語文言（API/mobile共有）
├── apps/
│   ├── api/                  # Fastify ゲームサーバー
│   │   ├── src/domain/       # 純粋関数・テスト対象(distance/resources/restore/visits/license)
│   │   ├── src/routes/       # auth/players/artworks/events/map/work/shop/admin
│   │   ├── src/services/     # players/locationGuard/artworks
│   │   ├── src/infra/        # db/redis/config/migrate
│   │   ├── src/jobs/         # anonymize(90日匿名化バッチ)
│   │   └── db/               # migrations + seed(東京の店舗/ST/名画/楽曲)
│   ├── mobile/               # Expo React Native（M1〜M10 + ログイン）
│   └── admin/                # 管理画面(単一HTML SPA)
├── mock-citras/              # citras本体モック + seed
├── scripts/import-assets.ts  # The Met API等から素材取り込み(PD検証)
└── e2e/run.mjs               # ログイン→チェックイン→修復→鑑賞 のE2E(20項目)
```

---

## セットアップ

### 前提

- Node.js 20+ / npm 10+
- Docker + Docker Compose（バックエンド一括起動用）
- モバイル確認: Expo Go アプリ（実機 or シミュレータ）

### A. Docker で一括起動（推奨）

```bash
docker compose up --build
# postgres+postgis / redis / mock-citras / api が起動
# api コンテナは起動時に migrate → seed → server を自動実行
```

- ゲームAPI: http://localhost:4000 （`GET /health`）
- mock-citras: http://localhost:4100 （`GET /health`）

### B. ローカル（Node直接）で起動

```bash
npm install
npm run build:shared

# 別途 postgres(PostGIS) と redis を起動しておく（下記の環境変数で接続先を指定）
export DATABASE_URL=postgres://museum:museum@127.0.0.1:5432/lost_museum
export REDIS_URL=redis://127.0.0.1:6379

npm run migrate           # スキーマ適用
npm run seed              # 名画5/楽曲5/店舗15/ST30 を投入
npm run import-assets     # (任意) The Met連携で素材メタ取り込み・PD検証

npm run dev:mock          # mock-citras (:4100)
npm run dev:api           # ゲームAPI (:4000)
```

### C. モバイルアプリ

```bash
cd apps/mobile
npm install
npm start                 # Expo Go でQRを読み取り
```

- API接続先は `app.json` の `extra.apiBaseUrl`（既定 `http://localhost:4000/api/v1`）。
  実機からは PC の LAN IP に変更する。

### D. 管理画面

```bash
cd apps/admin && python3 -m http.server 5173   # http://localhost:5173
```

上部で API ベースURL と `x-admin-secret`（既定 `admin-dev-secret`）を入力して「接続」。

---

## テスト

### ドメイン層ユニットテスト（カバレッジ80%必須 → 実測100%）

```bash
npm test                  # vitest（distance/resources/restore/visits/license）
npm run test:coverage     # カバレッジ計測（domain層100%）
```

### E2E（バックエンド一連フロー）

postgres/redis を起動し、DBを migrate+seed 済みにしてから:

```bash
bash scripts/e2e-run.sh   # api+mock-citras を起動し e2e/run.mjs を実行
```

検証項目（20件, すべてパス）:

- ログイン / 地図スポット取得（ST30件）
- 80m圏外チェックイン → 403 `too_far`
- 店舗チェックイン → メインピース入手 / 同一店1日1回制限
- 150km/h超移動 → `fraud_flag` 記録
- ワーク: 承認Webhookなしは403 / claim冪等（二重付与なし）
- 全ピース修復 → 名画完成 → BGM解放 → 鑑賞モード再生（ゼンマイ1消費）
- コイン交換（絵の具×10 / mockクーポン発行）
- 同一店5回訪問 → レプリカ常設 → 地図で `replica_store` 化

---

## 不正対策（§4）

| 脅威 | 対策 |
|---|---|
| GPSスプーフィング | 精度>100m拒否 / 速度>150km/h拒否+`fraud_flag` / `is_mock_location`検証 |
| チェックイン連打 | 同一店1日1回（サーバー判定） |
| ワーク報酬二重取得 | 承認Webhook受信時のみ付与 + `idempotency_key` UNIQUE |
| レートリミット | 全アクション10回/分（Redisスライディングウィンドウ） |

`fraud_flags` が3件で自動サスペンド → 管理画面から人間がレビュー・解除。

## 素材の権利（§8 / §13）

- 名画: The Met Open Access (CC0) / Wikimedia Commons (PD)
- 楽曲: Musopen (CC0) — **録音のライセンス**が CC0/PD のもののみ（著作隣接権に注意）
- `artwork_masters.license` / `music_masters.recording_license` は **CC0/PD 以外を取り込まない**
  （`domain/license.ts` でバリデーション、DBの CHECK 制約でも担保）
- 鑑賞モードに所蔵館・作者・演奏元を表示（クレジット）

---

## 技術スタック

| 成果物 | 技術 |
|---|---|
| モバイル | React Native (Expo SDK 51) / TypeScript |
| API | Node.js 20 / Fastify / TypeScript |
| DB | PostgreSQL 16 + PostGIS |
| キャッシュ | Redis（レート制御） |
| 地図 | react-native-maps |
| 音声 | expo-av |
| テスト | vitest（domain層） |
| インフラ | Docker Compose |

## スコープ外（§12）

本番 citras との実接続 / 対戦・陣取り / AR / ストア申請 / プッシュ本番配信 / 自動ピース分割。
