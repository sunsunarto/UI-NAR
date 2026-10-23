import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { Layout, Typography } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { fromBase64Url } from "../lib/urlEncode";
import { getAdminName, getAdminToken, adminLogout } from "../lib/adminAuth";

const { Header, Footer, Content } = Layout;
const { Text } = Typography;

export default function AppLayout({ children }) {
  const router = useRouter();
  const isVotingFlow = router.pathname.startsWith("/Voting");

  const nama = router.query.u ? fromBase64Url(router.query.u) : null;
  const unit = router.query.v ? fromBase64Url(router.query.v) : null;

  const [staffName, setStaffName] = useState(null);
  useEffect(() => {
    setStaffName(getAdminToken() ? getAdminName() : null);
  }, [router.pathname]);

  const accountLabel = isVotingFlow
    ? (nama ? `${nama} - ${unit || "-"}` : "-")
    : (staffName || "-");

  const handleAccountClick = () => {
    if (isVotingFlow && nama) router.push("/VotingLogin");
  };

  const handleLogout = () => {
    adminLogout();
    setStaffName(null);
    router.push("/AdminLogin");
  };

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <Layout style={{ minHeight: "100vh", background: "#4A4A43", fontFamily: "'Poppins', sans-serif" }}>
        <Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#D9CDAE", padding: "0 40px", height: 72 }}>
          <Text strong style={{ color: "#2b2b2b", fontSize: 16, fontFamily: "'Poppins', sans-serif" }}>
            <a href="http://portfolio-sunaryo.vercel.app" target="_blank" rel="noopener noreferrer" style={{ color: "#2b2b2b", fontSize: 16, fontFamily: "'Poppins', sans-serif" }}>Sunaryo</a> | Northland Ancol Residence
          </Text>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {staffName && (
              <button
                onClick={handleLogout}
                style={{ background: "transparent", border: "1px solid #5a5a52", borderRadius: 16, padding: "6px 12px", height: 32, fontSize: 12, color: "#2b2b2b", cursor: "pointer", fontFamily: "'Poppins', sans-serif", lineHeight: 1}}
              >
                Keluar
              </button>
            )}
            <div onClick={handleAccountClick} style={{ display: "flex", alignItems: "center", gap: 8, cursor: isVotingFlow && nama ? "pointer" : "default" }}>
              <Text style={{ color: "#2b2b2b", fontSize: 14, fontFamily: "'Poppins', sans-serif" }}>{accountLabel}</Text>
              <UserOutlined style={{ fontSize: 22, color: "#1a1a1a" }} />
            </div>
          </div>
        </Header>

        <Content>{children}</Content>

        <Footer style={{ textAlign: "center", background: "#D9CDAE", color: "#2b2b2b", fontFamily: "'Poppins', sans-serif" }}>
          © 2026 Voting Northland. All rights reserved
        </Footer>
      </Layout>
    </>
  );
}