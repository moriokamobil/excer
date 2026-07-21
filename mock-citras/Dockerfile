# mock citras API。単体で動くため repo ルートの workspace 経由でインストール。
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY mock-citras/package.json mock-citras/

RUN npm install

COPY . .

WORKDIR /app/mock-citras
EXPOSE 4100

CMD ["sh", "-c", "npx tsx src/server.ts"]
