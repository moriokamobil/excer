/** 環境変数の集約。docker-compose / ローカルの双方で動く既定値を持つ。 */
export const config = {
  port: parseInt(process.env.PORT ?? '4000', 10),
  host: process.env.HOST ?? '0.0.0.0',
  databaseUrl:
    process.env.DATABASE_URL ??
    'postgres://museum:museum@localhost:5432/lost_museum',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  mockCitrasUrl: process.env.MOCK_CITRAS_URL ?? 'http://localhost:4100',
  assetBaseUrl: process.env.ASSET_BASE_URL ?? 'http://localhost:4000/assets',
  // レートリミット上限（§4は10回/分。テスト・負荷検証時のみ env で緩和可能）
  rateLimitPerMinute: process.env.RATE_LIMIT_PER_MINUTE
    ? parseInt(process.env.RATE_LIMIT_PER_MINUTE, 10)
    : undefined,
};
