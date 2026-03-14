"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      setChecking(false);
    };

    checkSession();
  }, []);

  if (checking) {
    return <div style={{ padding: "40px" }}>Checking login...</div>;
  }

  return <>{children}</>;
}