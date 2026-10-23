import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { verifyAccountPassword } from "../lib/adminAuth";

const slug = (s) => (s || "unit").toString().replace(/[^A-Za-z0-9]+/g, "");

function drawCode(canvas, type, text, scale = 1) {
  if (type === "qr") {
    return QRCode.toCanvas(canvas, text, { width: 280 * scale, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
  }
  JsBarcode(canvas, text, {
    format: "CODE128",
    width: 3 * scale, height: 80 * scale, margin: 20 * scale,
    displayValue: true, fontSize: 16 * scale, textMargin: 4 * scale,
    background: "#ffffff", lineColor: "#000000",
  });
  return Promise.resolve();
}

export default function MasterDetailModal({ detail, onClose }) {
  const canvasRef = useRef(null);
  const [selectedKtp, setSelectedKtp] = useState(null);
  const [codeType, setCodeType] = useState("qr");
  const [codeError, setCodeError] = useState("");

  const [pendingFormat, setPendingFormat] = useState(null);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    setPendingFormat(null);
    setPassword("");
    setPwError("");

    const canvas = canvasRef.current;
    if (!selectedKtp || !canvas) return;
    setCodeError("");
    Promise.resolve()
      .then(() => drawCode(canvas, codeType, selectedKtp))
      .catch(() => setCodeError(codeType === "qr" ? "Gagal membuat QR" : "Gagal membuat barcode"));
  }, [selectedKtp, codeType]);

  const saveImage = async (format) => {
    const off = document.createElement("canvas");
    await drawCode(off, codeType, selectedKtp, 2);
    const a = document.createElement("a");
    a.href = off.toDataURL(format === "jpg" ? "image/jpeg" : "image/png", 0.95);
    a.download = `${codeType}-${slug(detail.unit)}-${selectedKtp.slice(-4)}.${format}`;
    a.click();
  };

  const confirmDownload = async () => {
    if (isVerifying) return;
    if (!password) { setPwError("Password wajib diisi"); return; }
    setIsVerifying(true);
    setPwError("");
    try {
      const res = await verifyAccountPassword(password);
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setPwError(body?.error || `Verifikasi gagal (status ${res.status})`);
        setPassword("");
        return;
      }
      try {
        await saveImage(pendingFormat);
        setPendingFormat(null);
        setPassword("");
      } catch {
        setPwError("Password benar, tetapi file gambar gagal dibuat");
      }
    } catch (err) {
      console.error(err);
      setPwError("Tidak dapat terhubung ke server");
    } finally {
      setIsVerifying(false);
    }
  };

  const fields = [
    ["Pemilik", detail.pemilik || "-"],
    ["Unit", detail.unit || "-"],
    ["NPP Pertelaan", `${Number(detail.npp_pertelaan).toFixed(12)}%`],
    ["No. PPJB", detail.nomor_ppjb || "-"],
  ];

  return (
    <div onClick={onClose} role="dialog" aria-modal="true" style={overlay}>
      <div onClick={(e) => e.stopPropagation()} style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#2b2b2b" }}>Detail Unit {detail.unit}</h2>
          <button onClick={onClose} aria-label="Tutup" style={closeBtn}>✕</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", rowGap: 6, fontSize: 14, color: "#2b2b2b" }}>
          {fields.map(([label, value]) => (
            <div key={label} style={{ display: "contents" }}>
              <span style={{ color: "#5a5a52" }}>{label}</span>
              <span>{value}</span>
            </div>
          ))}
        </div>

        <h3 style={{ margin: "20px 0 8px", fontSize: 15, color: "#2b2b2b" }}>Nomor KTP</h3>
        {detail.pemilik_ktp.map((p) => {
          const isOpen = selectedKtp === p.nomor_ktp;
          return (
            <div key={p.nomor_ktp} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, background: "#e8e0cc", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
              <div style={{ fontSize: 13, color: "#2b2b2b" }}>
                {p.pemilik && <div style={{ color: "#5a5a52" }}>{p.pemilik}</div>}
                <span style={{ fontFamily: "monospace", fontSize: 15 }}>{p.nomor_ktp}</span>
              </div>
              <button onClick={() => setSelectedKtp(isOpen ? null : p.nomor_ktp)} style={{ ...smallBtn, background: isOpen ? "#8B2A12" : "#4A4A43" }}>
                {isOpen ? "Sembunyikan" : "Tampilkan QR / Barcode"}
              </button>
            </div>
          );
        })}

        {selectedKtp && (
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <div style={{ display: "inline-flex", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setCodeType("qr")} style={codeType === "qr" ? tabOn : tabOff}>QR</button>
              <button onClick={() => setCodeType("barcode")} style={codeType === "barcode" ? tabOn : tabOff}>Barcode</button>
            </div>

            <div>
              <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto", borderRadius: 6 }} />
            </div>
            {codeError && <p style={{ color: "#8B2A12", fontSize: 12 }}>{codeError}</p>}

            {pendingFormat ? (
              <div style={{ marginTop: 12, background: "#e8e0cc", borderRadius: 10, padding: 12, textAlign: "left" }}>
                <div style={{ fontSize: 13, color: "#2b2b2b", marginBottom: 8 }}>
                  Masukkan password akunmu untuk mengunduh {pendingFormat === "png" ? "PNG" : "JPEG"}
                </div>
                <input
                  type="password" autoFocus autoComplete="off" value={password} placeholder="Password akun yang sedang login"
                  onChange={(e) => { setPassword(e.target.value); setPwError(""); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); confirmDownload(); } }}
                  style={{ ...pwInput, border: pwError ? "1.5px solid #8B2A12" : "1.5px solid transparent" }}
                />
                {pwError && <span style={{ color: "#8B2A12", fontSize: 12, display: "block", marginTop: 6 }}>{pwError}</span>}
                <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                  <button onClick={() => { setPendingFormat(null); setPassword(""); setPwError(""); }} disabled={isVerifying} style={{ ...smallBtn, background: "#5a5a52" }}>Batal</button>
                  <button onClick={confirmDownload} disabled={isVerifying} style={{ ...smallBtn, background: "#129E90" }}>
                    {isVerifying ? "Memeriksa..." : "Konfirmasi & Unduh"}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 12 }}>
                <button onClick={() => setPendingFormat("png")} style={{ ...smallBtn, background: "#129E90" }}>Unduh PNG</button>
                <button onClick={() => setPendingFormat("jpg")} style={{ ...smallBtn, background: "#129E90" }}>Unduh JPEG</button>
              </div>
            )}

            <p style={{ fontSize: 11, color: "#5a5a52", margin: "10px 0 0" }}>
              Isi kode: 16 digit nomor KTP. Mengunduh membutuhkan password akunmu, dan gambar yang diunduh memuat KTP lengkap.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const overlay = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 };
const card = { background: "#D9CDAE", borderRadius: 14, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto", boxSizing: "border-box" };
const closeBtn = { background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#2b2b2b" };
const smallBtn = { border: "none", borderRadius: 16, padding: "6px 14px", fontSize: 12, color: "#fff", cursor: "pointer", fontWeight: 500, whiteSpace: "nowrap" };
const tabOn = { background: "#4A4A43", color: "#fff", border: "none", borderRadius: 16, padding: "5px 18px", fontSize: 13, cursor: "pointer", fontWeight: 600 };
const tabOff = { background: "transparent", color: "#4A4A43", border: "1.5px solid #4A4A43", borderRadius: 16, padding: "5px 18px", fontSize: 13, cursor: "pointer" };
const pwInput = { width: "100%", boxSizing: "border-box", background: "#c9bfa2", borderRadius: 20, padding: "8px 16px", fontSize: 13, color: "#2b2b2b" };