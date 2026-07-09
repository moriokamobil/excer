"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid } from "@/lib/db";

// 近隣車両（フェーズ3でMaaS事業者APIと連携予定。現在はデモ表示）
const NEARBY = [
  { name: "タイムズカー プリウス", dist: "180m", status: "空車" },
  { name: "タイムズカー ヤリス", dist: "320m", status: "空車" },
  { name: "カレコ フィット", dist: "550m", status: "利用中" },
];

const fmt = (isoStr: string) => {
  const d = new Date(isoStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export function MoveDrawer() {
  const reservations =
    useLiveQuery(() => db.move_reservations.orderBy("startTime").reverse().toArray(), []) ?? [];
  const [vehicle, setVehicle] = useState(NEARBY[0].name);
  const [start, setStart] = useState("");
  const [hours, setHours] = useState("2");

  const active = reservations.filter((r) => r.status === "reserved");
  const done = reservations.filter((r) => r.status === "completed");
  const monthTotal = done
    .filter((r) => new Date(r.startTime).getMonth() === new Date().getMonth())
    .reduce((s, r) => s + r.price, 0);

  const reserve = async () => {
    if (!start) return;
    const s = new Date(start);
    const e = new Date(s.getTime() + Number(hours) * 3600000);
    await db.move_reservations.add({
      id: uuid(),
      provider: vehicle.split(" ")[0],
      vehicle: vehicle.split(" ").slice(1).join(" "),
      startTime: s.toISOString(),
      endTime: e.toISOString(),
      status: "reserved",
      price: Number(hours) * 950,
      createdAt: Date.now(),
    });
    setStart("");
  };

  return (
    <>
      <div className="section-label">予約中（{active.length} 件）</div>
      {active.map((r) => (
        <div key={r.id} className="row" style={{ borderColor: "var(--cyan-dim)" }}>
          <span className="dot green" />
          <div className="grow">
            <div>
              {r.provider} {r.vehicle}
            </div>
            <div className="sub mono">
              {fmt(r.startTime)} 〜 {fmt(r.endTime)} ・ ¥{r.price.toLocaleString()}
            </div>
          </div>
          <button
            className="btn small danger"
            onClick={() => db.move_reservations.update(r.id, { status: "cancelled" })}
          >
            取消
          </button>
        </div>
      ))}
      {active.length === 0 && <div className="empty-note">予約はありません</div>}

      <div className="section-label">近隣の車両（デモ）</div>
      {NEARBY.map((v) => (
        <div key={v.name} className="row">
          <span className={`dot ${v.status === "空車" ? "green" : "red"}`} />
          <div className="grow">
            <div>{v.name}</div>
            <div className="sub mono">
              {v.dist} ・ {v.status}
            </div>
          </div>
        </div>
      ))}

      <div className="form-grid">
        <div className="section-label">新規予約（デモ）</div>
        <select value={vehicle} onChange={(e) => setVehicle(e.target.value)}>
          {NEARBY.filter((v) => v.status === "空車").map((v) => (
            <option key={v.name}>{v.name}</option>
          ))}
        </select>
        <div className="cols">
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
          <select value={hours} onChange={(e) => setHours(e.target.value)}>
            {[1, 2, 3, 4, 6, 8].map((h) => (
              <option key={h} value={h}>
                {h}時間
              </option>
            ))}
          </select>
        </div>
        <button className="btn primary" onClick={reserve}>
          予約する
        </button>
      </div>

      <div className="section-label">今月の利用実績</div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div className="sub">
          {done.length} 回利用
        </div>
        <div className="mono" style={{ color: "var(--amber)", fontWeight: 700 }}>
          ¥{monthTotal.toLocaleString()}
        </div>
      </div>
      <div className="sub" style={{ fontSize: 11, color: "var(--muted)" }}>
        ※ カーシェア事業者APIとの本連携はフェーズ3で対応予定です。
      </div>
    </>
  );
}
