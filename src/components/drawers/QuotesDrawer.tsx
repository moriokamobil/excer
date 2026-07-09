"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid, type Quote } from "@/lib/db";

/** 日替わりの名言を決定的に選ぶ（日付でローテーション） */
export function pickDailyQuote(quotes: Quote[]): Quote | null {
  if (quotes.length === 0) return null;
  const d = new Date();
  const dayNumber = Math.floor(d.getTime() / 86400000);
  return quotes[dayNumber % quotes.length];
}

export function QuotesDrawer() {
  const quotes = useLiveQuery(() => db.quotes.orderBy("createdAt").toArray(), []) ?? [];
  const [text, setText] = useState("");
  const [author, setAuthor] = useState("");
  const daily = pickDailyQuote(quotes);

  const add = async () => {
    if (!text.trim()) return;
    await db.quotes.add({ id: uuid(), text: text.trim(), author: author.trim(), createdAt: Date.now() });
    setText("");
    setAuthor("");
  };

  return (
    <>
      {daily && (
        <div
          className="row"
          style={{ flexDirection: "column", alignItems: "stretch", gap: 6, borderColor: "var(--amber-dim)" }}
        >
          <div className="section-label" style={{ color: "var(--amber)" }}>
            本日の名言
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.7 }}>{daily.text}</div>
          {daily.author && <div className="sub">— {daily.author}</div>}
        </div>
      )}

      <div className="section-label">登録済み（{quotes.length} 件・日替わり表示）</div>
      {quotes.map((q) => (
        <div key={q.id} className="row">
          <div className="grow">
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>{q.text}</div>
            {q.author && <div className="sub">— {q.author}</div>}
          </div>
          <button className="icon-btn" onClick={() => db.quotes.delete(q.id)} aria-label="削除">
            🗑
          </button>
        </div>
      ))}

      <div className="form-grid">
        <div className="section-label">名言を自己登録</div>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="名言・座右の銘" />
        <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="出典・人物（任意）" />
        <button className="btn primary" onClick={add}>
          追加
        </button>
        <div className="sub" style={{ fontSize: 11, color: "var(--muted)" }}>
          ※ AI推薦機能は有料プラン（会話AI）で提供予定です。
        </div>
      </div>
    </>
  );
}
