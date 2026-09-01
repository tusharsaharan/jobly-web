export function StatusLabel({ status }: { status?: string }) {
  const normalized = status || "applied";
  const className =
    normalized === "shortlisted"
      ? "border-[#8DDCBE] bg-[#E9FBF2] text-[#1E7058]"
      : normalized === "rejected"
        ? "border-[#B6DCCB] bg-[#F2FAF6] text-[#335E50]"
        : "border-[#C5EBDD] bg-[#EFFBF5] text-[#23765E]";

  return (
    <span
      className={`w-fit rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${className}`}
    >
      {normalized}
    </span>
  );
}

export function EmptyGraphic({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center border-y border-dashed border-border px-6 text-center text-sm leading-6 text-ink/55">
      {label}
    </div>
  );
}
