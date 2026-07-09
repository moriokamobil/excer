"use client";

import { useEffect, useState } from "react";

const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function greeting(h: number) {
  if (h < 4) return "こんばんは";
  if (h < 11) return "おはようございます";
  if (h < 18) return "こんにちは";
  return "こんばんは";
}

export function Hud({
  score,
  scoreDetail,
  birthDate,
  targetAge,
  onOpenThemes,
}: {
  score: number;
  scoreDetail: string;
  birthDate: string;
  targetAge: number;
  onOpenThemes: () => void;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 残り時間：生年月日 + 目標年齢 の時点までのカウントダウン
  let daysLeft = 0;
  let hms = "";
  if (now) {
    const deadline = new Date(birthDate + "T00:00:00");
    deadline.setFullYear(deadline.getFullYear() + targetAge);
    const ms = Math.max(0, deadline.getTime() - now.getTime());
    daysLeft = Math.floor(ms / 86400000);
    const rest = ms - daysLeft * 86400000;
    const h = Math.floor(rest / 3600000);
    const m = Math.floor((rest % 3600000) / 60000);
    const s = Math.floor((rest % 60000) / 1000);
    hms = `${h}時間${String(m).padStart(2, "0")}分${String(s).padStart(2, "0")}秒`;
  }

  const R = 52;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, score));

  return (
    <section className="frame" style={{ padding: "22px 26px", position: "relative" }}>
      <button className="btn small" style={{ position: "absolute", top: 16, right: 16 }} onClick={onOpenThemes}>
        🎨 テーマ
      </button>

      <div className="mono" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--cyan)" }}>
        LIFE COCKPIT // MAIN DISPLAY
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>
          {now ? greeting(now.getHours()) : "…"}、機長
        </h1>
        <span className="mono" style={{ fontSize: 12, letterSpacing: "0.15em", color: "var(--muted)" }}>
          PILOT STATUS: ACTIVE
        </span>
      </div>
      <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 6 }}>
        {now
          ? `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")} ${WEEKDAYS[now.getDay()]} `
          : "--"}
        {now && (
          <b style={{ color: "var(--text)" }}>
            {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}
          </b>
        )}{" "}
        JST
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          flexWrap: "wrap",
          marginTop: 18,
        }}
      >
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>本日のライフスコア</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            {scoreDetail}
          </div>
        </div>

        {/* 円形ゲージ */}
        <svg width="130" height="130" viewBox="0 0 130 130" role="img" aria-label={`ライフスコア ${score}`}>
          <circle cx="65" cy="65" r={R} fill="none" stroke="var(--bg-2)" strokeWidth="9" />
          <circle
            cx="65"
            cy="65"
            r={R}
            fill="none"
            stroke="var(--amber)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${(C * pct) / 100} ${C}`}
            transform="rotate(-90 65 65)"
            style={{ filter: "drop-shadow(0 0 6px var(--amber-dim))", transition: "stroke-dasharray .6s ease" }}
          />
          <text x="65" y="63" textAnchor="middle" fill="var(--amber)" fontSize="30" fontWeight="700" className="mono">
            {score}
          </text>
          <text x="65" y="82" textAnchor="middle" fill="var(--muted)" fontSize="10" letterSpacing="2">
            SCORE
          </text>
        </svg>

        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>あなたの残り時間</div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            目標年齢 {targetAge}才まで
          </div>
        </div>

        <div
          className="mono"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--bezel)",
            borderRadius: 12,
            padding: "14px 22px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--muted)" }}>残り日数</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: "var(--amber)", marginTop: 2 }}>
            {now ? `${daysLeft.toLocaleString()}日` : "---"}
          </div>
          <div style={{ fontSize: 12, color: "var(--cyan)", marginTop: 2 }}>{now ? `(${hms})` : ""}</div>
        </div>
      </div>
    </section>
  );
}
