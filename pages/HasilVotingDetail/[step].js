import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchAllVotingData } from "../../lib/votingApi";
import { fetchLockStatus } from "../../lib/locks";
import { computeAllResults } from "../../lib/votingResults";
import { CANDIDATES_1, CANDIDATES_2, VOTING_TITLES } from "../../lib/candidates";

const REFRESH_MS = 30000;

const todayLabel = new Date().toLocaleDateString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const STATE_NOTE = {
  closed: { text: "Voting sudah ditutup: pemilik yang hadir tetapi tidak memilih dinyatakan walk out", color: "#ffb4a3" },
  waiting: { text: "Voting belum dibuka (kuorum belum tercapai): semua yang hadir dianggap belum voting", color: "#e0763f" },
  running: { text: "Voting masih berjalan: pemilik yang belum memilih dianggap belum voting", color: "#e0763f" },
};

export default function HasilVotingDetail() {
  const router = useRouter();
  const stepNumber = Number(router.query.step);
  const isValidStep = stepNumber === 1 || stepNumber === 2;

  const [results, setResults] = useState(null);
  const [votingState, setVotingState] = useState("running"); // closed | waiting | running
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState(null);

  // Ambil data sekarang, lalu ulangi tiap 30 detik. Data lama tetap tampil selama pembaruan.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [rows, lockStatus] = await Promise.all([
          fetchAllVotingData(),
          fetchLockStatus().catch(() => null), // status kunci gagal dibaca: anggap voting belum ditutup
        ]);
        if (cancelled) return;

        const voting = lockStatus?.features?.find((f) => f.feature === "voting");
        setResults(computeAllResults(rows, CANDIDATES_1, CANDIDATES_2));
        setVotingState(voting?.is_locked ? "closed" : voting?.reason === "QUORUM_NOT_MET" ? "waiting" : "running");
        setUpdatedAt(new Date());
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, []);

  useEffect(() => {
    if (router.isReady && !isValidStep) router.replace("/HasilVoting");
  }, [router.isReady, isValidStep, router]);

  if (!router.isReady || !isValidStep) return null;

  if (!results) {
    return (
      <div style={pageStyle}>
        <p style={{ color: "#fff", textAlign: "center", paddingTop: 48 }}>
          {error ? `Gagal memuat data: ${error}` : "Memuat data..."}
        </p>
      </div>
    );
  }

  const result = results[stepNumber];
  const closed = votingState === "closed";
  const hasVotes = result.totalVoted > 0;
  const hasAttendance = result.totalNpp > 0;
  const note = STATE_NOTE[votingState];

  return (
    <div style={pageStyle}>
      <button onClick={() => router.push("/HasilVoting")} style={backBtnStyle}>
        ← Back
      </button>

      <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 500, textAlign: "center", margin: "8px 0 0" }}>
        Hasil pengungutan suara {VOTING_TITLES[stepNumber]}
      </h1>
      <p style={{ color: "#e5ddc8", fontSize: 15, textAlign: "center", margin: "4px 0 8px" }}>
        pada tanggal {todayLabel}
      </p>
      <p style={{ color: note.color, fontSize: 12, textAlign: "center", margin: "0 0 28px" }}>{note.text}</p>

      {!hasAttendance && (
        <p style={{ color: "#e5ddc8", textAlign: "center" }}>Belum ada pemilik yang hadir.</p>
      )}

      {hasAttendance && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
          {result.tally.map((item) => (
            <ResultCard
              key={item.candidate}
              title={item.candidate}
              big={hasVotes ? `${item.pct.toFixed(2)}%` : "-"}
              small={`NPP: ${item.nppSum.toFixed(12)}%`}
              footer={`Total Suara: ${item.count}`}
            />
          ))}

          <ResultCard
            dashed
            title={closed ? "Walk out" : "Belum voting"}
            big={`${result.pendingPct.toFixed(2)}%`}
            small={`NPP: ${result.pendingNpp.toFixed(12)}%`}
            footer={`${result.pendingCount} pemilik`}
            footerBg={closed ? "#8B2A12" : "#6b6b63"}
            footerColor="#fff"
          />
        </div>
      )}

      {hasAttendance && (
        <p style={{ color: "#e5ddc8", fontSize: 12, textAlign: "center", marginTop: 24 }}>
          Total hadir: {result.totalPeople} pemilik — Total NPP efektif: {result.totalNpp.toFixed(12)}% (dihitung sebagai 100%)
        </p>
      )}

      <p style={{ color: "#a8a291", fontSize: 11, textAlign: "center", marginTop: 8 }}>
        Diperbarui {updatedAt?.toLocaleTimeString("id-ID")} · otomatis setiap 30 detik
        {error ? " · gagal memperbarui, menampilkan data terakhir" : ""}
      </p>
    </div>
  );
}

function ResultCard({ title, big, small, footer, footerBg = "#d4a017", footerColor = "#3a2a05", dashed = false }) {
  return (
    <div style={{ width: 170, borderRadius: 10, overflow: "hidden", border: dashed ? "2px dashed #D9CDAE" : "2px solid transparent", boxSizing: "border-box" }}>
      <div style={{ background: "#c9bfa2", padding: "28px 16px", textAlign: "center" }}>
        <p style={{ margin: "0 0 8px", fontSize: 16, color: "#2b2b2b" }}>{title}</p>
        <p style={{ margin: 0, fontSize: 22, color: "#2b2b2b", fontWeight: 600 }}>{big}</p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "#5a5a52" }}>{small}</p>
      </div>
      <div style={{ background: footerBg, padding: "8px 0", textAlign: "center", fontSize: 12, color: footerColor }}>{footer}</div>
    </div>
  );
}

const pageStyle = {
  minHeight: "calc(100vh - 144px)",
  background: "#4A4A43",
  padding: "32px 48px",
  boxSizing: "border-box",
};

const backBtnStyle = { background: "none", border: "none", color: "#e5ddc8", cursor: "pointer", padding: 0, fontSize: 14 };