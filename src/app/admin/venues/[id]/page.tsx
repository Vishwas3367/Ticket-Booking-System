"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Seat = { id: string; row: number; col: number; label: string; category: string };

export default function AdminVenueDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [rows, setRows] = useState(0);
  const [cols, setCols] = useState(0);
  const [msg, setMsg] = useState("");

  async function load() {
    const res = await fetch(`/api/venues/${params.id}`);
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    setName(data.venue.name);
    setAddress(data.venue.address);
    setSeats(data.venue.seats);
    setRows(data.venue.rows);
    setCols(data.venue.cols);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  async function save(e: FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/venues/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        address,
        seats: seats.map((s) => ({ id: s.id, category: s.category })),
      }),
    });
    const data = await res.json();
    setMsg(res.ok ? "Venue updated." : data.error);
  }

  async function remove() {
    if (!confirm("Delete this venue?")) return;
    const res = await fetch(`/api/venues/${params.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMsg(data.error);
      return;
    }
    router.push("/admin/venues");
  }

  function toggleCategory(id: string) {
    setSeats((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, category: s.category === "PREMIUM" ? "STANDARD" : "PREMIUM" } : s
      )
    );
  }

  return (
    <div>
      <Link href="/admin/venues" className="text-sm text-amber-300">
        ← All venues
      </Link>
      <form onSubmit={save} className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-900/30 bg-stone-900 p-5">
        <h1 className="text-2xl font-semibold">Manage venue</h1>
        <input className="h-11 rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="h-11 rounded-lg border border-amber-900/40 bg-stone-950 px-3" value={address} onChange={(e) => setAddress(e.target.value)} required />
        <p className="text-sm text-amber-100/70">Click a seat to switch Premium / Standard. New events copy this layout.</p>
        <div
          className="grid w-max gap-1.5"
          style={{ gridTemplateColumns: `repeat(${cols || 1}, minmax(2.25rem, 2.75rem))` }}
        >
          {Array.from({ length: rows }, (_, ri) =>
            Array.from({ length: cols }, (_, ci) => {
              const seat = seats.find((s) => s.row === ri + 1 && s.col === ci + 1);
              if (!seat) return <div key={`${ri}-${ci}`} />;
              return (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => toggleCategory(seat.id)}
                  className={`flex h-11 items-center justify-center rounded-md text-[0.65rem] ${
                    seat.category === "PREMIUM" ? "bg-amber-600" : "bg-teal-800"
                  }`}
                >
                  {seat.label}
                </button>
              );
            })
          )}
        </div>
        {msg && <p className="text-sm text-amber-300">{msg}</p>}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="h-11 cursor-pointer rounded-lg bg-amber-700 px-4">
            Save layout
          </button>
          <button type="button" onClick={remove} className="h-11 cursor-pointer rounded-lg border border-rose-700 px-4 text-rose-200">
            Delete venue
          </button>
        </div>
      </form>
    </div>
  );
}
