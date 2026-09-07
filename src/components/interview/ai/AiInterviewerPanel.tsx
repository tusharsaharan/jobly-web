import React, { useState } from "react";
import { Bot, Target, CheckCircle2, MessageSquarePlus, Lightbulb, ShieldAlert, Loader2 } from "lucide-react";
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-[#2d2d2d] bg-[#181818] p-3 text-xs text-white shadow-md font-sans">
      <div className="mb-2.5 flex items-center justify-between border-b border-[#2d2d2d] pb-2">
        <span className="font-semibold text-[#cccccc] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
          <Bot className="h-3.5 w-3.5 text-[#7EE0C5]" />
          Interviewer Assistant
        </span>
        <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#252526] text-[#858585] border border-[#2d2d2d]">
          Interviewer Only
        </span>
      </div>

      {/* Suggested Follow-Up Prompt */}
      <div className="rounded border border-[#2d2d2d] bg-[#1e1e1e] p-2.5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#cccccc] text-[11px]">
            Contextual Follow-up
          </span>
          <button
            onClick={handleGenerateFollowUp}
            disabled={loading}
            className="flex items-center gap-1 rounded bg-[#0e639c] hover:bg-[#1177bb] px-2.5 py-1 text-[11px] font-medium text-white transition disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            <span>Suggest</span>
          </button>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-[#cccccc]">
          {suggestion ? `${suggestion.observation} Ask: “${suggestion.suggestedQuestion}”` : "Click 'Suggest' to analyze code currently present in the shared workspace."}
        </p>
      </div>

      {/* Competency Matrix Coverage */}
      <div className="mt-2.5 flex-1 min-h-0 overflow-y-auto iv-scroll">
        <div className="mb-1.5 font-semibold text-[#858585] text-[10px] uppercase tracking-wider">
          Required Competency Coverage
        </div>

        <div className="space-y-1">
          {competencies.map((comp, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded border border-[#252526] bg-[#1e1e1e] px-2.5 py-1.5 text-[11px]"
            >
              <span className={comp.assessed ? "text-[#89d185]" : "text-[#858585]"}>{comp.name}</span>
              {comp.assessed ? (
                <span className="flex items-center gap-1 font-semibold text-[#89d185] text-[10px]">
                  <CheckCircle2 className="h-3 w-3" /> Covered
                </span>
              ) : (
                <span className="text-[10px] text-[#555555]">Pending</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Non-Autonomous Hiring Policy Notice */}
      <div className="mt-2 flex items-center gap-1.5 border-t border-[#2d2d2d] pt-2 text-[10px] text-[#666666]">
        <ShieldAlert className="h-3 w-3 text-amber-400 shrink-0" />
        <span>Advisory only. Final hiring decisions rest strictly with human recruiters.</span>
      </div>
    </div>
  );
}
