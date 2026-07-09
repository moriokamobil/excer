"use client";

import { useEffect } from "react";

export function Drawer({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label={title}>
        <div className="drawer-head">
          {icon && <span className="panel-icon">{icon}</span>}
          <h2>{title}</h2>
          <button className="drawer-close" onClick={onClose} aria-label="閉じる">
            ✕
          </button>
        </div>
        <div className="drawer-body">{children}</div>
      </aside>
    </>
  );
}
