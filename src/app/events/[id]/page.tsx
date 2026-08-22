"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SeatMap, { SeatView } from "@/components/SeatMap";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

type Price = { category: string; price: number; available?: number; total?: number };

export default function EventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [seats, setSeats] = useState<SeatView[]>([]);
  const [venue, setVenue] = useState<{ rows: number; cols: number } | null>(null);
  const [prices, setPrices] = useState<Price[]>([]);
  const [byCategory, setByCategory] = useState<Price[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [heldUntil, setHeldUntil] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState<{ reference: string; qrDataUrl: string } | null>(null);
  const [waitCategory, setWaitCategory] = useState("STANDARD");

  async function loadSeats() {
    const res = await fetch(`/api/events/${params.id}/seats`);
    const data = await res.json();
    setSeats(data.seats || []);
    setVenue(data.venue);
    setPrices(data.prices || []);
    setByCategory(data.byCategory || []);
    const mine = (data.seats || []).filter((s: SeatView) => s.status === "MINE").map((s: SeatView) => s.id);
    if (mine.length && selected.length === 0) setSelected(mine);
    const mineUntil = (data.seats || []).find((s: SeatView) => s.status === "MINE")?.heldUntil;
    if (mineUntil) setHeldUntil(mineUntil);
  }

  useEffect(() => {
    fetch(`/api/events/${params.id}`)
      .then((r) => r.json())
      .then((d) => setEvent(d.event));
    loadSeats();
    const poll = setInterval(loadSeats, 3000);
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(tick);
      fetch(`/api/events/${params.id}/hold`, { method: "DELETE" });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const priceMap = useMemo(() => Object.fromEntries(prices.map((p) => [p.category, p.price])), [prices]);
  const selectedSeats = seats.filter((s) => selected.includes(s.id));
  const total = selectedSeats.reduce((sum, s) => sum + (priceMap[s.category] || 0), 0);
  const remaining = heldUntil ? Math.max(0, Math.floor((new Date(heldUntil).getTime() - now) / 1000)) : 0;

  async function toggle(id: string) {
    if (!user) {
      router.push("/login");
      return;
    }
    const next = selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id];
    setSelected(next);
    setMessage("");
    if (next.length === 0) {
      await fetch(`/api/events/${params.id}/hold`, { method: "DELETE" });
      setHeldUntil(null);
      loadSeats();
      return;
    }
    const res = await fetch(`/api/events/${params.id}/hold`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seatIds: next }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      setSelected(selected);
      loadSeats();
      return;
    }
    setHeldUntil(data.heldUntil);
    loadSeats();
  }

  async function book() {
    const res = await fetch(`/api/events/${params.id}/book`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error);
      return;
    }
    setBooking({ reference: data.booking.reference, qrDataUrl: data.qrDataUrl });
    setSelected([]);
    loadSeats();
  }

  async function joinWaitlist() {
    const res = await fetch(`/api/events/${params.id}/waitlist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: waitCategory }),
    });
    const data = await res.json();
    setMessage(res.ok ? "You are on the waitlist. We will email you if a seat opens." : data.error);
  }

  if (!event) return <p>Loading event…</p>;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
      <section>
        <p className="text-xs uppercase tracking-widest text-amber-400">{event.type}</p>
        <h1 className="text-3xl font-semibold">{event.title}</h1>
        <p className="mt-2 text-amber-100/70">{event.description}</p>
        <p className="mt-2 text-sm">
          {new Date(event.startsAt).toLocaleString("en-IN")} · {event.venue?.name}
        </p>
        {venue && (
          <div className="mt-6 rounded-2xl border border-amber-900/30 bg-stone-950/50 p-4">
            <SeatMap seats={seats} rows={venue.rows} cols={venue.cols} selected={selected} onToggle={toggle} />
          </div>
        )}
      </section>
      <aside className="h-fit rounded-2xl border border-amber-900/30 bg-stone-900 p-5">
        {booking ? (
          <div>
            <h2 className="text-xl font-semibold">Booking confirmed</h2>
            <p className="mt-2 text-sm">Reference {booking.reference}</p>
            <img src={booking.qrDataUrl} alt="QR ticket" className="my-4 w-full max-w-[16rem] rounded-lg bg-white p-2" />
            <Link href="/bookings" className="flex h-11 items-center justify-center rounded-lg bg-amber-700">View tickets</Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold">Checkout</h2>
            <ul className="mt-3 space-y-1 text-sm">
              {selectedSeats.map((s) => (
                <li key={s.id} className="flex justify-between">
                  <span>{s.label} · {s.category}</span>
                  <span>₹{((priceMap[s.category] || 0) / 100).toFixed(0)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-lg">Total ₹{(total / 100).toFixed(0)}</p>
            {heldUntil && remaining > 0 && (
              <p className="mt-1 text-sm text-amber-300">Hold expires in {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</p>
            )}
            {message && <p className="mt-2 text-sm text-rose-300">{message}</p>}
            <button
              type="button"
              disabled={!selected.length || !user}
              onClick={book}
              className="mt-4 h-11 w-full cursor-pointer rounded-lg bg-emerald-700 font-medium disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm booking
            </button>
            {!user && <Link href="/login" className="mt-2 block text-center text-sm text-amber-300">Log in to book</Link>}
            <hr className="my-5 border-amber-900/40" />
            <h3 className="font-medium">Sold out?</h3>
            <p className="mt-1 text-xs text-amber-100/60">Join a waitlist for a category with no available seats.</p>
            <select className="mt-2 h-11 w-full rounded-lg border border-amber-900/40 bg-stone-950 px-2" value={waitCategory} onChange={(e) => setWaitCategory(e.target.value)}>
              {byCategory.map((c) => (
                <option key={c.category} value={c.category}>{c.category} · {c.available} left</option>
              ))}
            </select>
            <button
              type="button"
              onClick={joinWaitlist}
              disabled={(byCategory.find((c) => c.category === waitCategory)?.available || 0) > 0}
              className="mt-2 h-11 w-full cursor-pointer rounded-lg border border-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Join waitlist
            </button>
          </>
        )}
      </aside>
    </div>
  );
}
