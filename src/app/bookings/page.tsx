"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function BookingsPage() {
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch("/api/bookings");
    setData(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function cancel(id: string) {
    if (!confirm("Cancel this booking? Seats may go to the waitlist.")) return;
    const res = await fetch(`/api/bookings/${id}/cancel`, { method: "POST" });
    const body = await res.json();
    setMsg(res.ok ? "Booking cancelled." : body.error);
    load();
  }

  if (!data) return <p>Loading tickets…</p>;
  if (data.error) {
    return (
      <p>
        Please <Link className="text-amber-300" href="/login">log in</Link> to see your tickets.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold">My tickets</h1>
      {msg && <p className="mt-2 text-amber-300">{msg}</p>}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.bookings?.map((b: any) => (
          <article key={b.id} className="rounded-2xl border border-amber-900/30 bg-stone-900 p-5">
            <p className="text-xs uppercase text-amber-400">{b.status}</p>
            <h2 className="text-xl">{b.event.title}</h2>
            <p className="text-sm text-amber-100/70">{new Date(b.event.startsAt).toLocaleString("en-IN")} · {b.event.venue.name}</p>
            <p className="mt-2 text-sm">Seats {b.seats.map((s: any) => s.seat.label).join(", ")}</p>
            <p className="text-sm">Ref {b.reference} · ₹{(b.total / 100).toFixed(0)}</p>
            {b.qrDataUrl && <img src={b.qrDataUrl} alt="QR" className="mt-3 w-40 rounded bg-white p-2" />}
            {b.status === "CONFIRMED" && (
              <button type="button" onClick={() => cancel(b.id)} className="mt-4 h-11 cursor-pointer rounded-lg border border-rose-700 px-4 text-rose-200">
                Cancel booking
              </button>
            )}
          </article>
        ))}
      </div>
      <h2 className="mt-10 text-2xl font-semibold">Waitlist</h2>
      <ul className="mt-3 space-y-2">
        {data.waitlist?.map((w: any) => (
          <li key={w.id} className="rounded-xl border border-amber-900/30 p-4">
            {w.event.title} · {w.category} · {w.status}
            {w.offers?.[0]?.status === "OFFERED" && (
              <Link className="ml-3 text-amber-300" href={`/waitlist/offer/${w.offers[0].token}`}>
                Complete offer
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
