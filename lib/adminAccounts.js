import { apiFetch } from "./adminAuth";

export async function fetchAdminAccounts() {
  const res = await apiFetch("/admin/accounts");
  if (res.status === 403) {
    const body = await res.json().catch(() => null);
    if (body?.code === "STEPUP_REQUIRED") {
      const err = new Error("STEPUP_REQUIRED");
      err.code = "STEPUP_REQUIRED";
      throw err;
    }
  }
  if (!res.ok) throw new Error(`Gagal mengambil daftar akun: ${res.status}`);
  return res.json();
}

export async function verifyStepUp(code) {
  return apiFetch("/admin/verify-2fa", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

export async function createAdminAccount(data) {
  return apiFetch("/admin/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export async function setAdminAccountActive(id, isActive) {
  return apiFetch(`/admin/accounts/${id}/active`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
}