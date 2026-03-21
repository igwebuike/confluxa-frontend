import { apiFetch } from "@/lib/api";

export async function logoutAndRedirect() {
  try {
    await apiFetch("/auth/logout", {
      method: "POST",
    });
  } catch (err) {
    console.error("Logout failed", err);
  } finally {
    window.location.replace("/login");
  }
}