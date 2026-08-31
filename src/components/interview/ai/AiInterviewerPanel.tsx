import React, { useState } from "react";
import { Sparkles, BrainCircuit, Target, CheckCircle2, MessageSquarePlus, Lightbulb, ShieldAlert, Loader2 } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface AiInterviewerPanelProps {
  sessionId: string;
  problemTitle?: string;
  currentStage: string;
  jobSkills?: string[];
  jobTitle?: string;
}

export function AiInterviewerPanel({ sessionId, problemTitle, currentStage, jobSkills, jobTitle }: AiInterviewerPanelProps) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const [suggestion, setSuggestion] = useState<{ observation: string; suggestedQuestion: string; assessedCompetency: string } | null>(null);
  
  // Strict 4-pillar Bar Raiser Rubric — plan hierarchy Phase 4
  const derivedCompetencies = React.useMemo(() => {
    const pillarMap = [
      { pillar: "problem_solving", name: "Problem Solving & Decomposition", desc: "Clarifies constraints, decomposes task" },
      { pillar: "coding_algorithms", name: "Algorithmic Implementation & Code Quality", desc: "Data structures, complexity, correctness" },
      { pillar: "system_design", name: "System Architecture & Tradeoff Reasoning", desc: "Whiteboard, scale, trade-offs" },
      { pillar: "communication", name: "Technical Communication & Collaboration", desc: "Cadence, clarity, terminology" },
    ];
    // Optionally prioritize pillars based on jobSkills matching; still always show 4
    const skillsText = (jobSkills || []).join(" ").toLowerCase();
    if (skillsText.includes("system") || skillsText.includes("distributed") || currentStage === "SYSTEM_DESIGN") {
      // Reorder to surface system_design first when relevant
      const idx = pillarMap.findIndex((p) => p.pillar === "system_design");
      if (idx > 0) {
        const [sys] = pillarMap.splice(idx, 1);
        pillarMap.unshift(sys);
      }
    }
    return pillarMap.map((p) => ({ name: p.name, pillar: p.pillar, desc: p.desc, assessed: false }));
  }, [jobSkills, currentStage]);

  const [competencies, setCompetencies] = useState<{ name: string; pillar: string; assessed: boolean; desc: string }[]>(derivedCompetencies as any);

  React.useEffect(() => {
    setCompetencies(derivedCompetencies as any);
  }, [derivedCompetencies]);

  const handleGenerateFollowUp = async () => {
    setLoading(true);
    try {
      const workspace = await apiCall<{ workspace: Array<{ content?: string; language?: string }> }>(
        `/coding/${sessionId}/workspace`, "GET", null, token,
      );
      const activeFile = workspace.workspace.find((file) => file.content?.trim()) || workspace.workspace[0];
      const response = await apiCall<{ suggestion: { observation: string; suggestedQuestion: string; assessedCompetency: string } }>(
        `/interviews/${sessionId}/ai-suggest`, "POST", {
          activeCode: activeFile?.content || "",
          activeLanguage: activeFile?.language || "plaintext",
          currentStage,
        }, token,
      );
      setSuggestion(response.suggestion);
      // Map assessedCompetency string to pillar enum; fallback to name match
      const norm = (response.suggestion.assessedCompetency || "").toLowerCase().replace(/\s+/g, "_");
      setCompetencies((current) => current.map((item) => ({
        ...item,
        assessed: item.pillar === norm || item.name.toLowerCase().includes(norm) || item.name === response.suggestion.assessedCompetency || item.assessed,
      })));
      toast.success("Evidence-grounded suggestion generated from the shared workspace.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to generate a grounded suggestion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-[#181818] p-3.5 text-xs text-white shadow-xl">
      <div className="mb-3 flex items-center justify-between border-b border-[#333333] pb-2.5">
        <span className="font-semibold text-[#E0E0E0]">AI Interviewer Copilot</span>
        <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
          Interviewer Only
        </span>
      </div>

      {/* Suggested Follow-Up Prompt */}
      <div className="rounded-lg border border-purple-500/30 bg-purple-950/20 p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-purple-300">
            Contextual Follow-up
          </span>
          <button
            onClick={handleGenerateFollowUp}
            disabled={loading}
            className="flex items-center gap-1 rounded bg-purple-600 px-2 py-1 text-[11px] font-medium text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Suggest</span>
          </button>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-[#D8B4FE]">
          {suggestion ? `${suggestion.observation} Ask: “${suggestion.suggestedQuestion}”` : "Click 'Suggest' to analyze code that is actually present in the shared workspace."}
        </p>
      </div>

      {/* Competency Matrix Coverage */}
      <div className="mt-3 flex-1 overflow-y-auto">
        <div className="mb-2 font-semibold text-[#AAAAAA]">
          Required Competency Coverage
        </div>

        <div className="space-y-1.5">
          {competencies.map((comp, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded bg-[#222222] px-2.5 py-1.5 text-[11px]"
            >
              <span className={comp.assessed ? "text-emerald-300" : "text-[#888888]"}>{comp.name}</span>
              {comp.assessed ? (
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Covered
                </span>
              ) : (
                <span className="text-[10px] text-[#666666]">Pending</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Non-Autonomous Hiring Policy Notice */}
      <div className="mt-2 flex items-center gap-1.5 border-t border-[#333333] pt-2 text-[10px] text-[#777777]">
        <ShieldAlert className="h-3 w-3 text-amber-400 shrink-0" />
        <span>Advisory only. Final hiring decisions rest strictly with human recruiters.</span>
      </div>
    </div>
  );
}
