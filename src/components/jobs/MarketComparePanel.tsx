import { useState } from "react";
import { BarChart3, X, DollarSign, Briefcase, CheckCircle2, PlusCircle, Loader2, Sparkles } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type MarketComparison = {
  id: string;
  title: string;
  anonymizedCompany: string;
  location: string;
  type: string;
  skills: string[];
  overlapSkills: string[];
  additionalSkills: string[];
  minExperienceYears: number;
  salaryRange: {
    min?: number;
    max?: number;
    currency: string;
    period: string;
  } | null;
};

type MarketCompareData = {
  comparisons: MarketComparison[];
  marketMedianSalary: {
    min: number;
    max: number;
    currency: string;
    period: string;
    sampleSize: number;
  } | null;
  totalSimilarRoles: number;
  insight: string;
};

type MarketComparePanelProps = {
  payload: any;
};

export function MarketComparePanel({ payload }: MarketComparePanelProps) {
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<MarketCompareData | null>(null);

  const handleOpen = async () => {
    setIsOpen(true);
    setLoading(true);
    try {
      const result = await apiCall<MarketCompareData>("/jobs/market-compare", "POST", payload, token);
      setData(result);
    } catch (err) {
      console.error("Market compare error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-panel px-3.5 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-panel/80 cursor-pointer"
      >
        <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>Compare to Market</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="surface relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border shadow-2xl overflow-hidden bg-background">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <BarChart3 className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold text-ink text-base">Platform Market Benchmarks</h3>
                  <p className="text-xs text-ink/60">Anonymized comparison against peer postings in your category</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-panel hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-3" />
                  <p className="font-medium text-ink text-sm">Aggregating platform market postings...</p>
                </div>
              )}

              {data && !loading && (
                <>
                  {/* Top Insight Card */}
                  <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-900 dark:text-emerald-300">
                    <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <p className="font-semibold text-sm">Market Intelligence</p>
                      <p className="leading-relaxed opacity-90">{data.insight}</p>
                    </div>
                  </div>

                  {/* Benchmark Cards */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {data.marketMedianSalary ? (
                      <div className="rounded-xl border border-border bg-panel/40 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-ink/70 mb-2">
                          <DollarSign className="h-4 w-4 text-emerald-500" />
                          <span>Market Median Compensation</span>
                        </div>
                        <p className="text-2xl font-display font-bold text-ink">
                          ${data.marketMedianSalary.min.toLocaleString()} – ${data.marketMedianSalary.max.toLocaleString()}
                        </p>
                        <p className="text-[11px] text-ink/50 mt-1">
                          Based on {data.marketMedianSalary.sampleSize} visible platform listings
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-border bg-panel/40 p-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-ink/70 mb-2">
                          <DollarSign className="h-4 w-4 text-ink/40" />
                          <span>Market Compensation</span>
                        </div>
                        <p className="text-sm text-ink/70 italic">Undisclosed by peers in this specific title niche.</p>
                      </div>
                    )}

                    <div className="rounded-xl border border-border bg-panel/40 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-ink/70 mb-2">
                        <Briefcase className="h-4 w-4 text-blue-500" />
                        <span>Peer Postings Analyzed</span>
                      </div>
                      <p className="text-2xl font-display font-bold text-ink">{data.totalSimilarRoles}</p>
                      <p className="text-[11px] text-ink/50 mt-1">Active / recent similar role profiles on Jobly</p>
                    </div>
                  </div>

                  {/* Peer Postings List */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">Similar Role Profiles</p>
                    {data.comparisons.map((comp) => (
                      <div key={comp.id} className="rounded-xl border border-border/80 bg-panel/30 p-4 text-xs space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2.5">
                          <div>
                            <p className="font-semibold text-ink text-sm">{comp.title}</p>
                            <p className="text-[11px] text-ink/50">{comp.anonymizedCompany} • {comp.location} • {comp.type}</p>
                          </div>
                          {comp.salaryRange ? (
                            <span className="rounded bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-700 dark:text-emerald-300 text-xs">
                              ${comp.salaryRange.min?.toLocaleString()} - ${comp.salaryRange.max?.toLocaleString()} / {comp.salaryRange.period}
                            </span>
                          ) : (
                            <span className="text-[11px] text-ink/40 italic">Salary not published</span>
                          )}
                        </div>

                        {/* Skill Overlap Breakdown */}
                        <div className="space-y-1.5">
                          <p className="text-[11px] font-medium text-ink/70">Skill Profile Breakdown:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {comp.overlapSkills.map((skill, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                {skill}
                              </span>
                            ))}
                            {comp.additionalSkills.map((skill, idx) => (
                              <span key={idx} className="inline-flex items-center gap-1 rounded bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                                <PlusCircle className="h-3 w-3" />
                                {skill} (Market Common)
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end border-t border-border bg-panel/50 px-6 py-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium text-ink hover:bg-panel"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
