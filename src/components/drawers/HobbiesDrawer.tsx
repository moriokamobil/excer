"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid, type Hobby } from "@/lib/db";

const todayStr = () => new Date().toISOString().slice(0, 10);

export function HobbiesDrawer() {
  const hobbies = useLiveQuery(() => db.hobbies.orderBy("createdAt").toArray(), []) ?? [];
  const [name, setName] = useState("");
  const [target, setTarget] = useState("3");

  const add = async () => {
    if (!name.trim()) return;
    await db.hobbies.add({
      id: uuid(),
      name: name.trim(),
      streakDays: 0,
      weeklyTarget: Number(target) || 3,
      weeklyDone: 0,
      lastDoneDate: null,
      createdAt: Date.now(),
    });
    setName("");
  };

  const markDone = async (h: Hobby) => {
    const today = todayStr();
    if (h.lastDoneDate === today) return;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    await db.hobbies.update(h.id, {
      streakDays: h.lastDoneDate === yesterday ? h.streakDays + 1 : 1,
      weeklyDone: Math.min(h.weeklyTarget, h.weeklyDone + 1),
      lastDoneDate: today,
    });
  };

  return (
    <>
      <div className="section-label">趣味の進捗・記録（{hobbies.length} 件）</div>
      {hobbies.map((h) => (
        <div key={h.id} className="row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="grow">
              <div style={{ fontWeight: 700 }}>{h.name}</div>
              <div className="sub mono">
                🔥 {h.streakDays}日連続 ・ 今週 {h.weeklyDone}/{h.weeklyTarget}回
              </div>
            </div>
            <button
              className="btn small primary"
              disabled={h.lastDoneDate === todayStr()}
              onClick={() => markDone(h)}
            >
              {h.lastDoneDate === todayStr() ? "今日は完了" : "今日やった"}
            </button>
            <button className="icon-btn" onClick={() => db.hobbies.delete(h.id)} aria-label="削除">
              🗑
            </button>
          </div>
          <div className="panel-bar">
            <i style={{ width: `${Math.min(100, (h.weeklyDone / Math.max(1, h.weeklyTarget)) * 100)}%` }} />
          </div>
        </div>
      ))}
      {hobbies.length === 0 && <div className="empty-note">趣味が登録されていません</div>}

      <div className="form-grid">
        <div className="section-label">趣味を追加</div>
        <div className="cols">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="趣味名" />
          <select value={target} onChange={(e) => setTarget(e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7].map((n) => (
              <option key={n} value={n}>
                週{n}回目標
              </option>
            ))}
          </select>
        </div>
        <button className="btn primary" onClick={add}>
          追加
        </button>
      </div>
    </>
  );
}
