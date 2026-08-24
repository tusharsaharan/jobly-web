import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiCall } from "@/lib/api";
import { Trophy, Activity, Target } from "lucide-react";
import { toast } from "sonner";

export default function CodeforcesWidget({ user }: { user: any }) {
  const [handle, setHandle] = useState(user?.codeforcesHandle || "");
  const [isEditing, setIsEditing] = useState(!user?.codeforcesHandle);

  const { data: cfData, isLoading, refetch } = useQuery({
    queryKey: ["codeforces", handle],
    queryFn: () => apiCall(`/study/codeforces/${handle}`),
    enabled: !!handle && !isEditing,
  });

  const saveHandle = useMutation({
    mutationFn: (newHandle: string) => apiCall(`/users/profile`, { 
      method: "PATCH", 
      body: { codeforcesHandle: newHandle } 
    }),
    onSuccess: () => {
      toast.success("Codeforces handle linked!");
      setIsEditing(false);
      refetch();
    }
  });

  if (isEditing) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-border shadow-xs">
        <h3 className="text-sm font-bold mb-3 text-ink">
          Link Codeforces
        </h3>
        <input 
          type="text" 
          value={handle} 
          onChange={e => setHandle(e.target.value)}
          placeholder="Codeforces Handle" 
          className="w-full bg-cream/20 border border-border px-3.5 py-2.5 rounded-xl text-xs focus:border-ink focus:outline-none mb-3" 
        />
        <button 
          onClick={() => saveHandle.mutate(handle)} 
          className="w-full bg-ink text-white text-xs font-bold py-2.5 rounded-xl hover:bg-ink/90 cursor-pointer"
        >
          Link Account
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-border shadow-xs">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-bold text-ink">
          Codeforces Telemetry
        </h3>
        <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-[#2A9D7B] hover:text-[#183A32] cursor-pointer">Edit</button>
      </div>

      {isLoading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-3 py-1">
            <div className="h-3.5 bg-border/60 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3.5 bg-border/60 rounded"></div>
              <div className="h-3.5 bg-border/60 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      ) : cfData?.stats ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-3.5">
            <img src={cfData.stats.avatar} alt="CF Avatar" className="w-12 h-12 rounded-xl shadow-xs border border-border" />
            <div>
              <div className="font-bold text-base text-ink">{cfData.stats.handle}</div>
              <div className="text-xs font-semibold text-ink/50 uppercase tracking-wider">{cfData.stats.rank}</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-cream/20 rounded-xl p-3.5 border border-border text-center">
              <div className="text-xl font-black text-ink">{cfData.stats.rating || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mt-0.5">Rating</div>
            </div>
            <div className="bg-cream/20 rounded-xl p-3.5 border border-border text-center">
              <div className="text-xl font-black text-ink">{cfData.stats.maxRating || 'N/A'}</div>
              <div className="text-[10px] font-semibold text-ink/50 uppercase tracking-wider mt-0.5">Peak Rating</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-destructive text-xs font-medium">Failed to load stats. Check handle.</div>
      )}
    </div>
  );
}
