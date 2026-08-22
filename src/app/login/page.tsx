"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

type Role = "CUSTOMER" | "ORGANISER" | "ADMIN";

export default function LoginPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("customer@ticketbox.local");
  const [password, setPassword] = useState("Customer123!");
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [error, setError] = useState("");

  const { refresh } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        role,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Login failed");
      return;
    }

    await refresh();

    if (next) {
      router.push(next);
      return;
    }
    if (role === "ADMIN") {
      router.push("/admin/venues");
    } else if (role === "ORGANISER") {
      router.push("/organiser");
    } else {
      router.push("/");
    }
  }

  function handleRoleChange(value: Role) {
    setRole(value);

    // Demo credentials for easier testing
    if (value === "CUSTOMER") {
      setEmail("customer@ticketbox.local");
      setPassword("Customer123!");
    } else if (value === "ORGANISER") {
      setEmail("organiser@ticketbox.local");
      setPassword("Organiser123!");
    } else {
      setEmail("admin@ticketbox.local");
      setPassword("Admin123!");
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl border border-amber-900/30 bg-stone-900/80 p-6"
    >
      <h1 className="text-2xl font-semibold">Log in</h1>

      {/* Role */}
      <label className="text-sm">
        Role
        <select
          className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3"
          value={role}
          onChange={(e) => handleRoleChange(e.target.value as Role)}
        >
          <option value="CUSTOMER">Customer</option>
          <option value="ORGANISER">Organiser</option>
          <option value="ADMIN">Admin</option>
        </select>
      </label>

      {/* Email */}
      <label className="text-sm">
        Email
        <input
          type="email"
          className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>

      {/* Password */}
      <label className="text-sm">
        Password
        <input
          type="password"
          className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>

      {error && (
        <p className="text-sm text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        className="h-11 cursor-pointer rounded-lg bg-amber-700 font-medium hover:bg-amber-600"
      >
        Continue
      </button>

      <p className="text-xs leading-5 text-amber-100/60">
        <strong>Demo accounts:</strong>
        <br />
        Customer: customer@ticketbox.local / Customer123!
        <br />
        Organiser: organiser@ticketbox.local / Organiser123!
        <br />
        Admin: admin@ticketbox.local / Admin123!
      </p>

      <Link
        href="/register"
        className="text-sm text-amber-300"
      >
        Create an account
      </Link>
    </form>
  );
}