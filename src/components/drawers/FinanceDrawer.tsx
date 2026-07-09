"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, uuid, type FinanceAccount } from "@/lib/db";

const TYPES: FinanceAccount["accountType"][] = ["銀行", "証券", "現金", "その他"];

export const formatYen = (n: number) =>
  n >= 1000000 ? `¥${(n / 1000000).toFixed(1)}M` : `¥${n.toLocaleString()}`;

export function FinanceDrawer() {
  const accounts = useLiveQuery(() => db.finance_accounts.orderBy("createdAt").toArray(), []) ?? [];
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const [institution, setInstitution] = useState("");
  const [accountType, setAccountType] = useState<FinanceAccount["accountType"]>("銀行");
  const [balance, setBalance] = useState("");

  const add = async () => {
    if (!institution.trim()) return;
    await db.finance_accounts.add({
      id: uuid(),
      institution: institution.trim(),
      accountType,
      balance: Number(balance) || 0,
      linkedVia: "manual",
      createdAt: Date.now(),
    });
    setInstitution("");
    setBalance("");
  };

  return (
    <>
      <div className="row" style={{ borderColor: "var(--amber-dim)", justifyContent: "space-between" }}>
        <div className="section-label">総資産</div>
        <div className="mono" style={{ fontSize: 22, fontWeight: 700, color: "var(--amber)" }}>
          ¥{total.toLocaleString()}
        </div>
      </div>

      <div className="section-label">口座一覧（{accounts.length} 件）</div>
      {accounts.map((a) => (
        <div key={a.id} className="row">
          <div className="grow">
            <div>{a.institution}</div>
            <div className="sub">
              {a.accountType} ・ {a.linkedVia === "manual" ? "手動管理" : "API連携"}
            </div>
          </div>
          <input
            type="number"
            className="mono"
            style={{ width: 130, textAlign: "right" }}
            value={a.balance}
            onChange={(e) => db.finance_accounts.update(a.id, { balance: Number(e.target.value) || 0 })}
          />
          <button className="icon-btn" onClick={() => db.finance_accounts.delete(a.id)} aria-label="削除">
            🗑
          </button>
        </div>
      ))}

      <div className="form-grid">
        <div className="section-label">口座を追加</div>
        <div className="cols">
          <input value={institution} onChange={(e) => setInstitution(e.target.value)} placeholder="金融機関名" />
          <select value={accountType} onChange={(e) => setAccountType(e.target.value as FinanceAccount["accountType"])}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)} placeholder="残高（円）" />
        <button className="btn primary" onClick={add}>
          追加
        </button>
        <div className="sub" style={{ fontSize: 11, color: "var(--muted)" }}>
          ※ 銀行・証券口座の自動連携（Moneytree LINK）は有料プラン・フェーズ3で提供予定です。
        </div>
      </div>
    </>
  );
}
