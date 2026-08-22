"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

export default function AdminVenuesPage() {
  const [venues, setVenues] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", address: "", rows: 8, cols: 12, premiumRows: 2 });
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/venues");
    const data = await res.json();
    setVenues(data.venues || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/venues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, rows: Number(form.rows), cols: Number(form.cols), premiumRows: Number(form.premiumRows) }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Venue created with seat layout." : data.error);
    if (res.ok) load();
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-2xl border border-amber-900/30 bg-stone-900 p-5">
        <h1 className="text-2xl font-semibold">Create venue</h1>
        <input className="h-11 rounded-lg border border-amber-900/40 bg-stone-950 px-3" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className="h-11 rounded-lg border border-amber-900/40 bg-stone-950 px-3" placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
        <div className="grid grid-cols-3 gap-2">
          <label className="text-xs">Rows
            <input type="number" min={1} max={26} className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={form.rows} onChange={(e) => setForm({ ...form, rows: Number(e.target.value) })} />
          </label>
          <label className="text-xs">Columns
            <input type="number" min={1} max={20} className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={form.cols} onChange={(e) => setForm({ ...form, cols: Number(e.target.value) })} />
          </label>
          <label className="text-xs">Premium rows
            <input type="number" min={0} className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={form.premiumRows} onChange={(e) => setForm({ ...form, premiumRows: Number(e.target.value) })} />
          </label>
        </div>
        {msg && <p className="text-sm text-amber-300">{msg}</p>}
        <button type="submit" className="h-11 cursor-pointer rounded-lg bg-amber-700">Save venue</button>
      </form>
      <div>
        <h2 className="text-xl font-semibold">Venues</h2>
        <ul className="mt-3 space-y-3">
          {venues.map((v) => (
            <li key={v.id} className="rounded-xl border border-amber-900/30 p-4">
              <p className="font-medium">{v.name}</p>
              <p className="text-sm text-amber-100/70">{v.address}</p>
              <p className="text-sm">{v.rows}×{v.cols} · {v._count?.seats} seats · {v._count?.events} events</p>
              <Link href={`/admin/venues/${v.id}`} className="mt-2 inline-flex h-11 items-center text-amber-300">
                Edit layout & categories
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
