import { useState, useEffect } from "react";
import { Sparkles, Check, X, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type DeiImprovement = {
  originalPhrase: string;
  replacementPhrase: string;
  reason: string;
};

type DeiResult = {
  rewrittenDescription: string;
  improvements: DeiImprovement[];
  summary: string;
};

type DeiRewriteModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  onApply: (newDescription: string) => void;
};

export function DeiRewriteModal({ isOpen, onClose, title, description, onApply }: DeiRewriteModalProps) {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DeiResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sideBySide" | "improvements">("improvements");

  useEffect(() => {
    if (isOpen && description && description.trim().length >= 20) {
      handleRewrite();
    }
  }, [isOpen]);

  const handleRewrite = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiCall<DeiResult>("/jobs/dei-rewrite", "POST", {
        title,
        description
      }, token);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Failed to generate DEI rewrite.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="surface relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-border shadow-2xl overflow-hidden bg-background">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-semibold text-ink text-base">Make Job Description DEI-Friendly</h3>
              <p className="text-xs text-ink/60">AI-powered inclusivity &amp; bias reduction review</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink/50 transition-colors hover:bg-panel hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mb-4" />
              <p className="font-medium text-ink">Analyzing text for exclusionary or gender-coded terms...</p>
              <p className="text-xs text-ink/50 mt-1 max-w-sm">Generating an inclusive rewrite that maximizes candidate reach.</p>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
              <p className="font-medium">Optimization Error</p>
              <p className="mt-1 text-xs">{error}</p>
              <button
                onClick={handleRewrite}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold underline underline-offset-2"
              >
                Try Again
              </button>
            </div>
          )}

          {result && !loading && (
            <>
              {/* Summary Banner */}
              <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Inclusive Enhancements Identified</p>
                  <p className="text-xs mt-0.5 opacity-90">{result.summary}</p>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-border">
                <button
                  type="button"
                  onClick={() => setActiveTab("improvements")}
                  className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "improvements"
                      ? "border-ink text-ink"
                      : "border-transparent text-ink/50 hover:text-ink"
                  }`}
                >
                  Key Changes ({result.improvements.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("sideBySide")}
                  className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === "sideBySide"
                      ? "border-ink text-ink"
                      : "border-transparent text-ink/50 hover:text-ink"
                  }`}
                >
                  Full Rewritten Preview
                </button>
              </div>

              {/* Tab Contents */}
              {activeTab === "improvements" && (
                <div className="space-y-3">
                  {result.improvements.length === 0 ? (
                    <p className="text-sm text-ink/60 py-6 text-center">
                      No significant biased or exclusionary language detected in this job description.
                    </p>
                  ) : (
                    result.improvements.map((imp, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border border-border/80 bg-panel/40 p-3.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center gap-2 font-mono">
                          <span className="rounded bg-red-500/15 px-2 py-0.5 text-red-600 dark:text-red-400 line-through">
                            {imp.originalPhrase}
                          </span>
                          <ArrowRight className="h-3.5 w-3.5 text-ink/40 shrink-0" />
                          <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-700 dark:text-emerald-300">
                            {imp.replacementPhrase}
                          </span>
                        </div>
                        <p className="text-ink/70 font-sans">{imp.reason}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "sideBySide" && (
                <div className="grid gap-4 md:grid-cols-2 text-xs">
                  <div className="space-y-1.5">
                    <p className="font-semibold text-ink/70">Original Description</p>
                    <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-panel/30 p-3.5 font-mono text-ink/70 whitespace-pre-wrap leading-relaxed">
                      {description}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">DEI-Optimized Description</p>
                    <div className="max-h-72 overflow-y-auto rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3.5 font-mono text-ink whitespace-pre-wrap leading-relaxed">
                      {result.rewrittenDescription}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 border-t border-border bg-panel/50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-panel"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!result || loading}
            onClick={() => {
              if (result) {
                onApply(result.rewrittenDescription);
                onClose();
              }
            }}
            className="pill-mint inline-flex items-center gap-2 px-5 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            Apply DEI Rewrite
          </button>
        </div>
      </div>
    </div>
  );
}
