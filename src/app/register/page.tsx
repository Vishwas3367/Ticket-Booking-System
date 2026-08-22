"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [error, setError] = useState("");
  const { refresh } = useAuth();
  const router = useRouter();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not register");
      return;
    }
    await refresh();
    router.push("/");
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-amber-900/30 bg-stone-900/80 p-6">
      <h1 className="text-2xl font-semibold">Create account</h1>
      <label className="text-sm">Name
        <input required className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="text-sm">Email
        <input required type="email" className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label className="text-sm">Password
        <input required type="password" minLength={6} className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label className="text-sm">Role
        <select className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="CUSTOMER">Customer</option>
          <option value="ORGANISER">Organiser</option>
        </select>
      </label>
      {error && <p className="text-sm text-rose-300">{error}</p>}
      <button type="submit" className="h-11 cursor-pointer rounded-lg bg-amber-700 font-medium hover:bg-amber-600">Sign up</button>
    </form>
  );
}
