"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

export default function OrganiserPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [form, setForm] = useState({
    title: "",
    type: "MOVIE",
    description: "",
    venueId: "",
    startsAt: "",
    premium: 450,
    standard: 250,
  });
  const [msg, setMsg] = useState("");

  async function load() {
    const [e, v] = await Promise.all([fetch("/api/organiser/events"), fetch("/api/venues")]);
    const ed = await e.json();
    const vd = await v.json();
    setEvents(ed.events || []);
    setVenues(vd.venues || []);
    if (!form.venueId && vd.venues?.[0]) setForm((f) => ({ ...f, venueId: vd.venues[0].id }));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        type: form.type,
        description: form.description,
        venueId: form.venueId,
        startsAt: form.startsAt,
        prices: [
          { category: "PREMIUM", price: Number(form.premium) * 100 },
          { category: "STANDARD", price: Number(form.standard) * 100 },
        ],
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Event listed." : data.error);
    if (res.ok) load();
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">Organiser desk</h1>
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-2xl border border-amber-900/30 bg-stone-900 p-5">
          <h2 className="text-xl">New listing</h2>
          <input required className="h-11 rounded-lg border border-amber-900/40 bg-stone-950 px-3" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className="h-11 rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="MOVIE">Movie</option>
            <option value="CONCERT">Concert</option>
          </select>
          <textarea required className="min-h-24 rounded-lg border border-amber-900/40 bg-stone-950 px-3 py-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <select className="h-11 rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={form.venueId} onChange={(e) => setForm({ ...form, venueId: e.target.value })}>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
          <input required type="datetime-local" className="h-11 rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-xs">Premium ₹
              <input type="number" className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={form.premium} onChange={(e) => setForm({ ...form, premium: Number(e.target.value) })} />
            </label>
            <label className="text-xs">Standard ₹
              <input type="number" className="mt-1 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={form.standard} onChange={(e) => setForm({ ...form, standard: Number(e.target.value) })} />
            </label>
          </div>
          {msg && <p className="text-sm text-amber-300">{msg}</p>}
          <button type="submit" className="h-11 cursor-pointer rounded-lg bg-amber-700">Publish event</button>
        </form>
        <div>
          <h2 className="text-xl">Your events</h2>
          <ul className="mt-3 space-y-3">
            {events.map((ev) => (
              <li key={ev.id} className="rounded-xl border border-amber-900/30 p-4">
                <p className="font-medium">{ev.title}</p>
                <p className="text-sm text-amber-100/70">{ev.venue.name} · {new Date(ev.startsAt).toLocaleString("en-IN")}</p>
                <Link href={`/organiser/events/${ev.id}`} className="mt-2 inline-flex h-11 items-center text-amber-300">Booking summary</Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
