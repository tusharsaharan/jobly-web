import { o as __toESM } from "./_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "./_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate, g as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as apiCall, r as useAuth } from "./_ssr/auth-CeAVV6dB.mjs";
import { C as BriefcaseBusiness, S as CalendarDays, g as GraduationCap, l as MessageSquare, n as UserRound, w as Award } from "./_libs/lucide-react.mjs";
import { t as ApplicationConversation } from "./_ssr/ApplicationConversation-C3f5J-Qc.mjs";
import { n as AtsScoreRing, t as AtsBreakdown } from "./_ssr/AtsScoreRing-Bs25r7az.mjs";
import { n as toast } from "./_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app.applicants-awosJUI-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var statusOrder = {
	shortlisted: 0,
	applied: 1,
	rejected: 2
};
function ApplicantsPage() {
	const { user, token } = useAuth();
	const navigate = useNavigate();
	const [applications, setApplications] = (0, import_react.useState)([]);
	const [postedJobs, setPostedJobs] = (0, import_react.useState)([]);
	const [conversationId, setConversationId] = (0, import_react.useState)(null);
	const [jobFilter, setJobFilter] = (0, import_react.useState)("all");
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [profileId, setProfileId] = (0, import_react.useState)(null);
	const [sortMode, setSortMode] = (0, import_react.useState)("relevance");
	const [updating, setUpdating] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (user?.role === "seeker") navigate({
			to: "/dashboard",
			replace: true
		});
	}, [navigate, user?.role]);
	(0, import_react.useEffect)(() => {
		if (!token) return;
		let active = true;
		const loadPipeline = async () => {
			const [applicationsResult, jobsResult] = await Promise.all([apiCall("/applications/recruiter", "GET", null, token).catch(() => []), apiCall("/jobs", "GET", null, token).catch(() => [])]);
			if (!active) return;
			setApplications(Array.isArray(applicationsResult) ? applicationsResult : []);
			setPostedJobs(Array.isArray(jobsResult) ? jobsResult : []);
			setLoading(false);
		};
		loadPipeline();
		window.addEventListener("focus", loadPipeline);
		return () => {
			active = false;
			window.removeEventListener("focus", loadPipeline);
		};
	}, [token]);
	const jobs = (0, import_react.useMemo)(() => {
		const entries = /* @__PURE__ */ new Map();
		postedJobs.forEach((job) => {
			if (job._id) entries.set(job._id, job.title || "Untitled role");
		});
		applications.forEach((application) => {
			if (application.job?._id && application.job.title) entries.set(application.job._id, application.job.title);
		});
		return [...entries.entries()];
	}, [applications, postedJobs]);
	const visibleApplications = (0, import_react.useMemo)(() => {
		return [...jobFilter === "all" ? applications : applications.filter((application) => application.job?._id === jobFilter)].sort((left, right) => {
			if (sortMode === "relevance") return (right.atsScore ?? -1) - (left.atsScore ?? -1) || dateValue(right) - dateValue(left);
			if (sortMode === "newest") return dateValue(right) - dateValue(left);
			return (statusOrder[left.status] ?? 3) - (statusOrder[right.status] ?? 3) || dateValue(right) - dateValue(left);
		});
	}, [
		applications,
		jobFilter,
		sortMode
	]);
	const pipeline = (0, import_react.useMemo)(() => ({
		applied: applications.filter((application) => application.status === "applied").length,
		shortlisted: applications.filter((application) => application.status === "shortlisted").length,
		rejected: applications.filter((application) => application.status === "rejected").length
	}), [applications]);
	const selectedJobTitle = jobFilter === "all" ? "" : jobs.find(([id]) => id === jobFilter)?.[1] || "this role";
	async function setStatus(id, status) {
		setUpdating(id);
		try {
			await apiCall(`/applications/${id}/status`, "PATCH", { status }, token);
			setApplications((current) => current.map((application) => application._id === id ? {
				...application,
				status
			} : application));
			toast.success(`Candidate marked ${status}`);
		} catch (error) {
			toast.error(error.message ?? "Could not update the candidate status.");
		} finally {
			setUpdating(null);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-col justify-between gap-7 border-b border-border pb-8 lg:flex-row lg:items-end",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Recruiting pipeline"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink",
						children: "Applicants, in context."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 max-w-2xl text-lg leading-relaxed text-ink/68",
						children: "Review the evidence, manage candidate pipeline status, and message candidates directly."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/post-job",
					className: "pill-mint gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, {
						className: "h-4 w-4",
						"aria-hidden": "true"
					}), "Post a role"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 grid divide-y divide-border border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-y-0",
				"aria-label": "Pipeline counts",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PipelineCount, {
						label: "New",
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
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "surface-subtle mt-8 p-4 sm:p-5",
				"aria-label": "Applicant filters",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid gap-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(0,1fr)_auto] lg:items-end",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "marker-num",
								children: "Role"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: jobFilter,
								onChange: (event) => setJobFilter(event.target.value),
								className: "control-surface mt-2 min-h-11 w-full px-3 text-sm font-medium focus:border-ink focus:outline-none",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "all",
									children: "All roles"
								}), jobs.map(([id, title]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: id,
									children: title
								}, id))]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "marker-num",
							children: "Order"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex flex-wrap gap-2",
							role: "group",
							"aria-label": "Sort applicants",
							children: [
								["relevance", "Best fit"],
								["newest", "Most recent"],
								["status", "Pipeline status"]
							].map(([value, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setSortMode(value),
								"aria-pressed": sortMode === value,
								className: `min-h-10 rounded-md border px-3 text-sm font-semibold transition-colors ${sortMode === value ? "border-ink bg-ink text-cream" : "border-border bg-card text-ink/70 hover:border-ink/45"}`,
								children: label
							}, value))
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "pb-1 text-sm text-ink/55",
							children: [visibleApplications.length, " shown"]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-8 border-y border-border",
				"aria-label": "Applicant list",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingRows, {}) : visibleApplications.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "py-14 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-3xl text-ink",
						children: "No candidates in this view."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-3 text-sm text-ink/60",
						children: selectedJobTitle ? `No candidates have applied to ${selectedJobTitle} yet.` : "Change the filters or publish a role to start receiving applications."
					})]
				}) : visibleApplications.map((application) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicantRow, {
					application,
					conversationOpen: conversationId === application._id,
					currentUserId: user?._id ?? user?.id,
					onConversation: () => setConversationId((id) => id === application._id ? null : application._id),
					onProfile: () => setProfileId((id) => id === application._id ? null : application._id),
					onStatusChange: setStatus,
					profileOpen: profileId === application._id,
					token,
					updating: updating === application._id
				}, application._id))
			})
		]
	});
}
function ApplicantRow({ application, conversationOpen, currentUserId, onConversation, onProfile, onStatusChange, profileOpen, token, updating }) {
	useNavigate();
	const candidate = application.seeker;
	const firstExperience = candidate?.experience?.[0];
	const status = supportedStatus(application.status);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "border-b border-border px-1 py-6 last:border-b-0 sm:px-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex min-w-0 gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-panel text-sm font-bold text-ink",
							children: (candidate?.name || "Candidate").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("") || "C"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "marker-num text-ink/50",
									children: application.job?.title || "Role"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "mt-1 truncate text-lg font-semibold text-ink",
									children: candidate?.name || "Candidate"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 truncate text-sm text-ink/55",
									children: candidate?.email || "No email recorded"
								}),
								firstExperience?.title ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 text-sm text-ink/65",
									children: [firstExperience.title, firstExperience.company ? ` | ${firstExperience.company}` : ""]
								}) : null,
								candidate?.skills && candidate.skills.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-3 flex flex-wrap gap-1.5",
									children: candidate.skills.slice(0, 5).map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "rounded-md bg-panel px-2 py-1 text-xs font-medium text-ink/70",
										children: skill
									}, skill))
								}) : null
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-3 lg:justify-center",
						children: typeof application.atsScore === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtsScoreRing, {
							score: application.atsScore,
							size: 52
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "lg:hidden",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm font-semibold text-ink",
								children: [Math.round(application.atsScore), "% fit"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-ink/55",
								children: "ATS relevance"
							})]
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ink/55",
							children: "Score pending"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-2 lg:justify-end",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "sr-only",
								htmlFor: `candidate-status-${application._id}`,
								children: "Candidate status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								id: `candidate-status-${application._id}`,
								value: status,
								onChange: (event) => void onStatusChange(application._id, event.target.value),
								disabled: updating,
								className: `min-h-10 rounded-md border px-3 text-sm font-semibold capitalize focus:outline-none disabled:opacity-50 ${statusClass(status)}`,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "applied",
										children: "Applied"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "shortlisted",
										children: "Shortlisted"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
										value: "rejected",
										children: "Rejected"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: onProfile,
								"aria-expanded": profileOpen,
								className: "inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-ink transition-colors hover:bg-panel",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
									className: "h-4 w-4",
									"aria-hidden": "true"
								}), profileOpen ? "Close profile" : "Profile"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: onConversation,
								"aria-expanded": conversationOpen,
								className: "inline-flex min-h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-semibold text-ink transition-colors hover:bg-panel",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageSquare, {
									className: "h-4 w-4",
									"aria-hidden": "true"
								}), conversationOpen ? "Close message" : "Message"]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm text-ink/55",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "inline-flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, {
							className: "h-4 w-4",
							"aria-hidden": "true"
						}),
						"Applied ",
						formatDate(application.createdAt)
					]
				}), typeof application.atsScore === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "hidden font-semibold text-ink/72 lg:inline",
					children: [Math.round(application.atsScore), "% ATS fit"]
				}) : null]
			}),
			profileOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicantProfile, { applicant: candidate }) : null,
			profileOpen && application.atsBreakdown ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-5 border-t border-border pt-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AtsBreakdown, { breakdown: application.atsBreakdown })
			}) : null,
			conversationOpen && token ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ApplicationConversation, {
				applicationId: application._id,
				counterpartName: candidate?.name || "candidate",
				currentUserId,
				token
			}) : null
		]
	});
}
function ApplicantProfile({ applicant }) {
	const achievements = applicant?.achievements ?? [];
	const experience = applicant?.experience ?? [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": "Candidate profile",
		className: "mt-5 grid gap-8 border-t border-border pt-5 lg:grid-cols-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "marker-num",
				children: "Education"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-2 text-sm leading-6 text-ink/70",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, {
						className: "mt-1 h-4 w-4 shrink-0 text-ink/45",
						"aria-hidden": "true"
					}), applicant?.degree || "No degree recorded"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: [
					applicant?.college,
					applicant?.cgpa !== void 0 ? `CGPA ${applicant.cgpa}` : "",
					applicant?.collegeTier && applicant.collegeTier !== "unknown" ? applicant.collegeTier.toUpperCase() : ""
				].filter(Boolean).join(" | ") || "No education details recorded" })]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "marker-num",
				children: "Experience"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 space-y-3",
				children: experience.length > 0 ? experience.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 text-sm leading-6 text-ink/70",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, {
						className: "mt-1 h-4 w-4 shrink-0 text-ink/45",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-semibold text-ink",
							children: entry.title || "Experience"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						[entry.company, entry.duration].filter(Boolean).join(" | ") || "Details not recorded"
					] })]
				}, `${entry.title}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-ink/60",
					children: "No experience details recorded."
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "marker-num",
				children: "Achievements"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 space-y-3",
				children: achievements.length > 0 ? achievements.map((achievement, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex gap-2 text-sm leading-6 text-ink/70",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, {
						className: "mt-1 h-4 w-4 shrink-0 text-warm",
						"aria-hidden": "true"
					}), achievement]
				}, `${achievement}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-ink/60",
					children: "No achievements recorded."
				})
			})] })
		]
	});
}
function PipelineCount({ label, tone = "text-ink", value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "py-5 sm:px-6 sm:first:pl-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "marker-num",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: `font-display mt-2 text-4xl ${tone}`,
			children: value
		})]
	});
}
function LoadingRows() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "divide-y divide-border",
		children: Array.from({ length: 4 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-36 animate-pulse bg-card/40" }, index))
	});
}
function dateValue(application) {
	const date = application.createdAt ? new Date(application.createdAt).getTime() : 0;
	return Number.isFinite(date) ? date : 0;
}
function formatDate(value) {
	if (!value) return "recently";
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? "recently" : date.toLocaleDateString();
}
function supportedStatus(status) {
	return status === "shortlisted" || status === "rejected" ? status : "applied";
}
function statusClass(status) {
	if (status === "shortlisted") return "border-[#8DDCBE] bg-[#E9FBF2] text-[#1E7058]";
	if (status === "rejected") return "border-[#B6DCCB] bg-[#F2FAF6] text-[#335E50]";
	return "border-[#C5EBDD] bg-[#EFFBF5] text-[#23765E]";
}
//#endregion
export { ApplicantsPage as component };
