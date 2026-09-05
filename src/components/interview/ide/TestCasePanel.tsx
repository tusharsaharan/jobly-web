import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Play, Plus, Trash2, Copy, Check, X, Wand2, Beaker, ChevronDown, ChevronUp, Sparkles, AlertCircle, CheckCircle2, XCircle, Clock, FlaskConical, Search, Filter, Download, Upload, Trash, ListChecks, Maximize2
} from "lucide-react";
import { apiCall } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
}

interface TestResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  durationMs: number;
  error: string | null;
}

interface TestCasePanelProps {
  sessionId: string;
  language: string;
  getCode: () => string;
  problemTestCases?: Array<{ input: string; expectedOutput: string; isHidden?: boolean }>;
  problemExamples?: Array<{ input: string; output: string }>;
}

const MAX_CASES = 100; // VS Code-like lot limit

function genId() { return Math.random().toString(36).slice(2, 9); }

function generateBulkCases(count: number, language: string, existing: number = 0): TestCase[] {
  const cases: TestCase[] = [];
  const templates: Array<() => { input: string; expectedOutput: string; label: string }> = [
    () => ({ input: "", expectedOutput: "", label: "Empty" }),
    () => ({ input: "1\n0", expectedOutput: "0", label: "Single zero" }),
    () => ({ input: "1\n-100", expectedOutput: "-100", label: "Negative single" }),
    () => ({ input: "2\n1 1", expectedOutput: "", label: "Duplicate" }),
    () => ({ input: "3\n-1 0 1", expectedOutput: "", label: "Mixed signs" }),
    () => {
      const n = 20;
      const arr = Array.from({ length: n }, (_, i) => i + 1).join(" ");
      return { input: `${n}\n${arr}`, expectedOutput: "", label: "Large sequential" };
    },
    () => {
      const n = 50;
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 1000)).join(" ");
      return { input: `${n}\n${arr}`, expectedOutput: "", label: "Random 50" };
    },
    () => {
      const n = 5;
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 200) - 100).join(" ");
      return { input: `${n}\n${arr}`, expectedOutput: "", label: "Random signed" };
    },
    () => ({ input: `1\n${Math.floor(Math.random() * 1e9)}`, expectedOutput: "", label: "Large value" }),
    () => {
      const n = 2;
      const a = Math.floor(Math.random() * 1000);
      const b = Math.floor(Math.random() * 1000);
      return { input: `${n}\n${a} ${b}`, expectedOutput: "", label: "Pair" };
    },
  ];
  for (let i = 0; i < count; i++) {
    const tpl = templates[i % templates.length];
    const { input, expectedOutput } = tpl();
    // add variation for remaining beyond templates
    let finalInput = input;
    let finalOut = expectedOutput;
    if (i >= templates.length) {
      const n = 3 + (i % 7);
      const arr = Array.from({ length: n }, () => Math.floor(Math.random() * 500) - 250).join(" ");
      finalInput = `${n}\n${arr}`;
    }
    cases.push({ id: genId(), input: finalInput, expectedOutput: finalOut, isHidden: false });
  }
  return cases;
}

function autoGenerateCases(code: string, language: string): TestCase[] {
  return generateBulkCases(5, language);
}

