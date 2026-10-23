import { apiFetch } from "./adminAuth";

export async function fetchVoterByKtp(no_ktp) {
  return apiFetch(`/NPP_voting/ktp/${no_ktp}`);
}

export async function submitVote(id, voteType, candidate) {
  return apiFetch(`/NPP_voting/${id}/${voteType}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ candidate }),
  });
}

export async function fetchAllVotingData() {
  const res = await apiFetch("/NPP_voting");
  if (!res.ok) throw new Error(`Gagal mengambil data: ${res.status}`);
  return res.json();
}