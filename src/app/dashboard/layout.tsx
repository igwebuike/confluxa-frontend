"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AccessState = "checking" | "allowed";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<AccessState>("checking");

  useEffect(() => {
    const checkAccess = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.replace("/login");
        return;
      }

      setStatus("allowed");
    };

    checkAccess();
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm text-slate-700">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}