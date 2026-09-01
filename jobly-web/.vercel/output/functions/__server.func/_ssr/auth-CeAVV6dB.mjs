import { o as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-CeAVV6dB.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var API_BASE = "http://localhost:5000/api";
var ApiError = class extends Error {
	status;
	details;
	constructor(message, status, details) {
		super(message);
		this.name = "ApiError";
		this.status = status;
		this.details = details;
	}
};
async function apiCall(endpoint, method = "GET", body = null, token = null, isFormData = false) {
	const headers = {};
	if (token) headers["Authorization"] = `Bearer ${token}`;
	if (!isFormData) headers["Content-Type"] = "application/json";
	const config = {
		method,
		headers
	};
	if (body) config.body = isFormData ? body : JSON.stringify(body);
	const res = await fetch(`${API_BASE}${endpoint}`, config);
	let data = null;
	try {
		data = await res.json();
	} catch {}
	if (!res.ok) throw new ApiError(data?.message ?? data?.msg ?? `Error ${res.status}: ${res.statusText}`, res.status, data?.errors && typeof data.errors === "object" ? data.errors : void 0);
	return data;
}
var AuthContext = (0, import_react.createContext)(null);
var TOKEN_KEY = "jm_token";
function AuthProvider({ children }) {
	const [user, setUser] = (0, import_react.useState)(null);
	const [token, setToken] = (0, import_react.useState)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const fetchUser = (0, import_react.useCallback)(async (authToken) => {
		try {
			const data = await apiCall("/users/me", "GET", null, authToken);
			const u = data?.user ?? data;
			setUser(u);
		} catch {
			localStorage.removeItem(TOKEN_KEY);
			setToken(null);
			setUser(null);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		const t = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
		if (t) {
			setToken(t);
			fetchUser(t).finally(() => setReady(true));
		} else setReady(true);
	}, [fetchUser]);
	const login = (0, import_react.useCallback)((u, t) => {
		localStorage.setItem(TOKEN_KEY, t);
		setToken(t);
		setUser(u);
	}, []);
	const logout = (0, import_react.useCallback)(() => {
		localStorage.removeItem(TOKEN_KEY);
		setToken(null);
		setUser(null);
	}, []);
	const refresh = (0, import_react.useCallback)(async () => {
		if (token) await fetchUser(token);
	}, [token, fetchUser]);
	const value = (0, import_react.useMemo)(() => ({
		user,
		token,
		ready,
		login,
		logout,
		refresh
	}), [
		user,
		token,
		ready,
		login,
		logout,
		refresh
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AuthContext.Provider, {
		value,
		children
	});
}
function useAuth() {
	const ctx = (0, import_react.useContext)(AuthContext);
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
	return ctx;
}
//#endregion
export { apiCall as n, useAuth as r, AuthProvider as t };
