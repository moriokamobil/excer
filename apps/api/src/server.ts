import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './infra/config';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './routes/auth';
import { playerRoutes } from './routes/players';
import { artworkRoutes } from './routes/artworks';
import { eventRoutes } from './routes/events';
import { mapRoutes } from './routes/map';
import { workRoutes } from './routes/work';
import { shopRoutes } from './routes/shop';
import { adminRoutes } from './routes/admin';

export async function buildServer() {
  const app = Fastify({ logger: true });
  await app.register(cors, { origin: true });
  await app.register(authPlugin);

  app.get('/health', async () => ({ ok: true, service: 'lost-museum-api' }));
  app.log.info(
    `rate limit: ${config.rateLimitPerMinute ?? 'default(10)'} /min`,
  );

  await app.register(
    async (api) => {
      await api.register(authRoutes);
      await api.register(playerRoutes);
      await api.register(artworkRoutes);
      await api.register(eventRoutes);
      await api.register(mapRoutes);
      await api.register(workRoutes);
      await api.register(shopRoutes);
      await api.register(adminRoutes);
    },
    { prefix: '/api/v1' },
  );

  return app;
}

if (require.main === module) {
  buildServer()
    .then((app) => app.listen({ port: config.port, host: config.host }))
    .then((addr) => console.log(`lost-museum-api on ${addr}`))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
