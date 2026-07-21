# ゲームAPI（Fastify）。モノレポ全体をコピーし、共有パッケージをビルドして tsx で実行。
FROM node:20-bookworm-slim

WORKDIR /app

# 依存解決のため必要な package.json を先にコピー（キャッシュ活用）
COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY mock-citras/package.json mock-citras/

RUN npm install

# ソース一式
COPY . .

# 共有パッケージをビルド（dist を生成）
RUN npm run build:shared

WORKDIR /app/apps/api
EXPOSE 4000

# migrate → seed → server（compose 側 command で上書きも可）
CMD ["sh", "-c", "npx tsx src/infra/migrate.ts && npx tsx db/seed/index.ts && npx tsx src/server.ts"]
