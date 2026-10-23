import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { fetchLockRows, setFeatureLock } from "../lib/locks";

const FEATURES = [
  { key: "absensi", label: "Absensi" },
  { key: "voting", label: "Voting" },
];

export default function Toggels() {
  const router = useRouter();
  const [rows, setRows] = useState(null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try { setRows(await fetchLockRows()); setLoadError(""); }
    catch (err) { setLoadError(err.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  return (
    <div style={pageStyle}>
      <button onClick={() => router.push("/")} style={backBtnStyle}>← Back</button>

      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 500, margin: "8px 0 4px" }}>Kunci Fitur</h1>
      <p style={{ color: "#e5ddc8", fontSize: 14, margin: "0 0 28px", maxWidth: 560 }}>
        Tutup fitur kalau operator sudah tidak menerima absensi atau voting. Menutup tanpa password, membuka harus memasukkan password akunmu.
      </p>

      {loadError && <p style={{ color: "#ff8a70" }}>{loadError}</p>}
      {!rows && !loadError && <p style={{ color: "#e5ddc8" }}>Memuat...</p>}

      {rows && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {FEATURES.map((f) => (
            <FeatureCard key={f.key} feature={f} row={rows.find((r) => r.feature === f.key)} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureCard({ feature, row, onChanged }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = !!row?.is_locked;

  const apply = async (wantLocked) => {
    if (busy) return;
    setError("");

    if (wantLocked) {
      if (!window.confirm(`Tutup ${feature.label}? Operator tidak bisa lagi memakainya sampai kamu membukanya dengan password.`)) return;
    } else if (!password) {
      setError("Password wajib diisi untuk membuka");
      return;
    }

    setBusy(true);
    try {
      const res = await setFeatureLock(feature.key, wantLocked, wantLocked ? undefined : password);
      const body = await res.json().catch(() => null);
      if (!res.ok) { setError(body?.error || `Gagal (status ${res.status})`); return; }
      setPassword("");
      await onChanged();
    } catch (err) {
      console.error(err);
      setError("Tidak dapat terhubung ke server");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: "#D9CDAE", borderRadius: 14, padding: 24, width: 300 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 20, color: "#2b2b2b" }}>{feature.label}</h2>
        <span style={{ background: locked ? "#8B2A12" : "#129E90", color: "#fff", fontSize: 12, fontWeight: 600, borderRadius: 12, padding: "3px 12px" }}>
          {locked ? "Ditutup" : "Dibuka"}
        </span>
      </div>

      {row?.updated_by && (
        <p style={{ margin: "8px 0 0", fontSize: 11, color: "#5a5a52" }}>
          Terakhir diubah oleh {row.updated_by}, {new Date(row.updated_at).toLocaleString("id-ID")}
        </p>
      )}

      {!locked ? (
        <button onClick={() => apply(true)} disabled={busy} style={{ ...btn, background: "#8B2A12", marginTop: 18 }}>
          {busy ? "Memproses..." : `Tutup ${feature.label}`}
        </button>
      ) : (
        <>
          <input
            type="password" value={password} placeholder="Password untuk membuka"
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); apply(false); } }}
            style={{ ...inputStyle, marginTop: 18, border: error ? "1.5px solid #8B2A12" : "1.5px solid transparent" }}
          />
          <button onClick={() => apply(false)} disabled={busy} style={{ ...btn, background: "#129E90", marginTop: 10 }}>
            {busy ? "Memeriksa..." : `Buka ${feature.label}`}
          </button>
        </>
      )}

      {error && <p style={{ color: "#8B2A12", fontSize: 12, margin: "10px 0 0" }}>{error}</p>}
    </div>
  );
}

const pageStyle = { minHeight: "calc(100vh - 144px)", background: "#4A4A43", padding: "32px 48px", boxSizing: "border-box" };
const backBtnStyle = { background: "none", border: "none", color: "#e5ddc8", cursor: "pointer", padding: 0, fontSize: 14 };
const inputStyle = { width: "100%", boxSizing: "border-box", background: "#c9bfa2", borderRadius: 24, padding: "10px 18px", fontSize: 14, color: "#2b2b2b" };
const btn = { width: "100%", border: "none", borderRadius: 24, padding: "10px 0", fontSize: 14, color: "#fff", cursor: "pointer", fontWeight: 500 };