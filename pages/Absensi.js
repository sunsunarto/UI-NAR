import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { sanitizeKtpInput } from "../lib/masterData";
import { lookupOwner, submitAbsensi, fetchAllVotingData } from "../lib/api";
import { fetchLocks } from "../lib/locks";
import { TOTAL_NPP_Gedung, QUORUM_THRESHOLD_PERCENT } from "../lib/config";
import DonutChart from "../components/DonutChart";

const todayLabel = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const describeProblems = (b) =>
  [
    ...(b?.unit_issues || []).map((u) => `${u.unit}: ${u.issues.join(", ")}`),
    ...(b?.units_taken || []).map((u) => `${u.unit}: sudah diwakili pemilik bersama (KTP ${u.by})`),
  ].join(" | ");

export default function Absensi() {
  const router = useRouter();
  const [ktpInput, setKtpInput] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [step, setStep] = useState("idle"); // idle | notfound | found | saved
  const [owner, setOwner] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [absensiLocked, setAbsensiLocked] = useState(false);
  const [totalHadirNPP, setTotalHadirNPP] = useState(0);
  const [totalPemilikHadir, setTotalPemilikHadir] = useState(0);
  const inputRef = useRef(null);

  const percentage = (totalHadirNPP);
  const isQuorumMet = percentage >= QUORUM_THRESHOLD_PERCENT;

  const refreshStats = async () => {
    try {
      const rows = await fetchAllVotingData();
      setTotalHadirNPP(rows.reduce((acc, r) => acc + (Number(r.npp_pertelaan) || 0), 0));
      setTotalPemilikHadir(rows.length);
    } catch (err) {
      console.error("Gagal ambil statistik kehadiran:", err);
    }
  };

  useEffect(() => { refreshStats(); }, []);

  useEffect(() => {
    fetchLocks().then((l) => setAbsensiLocked(!!l.absensi)).catch(() => {});
  }, []);

  useEffect(() => {
    const refocus = () => { if (step === "idle") inputRef.current?.focus(); };
    refocus();
    window.addEventListener("click", refocus);
    return () => window.removeEventListener("click", refocus);
  }, [step]);

  const runLookup = async (ktp, picking = false) => {
    setErrorMsg("");
    setIsBusy(true);
    try {
      const res = await lookupOwner(ktp);
      const body = await res.json().catch(() => null);

      if (res.status === 423) {
        setAbsensiLocked(true);
        setErrorMsg(body?.error || "Absensi sudah ditutup oleh admin");
        if (!picking) setStep("idle");
        return;
      }
      if (!res.ok) {
        if (!picking) setStep("notfound");
        if (picking || res.status !== 404) {
          const detail = describeProblems(body);
          setErrorMsg(detail ? `${body?.error} — ${detail}` : body?.error || `Gagal memeriksa data (status ${res.status})`);
        }
        return;
      }
      setOwner(body);
      setStep("found");
    } catch (err) {
      console.error(err);
      setErrorMsg("Tidak dapat terhubung ke server");
    } finally {
      setIsBusy(false);
    }
  };

  const handleCek = () => {
    if (absensiLocked) { setErrorMsg("Absensi sudah ditutup oleh admin"); return; }
    const cleaned = ktpInput.trim();
    setErrorMsg("");

    if (!cleaned) { setFieldError("Field ini wajib diisi"); return; }
    if (cleaned.length !== 16) { setFieldError(`No. KTP harus 16 digit angka (saat ini ${cleaned.length} digit)`); return; }
    setFieldError("");

    runLookup(cleaned);
  };

  const resetToIdle = () => {
    setStep("idle");
    setOwner(null);
    setKtpInput("");
    setFieldError("");
    setErrorMsg("");
    inputRef.current?.focus();
  };

  const handleSesuai = async () => {
    if (!owner || isBusy) return;
    setIsBusy(true);
    setErrorMsg("");

    try {
      const res = await submitAbsensi(owner.nomor_ktp);
      const body = await res.json().catch(() => null);

      if (res.status === 423 || res.status === 409 || res.status === 422) {
        if (res.status === 423) setAbsensiLocked(true);
        const detail = describeProblems(body);
        setErrorMsg(detail ? `${body?.error} — ${detail}` : body?.error || "Gagal menyimpan data");
        setStep("idle");
        setOwner(null);
        setKtpInput("");
        return;
      }
      if (!res.ok) { setErrorMsg(body?.error || `Gagal menyimpan data (status ${res.status})`); return; }

      await refreshStats();
      setStep("saved");
    } catch (err) {
      console.error(err);
      setErrorMsg("Tidak dapat terhubung ke server");
    } finally {
      setIsBusy(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleCek(); }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 144px)", background: "#4A4A43", padding: "40px 48px", boxSizing: "border-box" }}>
      <button onClick={() => router.push("/")} style={{ background: "none", border: "none", color: "#e5ddc8", cursor: "pointer", padding: 0, fontSize: 14, marginBottom: 24 }}>
        ← Back
      </button>

      <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "stretch", justifyContent: "center" }}>
        <div style={{ flex: "1 1 400px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
            <h1 style={{ color: "#fff", fontSize: 30, fontWeight: 600, margin: 0, lineHeight: 1.3 }}>
              Absensi Kehadiran Rapat<br />Tanggal {todayLabel}
            </h1>

            {absensiLocked && (
              <p style={{ color: "#ffb4a3", marginTop: 16, fontWeight: 600 }}>Absensi sudah ditutup oleh admin</p>
            )}

            {step === "idle" && (
              <>
                <input
                  ref={inputRef} type="text" inputMode="numeric" maxLength={16} value={ktpInput}
                  disabled={absensiLocked}
                  onChange={(e) => { setKtpInput(sanitizeKtpInput(e.target.value)); if (fieldError) setFieldError(""); }}
                  onKeyDown={handleKeyDown} placeholder="Masukan KTP (16 digit)" autoFocus
                  style={{ ...inputStyle, marginTop: 24, maxWidth: 360, border: fieldError ? "1.5px solid #ffb4a3" : "1.5px solid transparent" }}
                />
                {fieldError && <span style={{ color: "#ffb4a3", fontSize: 12, marginTop: 6 }}>{fieldError}</span>}
                <button onClick={handleCek} disabled={absensiLocked || isBusy} style={{ ...pillBtn, marginTop: 12 }}>
                  {isBusy ? "Memeriksa..." : "Cek"}
                </button>
                {errorMsg && <p style={{ color: "#ffb4a3", marginTop: 12, maxWidth: 360, textAlign: "center" }}>{errorMsg}</p>}
              </>
            )}

            {step === "notfound" && (
              <>
                <div style={{ ...inputStyle, marginTop: 24, maxWidth: 360 }}>{ktpInput}</div>
                <button onClick={resetToIdle} style={{ ...pillBtn, marginTop: 12 }}>ulangi</button>
                {errorMsg && <p style={{ color: "#ffb4a3", marginTop: 12, maxWidth: 360, textAlign: "center" }}>{errorMsg}</p>}
              </>
            )}

            {step === "found" && (
              <>
                <div style={{ ...inputStyle, marginTop: 24, maxWidth: 360 }}>{ktpInput}</div>
                <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                  <button onClick={resetToIdle} disabled={isBusy} style={pillBtnOutline}>Tidak</button>
                  <button onClick={handleSesuai} disabled={isBusy} style={pillBtn}>{isBusy ? "Menyimpan..." : "Sesuai"}</button>
                </div>
                {errorMsg && <p style={{ color: "#ffb4a3", marginTop: 12, maxWidth: 360, textAlign: "center" }}>{errorMsg}</p>}
              </>
            )}
          </div>

          <div style={{ background: "#D9CDAE", borderRadius: 14, marginTop: 20, flex: 1, minHeight: 220, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, boxSizing: "border-box" }}>
            {step === "idle" && <span style={{ color: "#5a5a52", fontSize: 16 }}>&nbsp;</span>}
            {step === "notfound" && <span style={{ color: "#5a5a52", fontSize: 18 }}>tidak ada data</span>}

            {step === "found" && owner && (
              <div style={{ width: "100%", color: "#2b2b2b", fontSize: 15, lineHeight: 1.9 }}>
                {owner.choices.length > 1 && (
                  <div style={{ marginBottom: 10, padding: 10, borderRadius: 8, background: "#e8e0cc", lineHeight: 1.6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      Kepemilikan bersama. Pilih satu yang hadir dan memilih:
                    </div>
                    {owner.choices.map((c) => (
                      <label key={c.nomor_ktp} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, cursor: "pointer" }}>
                        <input
                          type="radio" name="hadir" disabled={isBusy}
                          checked={owner.nomor_ktp === c.nomor_ktp}
                          onChange={() => { if (owner.nomor_ktp !== c.nomor_ktp) runLookup(c.nomor_ktp, true); }}
                        />
                        {c.pemilik ? `${c.pemilik} — ${c.nomor_ktp}` : c.nomor_ktp}
                      </label>
                    ))}
                  </div>
                )}

                <div><b>Nama</b> : {owner.pemilik}</div>
                <div>
                  <b>Unit</b> :{" "}
                  {owner.units.length > 1 ? (
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18 }}>
                      {owner.units.map((u) => <li key={u}>{u}</li>)}
                    </ul>
                  ) : owner.unit}
                </div>
                <div><b>KTP</b> : {owner.nomor_ktp}</div>
                <div style={{ marginTop: 6, fontSize: 13, color: "#5a5a52" }}>
                  {owner.units.length} unit · NPP {Number(owner.npp_pertelaan).toFixed(12)}% → efektif {Number(owner.npp_efektif).toFixed(12)}%
                  {Number(owner.npp_pertelaan) > Number(owner.npp_efektif).toFixed(12) && " (dibatasi 20%)"}
                </div>

                {owner.unit_issues.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#8B2A12" }}>
                    Unit bermasalah (tidak dihitung):
                    <ul style={{ margin: "2px 0 0", paddingLeft: 18 }}>
                      {owner.unit_issues.map((item, idx) => <li key={idx}><b>{item.unit}</b> — {item.issues.join(", ")}</li>)}
                    </ul>
                  </div>
                )}
                {owner.units_taken.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#8B2A12" }}>
                    Sudah diwakili pemilik bersama (tidak dihitung): {owner.units_taken.map((u) => u.unit).join(", ")}
                  </div>
                )}
              </div>
            )}

            {step === "saved" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#129E90", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: "#fff" }}>✓</div>
                <span style={{ color: "#2b2b2b", fontSize: 16 }}>Data Berhasil di simpan</span>
                <button onClick={resetToIdle} style={pillBtn}>Lanjut</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: "1 1 380px", background: "#D9CDAE", borderRadius: 14, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
            <DonutChart percentage={percentage} />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <LegendItem color="#129E90" label="Hadir" />
              <LegendItem color="#8B2A12" label="Tidak hadir" />
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#2b2b2b", fontSize: 18, margin: 0 }}>Status: {isQuorumMet ? "Sah untuk Rapat" : "Belum Sah untuk Rapat"}</p>
            <p style={{ color: "#2b2b2b", fontSize: 15, margin: "10px 0 0", fontWeight: 600 }}>Hadir: {percentage.toFixed(12)}%</p>
            <p style={{ color: "#5a5a52", fontSize: 13, margin: "2px 0 0" }}>
              {totalHadirNPP.toLocaleString("id-ID", { maximumFractionDigits: 12 })} % dari {TOTAL_NPP_Gedung.toLocaleString("id-ID")} % · {totalPemilikHadir} pemilik
            </p>
            <p style={{ color: "#5a5a52", fontSize: 12, margin: "2px 0 0" }}>Kuorum minimal {QUORUM_THRESHOLD_PERCENT}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ width: 18, height: 18, borderRadius: "50%", background: color, display: "inline-block" }} />
      <span style={{ color: "#2b2b2b", fontSize: 16 }}>{label}</span>
    </div>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box", background: "#c9bfa2", border: "none", borderRadius: 24, padding: "12px 20px", fontSize: 15, color: "#2b2b2b" };
const pillBtn = { background: "#fff", border: "none", borderRadius: 24, padding: "10px 28px", fontSize: 15, color: "#2b2b2b", cursor: "pointer", fontWeight: 500 };
const pillBtnOutline = { background: "transparent", border: "1.5px solid #fff", borderRadius: 24, padding: "10px 28px", fontSize: 15, color: "#fff", cursor: "pointer", fontWeight: 500 };