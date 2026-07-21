import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { config } from '../infra/config';
import { pool } from '../infra/db';
import { checkRateLimit } from '../infra/redis';
import { loadPlayerFresh, isSuspended, type PlayerRow } from '../services/players';
import { MESSAGES } from '@lost-museum/shared';

declare module 'fastify' {
  interface FastifyRequest {
    player: PlayerRow;
    playerId: string;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { playerId: string; citrasUserId: string };
    user: { playerId: string; citrasUserId: string };
  }
}

/**
 * 認証・レート制御・サスペンド判定を一括で行うpreHandler。
 * ルート側で `{ preHandler: app.authGuard }` として使う。
 */
export const authPlugin = fp(async function authPlugin(app: FastifyInstance): Promise<void> {
  await app.register(fastifyJwt, { secret: config.jwtSecret });

  app.decorate(
    'authGuard',
    async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
      try {
        await req.jwtVerify();
      } catch {
        return reply.code(401).send({ error: 'unauthorized', message: MESSAGES.LOGIN_FAILED });
      }
      const playerId = req.user.playerId;

      // レートリミット（10回/分。config で緩和可能）
      const allowed = await checkRateLimit(playerId, config.rateLimitPerMinute);
      if (!allowed) {
        return reply.code(429).send({ error: 'rate_limited', message: MESSAGES.RATE_LIMITED });
      }

      const player = await loadPlayerFresh(pool, playerId);
      if (!player) {
        return reply.code(401).send({ error: 'player_not_found', message: MESSAGES.LOGIN_FAILED });
      }
      if (isSuspended(player)) {
        return reply
          .code(403)
          .send({ error: 'suspended', message: MESSAGES.PLAYER_SUSPENDED, code: 'suspended' });
      }
      req.player = player;
      req.playerId = playerId;
    },
  );
});

declare module 'fastify' {
  interface FastifyInstance {
    authGuard: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
