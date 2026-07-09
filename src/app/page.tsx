"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, seedIfEmpty, AI_FEATURES } from "@/lib/db";
import { applyTheme } from "@/lib/themes";
import { Hud } from "@/components/Hud";
import { Drawer } from "@/components/Drawer";
import { TodosDrawer } from "@/components/drawers/TodosDrawer";
import { ProjectsDrawer } from "@/components/drawers/ProjectsDrawer";
import { GoalsDrawer } from "@/components/drawers/GoalsDrawer";
import { QuotesDrawer, pickDailyQuote } from "@/components/drawers/QuotesDrawer";
import { HealthDrawer } from "@/components/drawers/HealthDrawer";
import { HomeDrawer } from "@/components/drawers/HomeDrawer";
import { ShoppingDrawer } from "@/components/drawers/ShoppingDrawer";
import { AnniversariesDrawer, daysUntil } from "@/components/drawers/AnniversariesDrawer";
import { FinanceDrawer, formatYen } from "@/components/drawers/FinanceDrawer";
import { HobbiesDrawer } from "@/components/drawers/HobbiesDrawer";
import { MoveDrawer } from "@/components/drawers/MoveDrawer";
import { ThemeStoreDrawer } from "@/components/drawers/ThemeStoreDrawer";
import { ProfileDrawer } from "@/components/drawers/ProfileDrawer";
import { PlanDrawer } from "@/components/drawers/PlanDrawer";

type DrawerKey =
  | "todos" | "projects" | "goals" | "quotes" | "health" | "home"
  | "shopping" | "anniversaries" | "finance" | "hobbies" | "move"
  | "themes" | "profile" | "plan" | null;

const DRAWERS: Record<Exclude<DrawerKey, null>, { title: string; icon: string; body: React.ReactNode }> = {
  todos: { title: "本日と直近のTO DO", icon: "☰", body: <TodosDrawer /> },
  projects: { title: "プロジェクト一覧 & トピック", icon: "📁", body: <ProjectsDrawer /> },
  goals: { title: "目標設定", icon: "◎", body: <GoalsDrawer /> },
  quotes: { title: "名言・座右の銘", icon: "❝", body: <QuotesDrawer /> },
  health: { title: "身体・メンタル管理", icon: "💓", body: <HealthDrawer /> },
  home: { title: "住居／物品／車両管理", icon: "🏠", body: <HomeDrawer /> },
  shopping: { title: "買い物・在庫管理", icon: "🛒", body: <ShoppingDrawer /> },
  anniversaries: { title: "記念日・誕生日・命日", icon: "📅", body: <AnniversariesDrawer /> },
  finance: { title: "資産管理", icon: "📊", body: <FinanceDrawer /> },
  hobbies: { title: "趣味", icon: "🎸", body: <HobbiesDrawer /> },
  move: { title: "MOVE（MaaS・カーシェア）", icon: "🚗", body: <MoveDrawer /> },
  themes: { title: "テーマストア", icon: "🎨", body: <ThemeStoreDrawer /> },
  profile: { title: "プロフィール設定", icon: "👤", body: <ProfileDrawer /> },
  plan: { title: "プラン・AI機能", icon: "✨", body: <PlanDrawer /> },
};

const todayStr = () => new Date().toISOString().slice(0, 10);

