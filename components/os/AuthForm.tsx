"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Mode = "login" | "register";

export default function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        setBusy(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-[360px]">
        <div className="mb-8">
          <div className="text-[26px] font-semibold tracking-tight text-neutral-900">
            {isRegister ? "Create your account" : "Sign in"}
          </div>
          <p className="mt-1.5 text-[13.5px] text-neutral-500">
            {isRegister
              ? "Map your land, log your crops, and scout every acre."
              : "Welcome back to your fields and records."}
          </p>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {isRegister && (
            <Field
              label="Full name"
              value={name}
              onChange={setName}
              type="text"
              placeholder="Mike Rivera"
              autoFocus
            />
          )}
          <Field
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="you@farm.com"
            autoFocus={!isRegister}
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder={isRegister ? "At least 8 characters" : "••••••••"}
          />

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-[12.5px] text-red-600 ring-1 ring-red-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full h-10 rounded-lg bg-[#3f7a3f] text-white text-[14px] font-medium transition hover:bg-[#356b35] disabled:opacity-60"
          >
            {busy ? "One moment…" : isRegister ? "Create account" : "Sign in"}
          </button>
        </form>

        <div className="mt-5 text-[13px] text-neutral-500">
          {isRegister ? (
            <>
              Already set up?{" "}
              <Link href="/login" className="text-[#3f7a3f] font-medium hover:underline">
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link href="/register" className="text-[#3f7a3f] font-medium hover:underline">
                Create an account
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type,
  placeholder,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type: string;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-neutral-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full h-10 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-[14px] text-neutral-900 outline-none transition focus:border-[#3f7a3f] focus:bg-white focus:ring-2 focus:ring-[#3f7a3f]/15"
      />
    </label>
  );
}
