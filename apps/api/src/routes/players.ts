import type { FastifyInstance } from 'fastify';
import { query } from '../infra/db';

function toProfile(p: any) {
  return {
    id: p.id,
    citrasUserId: p.citras_user_id,
    curatorName: p.curator_name,
    level: p.level,
    xp: p.xp,
    coins: p.coins,
    coinsEarnedToday: p.coins_earned_today,
    restorePaint: p.restore_paint,
    gramophoneSpring: p.gramophone_spring,
    suspendedUntil: p.suspended_until,
  };
}

export async function playerRoutes(app: FastifyInstance): Promise<void> {
  // GET /players/me — プロフィール・リソース残高・進捗サマリ
  app.get('/players/me', { preHandler: app.authGuard }, async (req) => {
    const p = req.player;
    const counts = await query<{ state: string; count: string }>(
      'SELECT state, COUNT(*)::text AS count FROM player_artworks WHERE player_id=$1 GROUP BY state',
      [p.id],
    );
    const progress = { undiscovered: 0, restoring: 0, completed: 0 } as Record<string, number>;
    for (const c of counts) progress[c.state] = parseInt(c.count, 10);
    const total = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM artwork_masters');
    return {
      player: toProfile(p),
      progress: {
        ...progress,
        totalArtworks: parseInt(total[0].count, 10),
      },
    };
  });

  // GET /inventory — リソース残高
  app.get('/inventory', { preHandler: app.authGuard }, async (req) => {
    const p = req.player;
    return {
      restorePaint: p.restore_paint,
      gramophoneSpring: p.gramophone_spring,
      coins: p.coins,
    };
  });
}
