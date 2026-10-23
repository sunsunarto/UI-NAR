export const MODULES = [
  { key: "absensi", label: "Absensi", href: "/Absensi" },
  { key: "voting", label: "Pemilihan suara", href: "/VotingLogin" },
  { key: "hasil_voting", label: "Hasil Pemilihan Suara", href: "/HasilVoting" },
  { key: "admin_host", label: "Admin Host", href: "/AdminHost" },
];

export const GRANTABLE = ["absensi", "voting", "hasil_voting"];

export const ROLE_PRESETS = {
  admin_vote: { label: "Admin Vote (hanya voting)", modules: ["voting"] },
  admin_help: { label: "Admin Help (absensi + lihat hasil voting)", modules: ["absensi", "hasil_voting"] },
  custom: { label: "Custom (pilih sendiri)", modules: [] },
};

const ROUTE_RULES = [
  { prefix: "/AdminHost", module: "admin_host" },
  { prefix: "/toggels", module: "admin_host" },
  { prefix: "/Absensi", module: "absensi" },
  { prefix: "/Voting", module: "voting" },
  { prefix: "/HasilVoting", module: "hasil_voting" },
];

export function requiredModuleFor(pathname) {
  const rule = ROUTE_RULES.find((r) => pathname.startsWith(r.prefix));
  return rule ? rule.module : null;
}