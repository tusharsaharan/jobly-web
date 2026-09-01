import { motion } from "framer-motion";

export function PipelineBar({
  color,
  label,
  total,
  value,
}: {
  color: string;
  label: string;
  total: number;
  value: number;
}) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-semibold text-ink/75">{label}</span>
        <span className="font-mono text-xs text-ink/55">
          {value} | {percentage}%
        </span>
      </div>
      <div className="mt-2 h-1.5 bg-ink/10">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export function PipelineDatum({
  label,
  tone = "text-ink",
  value,
}: {
  label: string;
  tone?: string;
  value: number;
}) {
  return (
    <button type="button" className="group flex flex-col items-start rounded-md p-3 -ml-3 border-l-2 border-transparent text-left transition-colors hover:bg-panel hover:border-mint-deep">
      <p className="marker-num transition-colors group-hover:text-mint-deep">{label}</p>
      <p className={`font-display mt-2 text-4xl ${tone}`}>{value}</p>
    </button>
  );
}
