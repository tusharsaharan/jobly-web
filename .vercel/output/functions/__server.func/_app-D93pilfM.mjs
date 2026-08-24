import { o as __toESM } from "./_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "./_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate, f as Outlet } from "./_libs/@tanstack/react-router+[...].mjs";
import { r as useAuth } from "./_ssr/auth-CeAVV6dB.mjs";
import { t as AppNav } from "./_ssr/Nav-C9P1gbyI.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_app-D93pilfM.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AppLayout() {
	const { user, ready } = useAuth();
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		if (ready && !user) navigate({ to: "/auth" });
	}, [
		ready,
		user,
		navigate
	]);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-cream",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-2 w-24 overflow-hidden rounded-full bg-ink/10",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-1/2 animate-marquee bg-lime" })
		})
	});
	if (!user) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grain min-h-screen bg-cream text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AppNav, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})]
	});
}
//#endregion
export { AppLayout as component };
