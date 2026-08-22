"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  async function onLogout() {
    await logout();
    setOpen(false);
    router.push("/");
  }

  const links = [
    { href: "/", label: "Events" },
    ...(user?.role === "CUSTOMER" || user?.role === "ADMIN"
      ? [{ href: "/bookings", label: "My tickets" }]
      : []),
    ...(user?.role === "ORGANISER" || user?.role === "ADMIN"
      ? [{ href: "/organiser", label: "Organiser" }]
      : []),
    ...(user?.role === "ADMIN" ? [{ href: "/admin/venues", label: "Venues" }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-amber-900/20 bg-[#1a120c]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-[4%] py-3">
        <Link href="/" className="font-[family-name:var(--font-geist-sans)] text-lg font-semibold tracking-wide text-amber-100">
          TicketBox
        </Link>
        <button
          type="button"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-amber-800/50 text-amber-100 md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <div className="space-y-1.5">
            <span className="block h-0.5 w-5 bg-amber-100" />
            <span className="block h-0.5 w-5 bg-amber-100" />
            <span className="block h-0.5 w-5 bg-amber-100" />
          </div>
        </button>
        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`cursor-pointer text-sm ${pathname === l.href ? "text-amber-300" : "text-amber-100/80 hover:text-amber-100"}`}
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <button
              type="button"
              onClick={onLogout}
              className="h-11 cursor-pointer rounded-lg bg-amber-800 px-4 text-sm text-amber-50 hover:bg-amber-700"
            >
              Log out
            </button>
          ) : (
            <div className="flex gap-2">
              <Link href="/login" className="flex h-11 cursor-pointer items-center rounded-lg px-4 text-sm text-amber-100">
                Log in
              </Link>
              <Link href="/register" className="flex h-11 cursor-pointer items-center rounded-lg bg-amber-700 px-4 text-sm text-white hover:bg-amber-600">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-amber-900/30 px-[4%] py-3 md:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex min-h-11 cursor-pointer items-center text-amber-100"
            >
              {l.label}
            </Link>
          ))}
          {user ? (
            <button type="button" onClick={onLogout} className="min-h-11 cursor-pointer text-left text-amber-200">
              Log out ({user.name})
            </button>
          ) : (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="flex min-h-11 cursor-pointer items-center text-amber-100">
                Log in
              </Link>
              <Link href="/register" onClick={() => setOpen(false)} className="flex min-h-11 cursor-pointer items-center text-amber-100">
                Sign up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
