const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000";
const TOKEN_KEY = "npp_admin_token";
const NAME_KEY = "npp_admin_name";
const MODULES_KEY = "npp_admin_modules";

const store = () => (typeof window === "undefined" ? null : window.sessionStorage);

export async function adminLogin(username, password) {
  return fetch(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function saveAdminSession(token, name, modules = []) {
  const s = store();
  if (!s) return;
  s.setItem(TOKEN_KEY, token);
  s.setItem(NAME_KEY, name || "");
  s.setItem(MODULES_KEY, JSON.stringify(modules));
}

export const getAdminToken = () => store()?.getItem(TOKEN_KEY) || null;
export const getAdminName = () => store()?.getItem(NAME_KEY) || null;

export function getAdminModules() {
  try {
    const parsed = JSON.parse(store()?.getItem(MODULES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

export function clearAdminSession() {
  const s = store();
  if (!s) return;
  [TOKEN_KEY, NAME_KEY, MODULES_KEY].forEach((k) => s.removeItem(k));
}

export function adminLogout() {
  const token = getAdminToken();
  clearAdminSession();
  if (!token) return;
  fetch(`${API_BASE}/admin/logout`, { method: "POST", headers: { "x-admin-token": token } }).catch(() => {});
}

export async function apiFetch(path, options = {}) {
  const token = getAdminToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...(options.headers || {}), ...(token ? { "x-admin-token": token } : {}) },
  });
  if (res.status === 401 && typeof window !== "undefined") {
    clearAdminSession();
    window.location.href = "/AdminLogin";
  }
  return res;
}

export async function verifyAccountPassword(password) {
  return apiFetch("/admin/verify-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}