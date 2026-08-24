import React, { useState, useEffect } from "react";
import { getInterviewSocket as getSocket } from "@/lib/socket";
import { Editor } from "@monaco-editor/react";
import { Play, Trophy, Code2 } from "lucide-react";
import { toast } from "sonner";

export default function CPArena({ lobbyState, user, setLobbyState }: any) {
  const [code, setCode] = useState(lobbyState.cpData?.initialCode || "");
  const [isEvaluating, setIsEvaluating] = useState(false);
  
  const problem = lobbyState.cpData;

  useEffect(() => {
    const socket = getSocket();
    
    socket.on("cp_score_update", (data: any) => {
      setLobbyState((prev: any) => {
        const newPlayers = prev.players.map((p: any) => {
          if (p.userId === data.userId) {
            return { ...p, testCasesPassed: data.testCasesPassed };
          }
          return p;
        });
        
        // Sort by passed test cases
        newPlayers.sort((a: any, b: any) => (b.testCasesPassed || 0) - (a.testCasesPassed || 0));
        
        // If someone passed ALL testcases, the game ends
        const maxPassed = newPlayers[0]?.testCasesPassed || 0;
        if (maxPassed === problem.testCases.length && prev.status !== "LEADERBOARD") {
          toast.success(`${newPlayers[0].name} solved the problem!`);
          return { ...prev, players: newPlayers, status: "LEADERBOARD" };
        }
        
        return { ...prev, players: newPlayers };
      });
    });

    return () => socket.off("cp_score_update");
  }, [problem]);

  const handleRunCode = async () => {
    setIsEvaluating(true);
    
    // NOTE: In a real system we would send the code to `terminal-runner` or Judge0 backend.
    // For this prototype, we will simulate a client-side evaluation (unsafe, but good for UI demo).
    let passed = 0;
    try {
      // eslint-disable-next-line no-new-func
      const userFunc = new Function(`
        ${code}
        return solve;
      `)();

      for (const tc of problem.testCases) {
        // Evaluate input arguments safely for demo
        const inputArgs = JSON.parse(`[${tc.input}]`); 
        const result = userFunc(...inputArgs);
        
        // Evaluate expected output safely
        const expected = JSON.parse(tc.expectedOutput);
        
        // Deep equal check (simple version)
        if (JSON.stringify(result) === JSON.stringify(expected)) {
          passed++;
        }
      }
      
      toast(`Passed ${passed}/${problem.testCases.length} test cases!`);
    } catch (err: any) {
      toast.error(`Execution Error: ${err.message}`);
    } finally {
      setIsEvaluating(false);
      getSocket().emit("submit_cp_testcase", { pin: lobbyState.pin, testCasesPassed: passed });
    }
  };

  if (lobbyState.status === "LEADERBOARD") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-white relative">
        <Trophy className="w-24 h-24 text-mint mb-8" />
        <h1 className="text-6xl font-black mb-12 text-mint">Match Concluded</h1>
        <div className="w-full max-w-lg bg-white/10 rounded-3xl p-8 border border-white/20">
          {lobbyState.players.map((p: any, idx: number) => (
            <div key={p.userId} className="flex items-center justify-between py-4 border-b border-white/10 last:border-0">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-white/50 w-8">{idx + 1}.</span>
                <span className="text-xl font-bold">{p.name}</span>
              </div>
              <div className="text-mint font-bold">
                {p.testCasesPassed || 0} / {problem?.testCases?.length || 0} Passed
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!problem) return <div className="text-white p-8">No problem generated.</div>;

  return (
    <div className="flex-1 flex text-white relative">
      {/* Left Panel: Problem & Scoreboard */}
      <div className="w-1/3 flex flex-col border-r border-white/10 bg-black/20">
        
        {/* Live Scoreboard */}
        <div className="p-6 border-b border-white/10 bg-mint/5">
          <h3 className="font-bold text-mint mb-4 uppercase tracking-widest text-xs flex items-center">
            <Trophy className="w-4 h-4 mr-2" /> Live Leaderboard
          </h3>
          <div className="space-y-3">
            {lobbyState.players.map((p: any, idx: number) => (
              <div key={p.userId} className="flex justify-between items-center text-sm">
                <div className="flex items-center">
                  <span className="opacity-50 mr-2 w-4">{idx + 1}.</span>
                  <span className={p.userId === user._id ? "font-bold text-white" : "opacity-80"}>
                    {p.name}
                  </span>
                </div>
                <div className="flex space-x-1">
                  {problem.testCases.map((_: any, i: number) => (
                    <div 
                      key={i} 
                      className={`w-3 h-3 rounded-full ${i < (p.testCasesPassed || 0) ? "bg-mint" : "bg-white/20"}`} 
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Problem Description */}
        <div className="p-6 flex-1 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">{lobbyState.topic}</h2>
          <div className="prose prose-invert prose-mint max-w-none text-sm">
            {/* Simple markdown render for demo */}
            <p className="whitespace-pre-wrap">{problem.problemStatement}</p>
          </div>
          
          <div className="mt-8 space-y-4">
            <h3 className="font-bold text-white/50 text-xs uppercase tracking-widest">Test Cases Preview</h3>
            {problem.testCases.slice(0, 2).map((tc: any, i: number) => (
              <div key={i} className="bg-white/5 p-3 rounded-lg font-mono text-xs border border-white/10">
                <div className="text-white/40 mb-1">Input:</div>
                <div className="mb-2">{tc.input}</div>
                <div className="text-white/40 mb-1">Expected Output:</div>
                <div className="text-mint">{tc.expectedOutput}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Code Editor */}
      <div className="flex-1 flex flex-col bg-[#1e1e1e]">
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#252526]">
          <div className="flex items-center text-white/50 text-sm font-mono">
            <Code2 className="w-4 h-4 mr-2" /> solve.js
          </div>
          <button 
            onClick={handleRunCode}
            disabled={isEvaluating}
            className="px-4 py-1.5 bg-mint text-ink font-bold text-sm rounded flex items-center hover:bg-mint/90 disabled:opacity-50"
          >
            {isEvaluating ? "Evaluating..." : <><Play className="w-4 h-4 mr-1 fill-current" /> Run Code</>}
          </button>
        </div>
        <div className="flex-1">
          <Editor
            height="100%"
            language="javascript"
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || "")}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "JetBrains Mono",
              padding: { top: 16 }
            }}
          />
        </div>
      </div>
    </div>
  );
}
