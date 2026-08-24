import { o as __toESM } from "./_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "./_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as apiCall, r as useAuth } from "./_ssr/auth-CeAVV6dB.mjs";
import { a as Sparkles, c as RotateCcw, o as Send, p as LoaderCircle } from "./_libs/lucide-react.mjs";
import { n as toast } from "./_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app.post-job-CIDpgBxt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var emptyForm = {
	title: "",
	company: "",
	location: "",
	type: "",
	description: "",
	skills: "",
	atsRequirements: {
		minCgpa: "",
		targetCollegeTier: "any",
		minExperienceYears: "",
		requiredDegree: ""
	}
};
function normalizeSkills(value) {
	return value.split(/[,;\n\r|\u2022]+/).map((skill) => skill.trim()).filter(Boolean);
}
function optionalNumber(value) {
	return value.trim() === "" ? void 0 : Number(value);
}
function toPayload(form) {
	return {
		title: form.title,
		company: form.company,
		location: form.location,
		type: form.type,
		description: form.description,
		skills: normalizeSkills(form.skills),
		atsRequirements: {
			minCgpa: optionalNumber(form.atsRequirements.minCgpa),
			targetCollegeTier: form.atsRequirements.targetCollegeTier,
			minExperienceYears: optionalNumber(form.atsRequirements.minExperienceYears),
			requiredDegree: form.atsRequirements.requiredDegree
		}
	};
}
function validateForm(form) {
	const errors = {};
	const title = form.title.trim();
	const description = form.description.trim();
	const skills = normalizeSkills(form.skills);
	if (title.length < 2) errors.title = "Enter a title with at least 2 characters.";
	else if (title.length > 160) errors.title = "Title cannot exceed 160 characters.";
	if (description.length < 20) errors.description = "Add at least 20 characters so candidates understand the role.";
	else if (description.length > 8e3) errors.description = "Description cannot exceed 8,000 characters.";
	if (form.company.trim().length > 160) errors.company = "Company cannot exceed 160 characters.";
	if (form.location.trim().length > 160) errors.location = "Location cannot exceed 160 characters.";
	if (skills.length > 30) errors.skills = "Add at most 30 skills.";
	else if (skills.some((skill) => skill.length > 80)) errors.skills = "Each skill must be 80 characters or fewer.";
	if (form.type && ![
		"Full-time",
		"Part-time",
		"Contract",
		"Internship"
	].includes(form.type)) errors.type = "Choose a supported employment type.";
	const cgpa = optionalNumber(form.atsRequirements.minCgpa);
	if (cgpa !== void 0 && (!Number.isFinite(cgpa) || cgpa < 0 || cgpa > 10)) errors.minCgpa = "Enter a CGPA from 0 to 10.";
	const experience = optionalNumber(form.atsRequirements.minExperienceYears);
	if (experience !== void 0 && (!Number.isFinite(experience) || experience < 0 || experience > 60)) errors.minExperienceYears = "Enter experience from 0 to 60 years.";
	if (form.atsRequirements.requiredDegree.trim().length > 120) errors.requiredDegree = "Required degree cannot exceed 120 characters.";
	return errors;
}
function asForm(job) {
	const requirements = job?.atsRequirements ?? {};
	const cgpa = Number(requirements.minCgpa);
	const experience = Number(requirements.minExperienceYears);
	return {
		title: typeof job?.title === "string" ? job.title : "",
		company: typeof job?.company === "string" ? job.company : "",
		location: typeof job?.location === "string" ? job.location : "",
		type: [
			"Full-time",
			"Part-time",
			"Contract",
			"Internship"
		].includes(job?.type) ? job.type : "",
		description: typeof job?.description === "string" ? job.description : "",
		skills: Array.isArray(job?.skills) ? job.skills.join(", ") : typeof job?.skills === "string" ? job.skills : "",
		atsRequirements: {
			minCgpa: Number.isFinite(cgpa) && cgpa > 0 ? String(cgpa) : "",
			targetCollegeTier: [
				"tier1",
				"tier2",
				"tier3",
				"any"
			].includes(requirements.targetCollegeTier) ? requirements.targetCollegeTier : "any",
			minExperienceYears: Number.isFinite(experience) && experience > 0 ? String(experience) : "",
			requiredDegree: typeof requirements.requiredDegree === "string" ? requirements.requiredDegree : ""
		}
	};
}
function PostJobPage() {
	const { user, token } = useAuth();
	const navigate = useNavigate();
	const [form, setForm] = (0, import_react.useState)(emptyForm);
	const [errors, setErrors] = (0, import_react.useState)({});
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [chatInput, setChatInput] = (0, import_react.useState)("");
	const [chatLoading, setChatLoading] = (0, import_react.useState)(false);
	const [chatHistory, setChatHistory] = (0, import_react.useState)([]);
	const chatEndRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (user?.role === "seeker") navigate({
			to: "/dashboard",
			replace: true
		});
	}, [user, navigate]);
	(0, import_react.useEffect)(() => {
		chatEndRef.current?.scrollIntoView({
			behavior: "smooth",
			block: "nearest"
		});
	}, [chatHistory, chatLoading]);
	function updateForm(next, field) {
		setForm(next);
		if (field && errors[field]) setErrors((current) => ({
			...current,
			[field]: void 0
		}));
	}
	async function submit(event) {
		event.preventDefault();
		const validationErrors = validateForm(form);
		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			toast.error("Review the highlighted fields before publishing.");
			return;
		}
		setLoading(true);
		try {
			await apiCall("/jobs", "POST", toPayload(form), token);
			toast.success("Role posted");
			navigate({ to: "/dashboard" });
		} catch (error) {
			setErrors(error?.details ?? {});
			toast.error(error.message ?? "Could not post the role.");
		} finally {
			setLoading(false);
		}
	}
	async function handleChat(event) {
		event.preventDefault();
		const message = chatInput.trim();
		if (!message || chatLoading || loading) return;
		setChatHistory((history) => [...history, {
			id: Date.now(),
			role: "user",
			text: message
		}]);
		setChatInput("");
		setChatLoading(true);
		try {
			const result = await apiCall("/jobs/ai-generate", "POST", {
				prompt: message,
				draft: toPayload(form)
			}, token);
			const job = result?.job ?? result;
			setForm(asForm(job));
			setErrors({});
			const response = typeof result?.message === "string" ? result.message : "I updated the role draft. Review it before publishing.";
			setChatHistory((history) => [...history, {
				id: Date.now() + 1,
				role: "ai",
				text: response
			}]);
			if (Array.isArray(result?.missingFields) && result.missingFields.length > 0) toast.message("The assistant needs a little more information before this role can be published.");
			else toast.success("Draft updated");
		} catch (error) {
			const response = error?.message ?? "I could not update the draft. Please try that again.";
			setChatHistory((history) => [...history, {
				id: Date.now() + 1,
				role: "ai",
				text: response
			}]);
			toast.error(response);
		} finally {
			setChatLoading(false);
		}
	}
	const disabled = chatLoading || loading;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto max-w-7xl px-6 pb-16 pt-28 sm:px-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "grid items-start gap-10 border-b border-border pb-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,1fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "marker-num",
						children: "A new opening"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "mt-4 font-display text-[clamp(2.7rem,5.4vw,5.5rem)] text-ink",
						children: "Post a role."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-6 max-w-xl text-base leading-7 text-ink/65",
						children: "Start in plain language, paste a brief, or fill in the details yourself. The assistant works on the draft you already have and never publishes for you."
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					"aria-label": "Recruiter assistant",
					className: "surface p-5 sm:p-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-mint text-ink",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, {
									className: "h-5 w-5",
									"aria-hidden": "true"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-ink",
									children: "Recruiter assistant"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-ink/60",
									children: "Describe a role or ask for a change to the current draft."
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							"aria-live": "polite",
							className: "mt-5 max-h-64 min-h-28 space-y-3 overflow-y-auto rounded-md border border-border bg-panel/40 p-4",
							children: [
								chatHistory.length === 0 && !chatLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm leading-6 text-ink/60",
									children: "Use a short role brief, a labeled list, or paste an existing job description. You can edit every result below."
								}) : chatHistory.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: `flex ${message.role === "user" ? "justify-end" : "justify-start"}`,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: `max-w-[85%] rounded-md px-4 py-2.5 text-sm leading-6 ${message.role === "user" ? "bg-ink text-cream" : "bg-mint-soft text-ink"}`,
										children: message.text
									})
								}, message.id)),
								chatLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex justify-start",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "inline-flex items-center gap-2 rounded-md bg-mint-soft px-4 py-2.5 text-sm text-ink",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
											className: "h-4 w-4 animate-spin",
											"aria-hidden": "true"
										}), "Updating the draft..."]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: chatEndRef })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
							onSubmit: handleChat,
							className: "mt-4 grid gap-3 sm:grid-cols-[1fr_auto]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "sr-only",
									htmlFor: "recruiter-assistant-input",
									children: "Describe the role or a change to the draft"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									id: "recruiter-assistant-input",
									value: chatInput,
									onChange: (event) => setChatInput(event.target.value),
									disabled,
									maxLength: 4e3,
									rows: 3,
									placeholder: "Describe the role or change a detail...",
									className: "control-surface min-h-24 resize-none px-4 py-3 text-sm placeholder:text-ink/40 focus:border-ink focus:outline-none disabled:opacity-50"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "submit",
									disabled: disabled || !chatInput.trim(),
									className: "pill-mint inline-flex cursor-pointer gap-2 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end",
									children: [chatLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
										className: "h-4 w-4 animate-spin",
										"aria-hidden": "true"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
										className: "h-4 w-4",
										"aria-hidden": "true"
									}), "Update draft"]
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-10 flex items-center justify-between gap-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "marker-num",
					children: "Role details"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-ink/60",
					children: "Every field stays editable after the assistant updates the draft."
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: submit,
				noValidate: true,
				className: "mt-10 space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Title",
						value: form.title,
						onChange: (value) => updateForm({
							...form,
							title: value
						}, "title"),
						placeholder: "Senior Product Engineer",
						disabled,
						required: true,
						error: errors.title,
						maxLength: 160
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Company (optional)",
						value: form.company,
						onChange: (value) => updateForm({
							...form,
							company: value
						}, "company"),
						placeholder: "Your organization",
						disabled,
						error: errors.company,
						maxLength: 160
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid gap-4 sm:grid-cols-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
							label: "Location (optional)",
							value: form.location,
							onChange: (value) => updateForm({
								...form,
								location: value
							}, "location"),
							placeholder: "Remote, hybrid, or city",
							disabled,
							error: errors.location,
							maxLength: 160
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "marker-num",
									children: "Employment type (optional)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: form.type,
									onChange: (event) => updateForm({
										...form,
										type: event.target.value
									}, "type"),
									disabled,
									"aria-invalid": Boolean(errors.type),
									className: "control-surface mt-2 w-full px-4 py-3.5 text-base focus:border-ink focus:outline-none disabled:opacity-50",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "",
											children: "Not specified"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Full-time",
											children: "Full-time"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Part-time",
											children: "Part-time"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Contract",
											children: "Contract"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: "Internship",
											children: "Internship"
										})
									]
								}),
								errors.type && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 text-sm text-destructive",
									role: "alert",
									children: errors.type
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "marker-num",
								children: ["Description ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-destructive",
									children: "*"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: form.description,
								onChange: (event) => updateForm({
									...form,
									description: event.target.value
								}, "description"),
								rows: 7,
								maxLength: 8e3,
								disabled,
								"aria-invalid": Boolean(errors.description),
								"aria-describedby": errors.description ? "description-error" : void 0,
								className: "control-surface mt-2 w-full resize-y px-4 py-3 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50",
								placeholder: "Describe the work, outcomes, and the person you need."
							}),
							errors.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "description-error",
								className: "mt-2 text-sm text-destructive",
								role: "alert",
								children: errors.description
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Skills (optional)",
						value: form.skills,
						onChange: (value) => updateForm({
							...form,
							skills: value
						}, "skills"),
						placeholder: "React, TypeScript, Postgres",
						disabled,
						error: errors.skills,
						maxLength: 2400,
						multiline: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						"aria-labelledby": "eligibility-heading",
						className: "surface-subtle mt-10 p-6",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-start justify-between gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "eligibility-heading",
								className: "font-semibold text-ink",
								children: "Eligibility rules (optional)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs leading-5 text-ink/60",
								children: "Only set a rule when it is genuinely required. A blank rule does not exclude anyone."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => updateForm({
									...form,
									atsRequirements: emptyForm.atsRequirements
								}),
								disabled,
								className: "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-border px-4 text-sm font-medium text-ink transition-colors hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
									className: "h-4 w-4",
									"aria-hidden": "true"
								}), "Clear rules"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "mt-6 grid gap-4 sm:grid-cols-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
									label: "Minimum CGPA",
									value: form.atsRequirements.minCgpa,
									onChange: (value) => updateForm({
										...form,
										atsRequirements: {
											...form.atsRequirements,
											minCgpa: value
										}
									}, "minCgpa"),
									placeholder: "e.g. 8.5",
									disabled,
									error: errors.minCgpa
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "marker-num",
										children: "College tier"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: form.atsRequirements.targetCollegeTier,
										onChange: (event) => updateForm({
											...form,
											atsRequirements: {
												...form.atsRequirements,
												targetCollegeTier: event.target.value
											}
										}),
										disabled,
										className: "control-surface mt-2 w-full px-4 py-3.5 text-base focus:border-ink focus:outline-none disabled:opacity-50",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "any",
												children: "No tier requirement"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "tier1",
												children: "Tier 1"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "tier2",
												children: "Tier 2 or better"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "tier3",
												children: "Tier 3 or better"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(NumberField, {
									label: "Minimum experience (years)",
									value: form.atsRequirements.minExperienceYears,
									onChange: (value) => updateForm({
										...form,
										atsRequirements: {
											...form.atsRequirements,
											minExperienceYears: value
										}
									}, "minExperienceYears"),
									placeholder: "e.g. 2",
									disabled,
									error: errors.minExperienceYears
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "marker-num",
											children: "Required degree"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "text",
											value: form.atsRequirements.requiredDegree,
											onChange: (event) => updateForm({
												...form,
												atsRequirements: {
													...form.atsRequirements,
													requiredDegree: event.target.value
												}
											}, "requiredDegree"),
											placeholder: "Leave blank when no degree is required",
											maxLength: 120,
											disabled,
											"aria-invalid": Boolean(errors.requiredDegree),
											className: "control-surface mt-2 w-full px-4 py-3.5 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs leading-5 text-ink/60",
											children: "Blank includes candidates who have no recorded degree."
										}),
										errors.requiredDegree && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm text-destructive",
											role: "alert",
											children: errors.requiredDegree
										})
									]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "submit",
						disabled,
						"data-cursor": "publish",
						className: "pill-mint-lg inline-flex w-full cursor-pointer gap-3 disabled:cursor-not-allowed disabled:opacity-60",
						children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "h-5 w-5 animate-spin",
							"aria-hidden": "true"
						}), " Publishing"] }) : "Publish role"
					})
				]
			})
		]
	});
}
function Field({ label, value, onChange, placeholder, required, disabled, error, maxLength, multiline = false }) {
	const controlClass = "control-surface mt-2 w-full px-4 py-3.5 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "marker-num",
				children: [
					label,
					" ",
					required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-destructive",
						children: "*"
					})
				]
			}),
			multiline ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				value,
				onChange: (event) => onChange(event.target.value),
				placeholder,
				maxLength,
				rows: 3,
				disabled,
				"aria-invalid": Boolean(error),
				className: `${controlClass} resize-y`
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				value,
				onChange: (event) => onChange(event.target.value),
				placeholder,
				maxLength,
				disabled,
				"aria-invalid": Boolean(error),
				className: controlClass
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-destructive",
				role: "alert",
				children: error
			})
		]
	});
}
function NumberField({ label, value, onChange, placeholder, disabled, error }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "marker-num",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "text",
				inputMode: "decimal",
				value,
				onChange: (event) => onChange(event.target.value),
				placeholder,
				disabled,
				"aria-invalid": Boolean(error),
				className: "control-surface mt-2 w-full px-4 py-3.5 text-base placeholder:text-ink/30 focus:border-ink focus:outline-none disabled:opacity-50"
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-destructive",
				role: "alert",
				children: error
			})
		]
	});
}
//#endregion
export { PostJobPage as component };
