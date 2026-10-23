import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { fetchAllMasterData, fetchMasterDetail } from "../../lib/masterData";
import { adminLogout } from "../../lib/adminAuth";
import AdminAccountForm from "../../components/AdminAccountForm";
import MasterDetailModal from "../../components/MasterDetailModal";

export default function Admin() {
  const router = useRouter();
  const [mode, setMode] = useState("master");
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState(null);
  const [detailBusyId, setDetailBusyId] = useState(null);

  useEffect(() => {
    if (mode !== "master" || rows) return;
    fetchAllMasterData().then(setRows).catch((err) => setError(err.message));
  }, [mode, rows]);

  const openDetail = async (id) => {
    if (detailBusyId !== null) return;
    setDetailBusyId(id);
    setError("");
    try { setDetail(await fetchMasterDetail(id)); }
    catch (err) { setError(err.message); }
    finally { setDetailBusyId(null); }
  };

  const handleLogout = () => { adminLogout(); router.push("/AdminLogin"); };

  return (
    <div style={pageStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button onClick={() => router.push("/")} style={backBtnStyle}>← Back</button>
        <button onClick={handleLogout} style={backBtnStyle}>Logout Admin</button>
      </div>

      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 500, margin: "8px 0 4px" }}>Admin Host</h1>
      <p style={{ color: "#e5ddc8", fontSize: 14, margin: "0 0 24px" }}>Master data pemilik unit dan akses akun staf</p>

      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button onClick={() => setMode("master")} style={mode === "master" ? tabActive : tabInactive}>Master Data</button>
        <button onClick={() => setMode("access")} style={mode === "access" ? tabActive : tabInactive}>Admin Web</button>
      </div>

      {mode === "master" && (
        <>
          <p style={{ color: "#e5ddc8", fontSize: 13, margin: "0 0 16px" }}>
            Dibaca dari file Excel di server, hanya untuk dilihat. Nomor KTP disamarkan; klik Detail untuk melihat lengkap.
          </p>

          {error && <p style={{ color: "#ff8a70" }}>{error}</p>}
          {!rows && !error && <p style={{ color: "#e5ddc8" }}>Memuat data...</p>}

          {rows && (
            <div style={{ background: "#c9bfa2", borderRadius: 10, padding: 16, maxWidth: 1200, maxHeight: 500, overflow: "auto" }}>
              <p style={{ margin: "0 0 8px", color: "#2b2b2b", fontSize: 12, fontWeight: 600 }}>{rows.length} unit ber-KTP</p>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#2b2b2b" }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #5a5a52" }}>
                    <th style={cell}>Unit</th>
                    <th style={cell}>Pemilik</th>
                    <th style={cell}>NPP Pertelaan</th>
                    <th style={cell}>PPJB</th>
                    <th style={cell}>No. KTP</th>
                    <th style={cell}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} style={{ borderBottom: "1px solid #d9cdae" }}>
                      <td style={cell}>{row.unit || "-"}</td>
                      <td style={cell}>{row.pemilik || "-"}</td>
                      <td style={cell}>{row.npp_pertelaan ? Number(row.npp_pertelaan).toFixed(12) : "-"}</td>
                      <td style={cell}>{row.nomor_ppjb || "-"}</td>
                      <td style={{ ...cell, fontFamily: "monospace" }}>{row.nomor_ktp || "-"}</td>
                      <td style={cell}>
                        <button onClick={() => openDetail(row.id)} disabled={detailBusyId !== null} style={detailBtn}>
                          {detailBusyId === row.id ? "..." : "Detail"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {mode === "access" && (
        <>
          <p style={{ color: "#e5ddc8", fontSize: 13, margin: "0 0 16px" }}>Tambah akun staf dan atur fitur web yang boleh diakses</p>
          <AdminAccountForm />
        </>
      )}

      {detail && <MasterDetailModal detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

const pageStyle = { minHeight: "calc(100vh - 144px)", background: "#4A4A43", padding: "32px 48px", boxSizing: "border-box" };
const backBtnStyle = { background: "none", border: "none", color: "#e5ddc8", cursor: "pointer", padding: 0, fontSize: 14 };
const tabActive = { background: "#D9CDAE", border: "none", borderRadius: 20, padding: "8px 22px", fontSize: 14, color: "#2b2b2b", cursor: "pointer", fontWeight: 600 };
const tabInactive = { background: "transparent", border: "1.5px solid #D9CDAE", borderRadius: 20, padding: "8px 22px", fontSize: 14, color: "#D9CDAE", cursor: "pointer", fontWeight: 500 };
const detailBtn = { background: "#4A4A43", color: "#fff", border: "none", borderRadius: 14, padding: "3px 14px", fontSize: 12, cursor: "pointer" };
const cell = { padding: "6px 10px" };