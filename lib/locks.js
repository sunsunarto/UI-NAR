import { apiFetch } from "./adminAuth";

const LABELS = { absensi: "Absensi", voting: "Voting" };

function normalizeStatus(data) {
  if (!Array.isArray(data)) return data;
  return {
    quorum: null,
    features: data.map((r) => ({
      feature: r.feature,
      is_locked: !!r.is_locked,
      force_open: false,
      effective_locked: !!r.is_locked,
      reason: r.is_locked ? "MANUAL" : null,
      message: r.is_locked ? `${LABELS[r.feature] || r.feature} sudah ditutup oleh admin` : null,
      updated_at: r.updated_at || null,
      updated_by: r.updated_by || null,
    })),
  };
}

export async function fetchLockStatus() {
  const res = await apiFetch("/locks");
  if (!res.ok) throw new Error(`Gagal mengambil status kunci: ${res.status}`);
  return normalizeStatus(await res.json());
}

export async function fetchLockRows() {
  const { features } = await fetchLockStatus();
  return features;
}

export async function fetchLocks() {
  const { features } = await fetchLockStatus();
  return {
    ...Object.fromEntries(features.map((f) => [f.feature, f.effective_locked])),
    messages: Object.fromEntries(features.map((f) => [f.feature, f.message])),
  };
}

export async function setFeatureLock(feature, locked, options = {}) {
  const { password, force } = typeof options === "string" ? { password: options } : options;
  return apiFetch(`/locks/${feature}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locked, password, force }),
  });
}