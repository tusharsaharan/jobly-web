import { useEffect, useState, useRef } from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";

type Flag = {
  field: string;
  severity: "warning" | "critical";
  message: string;
};

type RequirementFlagsProps = {
  payload: any;
};

export function RequirementFlags({ payload }: RequirementFlagsProps) {
  const { token } = useAuth();
  const [flags, setFlags] = useState<Flag[]>([]);
  const lastSemanticCheck = useRef("");

  // Rule-based checks (debounced on typing)
  useEffect(() => {
    const fetchRuleFlags = async () => {
      try {
        const result = await apiCall<{ flags: Flag[] }>("/jobs/flag-requirements", "POST", {
          type: "rules",
          payload,
        }, token);
        
        // Merge with existing semantic flags if any, or just set
        setFlags(current => {
          const semanticFlags = current.filter(f => !result.flags.some(rf => rf.field === f.field));
          return [...result.flags, ...semanticFlags];
        });
      } catch (err) {
        console.error("Failed to fetch rule flags", err);
      }
    };

    const timer = setTimeout(fetchRuleFlags, 500);
    return () => clearTimeout(timer);
  }, [JSON.stringify(payload), token]);

  // Semantic checks (ONLY on blur/significant change of description)
  useEffect(() => {
    const currentDesc = payload.description || "";
    if (currentDesc.length < 50 || currentDesc === lastSemanticCheck.current) return;

    const fetchSemanticFlags = async () => {
      try {
        const result = await apiCall<{ flags: Flag[] }>("/jobs/flag-requirements", "POST", {
          type: "semantic",
          payload,
        }, token);
        
        lastSemanticCheck.current = currentDesc;
        
        setFlags(current => {
          // Replace only semantic flags for description, keep rule flags
          const nonDescFlags = current.filter(f => f.field !== "description");
          return [...nonDescFlags, ...result.flags];
        });
      } catch (err) {
        console.error("Failed to fetch semantic flags", err);
      }
    };

    // Very long debounce for semantic checks to simulate "on stop typing"
    const timer = setTimeout(fetchSemanticFlags, 2000);
    return () => clearTimeout(timer);
  }, [payload.description, payload, token]);

  if (flags.length === 0) return null;

  return (
    <div className="mb-8 space-y-3">
      {flags.map((flag, idx) => (
        <div 
          key={`${flag.field}-${idx}`}
          className={`flex items-start gap-3 rounded-md border p-4 ${
            flag.severity === "critical" 
              ? "border-red-500/20 bg-red-500/10 text-red-500" 
              : "border-yellow-500/20 bg-yellow-500/10 text-yellow-500"
          }`}
        >
          {flag.severity === "critical" ? (
            <AlertCircle className="h-5 w-5 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="text-sm font-medium">Unrealistic Requirement Flag ({flag.field})</p>
            <p className="mt-1 text-sm opacity-90">{flag.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
