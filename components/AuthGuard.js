import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getAdminToken, getAdminModules } from "../lib/adminAuth";
import { requiredModuleFor } from "../lib/permissions";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    if (router.pathname === "/AdminLogin") { setAllowed(true); return; }

    if (!getAdminToken()) {
      setAllowed(false);
      router.replace("/AdminLogin");
      return;
    }

    const needed = requiredModuleFor(router.pathname);
    if (needed && !getAdminModules().includes(needed)) {
      setAllowed(false);
      router.replace("/");
      return;
    }

    setAllowed(true);
  }, [router.isReady, router.pathname]);

  return allowed ? children : null;
}