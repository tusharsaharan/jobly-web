import { o as __toESM } from "./_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "./_libs/@react-three/drei+[...].mjs";
import { g as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as apiCall, r as useAuth } from "./_ssr/auth-CeAVV6dB.mjs";
import { T as ArrowRight } from "./_libs/lucide-react.mjs";
import { s as motion } from "./_libs/framer-motion.mjs";
import { a as Tooltip, i as ResponsiveContainer, n as XAxis, r as Area, t as AreaChart } from "./_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app.dashboard-KkE520ej.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CountUp({ to, duration = 1400, suffix = "" }) {
	const [n, setN] = (0, import_react.useState)(0);
	const ref = (0, import_react.useRef)(null);
	const visible = (0, import_react.useRef)(false);
	const frame = (0, import_react.useRef)(null);
	const value = (0, import_react.useRef)(0);
	(0, import_react.useEffect)(() => {
		if (!ref.current) return;
		const io = new IntersectionObserver((entries) => {
			for (const e of entries) if (e.isIntersecting) {
				visible.current = true;
				setN((current) => current);
			}
		}, { threshold: .3 });
		io.observe(ref.current);
		return () => io.disconnect();
	}, []);
	(0, import_react.useEffect)(() => {
		if (typeof window === "undefined") return;
		const target = Number.isFinite(to) ? to : 0;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || duration <= 0) {
			value.current = target;
			setN(target);
			return;
		}
		if (!visible.current) {
			value.current = target;
			setN(target);
			return;
		}
		if (frame.current) cancelAnimationFrame(frame.current);
		const startValue = value.current;
		const change = target - startValue;
		const start = performance.now();
		const tick = (t) => {
			const p = Math.min(1, (t - start) / duration);
			const eased = 1 - Math.pow(1 - p, 3);
			const next = Math.round(startValue + change * eased);
			value.current = next;
			setN(next);
			if (p < 1) frame.current = requestAnimationFrame(tick);
		};
		frame.current = requestAnimationFrame(tick);
		return () => {
			if (frame.current) cancelAnimationFrame(frame.current);
		};
	}, [to, duration]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		ref,
		children: [n, suffix]
	});
}
function Metric({ label, suffix = "", value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-6 sm:px-6 sm:first:pl-0 lg:px-7",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
			className: "text-sm font-semibold text-ink/60",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", {
			className: "font-display mt-3 text-4xl text-ink",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CountUp, { to: value }), suffix]
		})]
	});
}
function PipelineBar({ color, label, total, value }) {
	const percentage = total > 0 ? Math.round(value / total * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-4 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-semibold text-ink/75",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "font-mono text-xs text-ink/55",
			children: [
				value,
				" | ",
				percentage,
				"%"
			]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-2 h-1.5 bg-ink/10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
			className: `h-full ${color}`,
			initial: { width: 0 },
			animate: { width: `${percentage}%` },
			transition: {
				duration: .6,
				ease: "easeOut"
			}
		})
	})] });
}
function PipelineDatum({ label, tone = "text-ink", value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "group flex flex-col items-start rounded-md p-3 -ml-3 border-l-2 border-transparent text-left transition-colors hover:bg-panel hover:border-mint-deep",
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
	const normalized = status || "applied";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `w-fit rounded-md border px-2.5 py-1 text-xs font-semibold capitalize ${normalized === "shortlisted" ? "border-[#8DDCBE] bg-[#E9FBF2] text-[#1E7058]" : normalized === "rejected" ? "border-[#B6DCCB] bg-[#F2FAF6] text-[#335E50]" : "border-[#C5EBDD] bg-[#EFFBF5] text-[#23765E]"}`,
		children: normalized
	});
}
function EmptyGraphic({ label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-full items-center justify-center border-y border-dashed border-border px-6 text-center text-sm leading-6 text-ink/55",
		children: label
	});
}
function Dashboard() {
	const { user, token } = useAuth();
	const [jobs, setJobs] = (0, import_react.useState)([]);
	const [applications, setApplications] = (0, import_react.useState)([]);
	(0, import_react.useEffect)(() => {
		if (!token) return;
		let active = true;
		const loadWorkspace = async () => {
			const [jobsResult, applicationsResult] = await Promise.all([apiCall(user?.role === "recruiter" ? "/jobs" : "/jobs/match", "GET", null, token).catch(() => []), apiCall(user?.role === "recruiter" ? "/applications/recruiter" : "/applications/me", "GET", null, token).catch(() => [])]);
			if (!active) return;
			setJobs(Array.isArray(jobsResult) ? jobsResult : []);
			setApplications(Array.isArray(applicationsResult) ? applicationsResult : []);
		};
		const reloadWhenVisible = () => {
			if (document.visibilityState === "visible") loadWorkspace();
		};
		loadWorkspace();
		window.addEventListener("focus", loadWorkspace);
		document.addEventListener("visibilitychange", reloadWhenVisible);
		return () => {
			active = false;
			window.removeEventListener("focus", loadWorkspace);
			document.removeEventListener("visibilitychange", reloadWhenVisible);
		};
	}, [
		token,
		user?.id,
		user?._id,
		user?.role,
		user?.resumeText
	]);
	const isRecruiter = user?.role === "recruiter";
	const workspace = (0, import_react.useMemo)(() => summarizeWorkspace(jobs, applications), [jobs, applications]);
	return isRecruiter ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecruiterOverview, {
		name: user?.name,
		workspace
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CandidateOverview, {
		hasResume: Boolean(user?.resumeText),
		name: user?.name,
		workspace
	});
}
function RecruiterOverview({ name, workspace }) {
	const firstName = name?.trim().split(/\s+/)[0] || "there";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col justify-between gap-8 border-b border-border pb-8 lg:flex-row lg:items-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "marker-num",
							children: "Recruiting workspace | live pipeline"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink",
							children: [
								"Good to see you, ",
								firstName,
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 max-w-2xl text-lg leading-relaxed text-ink/68",
							children: "Your current hiring picture, grounded in the roles and candidates already in the workspace."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/post-job",
						className: "pill-mint",
						children: "Post a role"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/applicants",
						className: "inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-cream",
						children: "Review applicants"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid divide-y divide-border border-b border-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Open roles",
						value: workspace.jobs.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Applications",
						value: workspace.applications.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Average fit",
						value: workspace.averageScore,
						suffix: "%"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Shortlisted",
						value: workspace.shortlisted
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 border-y border-border py-7",
				"aria-labelledby": "posted-roles-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Published roles"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "posted-roles-heading",
						className: "font-display mt-2 text-3xl text-ink",
						children: "Everything you have posted."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/post-job",
						className: "text-sm font-semibold text-ink hover:text-ink/65",
						children: "Post another role"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 divide-y divide-border",
					children: workspace.jobs.length > 0 ? workspace.jobs.map((job) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/applicants",
						className: "hover-row grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate font-semibold text-ink",
									children: job.title || "Untitled role"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 truncate text-sm text-ink/55",
									children: [job.company || "Company not specified", `Posted ${formatDate(job.createdAt)}`].join(" | ")
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-ink/72",
								children: formatApplicantCount(job.applicationCount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-ink/55",
								children: job.shortlistedCount ? `${job.shortlistedCount} shortlisted` : job.latestApplicationAt ? `Last activity ${formatDate(job.latestApplicationAt)}` : "No applicants yet"
							})
						]
					}, job._id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-8 text-sm leading-6 text-ink/60",
						children: "No roles have been posted yet. Publish one when you are ready to start the pipeline."
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(motion.section, {
					initial: {
						opacity: 0,
						y: 12
					},
					animate: {
						opacity: 1,
						y: 0
					},
					transition: { duration: .45 },
					className: "surface p-6 sm:p-7",
					"aria-labelledby": "application-activity-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-start justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "marker-num",
							children: "Applicant activity"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "application-activity-heading",
							className: "font-display mt-2 text-2xl text-ink",
							children: "Last seven days"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ink/55",
							children: "Live application volume"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-7 h-52 sm:h-64",
						children: workspace.applications.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
							width: "100%",
							height: "100%",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AreaChart, {
								data: workspace.activity,
								margin: {
									bottom: 0,
									left: -20,
									right: 0,
									top: 4
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
										axisLine: false,
										dataKey: "label",
										tick: {
											fill: "#183A32B3",
											fontSize: 12
										},
										tickLine: false
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
										contentStyle: {
											border: "1px solid #C5EBDD",
											borderRadius: 8,
											boxShadow: "0 14px 30px -22px rgba(24, 58, 50, 0.28)"
										},
										cursor: {
											stroke: "#A9EBD1",
											strokeWidth: 1
										},
										formatter: (value) => [value, "Applications"]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
										dataKey: "applications",
										fill: "#E9FBF2",
										fillOpacity: .82,
										stroke: "#2A9D7B",
										strokeWidth: 2.25,
										type: "monotone"
									})
								]
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyGraphic, { label: "Application activity will appear here once candidates apply." })
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "surface p-6 sm:p-7",
					"aria-labelledby": "pipeline-heading",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "marker-num",
							children: "Pipeline composition"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "pipeline-heading",
							className: "font-display mt-2 text-2xl text-ink",
							children: "Where candidates are now"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 space-y-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineBar, {
									label: "New",
									value: workspace.applied,
									total: workspace.applications.length,
									color: "bg-[#C5EBDD]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineBar, {
									label: "Shortlisted",
									value: workspace.shortlisted,
									total: workspace.applications.length,
									color: "bg-[#8DDCBE]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineBar, {
									label: "Closed",
									value: workspace.rejected,
									total: workspace.applications.length,
									color: "bg-[#70B99D]"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/applicants",
							className: "mt-9 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink/65",
							children: ["Open candidate pipeline", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "h-4 w-4",
								"aria-hidden": "true"
							})]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 border-y border-border py-7",
				"aria-labelledby": "recent-applicants-heading",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Latest activity"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "recent-applicants-heading",
						className: "font-display mt-2 text-3xl text-ink",
						children: "Recent candidates"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/applicants",
						className: "text-sm font-semibold text-ink hover:text-ink/65",
						children: "See all applicants"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 divide-y divide-border",
					children: workspace.recentApplications.length > 0 ? workspace.recentApplications.map((application) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "truncate font-semibold text-ink",
									children: application.seeker?.name || "Candidate"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 truncate text-sm text-ink/55",
									children: application.job?.title || "Role"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusLabel, { status: application.status }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold text-ink/72",
								children: typeof application.atsScore === "number" ? `${Math.round(application.atsScore)}% fit` : "Score pending"
							})
						]
					}, application._id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "py-8 text-sm leading-6 text-ink/60",
						children: "No candidate activity yet. Publish a role when you are ready to start the pipeline."
					})
				})]
			})
		]
	});
}
function CandidateOverview({ hasResume, name, workspace }) {
	const firstName = name?.trim().split(/\s+/)[0] || "there";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col justify-between gap-8 border-b border-border pb-8 lg:flex-row lg:items-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-w-3xl",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "marker-num",
							children: "Candidate workspace"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink",
							children: [
								"Welcome back, ",
								firstName,
								"."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-5 max-w-2xl text-lg leading-relaxed text-ink/68",
							children: hasResume ? "Your resume is ready. Review where your experience aligns, then keep every application in view." : "Upload a resume to turn it into a profile and see evidence-led role matches."
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: hasResume ? "/jobs" : "/resume",
						className: "pill-mint",
						children: hasResume ? "Browse matched roles" : "Upload your resume"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/applications",
						className: "inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-cream",
						children: "Applications"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid divide-y divide-border border-b border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Matched roles",
						value: workspace.jobs.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Applications",
						value: workspace.applications.length
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
						label: "Average fit",
						value: workspace.averageScore,
						suffix: "%"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "surface p-6 sm:p-7",
					"aria-labelledby": "candidate-pulse-heading",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "marker-num",
							children: "Application pulse"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "candidate-pulse-heading",
							className: "font-display mt-2 text-2xl text-ink",
							children: "Your pipeline at a glance"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-8 grid gap-5 sm:grid-cols-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineDatum, {
									label: "Submitted",
									value: workspace.applied
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineDatum, {
									label: "Shortlisted",
									value: workspace.shortlisted,
									tone: "text-[#2A9D7B]"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineDatum, {
									label: "Closed",
									value: workspace.rejected,
									tone: "text-[#183A32]"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/applications",
							className: "mt-9 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink/65",
							children: ["Review your applications", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, {
								className: "h-4 w-4",
								"aria-hidden": "true"
							})]
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "surface p-6 sm:p-7",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "marker-num",
							children: "Next best move"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display mt-2 text-2xl text-ink",
							children: hasResume ? "Explore fit, not just volume." : "Build the profile first."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-sm leading-6 text-ink/65",
							children: hasResume ? "Each role can show a detailed score before you apply, so you can decide with the requirements in view." : "Your resume unlocks role matching, score explanations, and a clearer application history."
						})
					]
				})]
			})
		]
	});
}
function summarizeWorkspace(jobs, applications) {
	const scoredApplications = applications.filter((application) => typeof application.atsScore === "number");
	const averageScore = scoredApplications.length > 0 ? Math.round(scoredApplications.reduce((sum, application) => sum + (application.atsScore ?? 0), 0) / scoredApplications.length) : 0;
	const applied = applications.filter((application) => application.status !== "shortlisted" && application.status !== "rejected").length;
	const shortlisted = applications.filter((application) => application.status === "shortlisted").length;
	const rejected = applications.filter((application) => application.status === "rejected").length;
	return {
		activity: buildActivity(applications),
		applied,
		applications,
		averageScore,
		jobs,
		recentApplications: [...applications].sort((left, right) => dateValue(right.createdAt) - dateValue(left.createdAt)).slice(0, 5),
		rejected,
		shortlisted
	};
}
function buildActivity(applications) {
	const formatter = new Intl.DateTimeFormat(void 0, { weekday: "short" });
	const days = Array.from({ length: 7 }, (_, index) => {
		const date = /* @__PURE__ */ new Date();
		date.setHours(0, 0, 0, 0);
		date.setDate(date.getDate() - (6 - index));
		return {
			applications: 0,
			key: date.toISOString().slice(0, 10),
			label: formatter.format(date)
		};
	});
	const byDate = new Map(days.map((day) => [day.key, day]));
	applications.forEach((application) => {
		if (!application.createdAt) return;
		const date = new Date(application.createdAt);
		if (Number.isNaN(date.getTime())) return;
		const day = byDate.get(date.toISOString().slice(0, 10));
		if (day) day.applications += 1;
	});
	return days.map(({ applications: count, label }) => ({
		applications: count,
		label
	}));
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
function formatApplicantCount(value) {
	const count = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
	return `${count} applicant${count === 1 ? "" : "s"}`;
}
//#endregion
export { Dashboard as component };
