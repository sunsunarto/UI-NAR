import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchAllVotingData } from "../lib/api";
import {TOTAL_NPP_Gedung, TOTAL_UNIT} from "../lib/config";

export default function AbsensiDetail() {
  const router = useRouter();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

useEffect(() => {
    const loadData = () => {
      fetchAllVotingData()
        .then(setRows)
        .catch((err) => setError(err.message));
    };
    loadData();
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, []);

  if (error) return <div style={pageStyle}><p style={{ color: "#fff", textAlign: "center", paddingTop: 48 }}>Gagal memuat data: {error}</p></div>;
  if (!rows) return <div style={pageStyle}><p style={{ color: "#fff", textAlign: "center", paddingTop: 48 }}>Memuat data...</p></div>;

  const totalPemilik = rows.length;
  const totalNpp = rows.reduce((sum, r) => sum + (Number(r.npp_efektif) || 0), 0);
  const totalUnit = rows.reduce((sum, r) => sum + (r.unit ? r.unit.split(",").filter((u) => u.trim()).length : 0), 0);

  return (
    <div style={pageStyle}>
      <button onClick={() => router.push("/Absensi")} style={backBtnStyle}>← Back</button>
      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 500, textAlign: "center", margin: "8px 0 24px" }}>Detail Absensi Kehadiran</h1>

      <div style={{ display: "flex", flexDirection:"colum", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 28}}>
        <SummaryCard label="Total Pemilik Hadir" value={totalPemilik} decs="Pemilik yang hadir sudah direkap dengan total unit yang dimiliki"/>
        <SummaryCard label="Total NPP Efektif" value={`${totalNpp.toFixed(12)}%`} decs={`Total NPP Northland Ancol Residence sudah di hitung yang memilik total npp ${TOTAL_NPP_Gedung}%`} />
        <SummaryCard label="Total Unit" value={totalUnit} decs={`Total unit Nothland Ancol residence memiliki ${TOTAL_UNIT} unit`}/>
      </div>

      <div style={{ background: "#D9CDAE", borderRadius: 10, padding: 16, maxWidth: 960, margin: "0 auto", maxHeight: 500, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#2b2b2b" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #5a5a52" }}>
              <th style={cell}>No</th>
              <th style={cell}>Unit</th>
              <th style={cell}>Total NPP</th>
              <th style={cell}>NPP Efektif</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #c9bfa2" }}>
                <td style={cell}>{idx + 1}</td>
                <td style={cell}>{r.unit || "-"}</td>
                <td style={cell}>{r.npp_pertelaan ? `${Number(r.npp_pertelaan).toFixed(12)}%` : "-"}</td>
                <td style={cell}>{r.npp_efektif ? `${Number(r.npp_efektif).toFixed(12)}%` : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, decs }) {
  return (
    <div style={{ background: "#D9CDAE", borderRadius: 10, padding: "16px 28px", textAlign: "center", maxWidth: 250 }}>
      <p style={{ margin: "0 0 4px", fontSize: 22, color: "#2b2b2b", fontWeight: 700 }}>{value}</p>
      <p style={{ margin: 0, fontSize: 15, color: "#5a5a52" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 12, color: "#8B2A12", marginTop: "10px", fontWeight: "bold" }}>{decs}</p>
    </div>
  );
}

const pageStyle = { minHeight: "calc(100vh - 144px)", background: "#4A4A43", padding: "32px 48px", boxSizing: "border-box" };
const backBtnStyle = { background: "none", border: "none", color: "#e5ddc8", cursor: "pointer", padding: 0, fontSize: 14, marginBottom: 16 };
const cell = { padding: "8px 10px" };