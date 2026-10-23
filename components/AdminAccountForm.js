import { useEffect, useState, useCallback } from "react";
import { fetchAdminAccounts, createAdminAccount, setAdminAccountActive, verifyStepUp } from "../lib/adminAccounts";
import { MODULES, ROLE_PRESETS, GRANTABLE } from "../lib/permissions";

const EMPTY_FORM = { name: "", username: "", password: "", role: "admin_vote", jobdesk: "" };
const moduleLabel = (key) => MODULES.find((m) => m.key === key)?.label || key;

export default function AdminAccountForm() {
  const [verified, setVerified] = useState(null);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);
  const [customModules, setCustomModules] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [accounts, setAccounts] = useState(null);

  const selectedModules = form.role === "custom" ? customModules : ROLE_PRESETS[form.role].modules;

  const loadAccounts = useCallback(async () => {
    try {
      setAccounts(await fetchAdminAccounts());
      setVerified(true);
    } catch (err) {
      if (err.code === "STEPUP_REQUIRED") {
        setVerified(false);
      } else {
        console.error(err);
        setOtpError("Gagal memeriksa status verifikasi, coba lagi");
        setVerified(false);
      }
    }
  }, []);
  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const handleVerify = async () => {
    if (isVerifying) return;
    if (otp.length !== 6) { setOtpError("Kode harus 6 digit"); return; }
    setOtpError("");
    setIsVerifying(true);
    try {
      const res = await verifyStepUp(otp);
      const body = await res.json().catch(() => null);
      if (!res.ok) { setOtpError(body?.error || "Verifikasi gagal"); setOtp(""); return; }
      setOtp("");
      await loadAccounts();
    } catch (err) {
      console.error(err);
      setOtpError("Tidak dapat terhubung ke server");
    } finally {
      setIsVerifying(false);
    }
  };

  const clearErr = (f) => {
    if (!fieldErrors[f]) return;
    setFieldErrors((prev) => { const n = { ...prev }; delete n[f]; return n; });
  };

  const updateField = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSuccessMsg("");
    clearErr(field);
    if (field === "role") clearErr("modules");
  };

  const toggleModule = (key) => {
    setCustomModules((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    clearErr("modules");
  };

  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Field ini wajib diisi";
    if (!form.username.trim()) errors.username = "Field ini wajib diisi";
    else if (!/^[a-zA-Z0-9_.]{3,50}$/.test(form.username.trim())) errors.username = "3–50 karakter: huruf, angka, titik, atau underscore";
    if (!form.password) errors.password = "Field ini wajib diisi";
    else if (form.password.length < 8) errors.password = "Password minimal 8 karakter";
    if (selectedModules.length === 0) errors.modules = "Pilih minimal satu fitur";
    return errors;
  };

  const handleSubmit = async () => {
    if (isSaving) return;
    setError("");
    setSuccessMsg("");

    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});

    setIsSaving(true);
    try {
      const res = await createAdminAccount({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password,
        permission_module: selectedModules.join(","),
        jobdesk: form.jobdesk.trim(),
      });
      const body = await res.json().catch(() => null);

      if (body?.code === "STEPUP_REQUIRED") { setVerified(false); return; }
      if (!res.ok) {
        const detail = body?.expected_format ? `Format: ${body.expected_format}` : body?.detail || null;
        setError(detail ? `${body?.error || "Gagal menyimpan"} — ${detail}` : body?.error || `Gagal menyimpan (status ${res.status})`);
        return;
      }

      setSuccessMsg(`✓ Akun "${form.username.trim()}" berhasil ditambahkan`);
      setForm(EMPTY_FORM);
      setCustomModules([]);
      loadAccounts();
    } catch (err) {
      console.error(err);
      setError("Tidak dapat terhubung ke server");
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async (acc) => {
    setError("");
    const res = await setAdminAccountActive(acc.id, !acc.is_active);
    const body = await res.json().catch(() => null);
    if (body?.code === "STEPUP_REQUIRED") { setVerified(false); return; }
    if (!res.ok) { setError(body?.error || "Gagal mengubah status akun"); return; }
    loadAccounts();
  };

  if (verified === null) {
    return <p style={{ color: "#e5ddc8", fontSize: 14 }}>Memeriksa verifikasi...</p>;
  }

  if (verified === false) {
    return (
      <div style={{ background: "#c9bfa2", borderRadius: 10, padding: 24, maxWidth: 360 }}>
        <h3 style={{ margin: "0 0 6px", color: "#2b2b2b", fontSize: 17 }}>Verifikasi 2 Langkah</h3>
        <p style={{ margin: "0 0 14px", color: "#5a5a52", fontSize: 13 }}>
          Fitur Akses Web butuh kode 6 digit dari aplikasi Authenticator. Verifikasi berlaku 10 menit.
        </p>
        <input
          type="text" inputMode="numeric" maxLength={6} value={otp} autoFocus placeholder="000000"
          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setOtpError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleVerify(); } }}
          style={{ ...inputStyle, width: "100%", boxSizing: "border-box", textAlign: "center", letterSpacing: 6, border: otpError ? "1.5px solid #8B2A12" : "1.5px solid transparent" }}
        />
        {otpError && <span style={errText}>{otpError}</span>}
        <button onClick={handleVerify} disabled={isVerifying} style={{ ...saveBtnStyle, marginTop: 14 }}>
          {isVerifying ? "Memeriksa..." : "Verifikasi"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "#c9bfa2", borderRadius: 10, padding: 20, maxWidth: 600 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Field label="Nama" value={form.name} onChange={updateField("name")} placeholder="Nama lengkap staf" error={fieldErrors.name} maxLength={100} />
          <Field label="Username" value={form.username} onChange={updateField("username")} placeholder="mis. andi.absensi" error={fieldErrors.username} maxLength={50} />
          <Field label="Password" type="password" value={form.password} onChange={updateField("password")} placeholder="Minimal 8 karakter" error={fieldErrors.password} />

          <label style={labelStyle}>
            Peran
            <select value={form.role} onChange={updateField("role")} style={inputStyle}>
              {Object.entries(ROLE_PRESETS).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
            </select>
          </label>

          <div>
            <span style={{ fontSize: 13, color: "#2b2b2b", display: "block", marginBottom: 4 }}>Fitur yang boleh diakses</span>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {GRANTABLE.map((key) => (
                <label key={key} style={{ fontSize: 13, color: "#2b2b2b", display: "flex", alignItems: "center", gap: 6, opacity: form.role === "custom" ? 1 : 0.7 }}>
                  <input type="checkbox" checked={selectedModules.includes(key)} disabled={form.role !== "custom"} onChange={() => toggleModule(key)} />
                  {moduleLabel(key)}
                </label>
              ))}
            </div>
            {fieldErrors.modules && <span style={errText}>{fieldErrors.modules}</span>}
          </div>

          <Field label="Jobdesk (opsional)" value={form.jobdesk} onChange={updateField("jobdesk")} placeholder="mis. Petugas meja absensi" maxLength={255} />
        </div>

        {error && <p style={{ color: "#8B2A12", fontSize: 13, marginTop: 10 }}>{error}</p>}
        {successMsg && <p style={{ color: "#0a6b5e", fontSize: 13, marginTop: 10, fontWeight: 600 }}>{successMsg}</p>}

        <button onClick={handleSubmit} disabled={isSaving} style={{ ...saveBtnStyle, marginTop: 14 }}>
          {isSaving ? "Menyimpan..." : "Tambah Akun"}
        </button>
      </div>

      {accounts && accounts.length > 0 && (
        <div style={{ background: "#c9bfa2", borderRadius: 10, padding: 16, maxWidth: 900, maxHeight: 400, overflow: "auto", marginTop: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, color: "#2b2b2b" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #5a5a52" }}>
                <th style={cell}>Nama</th><th style={cell}>Username</th><th style={cell}>Fitur</th>
                <th style={cell}>Jobdesk</th><th style={cell}>Ditambahkan</th><th style={cell}>Status</th><th style={cell}></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => {
                const isDeveloper = a.permission_module.split(",").includes("admin_host");
                return (
                  <tr key={a.id} style={{ borderBottom: "1px solid #d9cdae", opacity: a.is_active ? 1 : 0.55 }}>
                    <td style={cell}>{a.name}</td>
                    <td style={cell}>{a.username}</td>
                    <td style={cell}>{isDeveloper ? "Semua (developer)" : a.permission_module.split(",").map(moduleLabel).join(", ")}</td>
                    <td style={cell}>{a.jobdesk || "-"}</td>
                    <td style={cell}>{new Date(a.added_time).toLocaleString("id-ID")}</td>
                    <td style={cell}>{a.is_active ? "Aktif" : "Nonaktif"}</td>
                    <td style={cell}>
                      {isDeveloper ? "—" : (
                        <button onClick={() => handleToggle(a)} style={toggleBtn}>{a.is_active ? "Nonaktifkan" : "Aktifkan"}</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", error, maxLength }) {
  return (
    <label style={labelStyle}>
      {label}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} maxLength={maxLength}
        style={{ ...inputStyle, border: error ? "1.5px solid #8B2A12" : "1.5px solid transparent" }} />
      {error && <span style={errText}>{error}</span>}
    </label>
  );
}

const labelStyle = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13, color: "#2b2b2b" };
const inputStyle = { background: "#e8e0cc", border: "1.5px solid transparent", borderRadius: 8, padding: "8px 12px", fontSize: 14, color: "#2b2b2b" };
const errText = { color: "#8B2A12", fontSize: 11, marginTop: 4, display: "block" };
const saveBtnStyle = { background: "#129E90", border: "none", borderRadius: 24, padding: "10px 28px", fontSize: 14, color: "#fff", cursor: "pointer", fontWeight: 500 };
const toggleBtn = { background: "transparent", border: "1px solid #5a5a52", borderRadius: 12, padding: "3px 10px", fontSize: 12, color: "#2b2b2b", cursor: "pointer" };
const cell = { padding: "6px 10px" };