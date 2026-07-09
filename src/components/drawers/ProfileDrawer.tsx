"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function ProfileDrawer() {
  const birthDate =
    useLiveQuery(async () => (await db.settings.get("birth_date"))?.value, []) ?? "1990-01-01";
  const targetAge =
    useLiveQuery(async () => (await db.settings.get("target_age"))?.value, []) ?? "85";

  return (
    <>
      <div className="sub" style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.7 }}>
        「あなたの残り時間」は、生年月日と目標年齢から算出されます。
      </div>
      <div className="form-grid">
        <div className="sub">生年月日</div>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => e.target.value && db.settings.put({ key: "birth_date", value: e.target.value })}
        />
        <div className="sub">目標年齢</div>
        <input
          type="number"
          min={1}
          max={130}
          value={targetAge}
          onChange={(e) => e.target.value && db.settings.put({ key: "target_age", value: e.target.value })}
        />
      </div>
      <div className="sub" style={{ fontSize: 11, color: "var(--muted)" }}>
        ※ 無料プランのデータはすべて端末内（IndexedDB）に保存され、クラウドには送信されません。iOSのPWAでは長期間未使用の場合にローカルデータが消去されることがあります。
      </div>
    </>
  );
}
