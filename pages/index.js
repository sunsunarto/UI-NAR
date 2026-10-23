import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { MODULES } from "../lib/permissions";
import { getAdminModules } from "../lib/adminAuth";

export default function Home() {
  const router = useRouter();
  const [granted, setGranted] = useState(null);

  useEffect(() => { setGranted(getAdminModules()); }, []);

  const visible = MODULES.filter((m) => granted?.includes(m.key));

  return (
    <div style={{ minHeight: "calc(100vh - 144px)", background: "#4A4A43", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px" }}>
      <h1 style={{ color: "#D9CDAE", fontSize: 32, fontWeight: 500, margin: 0, textAlign: "center" }}>Northland Ancol Residence</h1>
      <p style={{ fontFamily: "'Great Vibes', cursive", color: "#fff", fontSize: 28, margin: "4px 0 40px", textAlign: "center" }}>
        my home, my pleasure, my prosperity
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%", maxWidth: 340 }}>
        {visible.map((m) => (
          <button key={m.key} onClick={() => router.push(m.href)} style={menuBtn}>{m.label}</button>
        ))}
        {granted && visible.length === 0 && (
          <p style={{ color: "#e5ddc8", textAlign: "center", fontSize: 14 }}>
            Akun ini belum punya izin ke fitur apa pun. Hubungi developer.
          </p>
        )}
      </div>
    </div>
  );
}

const menuBtn = { background: "#D9CDAE", border: "none", borderRadius: 10, padding: "18px 24px", fontSize: 18, color: "#2b2b2b", cursor: "pointer", fontFamily: "'Poppins', sans-serif" };