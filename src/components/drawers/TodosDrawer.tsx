"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid } from "@/lib/db";

export function TodosDrawer() {
  const todos = useLiveQuery(() => db.todos.orderBy("createdAt").toArray(), []) ?? [];
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [alarmTime, setAlarmTime] = useState("");

  const add = async () => {
    if (!title.trim()) return;
    await db.todos.add({
      id: uuid(),
      title: title.trim(),
      done: 0,
      dueDate: dueDate || null,
      alarmTime: alarmTime || null,
      createdAt: Date.now(),
    });
    setTitle("");
    setDueDate("");
    setAlarmTime("");
  };

  const remaining = todos.filter((t) => !t.done).length;

  return (
    <>
      <div className="section-label">
        残り {remaining} 件 ／ 全 {todos.length} 件
      </div>
      {todos.map((t) => (
        <div key={t.id} className={`row ${t.done ? "done" : ""}`}>
          <button
            className={`check ${t.done ? "on" : ""}`}
            onClick={() => db.todos.update(t.id, { done: t.done ? 0 : 1 })}
            aria-label="完了切替"
          >
            ✓
          </button>
          <div className="grow">
            <div>{t.title}</div>
            {(t.dueDate || t.alarmTime) && (
              <div className="sub mono">
                {t.dueDate && `期限 ${t.dueDate}`}
                {t.dueDate && t.alarmTime && " ・ "}
                {t.alarmTime && `⏰ ${t.alarmTime}`}
              </div>
            )}
          </div>
          <button className="icon-btn" onClick={() => db.todos.delete(t.id)} aria-label="削除">
            🗑
          </button>
        </div>
      ))}
      {todos.length === 0 && <div className="empty-note">TODOはありません</div>}

      <div className="form-grid">
        <div className="section-label">新規TODO</div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="タスク名" onKeyDown={(e) => e.key === "Enter" && add()} />
        <div className="cols">
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          <input type="time" value={alarmTime} onChange={(e) => setAlarmTime(e.target.value)} />
        </div>
        <button className="btn primary" onClick={add}>
          追加
        </button>
        <div className="sub" style={{ fontSize: 11, color: "var(--muted)" }}>
          ※ PWA版のアラームは「リマインダー」扱いです。遅延・不達の可能性があります（ネイティブ版で本格アラームAIに対応予定）。
        </div>
      </div>
    </>
  );
}
