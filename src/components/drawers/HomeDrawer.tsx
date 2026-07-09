"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid, type HomeItem } from "@/lib/db";

const CATEGORIES: HomeItem["category"][] = ["住居", "物品", "車両"];

export function HomeDrawer() {
  const items = useLiveQuery(() => db.home_items.orderBy("nextDue").toArray(), []) ?? [];
  const [name, setName] = useState("");
  const [category, setCategory] = useState<HomeItem["category"]>("住居");
  const [action, setAction] = useState("");
  const [nextDue, setNextDue] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    await db.home_items.add({
      id: uuid(),
      name: name.trim(),
      category,
      nextDue: nextDue || null,
      action: action.trim(),
      needsAction: nextDue ? 1 : 0,
      createdAt: Date.now(),
    });
    setName("");
    setAction("");
    setNextDue("");
  };

  return (
    <>
      <div className="section-label">設備点検・買替予定・車検通知（{items.length} 件）</div>
      {items.map((it) => (
        <div key={it.id} className="row">
          <span className={`dot ${it.needsAction ? "red" : "green"}`} />
          <div className="grow">
            <div>
              {it.name} <span className="sub" style={{ display: "inline" }}>［{it.category}］</span>
            </div>
            <div className="sub mono">
              {it.action}
              {it.nextDue && ` ・ ${it.nextDue}`}
            </div>
          </div>
          <button
            className="btn small"
            onClick={() => db.home_items.update(it.id, { needsAction: it.needsAction ? 0 : 1 })}
          >
            {it.needsAction ? "対応済に" : "要対応に"}
          </button>
          <button className="icon-btn" onClick={() => db.home_items.delete(it.id)} aria-label="削除">
            🗑
          </button>
        </div>
      ))}
      {items.length === 0 && <div className="empty-note">登録がありません</div>}

      <div className="form-grid">
        <div className="section-label">新規登録</div>
        <div className="cols">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="対象（例：自家用車）" />
          <select value={category} onChange={(e) => setCategory(e.target.value as HomeItem["category"])}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="cols">
          <input value={action} onChange={(e) => setAction(e.target.value)} placeholder="予定（例：車検）" />
          <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
        </div>
        <button className="btn primary" onClick={add}>
          追加
        </button>
      </div>
    </>
  );
}
