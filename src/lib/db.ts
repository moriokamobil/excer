// 無料プランのローカル保存層（仕様書 6.2）
// 端末内 IndexedDB（Dexie.js）に保存し、クラウドには送信しない。
// 主キーは端末側で生成した UUID とし、有料プラン移行時にそのままクラウドへ一括移行できる。
import Dexie, { type Table } from "dexie";

export type Todo = {
  id: string;
  title: string;
  done: 0 | 1;
  dueDate: string | null; // YYYY-MM-DD
  alarmTime: string | null; // HH:mm（PWA段階では「リマインダー」扱い：仕様書 9.1）
  createdAt: number;
};

export type Project = {
  id: string;
  name: string;
  progress: number; // 0-100
  dueDate: string | null;
  topic: string;
  createdAt: number;
};

export type Goal = {
  id: string;
  parentGoalId: string | null;
  level: "today" | "month" | "year" | "long"; // 今日／今月／今年／中長期
  title: string;
  done: 0 | 1;
  createdAt: number;
};

export type Quote = {
  id: string;
  text: string;
  author: string;
  createdAt: number;
};

export type HealthLog = {
  id: string;
  logDate: string; // YYYY-MM-DD
  sleepHours: number | null;
  restingHr: number | null;
  mood: "良好" | "普通" | "不調" | null;
  note: string;
  source: "manual" | "wearable";
};

export type Condition = { id: string; name: string; note: string; createdAt: number };

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  createdAt: number;
};

export type HomeItem = {
  id: string;
  name: string;
  category: "住居" | "物品" | "車両";
  nextDue: string | null; // 点検・車検・買替予定日
  action: string; // 予定内容（例：車検、フィルター交換）
  needsAction: 0 | 1;
  createdAt: number;
};

export type ShoppingItem = {
  id: string;
  name: string;
  qty: string;
  recurring: 0 | 1; // 定期購入
  lowStock: 0 | 1;
  bought: 0 | 1;
  createdAt: number;
};

export type Anniversary = {
  id: string;
  name: string;
  date: string; // MM-DD
  kind: "記念日" | "誕生日" | "命日";
  notify: 0 | 1;
  createdAt: number;
};

export type FinanceAccount = {
  id: string;
  institution: string;
  accountType: "銀行" | "証券" | "現金" | "その他";
  balance: number;
  linkedVia: "manual" | "moneytree"; // フェーズ3で Moneytree LINK 連携予定
  createdAt: number;
};

export type Hobby = {
  id: string;
  name: string;
  streakDays: number;
  weeklyTarget: number;
  weeklyDone: number;
  lastDoneDate: string | null; // YYYY-MM-DD
  createdAt: number;
};

export type MoveReservation = {
  id: string;
  provider: string;
  vehicle: string;
  startTime: string; // ISO
  endTime: string; // ISO
  status: "reserved" | "completed" | "cancelled";
  price: number;
  createdAt: number;
};

export type AiFeatureToggle = {
  key: string; // alarm | fortune | medical | bank | chat
  enabled: 0 | 1;
};

export type Setting = { key: string; value: string };

export const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

class LifeCockpitDB extends Dexie {
  todos!: Table<Todo, string>;
  projects!: Table<Project, string>;
  goals!: Table<Goal, string>;
  quotes!: Table<Quote, string>;
  health_logs!: Table<HealthLog, string>;
  conditions!: Table<Condition, string>;
  medications!: Table<Medication, string>;
  home_items!: Table<HomeItem, string>;
  shopping_items!: Table<ShoppingItem, string>;
  anniversaries!: Table<Anniversary, string>;
  finance_accounts!: Table<FinanceAccount, string>;
  hobbies!: Table<Hobby, string>;
  move_reservations!: Table<MoveReservation, string>;
  ai_feature_toggles!: Table<AiFeatureToggle, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super("life-cockpit");
    this.version(1).stores({
      todos: "id, done, dueDate, createdAt",
      projects: "id, createdAt",
      goals: "id, level, parentGoalId, createdAt",
      quotes: "id, createdAt",
      health_logs: "id, logDate",
      conditions: "id, createdAt",
      medications: "id, createdAt",
      home_items: "id, category, nextDue, createdAt",
      shopping_items: "id, bought, createdAt",
      anniversaries: "id, date, createdAt",
      finance_accounts: "id, createdAt",
      hobbies: "id, createdAt",
      move_reservations: "id, startTime, status",
      ai_feature_toggles: "key",
      settings: "key",
    });
  }
}

