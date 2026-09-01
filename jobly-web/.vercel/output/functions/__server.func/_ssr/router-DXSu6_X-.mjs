import { o as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as AuthProvider } from "./auth-CeAVV6dB.mjs";
import { _ as Github, h as Instagram, i as Twitter, m as Linkedin } from "../_libs/lucide-react.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { i as useMotionValue, n as useSpring, s as motion } from "../_libs/framer-motion.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { t as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-DXSu6_X-.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BPUxKIgF.css";
function reportError(error, context = {}) {
	if (typeof window === "undefined") return;
	console.error("Error reported:", error, context);
}
/**
* A soft mint tinge that gently follows the pointer — no visible dot, just
* a diffuse green wash over a small part of the screen. Native cursor stays
* visible. Respects reduced-motion and coarse pointers.
*/
function Cursor() {
	const x = useMotionValue(-1e3);
	const y = useMotionValue(-1e3);
	const sx = useSpring(x, {
		damping: 40,
		stiffness: 90,
		mass: .9
	});
	const sy = useSpring(y, {
		damping: 40,
		stiffness: 90,
		mass: .9
	});
	const [hover, setHover] = (0, import_react.useState)(false);
	const [enabled, setEnabled] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const fine = window.matchMedia("(pointer: fine)").matches;
		if (reduce || !fine) return;
		setEnabled(true);
		const onMove = (e) => {
			x.set(e.clientX);
			y.set(e.clientY);
			const el = e.target?.closest?.("a, button, input, textarea, select, [role='button'], [data-cursor]");
			setHover(Boolean(el));
		};
		window.addEventListener("pointermove", onMove);
		return () => window.removeEventListener("pointermove", onMove);
	}, [x, y]);
	if (!enabled) return null;
	const size = hover ? 520 : 420;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(motion.div, {
		"aria-hidden": true,
		style: {
			translateX: sx,
			translateY: sy
		},
		className: "pointer-events-none fixed left-0 top-0 z-[9998] mix-blend-multiply",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "transition-[width,height,opacity] duration-500 ease-out",
			style: {
				width: size,
				height: size,
				opacity: hover ? .09 : .065,
				transform: "translate(-50%, -50%)",
				background: "rgba(169, 235, 209, 0.48)",
				borderRadius: "999px",
				filter: "blur(34px)"
			}
		})
	});
}
var COLUMNS = [
	{
		title: "Product",
		links: [
			{
				label: "For candidates",
				to: "/auth"
			},
			{
				label: "For recruiters",
				to: "/auth"
			},
			{
				label: "How it works",
				to: "/"
			}
		]
	},
	{
		title: "Workspace",
		links: [
			{
				label: "Dashboard",
				to: "/dashboard"
			},
			{
				label: "Jobs",
				to: "/jobs"
			},
			{
				label: "Applications",
				to: "/applications"
			}
		]
	},
	{
		title: "Company",
		links: [
			{
				label: "About",
				to: "/"
			},
			{
				label: "Contact",
				to: "/"
			},
			{
				label: "Privacy",
				to: "/"
			}
		]
	}
];
function Footer() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
		className: "mt-24 border-t border-border bg-cream px-6 pb-10 pt-14 sm:px-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "inline-flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "grid h-8 w-8 place-items-center rounded-lg bg-ink text-cream",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "h-2.5 w-2.5 rounded-full bg-mint" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-display text-lg text-ink",
						children: "Jobly"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-sm text-sm leading-6 text-ink/65",
					children: "A calmer job-matching workspace. Bring your resume, understand every match, and keep every application moving."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex items-center gap-3 text-ink/60",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#",
							"aria-label": "Twitter",
							className: "hover-icon rounded-md p-1.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Twitter, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#",
							"aria-label": "Instagram",
							className: "hover-icon rounded-md p-1.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Instagram, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#",
							"aria-label": "LinkedIn",
							className: "hover-icon rounded-md p-1.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Linkedin, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#",
							"aria-label": "GitHub",
							className: "hover-icon rounded-md p-1.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Github, { className: "h-4 w-4" })
						})
					]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 gap-8 sm:grid-cols-3",
				children: COLUMNS.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-semibold text-ink",
					children: col.title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-4 space-y-3",
					children: col.links.map((link) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: link.to,
						className: "text-sm text-ink/65 transition-colors hover:text-ink",
						children: link.label
					}) }, link.label))
				})] }, col.title))
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto mt-12 flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-ink/55",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
				"© ",
				(/* @__PURE__ */ new Date()).getFullYear(),
				" Jobly. All rights reserved."
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Better job matching for candidates and recruiters." })]
		})]
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-cream px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "marker-num",
					children: "404 · lost"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-7xl text-ink",
					children: "Off the map"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-ink/70",
					children: "This page slipped through the cracks. Let's get you back."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "pill-mint mt-8",
					children: "Take me home"
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-cream px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "marker-num",
					children: "error · 500"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-display text-5xl text-ink",
					children: "Something snapped"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-ink/70",
					children: "Refresh the page or head home — we'll log the rest."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-8 flex flex-wrap justify-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "pill-mint",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "rounded-full border border-border px-5 py-2.5 text-sm text-ink",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$10 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Jobly — Find roles your resume already wins" },
			{
				name: "description",
				content: "An editorial job-matching workspace. Upload your resume, see your match score, and apply in one move."
			},
			{
				name: "author",
				content: "Jobly"
			},
			{
				property: "og:title",
				content: "Jobly — Roles your resume already wins"
			},
			{
				property: "og:description",
				content: "An editorial job-matching workspace for seekers and recruiters."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Nunito:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$10.useRouteContext();
	const isAuthPage = useRouter().state.location.pathname === "/auth";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative min-h-screen bg-cream text-ink",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-screen flex-col",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
					}), !isAuthPage && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Footer, {})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, { position: "bottom-right" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cursor, {})
			]
		}) })
	});
}
var $$splitComponentImporter$9 = () => import("./auth-C17JASMd.mjs");
var Route$9 = createFileRoute("/auth")({
	head: () => ({ meta: [{ title: "Log in · Jobly" }, {
		name: "description",
		content: "Sign in or create a Jobly account."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var $$splitComponentImporter$8 = () => import("../_app-D93pilfM.mjs");
var Route$8 = createFileRoute("/_app")({ component: lazyRouteComponent($$splitComponentImporter$8, "component") });
var $$splitComponentImporter$7 = () => import("./routes-C1EWJbTV.mjs");
var Route$7 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "Jobly | Find your next good fit" },
		{
			name: "description",
			content: "A calmer, clearer job-matching space for candidates and recruiters."
		},
		{
			property: "og:title",
			content: "Jobly | Find your next good fit"
		},
		{
			property: "og:description",
			content: "A brighter way to explore opportunities and keep hiring conversations moving."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
var $$splitComponentImporter$6 = () => import("../_app.resume-EOa7DqKT.mjs");
var Route$6 = createFileRoute("/_app/resume")({
	head: () => ({ meta: [{ title: "Resume | Jobly" }, {
		name: "description",
		content: "Upload and review your resume."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("../_app.profile-Drr-EugL.mjs");
var Route$5 = createFileRoute("/_app/profile")({
	head: () => ({ meta: [{ title: "Profile | JobMatch" }, {
		name: "description",
		content: "Your JobMatch profile."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("../_app.post-job-CIDpgBxt.mjs");
var Route$4 = createFileRoute("/_app/post-job")({
	head: () => ({ meta: [{ title: "Post a role | JobMatch" }, {
		name: "description",
		content: "Create a new opening."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("../_app.jobs-BMjSyO0W.mjs");
var Route$3 = createFileRoute("/_app/jobs")({
	head: () => ({ meta: [{ title: "Jobs | Jobly" }, {
		name: "description",
		content: "Explore every posted role with clear fit and eligibility context."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var $$splitComponentImporter$2 = () => import("../_app.dashboard-KkE520ej.mjs");
var Route$2 = createFileRoute("/_app/dashboard")({
	head: () => ({ meta: [{ title: "Overview | Jobly" }, {
		name: "description",
		content: "Your Jobly workspace overview."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("../_app.applications-BAIar3fb.mjs");
var Route$1 = createFileRoute("/_app/applications")({
	head: () => ({ meta: [{ title: "Applications | Jobly" }, {
		name: "description",
		content: "Track your applications."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("../_app.applicants-awosJUI-.mjs");
var Route = createFileRoute("/_app/applicants")({
	head: () => ({ meta: [{ title: "Applicants | Jobly" }, {
		name: "description",
		content: "Review applicants to your roles."
	}] }),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var AuthRoute = Route$9.update({
	id: "/auth",
	path: "/auth",
	getParentRoute: () => Route$10
});
var AppRoute = Route$8.update({
	id: "/_app",
	getParentRoute: () => Route$10
});
var IndexRoute = Route$7.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$10
});
var AppResumeRoute = Route$6.update({
	id: "/resume",
	path: "/resume",
	getParentRoute: () => AppRoute
});
var AppProfileRoute = Route$5.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => AppRoute
});
var AppPostJobRoute = Route$4.update({
	id: "/post-job",
	path: "/post-job",
	getParentRoute: () => AppRoute
});
var AppJobsRoute = Route$3.update({
	id: "/jobs",
	path: "/jobs",
	getParentRoute: () => AppRoute
});
var AppDashboardRoute = Route$2.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => AppRoute
});
var AppApplicationsRoute = Route$1.update({
	id: "/applications",
	path: "/applications",
	getParentRoute: () => AppRoute
});
var AppRouteChildren = {
	AppApplicantsRoute: Route.update({
		id: "/applicants",
		path: "/applicants",
		getParentRoute: () => AppRoute
	}),
	AppApplicationsRoute,
	AppDashboardRoute,
	AppJobsRoute,
	AppPostJobRoute,
	AppProfileRoute,
	AppResumeRoute
};
var rootRouteChildren = {
	IndexRoute,
	AppRoute: AppRoute._addFileChildren(AppRouteChildren),
	AuthRoute
};
var routeTree = Route$10._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