export default function CockpitPage() {
  const [ready, setReady] = useState(false);
  const [drawer, setDrawer] = useState<DrawerKey>(null);

  useEffect(() => {
    (async () => {
      await seedIfEmpty();
      const theme = (await db.settings.get("current_theme"))?.value ?? "cockpit";
      applyTheme(theme);
      setReady(true);
      // ローカルデータの自動消去リスク低減（仕様書 6.2）
      navigator.storage?.persist?.().catch(() => {});
      if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      }
    })();
  }, []);

  const todos = useLiveQuery(() => db.todos.toArray(), []) ?? [];
  const projects = useLiveQuery(() => db.projects.toArray(), []) ?? [];
  const goals = useLiveQuery(() => db.goals.toArray(), []) ?? [];
  const quotes = useLiveQuery(() => db.quotes.orderBy("createdAt").toArray(), []) ?? [];
  const healthLog = useLiveQuery(() => db.health_logs.where("logDate").equals(todayStr()).first(), []);
  const conditions = useLiveQuery(() => db.conditions.toArray(), []) ?? [];
  const medications = useLiveQuery(() => db.medications.toArray(), []) ?? [];
  const homeItems = useLiveQuery(() => db.home_items.toArray(), []) ?? [];
  const shopping = useLiveQuery(() => db.shopping_items.toArray(), []) ?? [];
  const anniversaries = useLiveQuery(() => db.anniversaries.toArray(), []) ?? [];
  const accounts = useLiveQuery(() => db.finance_accounts.toArray(), []) ?? [];
  const hobbies = useLiveQuery(() => db.hobbies.toArray(), []) ?? [];
  const reservations = useLiveQuery(() => db.move_reservations.toArray(), []) ?? [];
  const aiToggles = useLiveQuery(() => db.ai_feature_toggles.toArray(), []) ?? [];
  const plan = useLiveQuery(async () => (await db.settings.get("plan"))?.value, []) ?? "free";
  const birthDate =
    useLiveQuery(async () => (await db.settings.get("birth_date"))?.value, []) ?? "1990-01-01";
  const targetAge = Number(
    useLiveQuery(async () => (await db.settings.get("target_age"))?.value, []) ?? "85"
  );

  // ---- 派生値 ----
  const doneTodos = todos.filter((t) => t.done).length;
  const taskRatio = todos.length ? doneTodos / todos.length : 0;
  const sleep = healthLog?.sleepHours ?? null;
  const mood = healthLog?.mood ?? null;

  // 本日のライフスコア：タスク40 + 睡眠30 + 気分30
  const score = Math.round(
    40 * taskRatio +
      30 * (sleep === null ? 0.5 : Math.min(sleep / 8, 1)) +
      30 * (mood === "良好" ? 1 : mood === "普通" ? 0.6 : mood === "不調" ? 0.3 : 0.5)
  );

  const topProject = [...projects].sort((a, b) => b.progress - a.progress)[0];
  const goalLevels = new Set(goals.filter((g) => !g.done).map((g) => g.level)).size;
  const dailyQuote = pickDailyQuote(quotes);
  const needsAction = homeItems.filter((h) => h.needsAction);
  const nextHome = [...homeItems]
    .filter((h) => h.nextDue && h.needsAction)
    .sort((a, b) => (a.nextDue! < b.nextDue! ? -1 : 1))[0];
  const lowStock = shopping.filter((s) => s.lowStock && !s.bought);
  const recurringNames = shopping.filter((s) => s.recurring).map((s) => s.name).slice(0, 2);
  const nextAnniv = [...anniversaries].sort((a, b) => daysUntil(a.date) - daysUntil(b.date))[0];
  const totalAssets = accounts.reduce((s, a) => s + a.balance, 0);
  const topHobby = [...hobbies].sort((a, b) => b.streakDays - a.streakDays)[0];
  const activeMove = reservations.find((r) => r.status === "reserved");
  const monthMoves = reservations.filter(
    (r) => r.status !== "cancelled" && new Date(r.startTime).getMonth() === new Date().getMonth()
  );
  const monthCost = monthMoves.reduce((s, r) => s + r.price, 0);

  const fmtTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const toggleAi = async (key: string, enabled: 0 | 1) => {
    if (plan !== "paid") {
      setDrawer("plan");
      return;
    }
    await db.ai_feature_toggles.update(key, { enabled: enabled ? 0 : 1 });
  };

  if (!ready) {
    return (
      <main className="app" style={{ display: "grid", placeItems: "center", minHeight: "80vh" }}>
        <div className="mono" style={{ color: "var(--muted)", letterSpacing: "0.2em" }}>
          SYSTEM BOOT…
        </div>
      </main>
    );
  }

  const panels: {
    key: Exclude<DrawerKey, null>;
    icon: string;
    tag: string;
    title: string;
    metric: React.ReactNode;
    bar?: number;
    foot: React.ReactNode;
    footDot: "green" | "red" | "amber";
  }[] = [
    {
      key: "todos", icon: "☰", tag: "TASKS", title: "本日と直近のTO DO",
      metric: <>{todos.length - doneTodos}<small>件 残り</small></>,
      bar: taskRatio * 100,
      foot: <>完了 {doneTodos}/{todos.length}</>, footDot: "green",
    },
    {
      key: "projects", icon: "📁", tag: "PROJECTS", title: "プロジェクト一覧 & トピック",
      metric: <>{projects.length}<small>件 進行中</small></>,
      bar: topProject?.progress ?? 0,
      foot: topProject ? <>最優先: <b>{topProject.name}</b>（{topProject.progress}%）</> : "プロジェクトなし",
      footDot: "green",
    },
    {
      key: "goals", icon: "◎", tag: "GOALS", title: "目標設定",
      metric: <>{goalLevels}<small>階層 設定中</small></>,
      bar: goals.length ? (goals.filter((g) => g.done).length / goals.length) * 100 : 0,
      foot: "今日・今月・今年・中長期", footDot: "green",
    },
    {
      key: "quotes", icon: "❝", tag: "DAILY", title: "名言・座右の銘",
      metric: (
        <span style={{ fontSize: 14, fontWeight: 400, lineHeight: 1.7, color: "var(--text)" }}>
          {dailyQuote?.text ?? "名言を登録しましょう"}
        </span>
      ),
      foot: dailyQuote?.author ? `— ${dailyQuote.author}` : "日替わり表示", footDot: "amber",
    },
    {
      key: "health", icon: "💓", tag: "WEARABLE", title: "身体・メンタル管理",
      metric: <>{sleep ?? "-"}<small>h 睡眠</small></>,
      bar: sleep ? Math.min((sleep / 8) * 100, 100) : 0,
      foot: <>持病 {conditions.length}件 ・ お薬{medications.length > 0 ? "管理中" : "なし"}</>,
      footDot: "red",
    },
    {
      key: "home", icon: "🏠", tag: "ASSETS", title: "住居／物品／車両管理",
      metric: <>{needsAction.length}<small>件 要対応</small></>,
      foot: nextHome ? <>直近: <b>{nextHome.action}</b>（{nextHome.nextDue?.replaceAll("-", ".")}）</> : "要対応なし",
      footDot: needsAction.length ? "red" : "green",
    },
    {
      key: "shopping", icon: "🛒", tag: "HOME", title: "買い物・在庫管理",
      metric: <>{lowStock.length}<small>点 在庫少</small></>,
      foot: recurringNames.length ? <>定期購入: {recurringNames.join("・")}</> : "定期購入なし",
      footDot: lowStock.length ? "red" : "green",
    },
    {
      key: "anniversaries", icon: "📅", tag: "CALENDAR", title: "記念日・誕生日・命日",
      metric: nextAnniv ? <>{daysUntil(nextAnniv.date)}<small>日後</small></> : <>-<small></small></>,
      foot: nextAnniv ? (
        <>次: <b>{nextAnniv.name}</b>（{nextAnniv.date.replace("-", "/")}）</>
      ) : "登録なし",
      footDot: "green",
    },
    {
      key: "finance", icon: "📊", tag: "FINANCE", title: "資産管理",
      metric: <span className="mono">{formatYen(totalAssets)}</span>,
      bar: 62,
      foot: <>口座 {accounts.length}件 ・ 手動管理</>, footDot: "green",
    },
    {
      key: "hobbies", icon: "🎸", tag: "HOBBY", title: "趣味",
      metric: <>{topHobby?.streakDays ?? 0}<small>日 連続</small></>,
      bar: topHobby ? Math.min(100, (topHobby.weeklyDone / Math.max(1, topHobby.weeklyTarget)) * 100) : 0,
      foot: topHobby ? <>{topHobby.name} ・ 今週 {topHobby.weeklyDone}/{topHobby.weeklyTarget}回</> : "趣味を登録しましょう",
      footDot: "green",
    },
  ];

  return (
    <main className="app" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <Hud
        score={score}
        scoreDetail={`TASK ${doneTodos}/${todos.length} ・ SLEEP ${sleep ?? "-"}h ・ MOOD ${mood ?? "-"}`}
        birthDate={birthDate}
        targetAge={targetAge}
        onOpenThemes={() => setDrawer("themes")}
      />
      {/* 残り時間の設定リンク */}
      <button
        className="mono"
        style={{ fontSize: 11, color: "var(--muted)", alignSelf: "flex-end", marginTop: -10 }}
        onClick={() => setDrawer("profile")}
      >
        ⚙ 生年月日・目標年齢を設定
      </button>

      {/* MOVE（MaaS）— HUD直下・横長全幅（仕様書 2.1） */}
      <button
        className="frame"
        style={{
          display: "flex", alignItems: "center", gap: 18, padding: "16px 20px",
          flexWrap: "wrap", textAlign: "left",
        }}
        onClick={() => setDrawer("move")}
      >
        <span className="panel-icon">🚗</span>
        <div style={{ minWidth: 200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <b>MOVE</b>
            <span
              className="panel-tag"
              style={{ color: "var(--cyan)", borderColor: "var(--cyan-dim)", background: "var(--cyan-faint)" }}
            >
              MaaS ・ カーシェア
            </span>
          </div>
          <div className="panel-foot" style={{ marginTop: 4 }}>
            <span className={`dot ${activeMove ? "green" : "amber"}`} />
            {activeMove
              ? `本日 ${fmtTime(activeMove.startTime)}〜${fmtTime(activeMove.endTime)} ${activeMove.provider} ${activeMove.vehicle} 予約済み`
              : "予約はありません"}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
          <div>
            <div className="section-label">近くの車両</div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 700 }}>3台</div>
          </div>
          <div>
            <div className="section-label">今月の利用</div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 700 }}>
              {monthMoves.length}回 ¥{monthCost.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="section-label">次の予定</div>
            <div className="mono" style={{ fontSize: 17, fontWeight: 700 }}>
              {activeMove ? `本日 ${fmtTime(activeMove.startTime)}` : "--"}
            </div>
          </div>
        </div>
        <span className="btn primary">予約を管理</span>
      </button>

      {/* パネルグリッド */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {panels.map((p) => (
          <button key={p.key} className="panel-card" onClick={() => setDrawer(p.key)}>
            <div className="panel-head">
              <span className="panel-icon">{p.icon}</span>
              <span className="panel-tag">{p.tag}</span>
            </div>
            <div className="panel-title">{p.title}</div>
            <div className="panel-metric">{p.metric}</div>
            {p.bar !== undefined && (
              <div className="panel-bar">
                <i style={{ width: `${Math.max(0, Math.min(100, p.bar))}%` }} />
              </div>
            )}
            <div className="panel-foot">
              <span className={`dot ${p.footDot}`} />
              <span>{p.foot}</span>
            </div>
          </button>
        ))}
      </div>

      {/* AI / サブスクリプション（仕様書 1.3） */}
      <section className="frame" style={{ padding: "18px 20px" }}>
        <div className="section-label" style={{ marginBottom: 12 }}>
          AI / SUBSCRIPTION SYSTEMS
          {plan !== "paid" && (
            <button
              className="btn small primary"
              style={{ marginLeft: 12 }}
              onClick={() => setDrawer("plan")}
            >
              🔒 有料プランで解放
            </button>
          )}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
            gap: 10,
          }}
        >
          {AI_FEATURES.map((f) => {
            const t = aiToggles.find((x) => x.key === f.key);
            const on = plan === "paid" && t?.enabled === 1;
            return (
              <div key={f.key} className="row" style={{ padding: "10px 12px" }}>
                <div className="grow">
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{f.name}</div>
                  <div className="sub" style={{ fontSize: 11 }}>{f.desc}</div>
                </div>
                <button
                  className={`toggle ${on ? "on" : ""}`}
                  onClick={() => toggleAi(f.key, t?.enabled ?? 0)}
                  aria-label={`${f.name} 切替`}
                />
              </div>
            );
          })}
        </div>
      </section>

      <footer className="mono" style={{ textAlign: "center", fontSize: 11, color: "var(--muted)", letterSpacing: "0.1em" }}>
        LIFE COCKPIT — Phase 1 PWA ・ 各パネルをタップすると詳細画面が開きます
      </footer>

      {drawer && (
        <Drawer title={DRAWERS[drawer].title} icon={DRAWERS[drawer].icon} onClose={() => setDrawer(null)}>
          {DRAWERS[drawer].body}
        </Drawer>
      )}
    </main>
  );
}
