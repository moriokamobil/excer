"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { THEMES, applyTheme } from "@/lib/themes";

export function ThemeStoreDrawer() {
  const currentTheme =
    useLiveQuery(async () => (await db.settings.get("current_theme"))?.value, []) ?? "cockpit";
  const owned = useLiveQuery(
    async () => JSON.parse((await db.settings.get("owned_themes"))?.value ?? '["cockpit"]') as string[],
    []
  ) ?? ["cockpit"];

  const apply = async (key: string) => {
    await db.settings.put({ key: "current_theme", value: key });
    applyTheme(key);
  };

  // 購入フローのモック。本実装では Stripe Checkout（mode: 'payment'）→ Webhook で
  // user_themes に1行追加する（仕様書 10.4）。
  const buy = async (key: string, name: string, price: number) => {
    if (!confirm(`「${name}」を ¥${price} で購入します（デモ：実際の決済は行われません）`)) return;
    const next = [...new Set([...owned, key])];
    await db.settings.put({ key: "owned_themes", value: JSON.stringify(next) });
    await apply(key);
  };

  return (
    <>
      <div className="sub" style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
        お好きな配色にコックピットの見た目を変更できます。標準テーマは無料、その他は購入すると永続的に使用できます。
      </div>
      {THEMES.map((t) => {
        const isOwned = owned.includes(t.key);
        const isActive = currentTheme === t.key;
        return (
          <div
            key={t.key}
            className="row"
            style={isActive ? { borderColor: "var(--amber)", boxShadow: "0 0 0 1px var(--amber-dim)" } : {}}
          >
            <div style={{ display: "flex", gap: 3 }}>
              {t.swatch.map((c, i) => (
                <span
                  key={i}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: c,
                    border: "1px solid var(--bezel)",
                  }}
                />
              ))}
            </div>
            <div className="grow">
              <div style={{ fontWeight: 700, fontSize: 13 }}>
                {t.name}
                {t.isDefault && (
                  <span className="panel-tag" style={{ marginLeft: 6 }}>
                    標準
                  </span>
                )}
              </div>
              <div className="sub" style={{ fontSize: 11 }}>
                {t.description}
              </div>
            </div>
            {isActive ? (
              <span className="btn small" style={{ color: "var(--amber)", borderColor: "var(--amber-dim)" }}>
                適用中
              </span>
            ) : isOwned ? (
              <button className="btn small" onClick={() => apply(t.key)}>
                適用
              </button>
            ) : (
              <button className="btn small primary" onClick={() => buy(t.key, t.name, t.price)}>
                ¥{t.price}で購入
              </button>
            )}
          </div>
        );
      })}
      <div className="sub" style={{ fontSize: 11, color: "var(--muted)" }}>
        ※ テーマは買い切り型です。購入状態は端末内（IndexedDB）に保存され、有料プラン移行時にクラウドへ同期されます。
      </div>
    </>
  );
}
