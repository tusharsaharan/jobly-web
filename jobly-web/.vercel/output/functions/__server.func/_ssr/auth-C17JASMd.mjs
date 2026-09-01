import { o as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as apiCall, r as useAuth } from "./auth-CeAVV6dB.mjs";
import { n as toast } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-C17JASMd.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var CREAM = "#F7FFFB";
var CREAM_SOFT = "rgba(255, 255, 255, 0.72)";
var INK = "#183A32";
var CORAL = "#2A9D7B";
var MINT = "#D6F6E7";
var MINT_HOVER = "#A9EBD1";
function AuthPage() {
	const { user, login } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (user) navigate({
			to: "/dashboard",
			replace: true
		});
	}, [user, navigate]);
	const [mode, setMode] = (0, import_react.useState)("login");
	const [role, setRole] = (0, import_react.useState)("seeker");
	const [form, setForm] = (0, import_react.useState)({
		name: "",
		email: "",
		password: ""
	});
	const [loading, setLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (new URLSearchParams(window.location.search).get("mode") === "signup") setMode("signup");
	}, []);
	async function onSubmit(e) {
		e.preventDefault();
		setLoading(true);
		try {
			if (mode === "login") {
				const data = await apiCall("/auth/login", "POST", {
					email: form.email,
					password: form.password
				});
				const user = await apiCall("/users/me", "GET", null, data.token);
				login(user, data.token);
				toast.success("Welcome back");
				navigate({ to: "/dashboard" });
			} else {
				await apiCall("/auth/register", "POST", {
					...form,
					role
				});
				toast.success("Account created! Please log in.");
				setMode("login");
			}
		} catch (err) {
			toast.error(err.message ?? "Something went wrong");
		} finally {
			setLoading(false);
		}
	}
	const isLogin = mode === "login";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative min-h-screen w-full",
		style: {
			backgroundColor: CREAM,
			color: INK,
			fontFamily: "'Nunito', system-ui, sans-serif"
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute left-8 top-8 flex items-center gap-2 sm:left-12 sm:top-10",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition-transform duration-200 hover:scale-105",
				style: {
					backgroundColor: CORAL,
					color: "#fff"
				},
				children: "jr"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xl font-extrabold tracking-tight",
				style: {
					color: INK,
					fontFamily: "'Fredoka', 'Nunito', system-ui, sans-serif"
				},
				children: "Jobly"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex min-h-screen items-center justify-center px-6 py-24 sm:px-8",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-full max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-[2rem] p-8 transition-all duration-300 hover:-translate-y-0.5 sm:p-10",
						style: {
							backgroundColor: CREAM_SOFT,
							border: "1px solid rgba(24,58,50,0.12)",
							boxShadow: "0 30px 80px -40px rgba(42,157,123,0.28), 0 2px 8px rgba(24,58,50,0.05)",
							backdropFilter: "blur(18px)"
						},
						onMouseEnter: (e) => {
							e.currentTarget.style.boxShadow = "0 40px 90px -36px rgba(42,157,123,0.36), 0 4px 14px rgba(24,58,50,0.08)";
							e.currentTarget.style.borderColor = "rgba(42,157,123,0.28)";
						},
						onMouseLeave: (e) => {
							e.currentTarget.style.boxShadow = "0 30px 80px -40px rgba(42,157,123,0.28), 0 2px 8px rgba(24,58,50,0.05)";
							e.currentTarget.style.borderColor = "rgba(24,58,50,0.12)";
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mb-3 text-[11px] font-medium uppercase",
								style: {
									color: `${INK}8C`,
									letterSpacing: "0.24em",
									fontFamily: "'JetBrains Mono', ui-monospace, monospace"
								},
								children: isLogin ? "Log in · Jobly" : "Sign up · Jobly"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl",
								style: {
									color: INK,
									fontFamily: "'Fredoka', 'Nunito', system-ui, sans-serif"
								},
								children: isLogin ? "Hey, welcome back." : "Nice to meet you."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-4 text-[15px] leading-relaxed",
								style: { color: `${INK}A6` },
								children: isLogin ? "A friendlier way to find work. Sign in to pick up where you left off." : "Set up your account in a minute — then dive in."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit,
								className: "mt-8 space-y-5",
								children: [
									mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UField, {
										label: "Your name",
										placeholder: "Ada Lovelace",
										value: form.name,
										onChange: (v) => setForm({
											...form,
											name: v
										}),
										required: true
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[11px] font-semibold uppercase",
										style: {
											color: `${INK}B3`,
											letterSpacing: "0.16em",
											fontFamily: "'JetBrains Mono', ui-monospace, monospace"
										},
										children: "I am a"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 grid grid-cols-2 gap-2",
										children: ["seeker", "recruiter"].map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setRole(r),
											className: "rounded-full px-4 py-2.5 text-sm font-bold capitalize transition-all duration-200 hover:-translate-y-[1px]",
											style: role === r ? {
												backgroundColor: INK,
												color: CREAM
											} : {
												backgroundColor: "rgba(214,246,231,0.72)",
												color: `${INK}CC`
											},
											children: r
										}, r))
									})] })] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UField, {
										label: "Email",
										type: "email",
										placeholder: "you@example.com",
										value: form.email,
										onChange: (v) => setForm({
											...form,
											email: v
										}),
										required: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UField, {
										label: "Password",
										type: "password",
										placeholder: "••••••••",
										value: form.password,
										onChange: (v) => setForm({
											...form,
											password: v
										}),
										required: true
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										disabled: loading,
										className: "mt-2 w-full rounded-full py-3.5 text-[15px] font-extrabold tracking-wide transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_16px_30px_-16px_rgba(14,17,22,0.28)] disabled:opacity-50",
										style: {
											backgroundColor: MINT,
											color: INK
										},
										onMouseEnter: (e) => e.currentTarget.style.backgroundColor = MINT_HOVER,
										onMouseLeave: (e) => e.currentTarget.style.backgroundColor = MINT,
										children: loading ? "Hold on…" : isLogin ? "Log in" : "Sign up"
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 text-center text-sm font-medium",
						style: { color: `${INK}A6` },
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isLogin ? "New here?" : "Already a member?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: isLogin ? "/auth?mode=signup" : "/auth",
							className: "font-extrabold underline underline-offset-4 transition-opacity hover:opacity-70",
							style: { color: CORAL },
							children: isLogin ? "Create an account" : "Log in"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "mt-5 block text-center text-sm font-semibold transition-opacity hover:opacity-65",
						style: { color: `${INK}8C` },
						children: "Back to home"
					})
				]
			})
		})]
	});
}
function UField({ label, value, onChange, type = "text", placeholder, required }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[11px] font-semibold uppercase",
			style: {
				color: `${INK}B3`,
				letterSpacing: "0.16em",
				fontFamily: "'JetBrains Mono', ui-monospace, monospace"
			},
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			type,
			value,
			onChange: (e) => onChange(e.target.value),
			placeholder,
			required,
			className: "mt-2 w-full rounded-2xl px-4 py-3 text-[15px] transition-colors duration-200 focus:outline-none focus:ring-2",
			style: {
				backgroundColor: "rgba(255,255,255,0.72)",
				color: INK,
				border: "1px solid rgba(24,58,50,0.14)"
			}
		})]
	});
}
//#endregion
export { AuthPage as component };
