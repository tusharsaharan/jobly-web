import { o as __toESM } from "./_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "./_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as apiCall, r as useAuth } from "./_ssr/auth-CeAVV6dB.mjs";
import { S as CalendarDays, l as MessageSquare } from "./_libs/lucide-react.mjs";
import { t as ApplicationConversation } from "./_ssr/ApplicationConversation-C3f5J-Qc.mjs";
import { n as AtsScoreRing } from "./_ssr/AtsScoreRing-Bs25r7az.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app.applications-BAIar3fb.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ApplicationsPage() {
	const { user, token } = useAuth();
	const navigate = useNavigate();
	const [applications, setApplications] = (0, import_react.useState)([]);
	const [conversationId, setConversationId] = (0, import_react.useState)(null);
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		if (user?.role === "recruiter") navigate({
			to: "/dashboard",
			replace: true
		});
	}, [navigate, user?.role]);
	(0, import_react.useEffect)(() => {
		if (!token) return;
		apiCall("/applications/me", "GET", null, token).then((response) => setApplications(Array.isArray(response) ? response : [])).catch(() => setApplications([])).finally(() => setLoading(false));
	}, [token]);
	const pipeline = (0, import_react.useMemo)(() => ({
		applied: applications.filter((application) => application.status === "applied").length,
		shortlisted: applications.filter((application) => application.status === "shortlisted").length,
		rejected: applications.filter((application) => application.status === "rejected").length
	}), [applications]);
	const orderedApplications = (0, import_react.useMemo)(() => [...applications].sort((left, right) => dateValue(right.createdAt) - dateValue(left.createdAt)), [applications]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-6 pb-16 pt-28 sm:px-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "flex flex-col justify-between gap-7 border-b border-border pb-8 md:flex-row md:items-end",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Application history"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink",
						children: "Your applications, in motion."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 max-w-2xl text-lg leading-relaxed text-ink/68",
						children: "Track a role from submitted to decision, review ATS match feedback, and converse with recruiters."
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0",
				"aria-label": "Pipeline counts",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineCount, {
						label: "Active",
						value: pipeline.applied
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineCount, {
						label: "Shortlisted",
						value: pipeline.shortlisted,
						tone: "text-[#2A9D7B]"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineCount, {
						label: "Closed",
						value: pipeline.rejected,
						tone: "text-[#183A32]"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 border-y border-border",
				"aria-label": "Application history",
				children: [loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingRows, {}) : orderedApplications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "py-14 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl text-ink",
						children: "No applications yet."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-ink/60",
						children: "Browse roles to compare your profile and make your first application."
					})]
				}) : null, !loading && orderedApplications.map((application) => {
					const conversationOpen = conversationId === application._id;
					const recruiterName = application.job?.company || "the recruiter";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
						className: "border-b border-border px-1 py-6 last:border-b-0 sm:px-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "marker-num truncate text-ink/50",
											children: application.job?.company || "Company"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "font-display mt-1 truncate text-2xl text-ink",
											children: application.job?.title || "Role"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "mt-2 inline-flex items-center gap-2 text-sm text-ink/55",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, {
													className: "h-4 w-4",
													"aria-hidden": "true"
												}),
												"Submitted ",
												formatDate(application.createdAt)
											]
										})
									]
								}),
								typeof application.atsScore === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 sm:flex-col sm:gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtsScoreRing, {
										score: application.atsScore,
										size: 46
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs font-semibold text-ink/55",
										children: [Math.round(application.atsScore), "% fit"]
									})]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-ink/55",
									children: "Score pending"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-2 sm:justify-end",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusLabel, { status: application.status }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => setConversationId((id) => id === application._id ? null : application._id),
										"aria-expanded": conversationOpen,
										className: "inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-ink transition-colors hover:bg-panel",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, {
											className: "h-4 w-4",
											"aria-hidden": "true"
										}), conversationOpen ? "Close message" : "Message"]
									})]
								})
							]
						}), conversationOpen && token ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationConversation, {
							applicationId: application._id,
							counterpartName: recruiterName,
							currentUserId: user?._id ?? user?.id,
							token
						}) : null]
					}, application._id);
				})]
			})
		]
	});
}
function PipelineCount({ label, tone = "text-ink", value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "group flex w-full flex-col items-start py-5 px-4 text-left transition-colors hover:bg-panel sm:px-6 sm:first:pl-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "marker-num transition-colors group-hover:text-mint-deep",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `font-display mt-2 text-4xl ${tone}`,
			children: value
		})]
	});
}
function StatusLabel({ status }) {
	const normalized = status === "shortlisted" || status === "rejected" ? status : "applied";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${normalized === "shortlisted" ? "border-[#8DDCBE] bg-[#E9FBF2] text-[#1E7058]" : normalized === "rejected" ? "border-[#B6DCCB] bg-[#F2FAF6] text-[#335E50]" : "border-[#C5EBDD] bg-[#EFFBF5] text-[#23765E]"}`,
		children: normalized
	});
}
function LoadingRows() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-32 animate-pulse border-b border-border bg-card/40" }, index)) });
}
function dateValue(value) {
	const date = value ? new Date(value).getTime() : 0;
	return Number.isFinite(date) ? date : 0;
}
function formatDate(value) {
	if (!value) return "recently";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleDateString();
}
//#endregion
export { ApplicationsPage as component };
