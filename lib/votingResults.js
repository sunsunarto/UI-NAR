const npp = (r) => Number(r.npp_efektif) || 0;
const sumNpp = (list) => list.reduce((s, r) => s + npp(r), 0);

/**
 * Total npp_efektif SEMUA pemilik yang hadir = 100%.
 * Yang sudah memilih dihitung per kandidat. Sisanya (hadir tapi belum memilih di sesi ini)
 * masuk "pending": "belum voting" selama voting dibuka, "walk out" setelah voting ditutup.
 */
export function computeResults(rows, candidates, voteTypeField, candidateField) {
  const totalNpp = sumNpp(rows);
  const voters = rows.filter((r) => r[voteTypeField] === 1);
  const pending = rows.filter((r) => r[voteTypeField] !== 1);
  const pct = (value) => (totalNpp > 0 ? (value / totalNpp) * 100 : 0);

  const tally = candidates
    .map((candidate) => {
      const candidateVoters = voters.filter((r) => r[candidateField] === candidate);
      const nppSum = sumNpp(candidateVoters);
      return { candidate, count: candidateVoters.length, nppSum, pct: pct(nppSum) };
    })
    .sort((a, b) => b.nppSum - a.nppSum);

  const pendingNpp = sumNpp(pending);

  return {
    totalPeople: rows.length,      // semua yang hadir
    totalVoted: voters.length,     // yang sudah memilih di sesi ini
    totalNpp,                      // = 100%
    pendingCount: pending.length,
    pendingNpp,
    pendingPct: pct(pendingNpp),
    tally,
  };
}

export function computeAllResults(rows, candidates1, candidates2) {
  return {
    1: computeResults(rows, candidates1, "isVoted1", "candidate1"),
    2: computeResults(rows, candidates2, "isVoted2", "candidate2"),
  };
}