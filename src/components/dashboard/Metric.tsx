import { CountUp } from "@/components/fx/CountUp";

export function Metric({
  label,
  suffix = "",
  value,
}: {
  label: string;
  suffix?: string;
  value: number;
}) {
  return (
    <div className="py-6 sm:px-6 sm:first:pl-0 lg:px-7">
      <dt className="text-sm font-semibold text-ink/60">{label}</dt>
      <dd className="font-display mt-3 text-4xl text-ink">
        <CountUp to={value} />
        {suffix}
      </dd>
    </div>
  );
}
