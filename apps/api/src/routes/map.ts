import type { FastifyInstance } from 'fastify';
import { query } from '../infra/db';

export async function mapRoutes(app: FastifyInstance): Promise<void> {
  // GET /map/spots?bbox=w,s,e,n — イベント店舗・レプリカ店・ST
  app.get<{ Querystring: { bbox?: string } }>(
    '/map/spots',
    { preHandler: app.authGuard },
    async (req) => {
      const bbox = (req.query.bbox ?? '').split(',').map(Number);
      const hasBbox = bbox.length === 4 && bbox.every((n) => Number.isFinite(n));
      const [w, s, e, n] = hasBbox ? bbox : [-180, -90, 180, 90];

      const stores = await query(
        `SELECT cs.id, cs.name,
                ST_Y(cs.location::geometry) AS lat, ST_X(cs.location::geometry) AS lng,
                ap.artwork_id AS "mainPieceArtworkId",
                COALESCE(sv.replica_unlocked, false) AS "replicaUnlocked"
           FROM campaign_stores cs
           LEFT JOIN artwork_pieces ap ON ap.id = cs.main_piece_id
           LEFT JOIN store_visits sv ON sv.store_id = cs.id AND sv.player_id=$5
          WHERE ST_Intersects(cs.location, ST_MakeEnvelope($1,$2,$3,$4,4326)::geography)`,
        [w, s, e, n, req.playerId],
      );

      const stations = await query(
        `SELECT id, name, ST_Y(location::geometry) AS lat, ST_X(location::geometry) AS lng
           FROM carshare_stations
          WHERE ST_Intersects(location, ST_MakeEnvelope($1,$2,$3,$4,4326)::geography)`,
        [w, s, e, n],
      );

      const spots = [
        ...stores.map((s: any) => ({
          id: s.id,
          kind: s.replicaUnlocked ? 'replica_store' : 'event_store',
          name: s.name,
          lat: s.lat,
          lng: s.lng,
          mainPieceArtworkId: s.mainPieceArtworkId,
          replicaUnlocked: s.replicaUnlocked,
        })),
        ...stations.map((st: any) => ({
          id: st.id,
          kind: 'carshare_station',
          name: st.name,
          lat: st.lat,
          lng: st.lng,
        })),
      ];
      return { spots };
    },
  );
}
