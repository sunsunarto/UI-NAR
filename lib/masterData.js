import { apiFetch } from "./adminAuth";

export function sanitizeKtpInput(raw) {
  return raw.replace(/\D/g, "").slice(0, 16);
}

export async function fetchAllMasterData() {
  const res = await apiFetch("/master-data");
  if (!res.ok) throw new Error(`Gagal mengambil master data: ${res.status}`);
  return res.json();
}

export async function fetchMasterDetail(id) {
  const res = await apiFetch(`/master-data/${id}`);
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error || `Gagal mengambil detail: ${res.status}`);
  }
  return res.json();
}