export const db = new LifeCockpitDB();

export const AI_FEATURES = [
  { key: "alarm", name: "アラームAI", desc: "起床・睡眠解析" },
  { key: "fortune", name: "占い", desc: "毎日・週間占い" },
  { key: "medical", name: "メディカル", desc: "通院・健診連携" },
  { key: "bank", name: "銀行・証券連携", desc: "支出分析・資産生成" },
  { key: "chat", name: "会話AI", desc: "メンタルケア対話" },
] as const;

const todayStr = () => new Date().toISOString().slice(0, 10);

/** 初回起動時のみデモデータを投入する */
export async function seedIfEmpty() {
  const seeded = await db.settings.get("seeded");
  if (seeded) return;

  const now = Date.now();
  const today = todayStr();
  const iso = (h: number, m = 0) => {
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.toISOString();
  };

  await db.transaction(
    "rw",
    [
      db.todos, db.projects, db.goals, db.quotes, db.health_logs,
      db.conditions, db.medications, db.home_items, db.shopping_items,
      db.anniversaries, db.finance_accounts, db.hobbies, db.move_reservations,
      db.ai_feature_toggles, db.settings,
    ],
    async () => {
      await db.todos.bulkAdd(
        [
          { title: "朝のストレッチ", done: 1 },
          { title: "メールの返信", done: 1 },
          { title: "週次レビューの作成", done: 1 },
          { title: "LIFE COCKPIT 仕様書レビュー", done: 0, dueDate: today },
          { title: "ジムで筋トレ", done: 0, dueDate: today, alarmTime: "19:00" },
          { title: "書類の提出", done: 0, dueDate: today },
          { title: "読書 30分", done: 0 },
          { title: "買い出し", done: 0 },
        ].map((t, i) => ({
          id: uuid(),
          title: t.title,
          done: (t.done ?? 0) as 0 | 1,
          dueDate: (t as { dueDate?: string }).dueDate ?? null,
          alarmTime: (t as { alarmTime?: string }).alarmTime ?? null,
          createdAt: now + i,
        }))
      );

      await db.projects.bulkAdd([
        { id: uuid(), name: "LIFE COCKPIT 開発", progress: 64, dueDate: "2026-09-30", topic: "フェーズ1 PWA公開", createdAt: now },
        { id: uuid(), name: "資格試験の勉強", progress: 30, dueDate: "2026-11-15", topic: "過去問2周目", createdAt: now + 1 },
        { id: uuid(), name: "部屋の模様替え", progress: 15, dueDate: null, topic: "収納の見直し", createdAt: now + 2 },
      ]);

      const yearGoalId = uuid();
      await db.goals.bulkAdd([
        { id: uuid(), parentGoalId: null, level: "long", title: "健康なまま85歳まで自立して生きる", done: 0, createdAt: now },
        { id: yearGoalId, parentGoalId: null, level: "year", title: "LIFE COCKPITをリリースする", done: 0, createdAt: now + 1 },
        { id: uuid(), parentGoalId: yearGoalId, level: "month", title: "フェーズ1のMVPを完成させる", done: 0, createdAt: now + 2 },
        { id: uuid(), parentGoalId: null, level: "today", title: "仕様書のレビューを終える", done: 0, createdAt: now + 3 },
      ]);

      await db.quotes.bulkAdd([
        { id: uuid(), text: "小さな一歩の積み重ねが、大きな変化を生む。", author: "", createdAt: now },
        { id: uuid(), text: "為せば成る、為さねば成らぬ何事も。", author: "上杉鷹山", createdAt: now + 1 },
        { id: uuid(), text: "継続は力なり。", author: "", createdAt: now + 2 },
        { id: uuid(), text: "今日という日は、残りの人生の最初の日である。", author: "チャールズ・ディードリッヒ", createdAt: now + 3 },
      ]);

      await db.health_logs.add({
        id: uuid(),
        logDate: today,
        sleepHours: 6.5,
        restingHr: 58,
        mood: "良好",
        note: "",
        source: "manual",
      });

      await db.conditions.bulkAdd([
        { id: uuid(), name: "高血圧（経過観察）", note: "月1回通院", createdAt: now },
        { id: uuid(), name: "花粉症", note: "春季のみ", createdAt: now + 1 },
      ]);

      await db.medications.bulkAdd([
        { id: uuid(), name: "降圧薬", dosage: "1錠", timing: "朝食後", createdAt: now },
      ]);

      await db.home_items.bulkAdd([
        { id: uuid(), name: "自家用車", category: "車両", nextDue: "2026-09-02", action: "車検", needsAction: 1, createdAt: now },
        { id: uuid(), name: "エアコン", category: "住居", nextDue: "2026-07-20", action: "フィルター清掃", needsAction: 1, createdAt: now + 1 },
        { id: uuid(), name: "冷蔵庫", category: "物品", nextDue: "2028-04-01", action: "買替検討", needsAction: 0, createdAt: now + 2 },
      ]);

      await db.shopping_items.bulkAdd([
        { id: uuid(), name: "洗剤", qty: "1本", recurring: 1, lowStock: 1, bought: 0, createdAt: now },
        { id: uuid(), name: "コーヒー豆", qty: "200g", recurring: 1, lowStock: 1, bought: 0, createdAt: now + 1 },
        { id: uuid(), name: "ティッシュ", qty: "5箱", recurring: 0, lowStock: 0, bought: 0, createdAt: now + 2 },
      ]);

      await db.anniversaries.bulkAdd([
        { id: uuid(), name: "母の誕生日", date: "07-22", kind: "誕生日", notify: 1, createdAt: now },
        { id: uuid(), name: "結婚記念日", date: "10-14", kind: "記念日", notify: 1, createdAt: now + 1 },
        { id: uuid(), name: "祖父の命日", date: "03-05", kind: "命日", notify: 0, createdAt: now + 2 },
      ]);

      await db.finance_accounts.bulkAdd([
        { id: uuid(), institution: "みずほ銀行", accountType: "銀行", balance: 2400000, linkedVia: "manual", createdAt: now },
        { id: uuid(), institution: "楽天証券", accountType: "証券", balance: 4000000, linkedVia: "manual", createdAt: now + 1 },
      ]);

      await db.hobbies.bulkAdd([
        { id: uuid(), name: "ギター練習", streakDays: 12, weeklyTarget: 5, weeklyDone: 3, lastDoneDate: today, createdAt: now },
        { id: uuid(), name: "ランニング", streakDays: 0, weeklyTarget: 3, weeklyDone: 1, lastDoneDate: null, createdAt: now + 1 },
      ]);

      await db.move_reservations.bulkAdd([
        { id: uuid(), provider: "タイムズカー", vehicle: "プリウス", startTime: iso(18), endTime: iso(20), status: "reserved", price: 1900, createdAt: now },
        { id: uuid(), provider: "タイムズカー", vehicle: "ヤリス", startTime: new Date(now - 6 * 864e5).toISOString(), endTime: new Date(now - 6 * 864e5 + 2 * 36e5).toISOString(), status: "completed", price: 1900, createdAt: now - 6 * 864e5 },
      ]);

      await db.ai_feature_toggles.bulkAdd(
        AI_FEATURES.map((f) => ({ key: f.key, enabled: 0 as const }))
      );

      await db.settings.bulkAdd([
        { key: "seeded", value: "1" },
        { key: "target_age", value: "85" },
        { key: "birth_date", value: "1990-01-01" },
        { key: "current_theme", value: "cockpit" },
        { key: "owned_themes", value: JSON.stringify(["cockpit"]) },
        { key: "plan", value: "free" },
      ]);
    }
  );
}
