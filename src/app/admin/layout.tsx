"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<"checking" | "allowed">("checking");

  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.replace("/login");
        return;
      }

      const role = user.user_metadata?.role;

      if (role !== "admin") {
        window.location.replace("/dashboard");
        return;
      }

      setStatus("allowed");
    }

    checkAccess();
  }, []);

  if (status === "checking") {
    return <div style={{ padding: "40px" }}>Checking admin access...</div>;
  }

  return <>{children}</>;
}