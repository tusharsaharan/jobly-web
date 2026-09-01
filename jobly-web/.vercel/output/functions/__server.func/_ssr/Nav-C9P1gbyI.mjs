import { o as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as useAuth } from "./auth-CeAVV6dB.mjs";
import { f as LogOut, n as UserRound, t as X, u as Menu } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/Nav-C9P1gbyI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Logo({ className = "" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
		to: "/",
		className: `flex items-center gap-2.5 ${className}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "inline-flex h-8 w-8 items-center justify-center rounded-md bg-ink font-display text-lg text-cream",
			children: "J"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-display text-xl text-ink",
			children: "Jobly"
		})]
	});
}
function TopNav({ links, right, dark = false }) {
	const pathname = useRouterState({ select: (state) => state.location.pathname });
	const [scrolled, setScrolled] = (0, import_react.useState)(false);
	const [menuOpen, setMenuOpen] = (0, import_react.useState)(false);
	const overlay = dark && !scrolled && !menuOpen;
	const hasSurface = !overlay;
	(0, import_react.useEffect)(() => {
		const onScroll = () => setScrolled(window.scrollY > 24);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);
	(0, import_react.useEffect)(() => {
		setMenuOpen(false);
	}, [pathname]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: `fixed top-0 z-40 w-full transition-[background-color,border-color] duration-200 ${hasSurface ? "border-b border-border bg-cream/94 backdrop-blur" : "bg-transparent"}`,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 sm:px-10",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: overlay ? "[&_*]:!text-white" : "",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
				}),
				links && links.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
					className: "hidden items-center gap-1 md:flex",
					"aria-label": "Main navigation",
					children: links.map((link) => {
						const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: link.to,
							className: `border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${active ? overlay ? "border-white text-white" : "border-ink text-ink" : overlay ? "border-transparent text-white/75 hover:text-white" : "border-transparent text-ink/60 hover:text-ink"}`,
							children: link.label
						}, link.to);
					})
				}) : null,
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: `flex items-center gap-2 sm:gap-3 ${overlay ? "[&_.nav-text]:text-white" : "[&_.nav-text]:text-ink"}`,
					children: [right, links && links.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => setMenuOpen((open) => !open),
						"aria-expanded": menuOpen,
						"aria-label": menuOpen ? "Close navigation" : "Open navigation",
						title: menuOpen ? "Close navigation" : "Open navigation",
						className: `inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors md:hidden ${overlay ? "border-white/35 text-white" : "border-border text-ink hover:bg-ink/5"}`,
						children: menuOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
							className: "h-4 w-4",
							"aria-hidden": "true"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Menu, {
							className: "h-4 w-4",
							"aria-hidden": "true"
						})
					}) : null]
				})
			]
		}), links && links.length > 0 && menuOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
			className: "border-t border-border bg-cream px-6 py-3 md:hidden",
			"aria-label": "Mobile navigation",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mx-auto grid max-w-7xl gap-1",
				children: links.map((link) => {
					const active = link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: link.to,
						onClick: () => setMenuOpen(false),
						className: `rounded-md px-3 py-3 text-sm font-semibold ${active ? "bg-mint-soft text-ink" : "text-ink/70 hover:bg-ink/5"}`,
						children: link.label
					}, link.to);
				})
			})
		}) : null]
	});
}
function PublicNav({ dark = false }) {
	const { user } = useAuth();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopNav, {
		dark,
		right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: user ? "/profile" : "/auth",
			className: "nav-text hidden text-sm font-semibold hover:opacity-70 sm:inline",
			children: user ? "Account" : "Log in"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
			to: user ? "/dashboard" : "/auth",
			className: "pill-mint text-sm",
			children: user ? "Dashboard" : "Get started"
		})] })
	});
}
function AppNav() {
	const { user, logout } = useAuth();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopNav, {
		links: user?.role === "recruiter" ? [
			{
				to: "/dashboard",
				label: "Overview"
			},
			{
				to: "/post-job",
				label: "Post a role"
			},
			{
				to: "/applicants",
				label: "Applicants"
			}
		] : [
			{
				to: "/dashboard",
				label: "Overview"
			},
			{
				to: "/jobs",
				label: "Jobs"
			},
			{
				to: "/resume",
				label: "Resume"
			},
			{
				to: "/applications",
				label: "Applications"
			}
		],
		right: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "nav-text hidden text-sm font-medium text-ink/55 lg:inline",
				children: [
					user?.name,
					" | ",
					user?.role === "recruiter" ? "Recruiter" : "Candidate"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/profile",
				"aria-label": "Open profile",
				title: "Open profile",
				className: "inline-flex h-10 w-10 items-center justify-center rounded-md border border-border text-ink transition-colors hover:bg-mint-soft",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserRound, {
					className: "h-4 w-4",
					"aria-hidden": "true"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: logout,
				"aria-label": "Sign out",
				title: "Sign out",
				className: "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md border border-border text-ink/70 transition-colors hover:bg-ink hover:text-cream",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, {
					className: "h-4 w-4",
					"aria-hidden": "true"
				})
			})
		] })
	});
}
//#endregion
export { PublicNav as n, AppNav as t };
