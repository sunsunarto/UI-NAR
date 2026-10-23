import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { fetchVoterByKtp } from "../lib/votingApi";
import { toBase64Url } from "../lib/urlEncode";
import { sanitizeKtpInput } from "../lib/masterData";
import { fetchLocks } from "../lib/locks";

export default function VotingLogin() {
  const router = useRouter();
  const [ktpInput, setKtpInput] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [step, setStep] = useState("idle");
  const [voter, setVoter] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [votingLocked, setVotingLocked] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchLocks().then((l) => setVotingLocked(!!l.voting)).catch(() => {});
  }, []);

  const handleCek = async () => {
    if (votingLocked) { setFieldError("Voting sudah ditutup oleh admin"); return; }
    const cleaned = ktpInput.trim();
    if (isLoading) return;

    if (!cleaned) { setFieldError("Field ini wajib diisi"); return; }
    if (cleaned.length !== 16) { setFieldError(`No. KTP harus 16 digit angka (saat ini ${cleaned.length} digit)`); return; }
    setFieldError("");

    setIsLoading(true);
    try {
      const res = await fetchVoterByKtp(cleaned);
      if (res.status === 423) {
        setVotingLocked(true);
        setFieldError("Voting sudah ditutup oleh admin");
        return;
      }
      if (res.status === 404) { setStep("notfound"); return; }
      if (!res.ok) throw new Error(`Server responded ${res.status}`);

      const data = await res.json();
      setVoter(data);
      setStep(data.isVoted1 === 1 && data.isVoted2 === 1 ? "alreadyvoted" : "found");
    } catch (err) {
      console.error(err);
      setStep("notfound");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setStep("idle");
    setVoter(null);
    setKtpInput("");
    setFieldError("");
    inputRef.current?.focus();
  };

  const handleLanjut = () => {
    if (!voter) return;
    const u = toBase64Url(voter.pemilik);
    const v = toBase64Url(voter.unit || "-");
    router.push(`/Voting/${voter.isVoted1 === 0 ? 1 : 2}?id=${voter.id}&u=${u}&v=${v}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleCek(); }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 144px)", background: "#4A4A43", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
      <button onClick={() => router.push("/")} style={{ position: "absolute", top: 24, left: 24, background: "none", border: "none", color: "#e5ddc8", cursor: "pointer", padding: 0, fontSize: 14 }}>
        ← Back
      </button>

      {step === "idle" && (
        <>
          <h1 style={{ color: "#fff", fontSize: 32, fontWeight: 500, margin: 0, textAlign: "center", lineHeight: 1.3 }}>Login untuk melakukan<br />Voting</h1>
          <p style={{ color: "#e0763f", fontSize: 13, margin: "6px 0 28px" }}>Pastikan Sudah melakukan absensi</p>
          <input
            ref={inputRef} type="text" inputMode="numeric" maxLength={16} value={ktpInput}
            onChange={(e) => { setKtpInput(sanitizeKtpInput(e.target.value)); if (fieldError) setFieldError(""); }}
            onKeyDown={handleKeyDown} placeholder="Masukan KTP (16 digit)" autoFocus disabled={votingLocked}
            style={{ ...inputStyle, maxWidth: 340, border: fieldError ? "1.5px solid #ffb4a3" : "1.5px solid transparent" }}
          />
          {fieldError && <span style={{ color: "#ffb4a3", fontSize: 12, marginTop: 6 }}>{fieldError}</span>}
          <button onClick={handleCek} disabled={isLoading || votingLocked} style={{ ...pillBtn, marginTop: 14 }}>{isLoading ? "Memeriksa..." : "Cek"}</button>
        </>
      )}

      {step === "notfound" && (
        <Card>
          <StatusIcon type="warning" />
          <p style={{ color: "#2b2b2b", fontSize: 16, margin: "18px 0 24px", textAlign: "center" }}>Nomor KTP tidak terdaftar</p>
          <button onClick={handleReset} style={darkBtn}>Lanjut</button>
        </Card>
      )}

      {step === "alreadyvoted" && voter && (
        <Card>
          <StatusIcon type="check" />
          <div style={{ margin: "18px 0 24px" }}>
            <Row label="Nama" value={voter.pemilik} /><Row label="Unit" value={voter.unit || "-"} /><Row label="KTP" value={voter.nomor_ktp} />
          </div>
          <p style={{ color: "#8B2A12", fontSize: 13, textAlign: "center", margin: "0 0 16px" }}>Sudah menyelesaikan seluruh sesi voting</p>
          <button onClick={() => router.push("/")} style={darkBtn}>Kembali ke Menu</button>
        </Card>
      )}

      {step === "found" && voter && (
        <Card>
          <StatusIcon type="check" />
          <div style={{ margin: "18px 0 24px" }}>
            <Row label="Nama" value={voter.pemilik} /><Row label="Unit" value={voter.unit || "-"} /><Row label="KTP" value={voter.nomor_ktp} />
          </div>
          <button onClick={handleLanjut} style={darkBtn}>Lanjut</button>
        </Card>
      )}
    </div>
  );
}

function Card({ children }) {
  return <div style={{ background: "#D9CDAE", borderRadius: 20, padding: "32px 28px", width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", alignItems: "center" }}>{children}</div>;
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", color: "#2b2b2b", fontSize: 15, marginBottom: 4 }}>
      <span style={{ width: 56, flexShrink: 0 }}>{label}</span><span>: {value}</span>
    </div>
  );
}

function StatusIcon({ type }) {
  const isCheck = type === "check";
  return (
    <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#4A4A43", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {isCheck ? (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M4 13l5 5L20 6" stroke="#6C63FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg width="8" height="32" viewBox="0 0 8 32" fill="none"><rect x="0" y="0" width="8" height="20" rx="4" fill="#e0763f" /><rect x="0" y="26" width="8" height="6" rx="3" fill="#e0763f" /></svg>
      )}
    </div>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box", background: "#c9bfa2", border: "none", borderRadius: 24, padding: "12px 20px", fontSize: 15, color: "#2b2b2b", textAlign: "center" };
const pillBtn = { background: "#fff", border: "none", borderRadius: 24, padding: "10px 32px", fontSize: 15, color: "#2b2b2b", cursor: "pointer", fontWeight: 500 };
const darkBtn = { background: "#4A4A43", border: "none", borderRadius: 12, padding: "12px 0", fontSize: 15, color: "#fff", cursor: "pointer", fontWeight: 500, width: "100%" };