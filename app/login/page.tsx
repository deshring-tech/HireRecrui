"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NavBar from "@/components/NavBar";

type Mode = "login" | "signup" | "forgot";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setNotice("");
  }

  async function submit() {
    setError("");
    setNotice("");
    setLoading(true);
    try {
      if (mode === "forgot") {
        const res = await fetch("/api/auth/request-reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setNotice(data.message || "If an account exists, a reset link has been sent.");
        return;
      }

      const res = await fetch(`/api/auth/${mode === "login" ? "login" : "signup"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }
      router.push("/recruiter");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const heading =
    mode === "login" ? "Log in" : mode === "signup" ? "Create your recruiter account" : "Reset your password";
  const sub =
    mode === "login"
      ? "Access your candidate dashboard."
      : mode === "signup"
      ? "Get your own shareable intake link for candidates."
      : "We'll email you a link to set a new password.";

  return (
    <main>
      <NavBar />
      <section className="max-w-sm mx-auto px-6 pt-10 pb-24">
        <div className="card p-7">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">{heading}</h1>
          <p className="text-sm text-slate-500 mb-6">{sub}</p>

          <div className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="label">Name</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                onKeyDown={(e) => e.key === "Enter" && mode === "forgot" && submit()}
              />
            </div>
            {mode !== "forgot" && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="label mb-0">Password</label>
                  {mode === "login" && (
                    <button onClick={() => switchMode("forgot")} className="text-xs text-brand-600 hover:text-brand-700">
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  className="input mt-1.5"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                />
              </div>
            )}

            {error && <p className="text-sm text-rose-500">{error}</p>}
            {notice && <p className="text-sm text-emerald-600">{notice}</p>}

            <button
              onClick={submit}
              disabled={loading || !email || (mode !== "forgot" && !password)}
              className="btn-primary w-full"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                ? "Log in"
                : mode === "signup"
                ? "Create account"
                : "Send reset link"}
            </button>

            {mode === "signup" && (
              <p className="text-xs text-slate-400 text-center">
                By creating an account you agree to the{" "}
                <a href="/terms" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            )}
          </div>

          <div className="mt-5 text-center text-sm">
            {mode === "forgot" ? (
              <button onClick={() => switchMode("login")} className="text-brand-600 hover:text-brand-700">
                ← Back to log in
              </button>
            ) : (
              <button
                onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                className="text-brand-600 hover:text-brand-700"
              >
                {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
