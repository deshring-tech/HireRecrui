"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavBar from "@/components/NavBar";

export default function ResetPage() {
  return (
    <Suspense
      fallback={
        <main>
          <NavBar />
          <p className="text-center text-slate-400 text-sm mt-10">Loading...</p>
        </main>
      }
    >
      <ResetForm />
    </Suspense>
  );
}

function ResetForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not reset password.");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      <NavBar />
      <section className="max-w-sm mx-auto px-6 pt-10 pb-24">
        <div className="card p-7">
          <h1 className="text-xl font-semibold text-slate-900 mb-4">Set a new password</h1>
          {!token && <p className="text-sm text-rose-500">Missing reset token. Use the link from your email.</p>}
          {done ? (
            <p className="text-sm text-emerald-600">Password updated. Redirecting to log in...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">New password</label>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
              {error && <p className="text-sm text-rose-500">{error}</p>}
              <button onClick={submit} disabled={loading || !token || !password} className="btn-primary w-full">
                {loading ? "Saving..." : "Reset password"}
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