export function TestCasePanel({ sessionId, language, getCode, problemTestCases, problemExamples }: TestCasePanelProps) {
  const { token } = useAuth();
  const [cases, setCases] = useState<TestCase[]>(() => {
    const initial: TestCase[] = [];
    const src = problemTestCases && problemTestCases.length ? problemTestCases : (problemExamples?.map(e => ({ input: e.input, expectedOutput: e.output })) || []);
    src.slice(0, 20).forEach(tc => initial.push({ id: genId(), input: tc.input, expectedOutput: tc.expectedOutput, isHidden: !!tc.isHidden }));
    if (initial.length === 0) {
      initial.push({ id: genId(), input: "5\n1 2 3 4 5", expectedOutput: "15", isHidden: false });
      initial.push({ id: genId(), input: "3\n10 20 30", expectedOutput: "60", isHidden: false });
    }
    return initial;
  });
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [summary, setSummary] = useState<{ passed: number, total: number, allPassed: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "passed" | "failed">("all");
  const [showGenMenu, setShowGenMenu] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  // Sync when problem changes - preserve custom cases beyond problem count? Replace first N like VS Code reset
  useEffect(() => {
    if (problemTestCases && problemTestCases.length) {
      setCases(problemTestCases.slice(0, MAX_CASES).map(tc => ({ id: genId(), input: tc.input, expectedOutput: tc.expectedOutput, isHidden: !!tc.isHidden })));
      setResults(null); setSummary(null);
      setExpanded(new Set());
    }
  }, [problemTestCases]);

  const updateCase = (id: string, patch: Partial<TestCase>) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
    setResults(null); setSummary(null);
  };
  const addCase = () => {
    if (cases.length >= MAX_CASES) return toast.error(`Max ${MAX_CASES} test cases (VS Code limit)`);
    const nc: TestCase = { id: genId(), input: "", expectedOutput: "" };
    setCases(prev => [...prev, nc]);
    setExpanded(prev => new Set([...prev, nc.id]));
  };
  const addBulk = (count: number) => {
    if (cases.length + count > MAX_CASES) return toast.error(`Max ${MAX_CASES} cases`);
    const bulk = generateBulkCases(count, language, cases.length);
    setCases(prev => [...prev, ...bulk]);
    setExpanded(prev => {
      const next = new Set(prev);
      bulk.slice(0, 3).forEach(c => next.add(c.id));
      return next;
    });
    toast.success(`Generated ${count} test cases`);
    setShowGenMenu(false);
  };
  const removeCase = (id: string) => {
    if (cases.length <= 1) return toast.error("Keep at least one test case");
    setCases(prev => prev.filter(c => c.id !== id));
  };
  const duplicateCase = (id: string) => {
    const c = cases.find(x => x.id === id);
    if (!c) return;
    if (cases.length >= MAX_CASES) return toast.error(`Max ${MAX_CASES}`);
    setCases(prev => [...prev, { ...c, id: genId() }]);
  };
  const handleAutoGen = () => {
    addBulk(5);
  };
  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const expandAll = () => setExpanded(new Set(cases.map(c => c.id)));
  const collapseAll = () => setExpanded(new Set());

  const clearAll = () => {
    if (!confirm(`Delete all ${cases.length} cases?`)) return;
    setCases([{ id: genId(), input: "", expectedOutput: "" }]);
    setResults(null); setSummary(null);
  };

  const handleExport = () => {
    const data = JSON.stringify(cases.map(c => ({ input: c.input, expectedOutput: c.expectedOutput })), null, 2);
    navigator.clipboard.writeText(data);
    toast.success("Exported JSON to clipboard");
    // also download
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `testcases-${sessionId.slice(0, 6)}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const parsed = JSON.parse(importText);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      const imported: TestCase[] = arr.slice(0, MAX_CASES - cases.length).map((tc: any) => ({
        id: genId(),
        input: String(tc.input ?? ""),
        expectedOutput: String(tc.expectedOutput ?? tc.output ?? ""),
        isHidden: !!tc.isHidden,
      }));
      if (imported.length === 0) throw new Error("No valid cases");
      setCases(prev => [...prev, ...imported].slice(0, MAX_CASES));
      toast.success(`Imported ${imported.length} cases`);
      setShowImport(false);
      setImportText("");
    } catch (e: any) {
      toast.error(e.message || "Import failed: invalid JSON");
    }
  };

  const runAll = useCallback(async () => {
    const code = getCode();
    if (!code.trim()) return toast.error("No code to test");
    if (cases.length === 0) return toast.error("No test cases");
    const payload = cases.map(c => ({ input: c.input, expectedOutput: c.expectedOutput, isHidden: !!c.isHidden }));
    setRunning(true);
    setResults(null);
    try {
      const res = await apiCall<{ results: TestResult[]; passedCount: number; totalCount: number; allPassed: boolean }>(
        `/interviews/${sessionId}/run-tests`, "POST", { language, code, testCases: payload }, token
      );
      setResults(res.results);
      setSummary({ passed: res.passedCount, total: res.totalCount, allPassed: res.allPassed });
      const failedIds = new Set(res.results.filter(r => !r.passed).map((_, i) => cases[i]?.id).filter(Boolean) as string[]);
      if (failedIds.size) setExpanded(failedIds);
      else setExpanded(new Set(cases.slice(0, 2).map(c => c.id)));
      if (res.allPassed) toast.success(`All ${res.totalCount} tests passed! ✓`);
      else toast.error(`${res.passedCount}/${res.totalCount} passed`);
    } catch (e: any) {
      toast.error(e.message || "Test run failed");
    } finally { setRunning(false); }
  }, [cases, getCode, language, sessionId, token]);

  const filteredIndices = useMemo(() => {
    return cases.map((tc, idx) => ({ tc, idx })).filter(({ tc, idx }) => {
      if (search) {
        const q = search.toLowerCase();
        if (!tc.input.toLowerCase().includes(q) && !tc.expectedOutput.toLowerCase().includes(q)) return false;
      }
      if (filter !== "all" && results) {
        const r = results[idx];
        if (!r) return false;
        if (filter === "passed" && !r.passed) return false;
        if (filter === "failed" && r.passed) return false;
      }
      return true;
    });
  }, [cases, search, filter, results]);

  const passedCount = summary?.passed ?? results?.filter(r => r.passed).length ?? 0;
  const totalCount = summary?.total ?? results?.length ?? cases.length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#1e1e1e] text-white font-mono text-xs overflow-hidden">
      {/* VS Code Panel Toolbar - sticky top */}
      <div className="flex flex-col gap-1.5 border-b border-[#2d2d2d] bg-[#181818] px-2 py-1.5 flex-shrink-0 select-none">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#cccccc]">
              <FlaskConical className="h-3.5 w-3.5 text-[#7EE0C5]" /> Test Explorer
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono bg-[#252526] px-1.5 py-0.5 rounded text-[#cccccc] border border-[#2d2d2d]">
              {cases.length}/{MAX_CASES}
            </span>
            {results && (
              <span className={`hidden sm:inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold border ${summary?.allPassed ? "bg-[#89d185]/15 text-[#89d185] border-[#89d185]/20" : "bg-[#f85149]/15 text-[#f85149] border-[#f85149]/20"}`}>
                {passedCount}/{totalCount} {summary?.allPassed ? "✓" : "✗"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={expandAll} title="Expand All" className="p-1 hover:bg-[#2a2d2e] rounded text-[#858585] hover:text-white"><ChevronDown className="h-3.5 w-3.5" /></button>
            <button onClick={collapseAll} title="Collapse All" className="p-1 hover:bg-[#2a2d2e] rounded text-[#858585] hover:text-white"><ChevronUp className="h-3.5 w-3.5" /></button>
            <div className="h-4 w-px bg-[#2d2d2d] mx-0.5" />
            <button onClick={handleExport} title="Export JSON" className="p-1 hover:bg-[#2a2d2e] rounded text-[#858585] hover:text-white"><Download className="h-3.5 w-3.5" /></button>
            <button onClick={() => setShowImport(v => !v)} title="Import JSON" className={`p-1 rounded ${showImport ? "bg-[#37373d] text-white" : "hover:bg-[#2a2d2e] text-[#858585] hover:text-white"}`}><Upload className="h-3.5 w-3.5" /></button>
            <button onClick={clearAll} title="Clear All" className="p-1 hover:bg-[#5a1d1d] rounded text-[#858585] hover:text-[#f85149]"><Trash className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            <button onClick={addCase} className="flex items-center gap-1 rounded-sm bg-[#0e639c] hover:bg-[#1177bb] px-2.5 py-1 text-[11px] font-medium text-white transition">
              <Plus className="h-3 w-3" /> Add Case
            </button>

            <div className="relative">
              <button onClick={() => setShowGenMenu(!showGenMenu)} title="Auto-generate edge cases (lot)" className="flex items-center gap-1 rounded-sm bg-[#323233] hover:bg-[#3c3c3c] border border-[#3c3c3c] px-2 py-1 text-[11px] text-[#cccccc] transition">
                <Wand2 className="h-3 w-3 text-[#7EE0C5]" /> Generate <ChevronDown className={`h-3 w-3 transition ${showGenMenu ? "rotate-180" : ""}`} />
              </button>
              {showGenMenu && (
                <div className="absolute left-0 top-full mt-1 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-2xl py-1 min-w-[200px] z-50">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#858585] border-b border-[#3c3c3c] mb-1">Bulk Generate (Lot)</div>
                  {[5, 10, 25, 50].map(n => (
                    <button key={n} onClick={() => addBulk(n)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-[#2a2d2e] text-[#cccccc] flex items-center justify-between">
                      <span className="flex items-center gap-2"><Beaker className="w-3 h-3 text-[#7EE0C5]" /> Generate {n} edge cases</span>
                      <span className="text-[10px] font-mono bg-[#37373d] px-1 rounded text-[#858585]">+{n}</span>
                    </button>
                  ))}
                  <div className="border-t border-[#3c3c3c] mt-1 pt-1 px-2 space-y-1">
                    <button onClick={() => addBulk(Math.min(20, MAX_CASES - cases.length))} className="w-full px-2 py-1.5 text-xs bg-[#0e639c] hover:bg-[#1177bb] text-white rounded-sm text-center font-medium">+ 20 Random Stress</button>
                    <p className="text-[10px] text-[#858585] text-center">VS Code limit: {MAX_CASES} cases</p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={runAll} disabled={running} className="flex items-center gap-1.5 rounded-sm bg-[#89d185] hover:bg-[#73c991] px-3 py-1 text-[11px] font-bold text-black disabled:opacity-50 transition shadow-sm">
              {running ? <Clock className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
              <span>{running ? "Running…" : `Run All (${filteredIndices.length})`}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <div className="relative hidden sm:flex items-center">
              <Search className="w-3 h-3 absolute left-2 text-[#858585]" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter cases…"
                className="pl-7 pr-2 py-1 bg-[#3c3c3c] border border-[#3c3c3c] rounded-sm text-[11px] text-white placeholder:text-[#858585] focus:border-[#007acc] focus:outline-none w-[130px]"
              />
              {search && <button onClick={() => setSearch("")} className="absolute right-1 p-0.5 hover:bg-[#252526] rounded"><X className="w-3 h-3 text-[#858585]" /></button>}
            </div>
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="hidden sm:block bg-[#3c3c3c] border border-[#3c3c3c] text-[#cccccc] text-[11px] rounded-sm px-1.5 py-1 focus:border-[#007acc] focus:outline-none">
              <option value="all">All</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
            <span className="hidden lg:inline text-[10px] font-mono text-[#858585]">{filteredIndices.length} visible • Scroll up/down</span>
          </div>
        </div>

        {showImport && (
          <div className="rounded border border-[#007acc] bg-[#252526] p-2 space-y-1.5 animate-in">
            <div className="text-[11px] font-bold text-[#cccccc] flex items-center gap-1"><Upload className="w-3 h-3" /> Import JSON</div>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder='Paste JSON: [{"input":"5\\n1 2 3","expectedOutput":"6"}]'
              className="w-full min-h-[60px] rounded border border-[#3c3c3c] bg-[#1e1e1e] p-2 text-[11px] font-mono text-[#cccccc] placeholder:text-[#5a5a5a] focus:border-[#007acc] focus:outline-none"
              rows={3}
            />
            <div className="flex gap-1">
              <button onClick={handleImport} className="px-2.5 py-1 bg-[#0e639c] text-white text-xs rounded-sm">Import</button>
              <button onClick={() => setShowImport(false)} className="px-2.5 py-1 bg-[#37373d] text-[#cccccc] text-xs rounded-sm">Cancel</button>
              <span className="ml-auto text-[10px] text-[#858585] self-center">Max {MAX_CASES - cases.length} more</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content - VS Code / VS Online style: fills remaining, overflow-y-auto, handles lot (100) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-2 space-y-1.5 bg-[#1e1e1e] scrollbar-thin scrollbar-thumb-[#424242] scrollbar-track-transparent">
        {filteredIndices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-[#252526] border border-[#2d2d2d] flex items-center justify-center mb-2">
              <Beaker className="h-5 w-5 text-[#424242]" />
            </div>
            <p className="text-xs font-medium text-[#858585]">{search || filter !== "all" ? "No cases match filter" : "No test cases"}</p>
            <p className="text-[11px] text-[#5a5a5a] mt-1 max-w-[260px]">{search ? `Search: "${search}"` : "Add cases or generate edge cases (lot)"} • Scrollable panel ready for 100 cases</p>
            {!search && filter === "all" && (
              <div className="flex gap-1.5 mt-3">
                <button onClick={addCase} className="px-2.5 py-1 bg-[#0e639c] text-white text-xs rounded-sm">Add Case</button>
                <button onClick={() => addBulk(10)} className="px-2.5 py-1 bg-[#323233] border border-[#3c3c3c] text-[#cccccc] text-xs rounded-sm">Generate 10</button>
              </div>
            )}
          </div>
        ) : (
          filteredIndices.map(({ tc, idx: originalIdx }) => {
            const res = results?.[originalIdx];
            const isExpanded = expanded.has(tc.id);
            const status = !results ? "idle" as const : res?.passed ? "pass" as const : "fail" as const;
            return (
              <div key={tc.id} className={`rounded-sm border overflow-hidden transition ${status === "pass" ? "border-[#89d185]/30 bg-[#89d185]/[0.07]" : status === "fail" ? "border-[#f85149]/30 bg-[#f85149]/[0.07]" : "border-[#2d2d2d] bg-[#252526]"}`}>
                {/* Card header - VS Code tree row */}
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#252526]/70 hover:bg-[#2a2d2e] cursor-pointer select-none" onClick={() => toggleExpand(tc.id)}>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-sm text-[10px] font-bold font-mono flex-shrink-0 ${status === "pass" ? "bg-[#89d185] text-black" : status === "fail" ? "bg-[#f85149] text-white" : "bg-[#3c3c3c] text-[#cccccc]"}`}>
                      {originalIdx + 1}
                    </span>
                    <span className="text-[12px] font-medium text-[#cccccc] truncate">Case {originalIdx + 1} {tc.isHidden && <span className="ml-1 rounded-sm bg-[#37373d] border border-[#3c3c3c] px-1 py-0.5 text-[9px] text-[#858585]">Hidden</span>}</span>
                    {status !== "idle" && (
                      <span className={`hidden sm:flex items-center gap-1 text-[11px] font-medium ${status === "pass" ? "text-[#89d185]" : "text-[#f85149]"}`}>
                        {status === "pass" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {status === "pass" ? "Passed" : "Failed"}
                        {res && <span className="font-mono font-normal text-[#858585] text-[10px]">· {res.durationMs}ms</span>}
                      </span>
                    )}
                    <span className="hidden lg:inline text-[10px] font-mono text-[#5a5a5a] truncate max-w-[160px]">in: {(tc.input.slice(0, 24) || "∅").replace(/\n/g, "↵")}</span>
                  </div>
                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); duplicateCase(tc.id); }} title="Duplicate" className="rounded-sm p-1 text-[#858585] hover:bg-[#37373d] hover:text-white"><Copy className="h-3 w-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeCase(tc.id); }} title="Delete" className="rounded-sm p-1 text-[#858585] hover:bg-[#5a1d1d] hover:text-[#f85149]"><Trash2 className="h-3 w-3" /></button>
                    <span className="p-1 text-[#858585]">{isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</span>
                  </div>
                </div>

                {/* Collapsed preview */}
                {!isExpanded && (
                  <div className="px-3 pb-1.5 flex items-center gap-2 text-[11px] font-mono text-[#858585] truncate">
                    <span className="truncate">in: <span className="text-[#cccccc]">{tc.input.slice(0, 36) || "∅"}{tc.input.length > 36 ? "…" : ""}</span></span>
                    <span className="text-[#424242]">→</span>
                    <span className="truncate">out: <span className="text-[#cccccc]">{tc.expectedOutput.slice(0, 18) || "∅"}</span></span>
                  </div>
                )}

                {/* Expanded editor - scrollableEditors inside, like VS Code split */}
                {isExpanded && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2.5 bg-[#1e1e1e] border-t border-[#2d2d2d]">
                    <div className="flex flex-col gap-1 min-w-0">
                      <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#858585]">
                        <span>Input (stdin)</span>
                        <span className="font-mono font-normal text-[#5a5a5a]">{tc.input.length} chars</span>
                      </label>
                      <textarea
                        value={tc.input}
                        onChange={e => updateCase(tc.id, { input: e.target.value })}
                        placeholder={"e.g.\n5\n1 2 3 4 5"}
                        className="min-h-[68px] w-full resize-y rounded-sm border border-[#3c3c3c] bg-[#252526] p-2 text-[12px] leading-relaxed font-mono text-[#cccccc] placeholder:text-[#5a5a5a] outline-none focus:border-[#007acc] scrollbar-thin"
                        spellCheck={false}
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-col gap-1 min-w-0">
                      <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#858585]">
                        <span>Expected Output</span>
                        <span className="font-mono font-normal text-[#5a5a5a]">{tc.expectedOutput.length} chars</span>
                      </label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={e => updateCase(tc.id, { expectedOutput: e.target.value })}
                        placeholder={"e.g.\n15"}
                        className="min-h-[68px] w-full resize-y rounded-sm border border-[#3c3c3c] bg-[#252526] p-2 text-[12px] leading-relaxed font-mono text-[#cccccc] placeholder:text-[#5a5a5a] outline-none focus:border-[#007acc] scrollbar-thin"
                        spellCheck={false}
                        rows={3}
                      />
                    </div>
                    {res && !res.passed && (
                      <div className="lg:col-span-2 rounded-sm border border-[#f85149]/30 bg-[#f85149]/10 p-2 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#f85149]">
                          <AlertCircle className="h-3 w-3" /> Mismatch — Case {originalIdx + 1}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-[#858585] mb-1">Expected</div>
                            <pre className="whitespace-pre-wrap break-all rounded-sm bg-[#252526] border border-[#2d2d2d] p-2 text-[#7EE0C5] max-h-28 overflow-auto scrollbar-thin">{res.expectedOutput || "(empty)"}</pre>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-[#858585] mb-1">Actual</div>
                            <pre className="whitespace-pre-wrap break-all rounded-sm bg-[#252526] border border-[#2d2d2d] p-2 text-[#f85149] max-h-28 overflow-auto scrollbar-thin">{res.actualOutput || "(empty)"} {res.error && `\n[stderr] ${String(res.error).slice(0, 400)}`}</pre>
                          </div>
                        </div>
                        {res.error && <div className="text-[10px] font-mono text-[#858585]">stderr: {String(res.error).slice(0, 200)}</div>}
                      </div>
                    )}
                    {res && res.passed && (
                      <div className="lg:col-span-2 flex items-center gap-1.5 rounded-sm bg-[#89d185]/10 border border-[#89d185]/20 px-2 py-1.5 text-[11px] text-[#89d185]">
                        <CheckCircle2 className="h-3 w-3" /> Output matched expected ✓
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer summary - sticky bottom like VS Code Panel footer, scrollable context aware */}
      {filteredIndices.length > 0 && (
        <div className={`flex-shrink-0 sticky bottom-0 flex items-center justify-between px-3 py-2 text-xs font-medium border-t backdrop-blur ${summary?.allPassed ? "bg-[#89d185]/10 border-[#89d185]/20 text-[#89d185]" : summary ? "bg-[#f85149]/10 border-[#f85149]/20 text-[#f85149]" : "bg-[#252526] border-[#2d2d2d] text-[#cccccc]"}`}>
          <span className="flex items-center gap-2">
            {summary?.allPassed ? <CheckCircle2 className="h-4 w-4" /> : summary ? <Beaker className="h-4 w-4" /> : <ListChecks className="h-4 w-4 text-[#858585]" />}
            <span className="font-mono text-[11px]">{summary ? (summary.allPassed ? `All ${summary.total} tests passed ✓` : `${summary.passed}/${summary.total} passed`) : `${filteredIndices.length} of ${cases.length} shown • Ready to run`}</span>
          </span>
          <span className="hidden sm:flex items-center gap-2 text-[10px] font-mono font-normal opacity-70">
            {results && <span>{results.reduce((a, r) => a + r.durationMs, 0)}ms total</span>}
            <span className="bg-[#37373d] text-[#cccccc] px-1.5 py-0.5 rounded">Scrollable: Lot ready • {cases.length} cases</span>
          </span>
        </div>
      )}
    </div>
  );
}
