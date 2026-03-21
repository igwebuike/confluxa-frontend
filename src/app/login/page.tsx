"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

type LoginResponse = {
  ok?: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    global_role: string;
  };
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data: LoginResponse = await res.json();

      setLoading(false);

      if (!res.ok || !data.ok || !data.user) {
        alert(data.error || "Login failed");
        return;
      }

      const role = (data.user.global_role || "").toLowerCase();

      if (role === "platform_admin" || role === "admin") {
        window.location.href = "/admin";
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      alert("Unable to sign in right now.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <div className="flex flex-col items-center text-center">
            <img
              src="/confluxa-logo.png"
              alt="Confluxa Logo"
              className="h-16 w-16 object-contain mb-4"
            />

            <h1 className="text-3xl font-bold text-slate-900">
              Welcome back
            </h1>

            <p className="text-slate-500 mt-2">
              Sign in to your Confluxa account
            </p>
          </div>

          <form onSubmit={login} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>

              <input
                type="email"
                placeholder="you@getconfluxa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>

              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Secure access to your Confluxa dashboard
          </p>
        </div>
      </div>
    </div>
  );
}