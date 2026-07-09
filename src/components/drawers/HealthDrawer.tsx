"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid, type HealthLog } from "@/lib/db";

const todayStr = () => new Date().toISOString().slice(0, 10);
const MOODS: NonNullable<HealthLog["mood"]>[] = ["良好", "普通", "不調"];

export function HealthDrawer() {
  const today = todayStr();
  const log = useLiveQuery(() => db.health_logs.where("logDate").equals(today).first(), [today]);
  const conditions = useLiveQuery(() => db.conditions.orderBy("createdAt").toArray(), []) ?? [];
  const medications = useLiveQuery(() => db.medications.orderBy("createdAt").toArray(), []) ?? [];

  const [condName, setCondName] = useState("");
  const [medName, setMedName] = useState("");
  const [medTiming, setMedTiming] = useState("");

  const upsert = async (patch: Partial<HealthLog>) => {
    if (log) await db.health_logs.update(log.id, patch);
    else
      await db.health_logs.add({
        id: uuid(),
        logDate: today,
        sleepHours: null,
        restingHr: null,
        mood: null,
        note: "",
        source: "manual",
        ...patch,
      });
  };

  return (
    <>
      <div className="form-grid">
        <div className="section-label">今日の記録（{today}）</div>
        <div className="cols">
          <div>
            <div className="sub" style={{ marginBottom: 4 }}>睡眠時間 (h)</div>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              value={log?.sleepHours ?? ""}
              onChange={(e) => upsert({ sleepHours: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </div>
          <div>
            <div className="sub" style={{ marginBottom: 4 }}>安静時心拍 (bpm)</div>
            <input
              type="number"
              min="0"
              max="250"
              value={log?.restingHr ?? ""}
              onChange={(e) => upsert({ restingHr: e.target.value === "" ? null : Number(e.target.value) })}
            />
          </div>
        </div>
        <div className="sub">気分</div>
        <div style={{ display: "flex", gap: 8 }}>
          {MOODS.map((m) => (
            <button
              key={m}
              className={`btn small ${log?.mood === m ? "primary" : ""}`}
              onClick={() => upsert({ mood: m })}
            >
              {m}
            </button>
          ))}
        </div>
        <textarea
          rows={2}
          placeholder="体調メモ"
          value={log?.note ?? ""}
          onChange={(e) => upsert({ note: e.target.value })}
        />
      </div>

      <div className="section-label">持病（{conditions.length} 件）</div>
      {conditions.map((c) => (
        <div key={c.id} className="row">
          <div className="grow">
            <div>{c.name}</div>
            {c.note && <div className="sub">{c.note}</div>}
          </div>
          <button className="icon-btn" onClick={() => db.conditions.delete(c.id)} aria-label="削除">
            🗑
          </button>
        </div>
      ))}
      <div className="form-grid">
        <input value={condName} onChange={(e) => setCondName(e.target.value)} placeholder="持病・注意事項を追加" />
        <button
          className="btn small"
          onClick={async () => {
            if (!condName.trim()) return;
            await db.conditions.add({ id: uuid(), name: condName.trim(), note: "", createdAt: Date.now() });
            setCondName("");
          }}
        >
          追加
        </button>
      </div>

      <div className="section-label">お薬（{medications.length} 件）</div>
      {medications.map((m) => (
        <div key={m.id} className="row">
          <div className="grow">
            <div>{m.name}</div>
            <div className="sub">
              {m.dosage} {m.timing}
            </div>
          </div>
          <button className="icon-btn" onClick={() => db.medications.delete(m.id)} aria-label="削除">
            🗑
          </button>
        </div>
      ))}
      <div className="form-grid">
        <div className="cols">
          <input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="薬の名前" />
          <input value={medTiming} onChange={(e) => setMedTiming(e.target.value)} placeholder="服用タイミング" />
        </div>
        <button
          className="btn small"
          onClick={async () => {
            if (!medName.trim()) return;
            await db.medications.add({
              id: uuid(),
              name: medName.trim(),
              dosage: "",
              timing: medTiming.trim(),
              createdAt: Date.now(),
            });
            setMedName("");
            setMedTiming("");
          }}
        >
          追加
        </button>
      </div>

      <div className="sub" style={{ fontSize: 11, color: "var(--muted)" }}>
        ※ Wearable連携（Apple Watch等）はネイティブアプリ版（フェーズ2）で対応予定です。現在は手入力のみです。
      </div>
    </>
  );
}
