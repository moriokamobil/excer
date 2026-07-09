"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid, type Goal } from "@/lib/db";

const LEVELS: { key: Goal["level"]; label: string }[] = [
  { key: "today", label: "今日" },
  { key: "month", label: "今月" },
  { key: "year", label: "今年" },
  { key: "long", label: "中長期" },
];

export function GoalsDrawer() {
  const goals = useLiveQuery(() => db.goals.orderBy("createdAt").toArray(), []) ?? [];
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState<Goal["level"]>("today");

  const add = async () => {
    if (!title.trim()) return;
    await db.goals.add({
      id: uuid(),
      parentGoalId: null,
      level,
      title: title.trim(),
      done: 0,
      createdAt: Date.now(),
    });
    setTitle("");
  };

  return (
    <>
      {LEVELS.map(({ key, label }) => {
        const items = goals.filter((g) => g.level === key);
        return (
          <div key={key} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="section-label">{label}の目標</div>
            {items.map((g) => (
              <div key={g.id} className={`row ${g.done ? "done" : ""}`}>
                <button
                  className={`check ${g.done ? "on" : ""}`}
                  onClick={() => db.goals.update(g.id, { done: g.done ? 0 : 1 })}
                  aria-label="達成切替"
                >
                  ✓
                </button>
                <div className="grow">
                  <div>{g.title}</div>
                </div>
                <button className="icon-btn" onClick={() => db.goals.delete(g.id)} aria-label="削除">
                  🗑
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <div className="empty-note" style={{ padding: "6px 0" }}>
                未設定
              </div>
            )}
          </div>
        );
      })}

      <div className="form-grid">
        <div className="section-label">新規目標</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="目標" onKeyDown={(e) => e.key === "Enter" && add()} />
        <select value={level} onChange={(e) => setLevel(e.target.value as Goal["level"])}>
          {LEVELS.map((l) => (
            <option key={l.key} value={l.key}>
              {l.label}
            </option>
          ))}
        </select>
        <button className="btn primary" onClick={add}>
          追加
        </button>
      </div>
    </>
  );
}
