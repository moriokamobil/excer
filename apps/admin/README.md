# 管理画面 (admin)

ピースcrop調整・イベント店設定・交換レート・不正レビューを行う軽量SPA。
ビルド不要の単一 HTML（vanilla JS）で、ゲームAPIの `/admin/*` エンドポイントに接続します。

## 起動

任意の静的サーバーで `index.html` を配信するか、ブラウザで直接開きます。

```bash
# 例: Python の簡易サーバー
cd apps/admin && python3 -m http.server 5173
# → http://localhost:5173
```

画面上部で以下を設定して「接続」:

- **API ベースURL**: 既定 `http://localhost:4000/api/v1`
- **x-admin-secret**: 既定 `admin-dev-secret`（APIの `ADMIN_SECRET` 環境変数と一致させる）

## 機能

| タブ | 内容 |
|---|---|
| 不正レビュー | `fraud_flags` 一覧。プレイヤー単位でレビュー済み化 + サスペンド解除 |
| 交換レート | `exchange_rates` のコイン数・日次上限・有効/無効を編集 |
| イベント店 | キャンペーン店舗が配布するメインピースを変更 |
| ピースcrop調整 | 各ピースの crop 座標(0.0〜1.0)を調整 |
