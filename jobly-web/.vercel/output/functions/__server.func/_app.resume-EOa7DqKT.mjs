import { o as __toESM } from "./_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "./_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as apiCall, r as useAuth } from "./_ssr/auth-CeAVV6dB.mjs";
import { C as BriefcaseBusiness, b as CircleCheck, p as LoaderCircle, r as Upload, v as FileText, w as Award } from "./_libs/lucide-react.mjs";
import { n as toast } from "./_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app.resume-EOa7DqKT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ResumePage() {
	const { user, token, refresh } = useAuth();
	const navigate = useNavigate();
	const inputRef = (0, import_react.useRef)(null);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const [uploading, setUploading] = (0, import_react.useState)(false);
	const [uploadProgress, setUploadProgress] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (user?.role === "recruiter") navigate({
			to: "/dashboard",
			replace: true
		});
	}, [navigate, user?.role]);
	async function upload(file) {
		if (file.type !== "application/pdf") {
			toast.error("Choose a PDF resume.");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			toast.error("The resume must be 5MB or smaller.");
			return;
		}
		setUploading(true);
		setUploadProgress({
			step: "uploading",
			message: "Uploading document to S3 storage...",
			progress: 20
		});
		try {
			const formData = new FormData();
			formData.append("resume", file);
			const res = await apiCall("/resume/upload", "POST", formData, token, true);
			setUploadProgress({
				step: "processing",
				message: "AI extracting skills and recalibrating ATS scores...",
				progress: 70
			});
			await refresh();
			setUploadProgress({
				step: "completed",
				message: "Extraction and scoring complete!",
				progress: 100
			});
			toast.success(res.msg || "Resume parsed and profile refreshed.");
		} catch (error) {
			toast.error(error.message ?? "Resume upload failed.");
		} finally {
			setUploading(false);
			setTimeout(() => setUploadProgress(null), 3e3);
		}
	}
	const hasResume = Boolean(user?.resumeText);
	const skills = Array.isArray(user?.skills) ? user.skills : [];
	const experience = Array.isArray(user?.experience) ? user.experience : [];
	const achievements = Array.isArray(user?.achievements) ? user.achievements : [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-6xl px-6 pb-16 pt-28 sm:px-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "border-b border-border pb-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Candidate profile source"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display mt-4 text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink",
						children: "Your resume, made useful."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-5 max-w-2xl text-lg leading-relaxed text-ink/68",
						children: "Keep one current PDF here. Jobly uses it to refresh your skills, profile context, and role-fit analysis."
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				onDragOver: (event) => {
					event.preventDefault();
					setDragging(true);
				},
				onDragLeave: () => setDragging(false),
				onDrop: (event) => {
					event.preventDefault();
					setDragging(false);
					const file = event.dataTransfer.files?.[0];
					if (file) upload(file);
				},
				className: `surface mt-8 grid gap-6 p-6 sm:p-7 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center ${dragging ? "border-[#2A9D7B] bg-mint-soft" : ""}`,
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "inline-flex h-12 w-12 items-center justify-center rounded-md bg-panel text-ink",
						children: uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "h-5 w-5 animate-spin",
							"aria-hidden": "true"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, {
							className: "h-5 w-5",
							"aria-hidden": "true"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-semibold text-ink",
							children: uploadProgress ? uploadProgress.message : uploading ? "Processing your resume" : hasResume ? "Your resume is active" : "Add your resume"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm leading-6 text-ink/60",
							children: uploading ? "Extracting the profile details used in matching via async worker pipeline." : hasResume ? "Upload a newer PDF any time to refresh the profile and recalibrate future scores." : "Drop a PDF here or browse to start building your candidate profile."
						}),
						uploadProgress && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-3 w-full max-w-md",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-1.5 w-full overflow-hidden rounded-full bg-ink/10",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "h-full bg-[#2A9D7B] transition-all duration-500 ease-out",
									style: { width: `${uploadProgress.progress}%` }
								})
							})
						}),
						hasResume && !uploading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#2A9D7B]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
								className: "h-4 w-4",
								"aria-hidden": "true"
							}), "Parsed and ready for matching"]
						}) : null
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-3 md:justify-end",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: inputRef,
							type: "file",
							accept: "application/pdf,.pdf",
							className: "hidden",
							onChange: (event) => {
								const file = event.target.files?.[0];
								if (file) upload(file);
								event.target.value = "";
							}
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => inputRef.current?.click(),
							disabled: uploading,
							className: "pill-mint gap-2 disabled:opacity-55",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
								className: "h-4 w-4",
								"aria-hidden": "true"
							}), hasResume ? "Replace PDF" : "Browse PDF"]
						})]
					})
				]
			}),
			hasResume ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-10 border-b border-border py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Profile summary"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-2xl text-base leading-7 text-ink/75",
						children: user?.resumeSummary || "Your profile was parsed successfully. Add a newer PDF if your experience or skills change."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-5 sm:grid-cols-3 lg:grid-cols-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileFact, {
								label: "College",
								value: user?.college || "Not recorded"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileFact, {
								label: "CGPA",
								value: user?.cgpa !== void 0 && user?.cgpa !== null ? String(user.cgpa) : "Not recorded"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProfileFact, {
								label: "Education tier",
								value: {
									tier1: "Tier 1",
									tier2: "Tier 2",
									tier3: "Tier 3",
									unknown: "Not recorded"
								}[user?.collegeTier || "unknown"]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "border-b border-border py-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Skills from your resume"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 flex flex-wrap gap-2",
						children: skills.length > 0 ? skills.map((skill) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "rounded-md bg-panel px-3 py-1.5 text-sm font-medium text-ink/75",
							children: skill
						}, skill)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ink/60",
							children: "No skills were extracted from this file."
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "grid gap-10 border-b border-border py-10 lg:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Experience"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 space-y-5",
						children: experience.length > 0 ? experience.map((entry, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 border-l-2 border-[#A9EBD1] pl-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefcaseBusiness, {
								className: "mt-1 h-4 w-4 shrink-0 text-ink/45",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "font-semibold text-ink",
								children: entry.title || "Experience"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-sm text-ink/60",
								children: [entry.company, entry.duration].filter(Boolean).join(" | ") || "Details not recorded"
							})] })]
						}, `${entry.title}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ink/60",
							children: "No experience entries were extracted."
						})
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "Achievements"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-5 space-y-5",
						children: achievements.length > 0 ? achievements.map((achievement, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-3 border-l-2 border-[#2A9D7B] pl-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Award, {
								className: "mt-1 h-4 w-4 shrink-0 text-warm",
								"aria-hidden": "true"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm leading-6 text-ink/75",
								children: achievement
							})]
						}, `${achievement}-${index}`)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-ink/60",
							children: "No achievements were extracted."
						})
					})] })]
				})
			] }) : null
		]
	});
}
function ProfileFact({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-l-2 border-ink/14 pl-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "marker-num",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-2 text-sm font-semibold text-ink",
			children: value
		})]
	});
}
//#endregion
export { ResumePage as component };
