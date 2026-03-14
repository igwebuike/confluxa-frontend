"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AccessState = "checking" | "allowed" | "denied";

export default function AdminLayout({
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

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        window.location.replace("/login");
        return;
      }

      const role =
        user.app_metadata?.role ||
        (user as any)?.raw_app_meta_data?.role ||
        user.user_metadata?.role ||
        "";

      if (role !== "admin") {
        window.location.replace("/dashboard");
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
          Checking admin access...
        </div>
      </div>
    );
  }

  if (status !== "allowed") {
    return null;
  }

  return <>{children}</>;
}