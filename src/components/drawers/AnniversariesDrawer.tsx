"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid, type Anniversary } from "@/lib/db";

const KINDS: Anniversary["kind"][] = ["記念日", "誕生日", "命日"];

/** MM-DD から次回発生日までの日数 */
export function daysUntil(mmdd: string): number {
  const [m, d] = mmdd.split("-").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), m - 1, d);
  if (next < today) next = new Date(now.getFullYear() + 1, m - 1, d);
  return Math.round((next.getTime() - today.getTime()) / 86400000);
}

export function AnniversariesDrawer() {
  const items = useLiveQuery(() => db.anniversaries.toArray(), []) ?? [];
  const sorted = [...items].sort((a, b) => daysUntil(a.date) - daysUntil(b.date));
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<Anniversary["kind"]>("誕生日");

  const add = async () => {
    if (!name.trim() || !date) return;
    await db.anniversaries.add({
      id: uuid(),
      name: name.trim(),
      date: date.slice(5), // YYYY-MM-DD → MM-DD
      kind,
      notify: 1,
      createdAt: Date.now(),
    });
    setName("");
    setDate("");
  };

  return (
    <>
      <div className="section-label">近い順（{items.length} 件）</div>
      {sorted.map((a) => {
        const days = daysUntil(a.date);
        return (
          <div key={a.id} className="row">
            <div className="grow">
              <div>
                {a.name}
                <span className="panel-tag" style={{ marginLeft: 8 }}>
                  {a.kind}
                </span>
              </div>
              <div className="sub mono">
                {a.date.replace("-", "/")} ・ あと{days}日
              </div>
            </div>
            <button
              className={`toggle ${a.notify ? "on" : ""}`}
              onClick={() => db.anniversaries.update(a.id, { notify: a.notify ? 0 : 1 })}
              aria-label="通知切替"
              title="通知"
            />
            <button className="icon-btn" onClick={() => db.anniversaries.delete(a.id)} aria-label="削除">
              🗑
            </button>
          </div>
        );
      })}
      {items.length === 0 && <div className="empty-note">登録がありません</div>}

      <div className="form-grid">
        <div className="section-label">新規登録</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="名称（例：母の誕生日）" />
        <div className="cols">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select value={kind} onChange={(e) => setKind(e.target.value as Anniversary["kind"])}>
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </div>
        <button className="btn primary" onClick={add}>
          追加
        </button>
        <div className="sub" style={{ fontSize: 11, color: "var(--muted)" }}>
          ※ プレゼント提案機能は有料プラン（会話AI）で提供予定です。
        </div>
      </div>
    </>
  );
}
