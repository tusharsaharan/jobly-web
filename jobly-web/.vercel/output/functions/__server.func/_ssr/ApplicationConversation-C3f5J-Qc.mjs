import { o as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { n as apiCall } from "./auth-CeAVV6dB.mjs";
import { o as Send, p as LoaderCircle } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ApplicationConversation-C3f5J-Qc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function ApplicationConversation({ applicationId, token, currentUserId, counterpartName }) {
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [text, setText] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(true);
	const [sending, setSending] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		let active = true;
		setLoading(true);
		setError("");
		apiCall(`/messages/application/${applicationId}`, "GET", null, token).then((response) => {
			if (active) setMessages(Array.isArray(response) ? response : []);
		}).catch((requestError) => {
			if (active) setError(requestError.message || "Could not load this conversation.");
		}).finally(() => {
			if (active) setLoading(false);
		});
		return () => {
			active = false;
		};
	}, [applicationId, token]);
	async function send(event) {
		event.preventDefault();
		const message = text.trim();
		if (!message || sending) return;
		setSending(true);
		setError("");
		try {
			const sent = await apiCall(`/messages/application/${applicationId}`, "POST", { text: message }, token);
			setMessages((current) => [...current, sent]);
			setText("");
		} catch (requestError) {
			setError(requestError?.message ?? "Could not send the message.");
		} finally {
			setSending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		"aria-label": `Conversation with ${counterpartName}`,
		className: "mt-5 border-t border-border pt-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "font-semibold text-ink",
					children: ["Conversation with ", counterpartName]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-[10px] uppercase tracking-widest text-ink/50",
					children: "Application thread"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-live": "polite",
				className: "mt-4 max-h-72 space-y-3 overflow-y-auto pr-1",
				children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-20 items-center gap-2 text-sm text-ink/60",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
						className: "h-4 w-4 animate-spin",
						"aria-hidden": "true"
					}), " Loading messages"]
				}) : messages.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "min-h-20 text-sm leading-6 text-ink/60",
					children: "Start the conversation with a clear next step or question."
				}) : messages.map((message) => {
					const senderId = typeof message.sender === "object" ? message.sender?._id ?? message.sender?.id : message.sender;
					const mine = Boolean(currentUserId && senderId === currentUserId);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `flex ${mine ? "justify-end" : "justify-start"}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: `max-w-[85%] rounded-md px-4 py-2.5 text-sm leading-6 ${mine ? "bg-ink text-cream" : "bg-panel text-ink"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: message.text }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: `mt-1 font-mono text-[10px] uppercase tracking-widest ${mine ? "text-cream/60" : "text-ink/45"}`,
								children: [mine ? "You" : message.sender && typeof message.sender === "object" ? message.sender.name : counterpartName, message.createdAt ? ` | ${new Date(message.createdAt).toLocaleDateString()}` : ""]
							})]
						})
					}, message._id);
				})
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 text-sm text-destructive",
				role: "alert",
				children: error
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: send,
				className: "mt-4 grid gap-3 sm:grid-cols-[1fr_auto]",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "sr-only",
						htmlFor: `message-${applicationId}`,
						children: ["Message ", counterpartName]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						id: `message-${applicationId}`,
						value: text,
						onChange: (event) => setText(event.target.value),
						maxLength: 2e3,
						rows: 2,
						disabled: sending,
						placeholder: "Write a message...",
						className: "control-surface resize-y px-4 py-3 text-sm placeholder:text-ink/40 focus:border-ink focus:outline-none disabled:opacity-50"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "submit",
						disabled: sending || !text.trim(),
						className: "pill-mint inline-flex cursor-pointer gap-2 disabled:cursor-not-allowed disabled:opacity-50 sm:self-end",
						children: [sending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "h-4 w-4 animate-spin",
							"aria-hidden": "true"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, {
							className: "h-4 w-4",
							"aria-hidden": "true"
						}), "Send"]
					})
				]
			})
		]
	});
}
//#endregion
export { ApplicationConversation as t };
