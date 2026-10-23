import { useState } from "react";
import { useRouter } from "next/router";
import { adminLogin, saveAdminSession } from "../lib/adminAuth";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const clearErr = (f) => {
    if (!fieldErrors[f]) return;
    setFieldErrors((prev) => { const n = { ...prev }; delete n[f]; return n; });
  };

  const handleLogin = async () => {
    if (isLoading) return;
    setError("");

    const errors = {};
    if (!username.trim()) errors.username = "Field ini wajib diisi";
    if (!password.trim()) errors.password = "Field ini wajib diisi";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});

    setIsLoading(true);
    try {
      const res = await adminLogin(username.trim(), password);
      const body = await res.json().catch(() => null);
      if (!res.ok) { setError(body?.error || "Login gagal"); return; }

      saveAdminSession(body.token, body.name, body.modules);
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Tidak dapat terhubung ke server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); handleLogin(); }
  };

  return (
    <div style={{ minHeight: "calc(100vh - 144px)", background: "#4A4A43", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ background: "#D9CDAE", borderRadius: 14, padding: 32, width: "100%", maxWidth: 340 }}>
        <h2 style={{ margin: "0 0 20px", color: "#2b2b2b", fontSize: 20, textAlign: "center" }}>Login</h2>

        <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); clearErr("username"); }} onKeyDown={handleKeyDown} placeholder="Username" autoFocus
          style={{ ...inputStyle, border: fieldErrors.username ? "1.5px solid #8B2A12" : "1.5px solid transparent" }} />
        {fieldErrors.username && <span style={errText}>{fieldErrors.username}</span>}

        <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); clearErr("password"); }} onKeyDown={handleKeyDown} placeholder="Password"
          style={{ ...inputStyle, marginTop: 10, border: fieldErrors.password ? "1.5px solid #8B2A12" : "1.5px solid transparent" }} />
        {fieldErrors.password && <span style={errText}>{fieldErrors.password}</span>}

        {error && <p style={{ color: "#8B2A12", fontSize: 13, marginTop: 10 }}>{error}</p>}

        <button onClick={handleLogin} disabled={isLoading} style={{ ...pillBtn, marginTop: 16, width: "100%" }}>
          {isLoading ? "Memeriksa..." : "Masuk"}
        </button>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", boxSizing: "border-box", background: "#c9bfa2", borderRadius: 24, padding: "12px 20px", fontSize: 15, color: "#2b2b2b", display: "block" };
const errText = { color: "#8B2A12", fontSize: 11, display: "block", marginTop: 4 };
const pillBtn = { background: "#4A4A43", border: "none", borderRadius: 24, padding: "10px 28px", fontSize: 15, color: "#fff", cursor: "pointer", fontWeight: 500 };