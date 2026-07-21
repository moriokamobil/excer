import type { FastifyInstance } from 'fastify';
import { upsertPlayerByCitrasId } from '../services/players';

/**
 * POST /auth/login — citras ID でログイン（mock連携）。
 * 実運用では citras OIDC を検証するが、本リポジトリでは citras_user_id を信頼してJWT発行。
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Body: { citras_user_id?: string; curator_name?: string } }>(
    '/auth/login',
    async (req, reply) => {
      const { citras_user_id, curator_name } = req.body ?? {};
      if (!citras_user_id) {
        return reply.code(400).send({ error: 'bad_request', message: 'citras_user_id が必要です' });
      }
      const player = await upsertPlayerByCitrasId(
        citras_user_id,
        curator_name?.trim() || `学芸員_${citras_user_id.slice(0, 6)}`,
      );
      const token = app.jwt.sign({ playerId: player.id, citrasUserId: player.citras_user_id });
      return reply.send({
        token,
        player: {
          id: player.id,
          citrasUserId: player.citras_user_id,
          curatorName: player.curator_name,
        },
      });
    },
  );
}
