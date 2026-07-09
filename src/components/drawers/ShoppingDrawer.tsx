"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid } from "@/lib/db";

export function ShoppingDrawer() {
  const items = useLiveQuery(() => db.shopping_items.orderBy("createdAt").toArray(), []) ?? [];
  const [name, setName] = useState("");
  const [recurring, setRecurring] = useState(false);

  const add = async () => {
    if (!name.trim()) return;
    await db.shopping_items.add({
      id: uuid(),
      name: name.trim(),
      qty: "",
      recurring: recurring ? 1 : 0,
      lowStock: 0,
      bought: 0,
      createdAt: Date.now(),
    });
    setName("");
    setRecurring(false);
  };

  return (
    <>
      <div className="section-label">
        買い物リスト（在庫少 {items.filter((i) => i.lowStock && !i.bought).length} 点）
      </div>
      {items.map((it) => (
        <div key={it.id} className={`row ${it.bought ? "done" : ""}`}>
          <button
            className={`check ${it.bought ? "on" : ""}`}
            onClick={() => db.shopping_items.update(it.id, { bought: it.bought ? 0 : 1 })}
            aria-label="購入済切替"
          >
            ✓
          </button>
          <div className="grow">
            <div>
              {it.name}
              {it.recurring === 1 && (
                <span className="panel-tag" style={{ marginLeft: 8, color: "var(--cyan)" }}>
                  定期
                </span>
              )}
            </div>
            {it.qty && <div className="sub">{it.qty}</div>}
          </div>
          <button
            className="btn small"
            style={it.lowStock ? { color: "var(--red)", borderColor: "var(--red)" } : {}}
            onClick={() => db.shopping_items.update(it.id, { lowStock: it.lowStock ? 0 : 1 })}
          >
            {it.lowStock ? "在庫少" : "在庫OK"}
          </button>
          <button className="icon-btn" onClick={() => db.shopping_items.delete(it.id)} aria-label="削除">
            🗑
          </button>
        </div>
      ))}
      {items.length === 0 && <div className="empty-note">リストは空です</div>}

      <div className="form-grid">
        <div className="section-label">アイテム追加</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="日用品名" onKeyDown={(e) => e.key === "Enter" && add()} />
        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
          <button className={`toggle ${recurring ? "on" : ""}`} onClick={() => setRecurring(!recurring)} aria-label="定期購入" />
          定期購入として管理
        </label>
        <button className="btn primary" onClick={add}>
          追加
        </button>
      </div>
    </>
  );
}
