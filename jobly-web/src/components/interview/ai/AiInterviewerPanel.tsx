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

const SW = 1.75;

export function AiInterviewerPanel({ sessionId, problemTitle, currentStage, jobSkills, jobTitle }: AiInterviewerPanelProps) {
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const [suggestion, setSuggestion] = useState<{ observation: string; suggestedQuestion: string; assessedCompetency: string } | null>(null);

  // Strict 4-pillar Bar Raiser Rubric
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
    <div className="iv-card flex h-full flex-col overflow-hidden p-3 text-iv-text">
      <div className="mb-3 flex items-center justify-between border-b border-iv-line pb-2.5">
        <span className="font-semibold">AI Interviewer Copilot</span>
        <span className="iv-badge iv-badge-info">Interviewer Only</span>
      </div>

      {/* Suggested Follow-Up Prompt */}
      <div className="iv-card border-purple-500/30 bg-purple-950/20 p-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#c4b5fd]">Contextual Follow-up</span>
          <button
            onClick={handleGenerateFollowUp}
            disabled={loading}
            className="iv-btn iv-btn-sm bg-purple-600 text-white hover:bg-purple-700"
          >
            {loading && <Loader2 strokeWidth={SW} className="h-3 w-3 animate-spin" />}
            <span>Suggest</span>
          </button>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-[#d8b4fe]">
          {suggestion ? `${suggestion.observation} Ask: “${suggestion.suggestedQuestion}”` : "Click 'Suggest' to analyze code that is actually present in the shared workspace."}
        </p>
      </div>

      {/* Competency Matrix Coverage */}
      <div className="iv-scroll mt-3 flex-1 overflow-y-auto">
        <div className="mb-2 font-semibold text-iv-muted">Required Competency Coverage</div>

        <div className="space-y-1.5">
          {competencies.map((comp, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-md bg-iv-surface-alt px-2.5 py-1.5 text-[11px]"
            >
              <span className={comp.assessed ? "text-iv-success" : "text-iv-dim"}>{comp.name}</span>
              {comp.assessed ? (
                <span className="flex items-center gap-1 font-semibold text-iv-success">
                  <CheckCircle2 strokeWidth={SW} className="h-3 w-3" /> Covered
                </span>
              ) : (
                <span className="text-[10px] text-iv-dim">Pending</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Non-Autonomous Hiring Policy Notice */}
      <div className="mt-2 flex items-center gap-1.5 border-t border-iv-line pt-2 text-[10px] text-iv-dim">
        <ShieldAlert strokeWidth={SW} className="h-3 w-3 shrink-0 text-iv-warning" />
        <span>Advisory only. Final hiring decisions rest strictly with human recruiters.</span>
      </div>
    </div>
  );
}
