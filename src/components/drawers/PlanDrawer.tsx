"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, AI_FEATURES } from "@/lib/db";

export function PlanDrawer() {
  const plan = useLiveQuery(async () => (await db.settings.get("plan"))?.value, []) ?? "free";
  const [processing, setProcessing] = useState(false);

  // Stripe Checkout → Webhook 反映待ち（仕様書 7.2）のモック。
  // 決済完了通知は別経路で届くため「反映中」画面を挟む設計をデモとして再現する。
  const upgrade = async () => {
    if (!confirm("有料プランにアップグレードします（デモ：実際の決済は行われません）")) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500)); // Webhook受信の擬似待機
    await db.settings.put({ key: "plan", value: "paid" });
    setProcessing(false);
  };

  const downgrade = async () => {
    await db.settings.put({ key: "plan", value: "free" });
    await db.ai_feature_toggles.toCollection().modify({ enabled: 0 });
  };

  return (
    <>
      {processing ? (
        <div className="empty-note" style={{ padding: "48px 0" }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
          決済を反映中です…
          <div className="sub" style={{ marginTop: 8 }}>
            （Stripe Webhook の受信を待機しています）
          </div>
        </div>
      ) : (
        <>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div className="section-label">現在のプラン</div>
            <div style={{ fontWeight: 700, color: plan === "paid" ? "var(--amber)" : "var(--text)" }}>
              {plan === "paid" ? "有料プラン" : "無料プラン"}
            </div>
          </div>

          <div className="section-label">有料プランで解放される機能</div>
          {AI_FEATURES.map((f) => (
            <div key={f.key} className="row">
              <span className={`dot ${plan === "paid" ? "green" : "amber"}`} />
              <div className="grow">
                <div>{f.name}</div>
                <div className="sub">{f.desc}</div>
              </div>
            </div>
          ))}
          <div className="row">
            <span className={`dot ${plan === "paid" ? "green" : "amber"}`} />
            <div className="grow">
              <div>クラウド同期・バックアップ</div>
              <div className="sub">端末をまたいだデータ同期</div>
            </div>
          </div>

          {plan === "free" ? (
            <button className="btn primary" onClick={upgrade}>
              アップグレード（月額 ¥980・デモ）
            </button>
          ) : (
            <button className="btn" onClick={downgrade}>
              無料プランに戻す（デモ）
            </button>
          )}
          <div className="sub" style={{ fontSize: 11, color: "var(--muted)" }}>
            ※ 本実装では Stripe Checkout で決済し、解約・プラン変更は Stripe カスタマーポータルを利用します。
          </div>
        </>
      )}
    </>
  );
}
