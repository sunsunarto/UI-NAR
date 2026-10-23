import { apiFetch } from "./adminAuth";

export async function lookupOwner(ktp) {
  return apiFetch(`/absensi/lookup/${ktp}`);
}

export async function submitAbsensi(nomor_ktp) {
  return apiFetch("/NPP_voting", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nomor_ktp }),
  });
}

export async function fetchAllVotingData() {
  const res = await apiFetch("/NPP_voting");
  if (!res.ok) throw new Error(`Gagal mengambil data: ${res.status}`);
  return res.json();
}