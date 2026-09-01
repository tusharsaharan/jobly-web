import { d as require_jsx_runtime } from "../_libs/@react-three/drei+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/AtsScoreRing-Bs25r7az.js
var import_jsx_runtime = require_jsx_runtime();
function AtsScoreRing({ score, size = 64 }) {
	const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
	const radius = (size - 8) / 2;
	const circumference = radius * 2 * Math.PI;
	const strokeDashoffset = circumference - safeScore / 100 * circumference;
	let color = "text-[#a65b75]";
	if (safeScore >= 40) color = "text-[#b48644]";
	if (safeScore >= 70) color = "text-[#4f8c78]";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex items-center justify-center",
		style: {
			width: size,
			height: size
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			className: "absolute inset-0 -rotate-90 transform",
			width: size,
			height: size,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				className: "text-ink/10",
				strokeWidth: "4",
				stroke: "currentColor",
				fill: "transparent",
				r: radius,
				cx: size / 2,
				cy: size / 2
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				className: `${color} transition-all duration-1000 ease-out`,
				strokeWidth: "4",
				strokeDasharray: circumference,
				strokeDashoffset,
				strokeLinecap: "round",
				stroke: "currentColor",
				fill: "transparent",
				r: radius,
				cx: size / 2,
				cy: size / 2
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-sm font-bold text-ink",
			children: safeScore
		})]
	});
}
var BREAKDOWN_LABELS = {
	skillMatch: "Skill Match",
	experienceRelevance: "Experience",
	educationFit: "Education",
	projectsAndAchievements: "Projects & Awards",
	keywordOptimization: "Keywords",
	overallPresentation: "Presentation"
};
function AtsBreakdown({ breakdown, tips }) {
	if (!breakdown) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-4 space-y-3 border-t border-border pt-4 text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2",
			children: Object.entries(BREAKDOWN_LABELS).map(([key, label]) => {
				const val = breakdown[key];
				if (val === void 0 || val === null) return null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BreakdownBar, {
					label,
					score: val
				}, key);
			})
		}), tips && tips.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 border-t border-border pt-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-semibold text-ink",
				children: "Improvement tips:"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 list-inside list-disc space-y-1 text-ink/70",
				children: tips.map((t, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: t }, i))
			})]
		})]
	});
}
function BreakdownBar({ label, score }) {
	const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
	let barColor = "bg-[#c28ea0]";
	if (safeScore >= 40) barColor = "bg-[#d4ae72]";
	if (safeScore >= 70) barColor = "bg-[#7bbda8]";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-1 flex justify-between text-xs text-ink/70",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [safeScore, "%"] })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "h-1.5 w-full overflow-hidden bg-ink/10",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: `h-full ${barColor} transition-all duration-1000 ease-out`,
			style: { width: `${safeScore}%` }
		})
	})] });
}
//#endregion
export { AtsScoreRing as n, AtsBreakdown as t };
