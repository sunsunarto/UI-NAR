import Head from "next/head";
import AppLayout from "../components/AppLayout";
import AuthGuard from "../components/AuthGuard";
import "antd/dist/reset.css";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/icon.ico" />
        <title>My App</title>
      </Head>
      <AppLayout>
        <AuthGuard>
          <Component {...pageProps} />
        </AuthGuard>
      </AppLayout>
    </>
  );
}