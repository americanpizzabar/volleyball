// Small presentational helpers shared across pages.
import type { ReactNode } from "react";

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      aria-label="読み込み中"
    />
  );
}

export function FullScreenLoader({ label = "読み込み中…" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-400">
      <Spinner className="text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 py-10 text-center">
      {icon && <div className="text-4xl">{icon}</div>}
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {description && (
        <p className="max-w-xs text-sm text-slate-500">{description}</p>
      )}
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const conditionStyles: Record<number, string> = {
  1: "bg-red-100 text-red-700",
  2: "bg-orange-100 text-orange-700",
  3: "bg-amber-100 text-amber-700",
  4: "bg-lime-100 text-lime-700",
  5: "bg-emerald-100 text-emerald-700",
};

export function ConditionBadge({ value }: { value: number }) {
  const labels = ["", "絶不調", "不調", "普通", "好調", "絶好調"];
  return (
    <span className={`chip ${conditionStyles[value] ?? "bg-slate-100 text-slate-600"}`}>
      {"★".repeat(value)}{labels[value] ?? ""}
    </span>
  );
}
