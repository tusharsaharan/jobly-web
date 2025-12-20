import React, { useState } from "react";
import {
  ShieldCheck,
  Star,
  CheckCircle2,
  XCircle,
  Paperclip,
  Award,
  Sparkles,
  Save,
  Loader2,
  FileCode,
  Layers,
  MessageSquare,
} from "lucide-react";
import { apiCall } from "@/lib/api";
import { toast } from "sonner";

interface CompetencyItem {
  category: string;
  score: number;
  notes: string;
  evidenceRefs: Array<{
    refType: "TRANSCRIPT" | "CODE_CHECKPOINT" | "EXECUTION" | "WHITEBOARD_SNAPSHOT";
    timelineEventId?: string;
    checkpointId?: string;
    quote?: string;
    note?: string;
  }>;
}

interface EvaluationFormProps {
  sessionId: string;
  token?: string;
  onSaved?: () => void;
}

const DEFAULT_CATEGORIES = [
  "Problem Solving & Algorithm Design",
  "Code Quality & Architecture",
  "System Design & Scalability",
  "Technical Communication",
  "Debugging & Error Handling",
];

export function EvaluationForm({ sessionId, token, onSaved }: EvaluationFormProps) {
  const [overallRating, setOverallRating] = useState<number>(4);
  const [decision, setDecision] = useState<string>("HIRE");
  const [privateNotes, setPrivateNotes] = useState<string>("");
  const [strengths, setStrengths] = useState<string>("Clean modular code, quick problem comprehension");
  const [weaknesses, setWeaknesses] = useState<string>("Edge case testing can be improved");
  const [saving, setSaving] = useState<boolean>(false);

  const [competencies, setCompetencies] = useState<CompetencyItem[]>(
    DEFAULT_CATEGORIES.map((cat) => ({
      category: cat,
      score: 4,
      notes: "Demonstrated solid foundation during live technical interview.",
      evidenceRefs: [
        {
          refType: "CODE_CHECKPOINT",
          note: "Verified via live collaborative code implementation.",
        },
      ],
    }))
  );

  const handleScoreChange = (idx: number, newScore: number) => {
    setCompetencies((prev) => {
      const updated = [...prev];
      updated[idx].score = newScore;
      return updated;
    });
  };

  const handleNotesChange = (idx: number, notes: string) => {
    setCompetencies((prev) => {
      const updated = [...prev];
      updated[idx].notes = notes;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiCall(
        `/evaluations/${sessionId}`,
        "POST",
        {
          overallRating,
          decision,
          competencies,
          strengths: strengths.split(",").map((s) => s.trim()).filter(Boolean),
          weaknesses: weaknesses.split(",").map((w) => w.trim()).filter(Boolean),
          privateNotes,
        },
        token
      );

      toast.success("Interview evaluation & verified scorecard finalized!");
      if (onSaved) onSaved();
    } catch (err: any) {
      toast.error(err.message || "Failed saving evaluation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col overflow-y-auto bg-[#121212] p-6 text-white text-xs font-mono">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-[#2A2A2A] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2A9D7B]/20 text-[#2A9D7B]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Interview Evaluation & Scorecard</h1>
            <p className="text-[11px] text-[#888888]">Evidence-backed assessment and hiring recommendation</p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-[#2A9D7B] px-4 py-2 font-sans text-xs font-semibold text-white shadow-lg transition hover:bg-[#238266] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          <span>Finalize Scorecard</span>
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Decision & Summary */}
        <div className="col-span-12 lg:col-span-5 space-y-5">
          {/* Decision Selector */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-4 space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">Hiring Recommendation</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: "STRONG_HIRE", label: "Strong Hire", color: "border-emerald-500 text-emerald-400 bg-emerald-500/10" },
                { val: "HIRE", label: "Hire", color: "border-[#2A9D7B] text-[#2A9D7B] bg-[#2A9D7B]/10" },
                { val: "NO_HIRE", label: "No Hire", color: "border-amber-500 text-amber-400 bg-amber-500/10" },
                { val: "STRONG_NO_HIRE", label: "Strong No Hire", color: "border-rose-500 text-rose-400 bg-rose-500/10" },
              ].map((item) => (
                <button
                  type="button"
                  key={item.val}
                  onClick={() => setDecision(item.val)}
                  className={`rounded-lg border p-2.5 text-center font-sans font-semibold transition ${
                    decision === item.val ? item.color : "border-[#333333] bg-[#202020] text-[#777777] hover:border-[#444444]"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Overall Rating Slider */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">Overall Rating</h2>
              <span className="text-base font-bold text-[#2A9D7B]">{overallRating} / 5</span>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setOverallRating(star)}
                  className={`p-1 transition ${star <= overallRating ? "text-amber-400" : "text-[#444444]"}`}
                >
                  <Star className="h-5 w-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-4 space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-[#AAAAAA]">Key Candidate Strengths (comma-separated)</label>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded border border-[#333333] bg-[#111111] p-2 text-white outline-none focus:border-[#2A9D7B]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-[#AAAAAA]">Growth Areas / Weaknesses</label>
              <textarea
                value={weaknesses}
                onChange={(e) => setWeaknesses(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded border border-[#333333] bg-[#111111] p-2 text-white outline-none focus:border-[#2A9D7B]"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Evidence-Backed Competency Grid */}
        <div className="col-span-12 lg:col-span-7 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#AAAAAA]">Competency Breakdown (Evidence-Linked)</h2>
          {competencies.map((comp, idx) => (
            <div key={comp.category} className="rounded-xl border border-[#2A2A2A] bg-[#181818] p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-[13px]">{comp.category}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => handleScoreChange(idx, s)}
                      className={`h-6 w-6 rounded text-xs font-bold transition ${
                        s === comp.score ? "bg-[#2A9D7B] text-white" : "bg-[#252526] text-[#777777] hover:bg-[#333333]"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <input
                type="text"
                value={comp.notes}
                onChange={(e) => handleNotesChange(idx, e.target.value)}
                placeholder="Observational notes..."
                className="w-full rounded border border-[#333333] bg-[#111111] px-2.5 py-1.5 text-white outline-none focus:border-[#2A9D7B]"
              />

              {/* Evidence Link Badges */}
              <div className="flex items-center gap-2 pt-1">
                <span className="flex items-center gap-1 text-[10px] text-[#888888]">
                  <Paperclip className="h-3 w-3 text-[#2A9D7B]" />
                  <span>Evidence:</span>
                </span>
                {comp.evidenceRefs.map((ref, rIdx) => (
                  <span key={rIdx} className="rounded bg-[#2A9D7B]/15 px-2 py-0.5 text-[10px] text-[#2A9D7B] border border-[#2A9D7B]/30">
                    {ref.refType} Verified
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
