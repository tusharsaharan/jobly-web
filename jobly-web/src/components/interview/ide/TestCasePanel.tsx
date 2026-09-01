import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Play, Plus, Trash2, Copy, X, Wand2, Beaker, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, XCircle, Clock, FlaskConical, Search, Download, Upload, Trash, ListChecks,
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

const SW = 1.75;
const MAX_CASES = 100;

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

export function TestCasePanel({ sessionId, language, getCode, problemTestCases, problemExamples }: TestCasePanelProps) {
  const { token } = useAuth();
  const [cases, setCases] = useState<TestCase[]>(() => {
    const initial: TestCase[] = [];
    const src = problemTestCases && problemTestCases.length
      ? problemTestCases
      : (problemExamples?.map((e) => ({ input: e.input, expectedOutput: e.output, isHidden: false })) || []);
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

  // Sync when problem changes - replace first N like a reset
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
    if (cases.length >= MAX_CASES) return toast.error(`Max ${MAX_CASES} test cases`);
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
      if (res.allPassed) toast.success(`All ${res.totalCount} tests passed!`);
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-iv-surface-alt text-iv-text">
      {/* Panel Toolbar — sticky top */}
      <div className="iv-header-panel h-auto shrink-0 flex-col gap-1.5 py-1.5">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-iv-muted">
              <FlaskConical strokeWidth={SW} className="h-4 w-4 text-iv-accent-glow" /> Test Explorer
            </span>
            <span className="iv-badge iv-badge-neutral hidden font-num sm:inline-flex">
              {cases.length}/{MAX_CASES}
            </span>
            {results && (
              <span className={`iv-badge hidden sm:inline-flex ${summary?.allPassed ? "iv-badge-success" : "iv-badge-danger"}`}>
                {passedCount}/{totalCount} {summary?.allPassed ? "✓" : "✗"}
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button onClick={expandAll} title="Expand All" className="iv-icon-btn iv-icon-btn-sm"><ChevronDown strokeWidth={SW} className="h-4 w-4" /></button>
            <button onClick={collapseAll} title="Collapse All" className="iv-icon-btn iv-icon-btn-sm"><ChevronUp strokeWidth={SW} className="h-4 w-4" /></button>
            <div className="mx-0.5 h-4 w-px bg-iv-line" />
            <button onClick={handleExport} title="Export JSON" className="iv-icon-btn iv-icon-btn-sm"><Download strokeWidth={SW} className="h-4 w-4" /></button>
            <button onClick={() => setShowImport(v => !v)} title="Import JSON" className={`iv-icon-btn iv-icon-btn-sm ${showImport ? "bg-white/10 text-iv-text" : ""}`}><Upload strokeWidth={SW} className="h-4 w-4" /></button>
            <button onClick={clearAll} title="Clear All" className="iv-icon-btn iv-icon-btn-sm hover:!text-iv-danger"><Trash strokeWidth={SW} className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1">
            <button onClick={addCase} className="iv-btn iv-btn-ghost iv-btn-sm">
              <Plus strokeWidth={SW} className="h-3 w-3" /> Add Case
            </button>

            <div className="relative">
              <button onClick={() => setShowGenMenu(!showGenMenu)} title="Auto-generate edge cases" className="iv-btn iv-btn-ghost iv-btn-sm">
                <Wand2 strokeWidth={SW} className="h-3 w-3 text-iv-accent-glow" /> Generate
                <ChevronDown strokeWidth={SW} className={`h-3 w-3 transition ${showGenMenu ? "rotate-180" : ""}`} />
              </button>
              {showGenMenu && (
                <div className="iv-card absolute left-0 top-full z-50 mt-1 min-w-[200px] bg-iv-elevated py-1 shadow-lift">
                  <div className="mb-1 border-b border-iv-line px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-iv-dim">Bulk Generate</div>
                  {[5, 10, 25, 50].map(n => (
                    <button key={n} onClick={() => addBulk(n)} className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-iv-muted transition hover:bg-white/5 hover:text-iv-text">
                      <span className="flex items-center gap-2"><Beaker strokeWidth={SW} className="h-3 w-3 text-iv-accent-glow" /> Generate {n} edge cases</span>
                      <span className="iv-badge iv-badge-neutral font-num">+{n}</span>
                    </button>
                  ))}
                  <div className="mt-1 space-y-1 border-t border-iv-line px-2 pt-1">
                    <button onClick={() => addBulk(Math.min(20, MAX_CASES - cases.length))} className="iv-btn iv-btn-primary iv-btn-sm w-full">+ 20 Random Stress</button>
                    <p className="text-center text-[10px] text-iv-dim">Limit: {MAX_CASES} cases</p>
                  </div>
                </div>
              )}
            </div>

            <button onClick={runAll} disabled={running} className="iv-btn iv-btn-primary iv-btn-sm">
              {running ? <Clock strokeWidth={SW} className="h-3 w-3 animate-spin" /> : <Play strokeWidth={SW} className="h-3 w-3 fill-current" />}
              <span>{running ? "Running…" : `Run All (${filteredIndices.length})`}</span>
            </button>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="relative hidden items-center sm:flex">
              <Search strokeWidth={SW} className="pointer-events-none absolute left-2 h-3 w-3 text-iv-dim" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Filter cases…"
                className="h-7 w-[130px] rounded-md border border-iv-line bg-iv-bg pl-7 pr-2 text-[11px] text-iv-text outline-none transition placeholder:text-iv-dim focus:border-iv-accent"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-1 p-0.5 text-iv-dim transition hover:text-iv-text">
                  <X strokeWidth={SW} className="h-3 w-3" />
                </button>
              )}
            </div>
            <select
              value={filter}
              onChange={e => setFilter(e.target.value as any)}
              className="iv-select hidden h-7 w-auto px-1.5 text-[11px] sm:block"
            >
              <option value="all">All</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
            <span className="hidden text-[10px] font-num text-iv-dim lg:inline">{filteredIndices.length} visible</span>
          </div>
        </div>

        {showImport && (
          <div className="iv-card w-full space-y-1.5 border-iv-accent bg-iv-elevated p-2">
            <div className="flex items-center gap-1 text-[11px] font-bold text-iv-muted"><Upload strokeWidth={SW} className="h-3 w-3" /> Import JSON</div>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder='Paste JSON: [{"input":"5\\n1 2 3","expectedOutput":"6"}]'
              className="iv-scroll min-h-[60px] w-full resize-y rounded-md border border-iv-line bg-iv-bg p-2 font-iv-code text-[11px] text-iv-text outline-none placeholder:text-iv-dim focus:border-iv-accent"
              rows={3}
            />
            <div className="flex gap-1">
              <button onClick={handleImport} className="iv-btn iv-btn-primary iv-btn-sm">Import</button>
              <button onClick={() => setShowImport(false)} className="iv-btn iv-btn-ghost iv-btn-sm">Cancel</button>
              <span className="ml-auto self-center text-[10px] text-iv-dim">Max {MAX_CASES - cases.length} more</span>
            </div>
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="iv-scroll min-h-0 flex-1 space-y-1.5 overflow-x-hidden overflow-y-auto bg-iv-surface-alt p-2">
        {filteredIndices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-iv-line bg-iv-elevated">
              <Beaker strokeWidth={SW} className="h-5 w-5 text-iv-dim" />
            </div>
            <p className="text-xs font-medium text-iv-dim">{search || filter !== "all" ? "No cases match filter" : "No test cases"}</p>
            <p className="mt-1 max-w-[260px] text-[11px] text-iv-dim">{search ? `Search: "${search}"` : "Add cases or generate edge cases"}</p>
            {!search && filter === "all" && (
              <div className="mt-3 flex gap-1.5">
                <button onClick={addCase} className="iv-btn iv-btn-primary iv-btn-sm">Add Case</button>
                <button onClick={() => addBulk(10)} className="iv-btn iv-btn-ghost iv-btn-sm">Generate 10</button>
              </div>
            )}
          </div>
        ) : (
          filteredIndices.map(({ tc, idx: originalIdx }) => {
            const res = results?.[originalIdx];
            const isExpanded = expanded.has(tc.id);
            const status = !results ? "idle" as const : res?.passed ? "pass" as const : "fail" as const;
            return (
              <div key={tc.id} className={`overflow-hidden rounded-lg border transition ${
                status === "pass" ? "border-iv-success/30 bg-iv-success-surface"
                : status === "fail" ? "border-iv-danger/30 bg-iv-danger-surface"
                : "border-iv-line bg-iv-elevated"}`}>
                {/* Card header */}
                <div className="flex cursor-pointer select-none items-center justify-between bg-white/[0.02] px-2.5 py-1.5 transition hover:bg-white/5" onClick={() => toggleExpand(tc.id)}>
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-num text-[10px] font-bold ${
                      status === "pass" ? "bg-iv-success text-black"
                      : status === "fail" ? "bg-iv-danger-strong text-white"
                      : "bg-white/10 text-iv-muted"}`}>
                      {originalIdx + 1}
                    </span>
                    <span className="truncate text-xs font-medium text-iv-muted">
                      Case {originalIdx + 1} {tc.isHidden && <span className="iv-badge iv-badge-neutral ml-1">Hidden</span>}
                    </span>
                    {status !== "idle" && (
                      <span className={`hidden items-center gap-1 text-[11px] font-medium sm:flex ${status === "pass" ? "text-iv-success" : "text-iv-danger"}`}>
                        {status === "pass" ? <CheckCircle2 strokeWidth={SW} className="h-3 w-3" /> : <XCircle strokeWidth={SW} className="h-3 w-3" />}
                        {status === "pass" ? "Passed" : "Failed"}
                        {res && <span className="font-num text-[10px] font-normal text-iv-dim">· {res.durationMs}ms</span>}
                      </span>
                    )}
                    <span className="hidden max-w-[160px] truncate font-num text-[10px] text-iv-dim lg:inline">in: {(tc.input.slice(0, 24) || "∅").replace(/\n/g, "↵")}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button onClick={(e) => { e.stopPropagation(); duplicateCase(tc.id); }} title="Duplicate" className="iv-icon-btn iv-icon-btn-sm"><Copy strokeWidth={SW} className="h-3 w-3" /></button>
                    <button onClick={(e) => { e.stopPropagation(); removeCase(tc.id); }} title="Delete" className="iv-icon-btn iv-icon-btn-sm hover:!text-iv-danger"><Trash2 strokeWidth={SW} className="h-3 w-3" /></button>
                    <span className="p-1 text-iv-dim">{isExpanded ? <ChevronUp strokeWidth={SW} className="h-3 w-3" /> : <ChevronDown strokeWidth={SW} className="h-3 w-3" />}</span>
                  </div>
                </div>

                {/* Collapsed preview */}
                {!isExpanded && (
                  <div className="flex items-center gap-2 truncate px-3 pb-1.5 font-iv-code text-[11px] text-iv-dim">
                    <span className="truncate">in: <span className="text-iv-muted">{tc.input.slice(0, 36) || "∅"}{tc.input.length > 36 ? "…" : ""}</span></span>
                    <span className="text-iv-dim">→</span>
                    <span className="truncate">out: <span className="text-iv-muted">{tc.expectedOutput.slice(0, 18) || "∅"}</span></span>
                  </div>
                )}

                {/* Expanded editor */}
                {isExpanded && (
                  <div className="grid grid-cols-1 gap-2 border-t border-iv-line bg-iv-bg p-2.5 lg:grid-cols-2">
                    <div className="flex min-w-0 flex-col gap-1">
                      <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-iv-dim">
                        <span>Input (stdin)</span>
                        <span className="font-num font-normal text-iv-dim">{tc.input.length} chars</span>
                      </label>
                      <textarea
                        value={tc.input}
                        onChange={e => updateCase(tc.id, { input: e.target.value })}
                        placeholder={"e.g.\n5\n1 2 3 4 5"}
                        className="iv-scroll min-h-[68px] w-full resize-y rounded-md border border-iv-line bg-iv-elevated p-2 font-iv-code text-xs leading-relaxed text-iv-text outline-none placeholder:text-iv-dim focus:border-iv-accent"
                        spellCheck={false}
                        rows={3}
                      />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <label className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-iv-dim">
                        <span>Expected Output</span>
                        <span className="font-num font-normal text-iv-dim">{tc.expectedOutput.length} chars</span>
                      </label>
                      <textarea
                        value={tc.expectedOutput}
                        onChange={e => updateCase(tc.id, { expectedOutput: e.target.value })}
                        placeholder={"e.g.\n15"}
                        className="iv-scroll min-h-[68px] w-full resize-y rounded-md border border-iv-line bg-iv-elevated p-2 font-iv-code text-xs leading-relaxed text-iv-text outline-none placeholder:text-iv-dim focus:border-iv-accent"
                        spellCheck={false}
                        rows={3}
                      />
                    </div>
                    {res && !res.passed && (
                      <div className="iv-card space-y-1.5 border-iv-danger/30 bg-iv-danger-surface lg:col-span-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-iv-danger">
                          <AlertCircle strokeWidth={SW} className="h-3 w-3" /> Mismatch — Case {originalIdx + 1}
                        </div>
                        <div className="grid grid-cols-1 gap-2 font-iv-code text-[11px] sm:grid-cols-2">
                          <div>
                            <div className="mb-1 text-[10px] uppercase tracking-wider text-iv-dim">Expected</div>
                            <pre className="iv-scroll max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-md border border-iv-line bg-iv-surface p-2 text-iv-accent-glow">{res.expectedOutput || "(empty)"}</pre>
                          </div>
                          <div>
                            <div className="mb-1 text-[10px] uppercase tracking-wider text-iv-dim">Actual</div>
                            <pre className="iv-scroll max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-md border border-iv-line bg-iv-surface p-2 text-iv-danger">{res.actualOutput || "(empty)"} {res.error && `\n[stderr] ${String(res.error).slice(0, 400)}`}</pre>
                          </div>
                        </div>
                        {res.error && <div className="font-iv-code text-[10px] text-iv-dim">stderr: {String(res.error).slice(0, 200)}</div>}
                      </div>
                    )}
                    {res && res.passed && (
                      <div className="flex items-center gap-1.5 rounded-md border border-iv-success/20 bg-iv-success-surface px-2 py-1.5 text-[11px] text-iv-success lg:col-span-2">
                        <CheckCircle2 strokeWidth={SW} className="h-3 w-3" /> Output matched expected ✓
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer summary — sticky bottom */}
      {filteredIndices.length > 0 && (
        <div className={`flex shrink-0 items-center justify-between border-t px-3 py-2 text-xs font-medium backdrop-blur ${
          summary?.allPassed ? "border-iv-success/20 bg-iv-success-surface text-iv-success"
          : summary ? "border-iv-danger/20 bg-iv-danger-surface text-iv-danger"
          : "border-iv-line bg-iv-elevated text-iv-muted"}`}>
          <span className="flex items-center gap-2">
            {summary?.allPassed ? <CheckCircle2 strokeWidth={SW} className="h-4 w-4" /> : summary ? <Beaker strokeWidth={SW} className="h-4 w-4" /> : <ListChecks strokeWidth={SW} className="h-4 w-4 text-iv-dim" />}
            <span className="font-num text-[11px]">{summary ? (summary.allPassed ? `All ${summary.total} tests passed ✓` : `${summary.passed}/${summary.total} passed`) : `${filteredIndices.length} of ${cases.length} shown • Ready to run`}</span>
          </span>
          <span className="hidden items-center gap-2 font-num text-[10px] font-normal opacity-70 sm:flex">
            {results && <span>{results.reduce((a, r) => a + r.durationMs, 0)}ms total</span>}
            <span className="iv-badge iv-badge-neutral font-num">{cases.length} cases</span>
          </span>
        </div>
      )}
    </div>
  );
}
