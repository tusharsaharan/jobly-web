import { o as __toESM } from "./_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "./_libs/@react-three/drei+[...].mjs";
import { g as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as apiCall, r as useAuth } from "./_ssr/auth-CeAVV6dB.mjs";
import { C as BriefcaseBusiness, d as Mail, g as GraduationCap, v as FileText } from "./_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app.profile-Drr-EugL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ProfilePage() {
	const { user, token } = useAuth();
	const [recruiterStats, setRecruiterStats] = (0, import_react.useState)({
		jobs: 0,
		applicants: 0
	});
	(0, import_react.useEffect)(() => {
		if (!token || user?.role !== "recruiter") return;
		Promise.all([apiCall("/jobs", "GET", null, token).catch(() => []), apiCall("/applications/recruiter", "GET", null, token).catch(() => [])]).then(([jobs, applicants]) => {
			setRecruiterStats({
				jobs: Array.isArray(jobs) ? jobs.length : 0,
				applicants: Array.isArray(applicants) ? applicants.length : 0
			});
		});
	}, [token, user?.role]);
	const isRecruiter = user?.role === "recruiter";
	const experience = Array.isArray(user?.experience) ? user.experience : [];
	const achievements = Array.isArray(user?.achievements) ? user.achievements : [];
	const skills = Array.isArray(user?.skills) ? user.skills : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-6 py-16 sm:px-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "marker-num",
				children: "Account"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 border-b border-border pb-10",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-wrap items-end justify-between gap-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink",
						children: "Your profile."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-xl text-base leading-7 text-ink/65",
						children: "The details JobMatch uses across your workspace."
					})] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-10 grid gap-5 sm:grid-cols-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileDatum, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-4 w-4" }),
							label: "Email",
							value: user?.email || "Not available"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileDatum, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, { className: "h-4 w-4" }),
							label: isRecruiter ? "Open roles" : "Experience entries",
							value: isRecruiter ? String(recruiterStats.jobs) : String(experience.length)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileDatum, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "h-4 w-4" }),
							label: isRecruiter ? "Applicants" : "Resume status",
							value: isRecruiter ? String(recruiterStats.applicants) : user?.resumeText ? "Parsed" : "Not uploaded"
						})
					]
				})]
			}),
			isRecruiter ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "py-12",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-end justify-between gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Recruiting workspace"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "mt-3 font-display text-4xl",
						children: "Keep the pipeline moving."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/applicants",
						className: "pill-mint",
						children: "Review applicants"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 max-w-2xl text-base leading-7 text-ink/65",
					children: "Your profile controls the roles and applicant conversations visible in this workspace."
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-10 border-b border-border py-12 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.65fr)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "marker-num",
							children: "Resume summary"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 max-w-2xl text-base leading-7 text-ink/75",
							children: user?.resumeSummary || "Upload a resume to build your candidate profile."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/resume",
							className: "link-underline mt-6 inline-block text-sm font-medium text-ink",
							children: "Update resume"
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Education"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-4 space-y-2 text-sm leading-6 text-ink/75",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileLine, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { className: "h-4 w-4" }),
							value: user?.degree || "Degree not recorded"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileLine, {
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GraduationCap, { className: "h-4 w-4" }),
							value: [user?.college, user?.cgpa !== void 0 ? `CGPA ${user.cgpa}` : ""].filter(Boolean).join(" | ") || "College details not recorded"
						})]
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border-b border-border py-12",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Skills"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 flex flex-wrap gap-2",
						children: skills.length > 0 ? skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-full border border-border bg-card px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-ink/75",
							children: skill
						}, skill)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ink/60",
							children: "No skills are recorded yet."
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-10 py-12 lg:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Experience"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 space-y-4",
						children: experience.length > 0 ? experience.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-l-2 border-lime pl-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-ink",
								children: entry.title || "Experience"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-ink/60",
								children: [entry.company, entry.duration].filter(Boolean).join(" | ")
							})]
						}, `${entry.title}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ink/60",
							children: "No experience entries recorded."
						})
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Achievements"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 space-y-3",
						children: achievements.length > 0 ? achievements.map((achievement, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "border-l-2 border-warm pl-4 text-sm leading-6 text-ink/75",
							children: achievement
						}, `${achievement}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ink/60",
							children: "No achievements recorded."
						})
					})] })]
				})
			] })
		]
	});
}
function ProfileDatum({ icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-l-2 border-ink/15 pl-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-ink/50",
			children: [icon, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-mono text-[10px] uppercase tracking-widest",
				children: label
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 break-words text-base font-medium text-ink",
			children: value
		})]
	});
}
function ProfileLine({ icon, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "flex gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mt-1 shrink-0 text-ink/45",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: value })]
	});
}
//#endregion
export { ProfilePage as component };
