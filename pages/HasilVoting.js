import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchAllVotingData } from "../lib/votingApi";
import { computeAllResults } from "../lib/votingResults";
import { CANDIDATES_1, CANDIDATES_2, VOTING_TITLES } from "../lib/candidates";

const todayLabel = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

export default function HasilVoting() {
  const router = useRouter();
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllVotingData()
      .then((rows) => setResults(computeAllResults(rows, CANDIDATES_1, CANDIDATES_2)))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div style={pageStyle}><p style={{ color: "#fff", textAlign: "center", paddingTop: 48 }}>Gagal memuat data: {error}</p></div>;
  if (!results) return <div style={pageStyle}><p style={{ color: "#fff", textAlign: "center", paddingTop: 48 }}>Memuat data...</p></div>;

  const leader1 = results[1].totalVoted > 0 ? results[1].tally[0] : null;
  const leader2 = results[2].totalVoted > 0 ? results[2].tally[0] : null;

  return (
    <div style={pageStyle}>
      <button onClick={() => router.push("/")} style={backBtnStyle}>← Back</button>
      <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 500, textAlign: "center", margin: "8px 0 0" }}>Hasil pengungutan suara</h1>
      <p style={{ color: "#e5ddc8", fontSize: 15, textAlign: "center", margin: "4px 0 40px" }}>pada tanggal {todayLabel}</p>

      <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
        <SummaryCard candidate={leader1?.candidate || "-"} title={VOTING_TITLES[1]} onDetail={() => router.push("/HasilVotingDetail/1")} />
        <SummaryCard candidate={leader2?.candidate || "-"} title={VOTING_TITLES[2]} onDetail={() => router.push("/HasilVotingDetail/2")} />
      </div>
    </div>
  );
}

function SummaryCard({ candidate, title, onDetail }) {
  return (
    <div style={{ background: "#c9bfa2", borderRadius: 10, padding: "28px 36px", minWidth: 220, textAlign: "center" }}>
      <p style={{ margin: "0 0 4px", fontSize: 18, color: "#2b2b2b", fontWeight: 500 }}>{candidate}</p>
      <p style={{ margin: "0 0 18px", fontSize: 14, color: "#5a5a52" }}>{title}</p>
      <button onClick={onDetail} style={{ background: "#4A4A43", color: "#fff", border: "none", borderRadius: 20, padding: "8px 26px", fontSize: 14, cursor: "pointer" }}>detail</button>
    </div>
  );
}

const pageStyle = { minHeight: "calc(100vh - 144px)", background: "#4A4A43", padding: "32px 48px", boxSizing: "border-box" };
const backBtnStyle = { background: "none", border: "none", color: "#e5ddc8", cursor: "pointer", padding: 0, fontSize: 14 };