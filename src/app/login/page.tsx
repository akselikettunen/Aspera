"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid username or password.");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-md border border-line bg-surface rounded-[3px] p-8">
        <Link href="/" className="flex items-center gap-2.5 text-[15px] font-extrabold tracking-tight text-text mb-7">
          <Logo size={17} />
          ASPERA
        </Link>

        <h1 className="text-2xl font-bold tracking-[-0.02em] text-text mb-1">Welcome back</h1>
        <p className="text-sub mb-6 text-sm">Log in to continue your practice</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-sub/70 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              className="w-full border border-line bg-bg rounded-[2px] px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>
          <div>
            <label className="block font-mono text-[10px] tracking-[0.14em] uppercase text-sub/70 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full border border-line bg-bg rounded-[2px] px-3 py-2 text-sm text-text font-mono focus:outline-none focus:border-accent/40 transition-colors"
            />
          </div>

          {error && <p className="text-bad text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-bg rounded-[2px] py-2.5 font-mono text-[13px] font-medium tracking-[0.04em] hover:bg-accent-hover disabled:opacity-50 transition-colors"
          >
            {loading ? "Logging in…" : "Log in →"}
          </button>
        </form>

        <p className="text-center text-sm text-sub mt-6">
          No account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
