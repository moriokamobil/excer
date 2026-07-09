"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid } from "@/lib/db";

export function ProjectsDrawer() {
  const projects = useLiveQuery(() => db.projects.orderBy("createdAt").toArray(), []) ?? [];
  const [name, setName] = useState("");
  const [topic, setTopic] = useState("");
  const [dueDate, setDueDate] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    await db.projects.add({
      id: uuid(),
      name: name.trim(),
      progress: 0,
      dueDate: dueDate || null,
      topic: topic.trim(),
      createdAt: Date.now(),
    });
    setName("");
    setTopic("");
    setDueDate("");
  };

  return (
    <>
      <div className="section-label">{projects.length} 件 進行中</div>
      {projects.map((p) => (
        <div key={p.id} className="row" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="grow">
              <div style={{ fontWeight: 700 }}>{p.name}</div>
              <div className="sub">
                {p.topic}
                {p.dueDate && ` ・ 期限 ${p.dueDate}`}
              </div>
            </div>
            <span className="mono" style={{ color: "var(--cyan)", fontSize: 13 }}>
              {p.progress}%
            </span>
            <button className="icon-btn" onClick={() => db.projects.delete(p.id)} aria-label="削除">
              🗑
            </button>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={p.progress}
            onChange={(e) => db.projects.update(p.id, { progress: Number(e.target.value) })}
            style={{ accentColor: "var(--amber)", padding: 0, border: "none", background: "transparent" }}
          />
          <div className="panel-bar">
            <i style={{ width: `${p.progress}%` }} />
          </div>
        </div>
      ))}
      {projects.length === 0 && <div className="empty-note">プロジェクトはありません</div>}

      <div className="form-grid">
        <div className="section-label">新規プロジェクト</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="プロジェクト名" />
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="トピック・メモ" />
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        <button className="btn primary" onClick={add}>
          追加
        </button>
      </div>
    </>
  );
}
