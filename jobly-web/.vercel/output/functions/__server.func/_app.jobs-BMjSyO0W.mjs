import { o as __toESM } from "./_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "./_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate, g as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as apiCall, r as useAuth } from "./_ssr/auth-CeAVV6dB.mjs";
import { T as ArrowRight, p as LoaderCircle, s as Search, v as FileText, x as Check, y as ClipboardCheck } from "./_libs/lucide-react.mjs";
import { n as AtsScoreRing, t as AtsBreakdown } from "./_ssr/AtsScoreRing-Bs25r7az.mjs";
import { n as toast } from "./_libs/sonner.mjs";
import { s as motion } from "./_libs/framer-motion.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app.jobs-BMjSyO0W.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function JobsPage() {
	const { token, user } = useAuth();
	const navigate = useNavigate();
	const [applying, setApplying] = (0, import_react.useState)(null);
	const [jobs, setJobs] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [query, setQuery] = (0, import_react.useState)("");
	const [scoreExpandedId, setScoreExpandedId] = (0, import_react.useState)(null);
	const [scoring, setScoring] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (user?.role === "recruiter") navigate({
			to: "/dashboard",
			replace: true
		});
	}, [navigate, user?.role]);
	(0, import_react.useEffect)(() => {
		if (!token) return;
		Promise.all([apiCall("/jobs/match", "GET", null, token), apiCall("/applications/me", "GET", null, token).catch(() => [])]).then(([matchedJobs, applications]) => {
			const safeJobs = Array.isArray(matchedJobs) ? matchedJobs : [];
			const appliedIds = new Set((Array.isArray(applications) ? applications : []).map((application) => application.job && typeof application.job === "object" ? application.job._id : application.job));
			setJobs(safeJobs.map((job) => ({
				...job,
				applied: appliedIds.has(job._id),
				description: typeof job.description === "string" ? job.description : "",
				eligible: job.eligible !== false,
				eligibilityReasons: Array.isArray(job.eligibilityReasons) ? job.eligibilityReasons : [],
				match: job.score,
				skills: Array.isArray(job.skills) ? job.skills : []
			})));
		}).catch((error) => {
			console.error(error);
			setJobs([]);
		}).finally(() => setLoading(false));
	}, [
		token,
		user?.id,
		user?._id,
		user?.resumeText,
		user?.role
	]);
	async function apply(jobId) {
		if (!user?.resumeText) {
			toast.error("Upload your resume before applying.");
			return;
		}
		setApplying(jobId);
		try {
			const application = await apiCall(`/applications/${jobId}`, "POST", {}, token);
			setJobs((current) => current.map((job) => job._id === jobId ? {
				...job,
				applied: true,
				atsBreakdown: application?.atsBreakdown ?? job.atsBreakdown,
				atsScore: application?.atsScore ?? job.atsScore,
				atsTips: application?.atsTips ?? job.atsTips
			} : job));
			toast.success("Application sent");
		} catch (error) {
			toast.error(error.message ?? "Could not apply to this role.");
		} finally {
			setApplying(null);
		}
	}
	async function checkScore(jobId) {
		if (!user?.resumeText) {
			toast.error("Upload your resume to calculate a fit score.");
			return;
		}
		setScoring(jobId);
		try {
			const response = await apiCall(`/jobs/${jobId}/ats-score`, "GET", null, token);
			setJobs((current) => current.map((job) => job._id === jobId ? {
				...job,
				atsBreakdown: response.breakdown,
				atsScore: response.score,
				atsTips: response.tips
			} : job));
			setScoreExpandedId(jobId);
		} catch (error) {
			toast.error(error.message ?? "Could not calculate a fit score.");
		} finally {
			setScoring(null);
		}
	}
	const filteredJobs = (0, import_react.useMemo)(() => jobs.filter((job) => {
		const normalized = query.trim().toLowerCase();
		return !normalized || job.title?.toLowerCase().includes(normalized) || job.company?.toLowerCase().includes(normalized) || job.skills?.some((skill) => skill.toLowerCase().includes(normalized));
	}), [jobs, query]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col justify-between gap-7 border-b border-border pb-8 lg:flex-row lg:items-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Role intelligence"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink",
						children: "Opportunities, with context."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 max-w-2xl text-lg leading-relaxed text-ink/68",
						children: "Every posted role stays visible here. Check fit, inspect the evidence, and see any eligibility rule before you apply."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "control-surface flex min-h-11 w-full items-center gap-3 px-3 lg:max-w-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
							className: "h-4 w-4 shrink-0 text-ink/45",
							"aria-hidden": "true"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sr-only",
							children: "Search roles"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: query,
							onChange: (event) => setQuery(event.target.value),
							placeholder: "Search title, company, or skill",
							className: "min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink/40 focus:outline-none"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-7 flex flex-wrap items-center justify-between gap-3 text-sm text-ink/55",
				"aria-live": "polite",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: loading ? "Finding posted roles..." : `${filteredJobs.length} role${filteredJobs.length === 1 ? "" : "s"} available` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: user?.resumeText ? "Scores use your current resume" : "Add a resume to unlock scoring" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3",
				"aria-label": "Posted roles",
				children: [
					loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingCards, {}) : null,
					!loading && filteredJobs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyRoles, { hasResume: Boolean(user?.resumeText) }) : null,
					!loading && filteredJobs.map((job, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.article, {
						initial: {
							opacity: 0,
							y: 14
						},
						animate: {
							opacity: 1,
							y: 0
						},
						transition: {
							duration: .32,
							delay: Math.min(index * .035, .2)
						},
						className: "surface flex min-h-[430px] flex-col p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "marker-num truncate text-ink/50",
										children: job.company || "Company"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "font-display mt-2 text-2xl leading-tight text-ink",
										children: job.title
									})]
								}), typeof job.match === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "shrink-0 border-l border-border pl-3 text-right",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-display text-3xl text-[#2A9D7B]",
										children: [Math.round(job.match), "%"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-1 text-xs font-semibold text-ink/50",
										children: "Role fit"
									})]
								}) : null]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-5 line-clamp-3 text-sm leading-6 text-ink/68",
								children: job.description
							}),
							job.skills.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-5 flex flex-wrap gap-1.5",
								children: job.skills.slice(0, 5).map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "rounded-md bg-panel px-2 py-1 text-xs font-medium text-ink/70",
									children: skill
								}, skill))
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Requirements, { requirements: job.atsRequirements }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-auto border-t border-border pt-5",
								children: [typeof job.atsScore === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtsScoreRing, {
											score: job.atsScore,
											size: 48
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold text-ink",
											children: "Profile fit"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-ink/55",
											children: "Based on your resume"
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setScoreExpandedId((id) => id === job._id ? null : job._id),
										"aria-expanded": scoreExpandedId === job._id,
										className: "text-sm font-semibold text-ink underline decoration-ink/30 underline-offset-4 hover:decoration-ink",
										children: scoreExpandedId === job._id ? "Hide evidence" : "View evidence"
									})]
								}), scoreExpandedId === job._id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtsBreakdown, {
									breakdown: job.atsBreakdown,
									tips: job.atsTips
								}) : null] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => void checkScore(job._id),
									disabled: scoring === job._id,
									className: "inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-ink/65 disabled:opacity-50",
									children: [scoring === job._id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										className: "h-4 w-4 animate-spin",
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardCheck, {
										className: "h-4 w-4",
										"aria-hidden": "true"
									}), scoring === job._id ? "Calculating fit" : "Analyze profile fit"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-5",
									children: job.applied ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between gap-3 border border-[#8DDCBE] bg-[#E9FBF2] px-3 py-2.5 text-sm text-[#1E7058]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-2 font-semibold",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
												className: "h-4 w-4",
												"aria-hidden": "true"
											}), "Application sent"]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
											to: "/applications",
											className: "font-semibold underline underline-offset-4",
											children: "Track it"
										})]
									}) : !user?.resumeText ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
										to: "/resume",
										className: "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-cream transition-colors hover:bg-ink/85",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
											className: "h-4 w-4",
											"aria-hidden": "true"
										}), "Add resume to apply"]
									}) : job.eligible === false ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border border-[#A9EBD1] bg-[#ECFBF4] px-3 py-2.5 text-sm text-[#1E7058]",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-semibold",
											children: "Requirements not met"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 leading-5 text-[#276D59]",
											children: job.eligibilityReasons?.[0] || "This role has a requirement your current profile does not meet."
										})]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										onClick: () => void apply(job._id),
										disabled: applying === job._id,
										className: "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-ink px-4 text-sm font-semibold text-cream transition-colors hover:bg-ink/85 disabled:opacity-55",
										children: [
											applying === job._id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
												className: "h-4 w-4 animate-spin",
												"aria-hidden": "true"
											}) : null,
											applying === job._id ? "Sending application" : "Apply to role",
											applying === job._id ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
												className: "h-4 w-4",
												"aria-hidden": "true"
											})
										]
									})
								})]
							})
						]
					}, job._id))
				]
			})
		]
	});
}
function Requirements({ requirements }) {
	if (!requirements) return null;
	const rules = [
		requirements.minCgpa && requirements.minCgpa > 0 ? `CGPA ${requirements.minCgpa}+` : "",
		requirements.minExperienceYears && requirements.minExperienceYears > 0 ? `${requirements.minExperienceYears}+ years` : "",
		requirements.targetCollegeTier && requirements.targetCollegeTier !== "any" ? requirements.targetCollegeTier.toUpperCase() : "",
		requirements.requiredDegree ? requirements.requiredDegree : ""
	].filter(Boolean);
	return rules.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-5 border-l-2 border-[#2A9D7B] pl-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "marker-num text-ink/50",
			children: "Role requirements"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 text-xs leading-5 text-ink/65",
			children: rules.join(" | ")
		})]
	}) : null;
}
function EmptyRoles({ hasResume }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "surface col-span-full flex min-h-64 flex-col items-center justify-center px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-3xl text-ink",
				children: hasResume ? "No roles match that search." : "Your resume unlocks scoring."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 max-w-md text-sm leading-6 text-ink/60",
				children: hasResume ? "Try a different title, company, or skill. New roles will appear here as they are posted." : "You can browse every role now. Upload a PDF resume when you are ready to see fit evidence and apply."
			}),
			!hasResume ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
				to: "/resume",
				className: "pill-mint mt-6 gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
					className: "h-4 w-4",
					"aria-hidden": "true"
				}), "Upload resume"]
			}) : null
		]
	});
}
function LoadingCards() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: Array.from({ length: 6 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-[430px] animate-pulse rounded-md border border-border bg-card/45" }, index)) });
}
//#endregion
export { JobsPage as component };
