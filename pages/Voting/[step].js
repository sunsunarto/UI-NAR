import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";
import { CANDIDATES_1, CANDIDATES_2, VOTING_TITLES, VOTING_PERIODE } from "../../lib/candidates";
import { submitVote } from "../../lib/votingApi";

const swalBase = { background: "#D9CDAE", color: "#2b2b2b", confirmButtonColor: "#129E90" };

export default function VotingStep() {
  const router = useRouter();
  const { step, id, u, v } = router.query;
  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const stepNumber = Number(step);
  const isValidStep = stepNumber === 1 || stepNumber === 2;
  const candidates = stepNumber === 1 ? CANDIDATES_1 : CANDIDATES_2;
  const voteType = stepNumber === 1 ? "isVoted1" : "isVoted2";
  const title = VOTING_TITLES[stepNumber] || `Voting ${stepNumber}`;

  useEffect(() => {
    if (!router.isReady) return;
    if (!isValidStep || !id) router.replace("/VotingLogin");
  }, [router.isReady, isValidStep, id, router]);

  useEffect(() => {
    setSelected(null);
    setIsSaved(false);
    setIsSubmitting(false);
  }, [step]);

  const goNext = useCallback(() => {
    if (stepNumber === 1) router.push(`/Voting/2?id=${id}&u=${u || ""}&v=${v || ""}`);
    else router.push("/VotingLogin");
  }, [stepNumber, id, u, v, router]);

  const handleSubmit = useCallback(async () => {
    if (!selected || isSubmitting) return;

    const result = await Swal.fire({
      title: "Konfirmasi Pilihan",
      html: `Anda memilih:<br/><b style="font-size:20px;color:#129E90;">${selected}</b>`,
      icon: "question", showCancelButton: true, confirmButtonText: "Ya, Pilih", cancelButtonText: "Batal",
      cancelButtonColor: "#8B2A12", reverseButtons: true, allowOutsideClick: false, ...swalBase,
    });
    if (!result.isConfirmed) return;

    setIsSubmitting(true);
    try {
      const res = await submitVote(id, voteType, selected);
      const body = await res.json().catch(() => null);

      if (res.status === 403) {
        await Swal.fire({ icon: "warning", title: "Sudah Voting", html: `Anda sudah memilih: <b>${body?.candidate || "-"}</b>`, ...swalBase });
        goNext();
        return;
      }
      if (!res.ok) {
        await Swal.fire({ icon: "error", title: "Gagal Menyimpan", text: body?.error || `Server responded ${res.status}`, ...swalBase });
        return;
      }
      setIsSaved(true);
    } catch (err) {
      console.error(err);
      await Swal.fire({ icon: "error", title: "Koneksi Gagal", text: "Tidak dapat terhubung ke server", ...swalBase });
    } finally {
      setIsSubmitting(false);
    }
  }, [selected, isSubmitting, id, voteType, goNext]);

  if (!isValidStep || !id) return null;

  return (
    <div style={{ minHeight: "calc(100vh - 144px)", background: "#4A4A43", display: "flex", flexDirection: "column", alignItems: "center", padding: "48px 48px 24px", boxSizing: "border-box" }}>
      {!isSaved ? (
        <>
          <h1 style={{ color: "#fff", fontSize: 26, fontWeight: 500, margin: 0, textAlign: "center" }}>{title}</h1>
          <p style={{ color: "#e5ddc8", fontSize: 20, margin: "2px 0 4px", textAlign: "center" }}>{VOTING_PERIODE}</p>
          <p style={{ color: "#e0763f", fontSize: 12, margin: "0 0 32px", textAlign: "center" }}>Pastikan memilih dari bijaksana.</p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, width: "100%", maxWidth: 1000, justifyContent: "center" }}>
            {candidates.map((candidate) => {
              const isSelected = selected === candidate;
              return (
                <button
                  key={candidate} onClick={() => setSelected(candidate)} disabled={isSubmitting}
                  style={{ background: "#c9bfa2", border: isSelected ? "3px solid #4a90d9" : "3px solid transparent", borderRadius: 10, flex: "1 1 200px", maxWidth: 240, height: 170, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#5a5a52", cursor: "pointer", fontWeight: 500 }}
                >
                  {candidate}
                </button>
              );
            })}
          </div>

          {selected && (
            <button onClick={handleSubmit} disabled={isSubmitting} style={{ ...pillBtn, marginTop: 32 }}>
              {isSubmitting ? "Menyimpan..." : "Lanjut"}
            </button>
          )}
        </>
      ) : (
        <div style={{ textAlign: "center", margin: "auto" }}>
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#D9CDAE", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M4 13l5 5L20 6" stroke="#6C63FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <p style={{ color: "#fff", fontSize: 18, margin: "0 0 24px" }}>Suara berhasil di simpan</p>
          <button onClick={goNext} style={pillBtn}>Lanjut</button>
        </div>
      )}
    </div>
  );
}

const pillBtn = { background: "#fff", border: "none", borderRadius: 24, padding: "8px 28px", fontSize: 14, color: "#2b2b2b", cursor: "pointer", fontWeight: 500 };