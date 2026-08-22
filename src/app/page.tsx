"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type EventCard = {
  id: string;
  title: string;
  type: string;
  description: string;
  startsAt: string;
  venue: { name: string; address: string };
  available: number;
  capacity: number;
  prices: { category: string; price: number }[];
};

export default function HomePage() {
  const [events, setEvents] = useState<EventCard[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQ) params.set("q", debouncedQ);
    if (type) params.set("type", type);
    fetch(`/api/events?${params}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events || []));
  }, [debouncedQ, type]);

  return (
    <div>
      <section className="mb-8 rounded-2xl bg-gradient-to-br from-amber-900/40 to-stone-900 p-[6%] md:p-10">
        <p className="text-sm uppercase tracking-[0.25em] text-amber-300/80">Movies & concerts</p>
        <h1 className="mt-2 font-[family-name:var(--font-geist-sans)] text-3xl font-semibold md:text-5xl">
          Pick a seat. Hold it. Walk in with a QR.
        </h1>
        <p className="mt-3 max-w-2xl text-amber-100/75">
          Live seat maps, 10-minute holds, waitlists when shows sell out, and automatic reallocation when someone cancels.
        </p>
      </section>

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search title or venue"
          className="h-11 w-full flex-1 rounded-lg border border-amber-900/40 bg-stone-900 px-3 text-amber-50"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-11 w-full rounded-lg border border-amber-900/40 bg-stone-900 px-3 md:w-48"
        >
          <option value="ALL">All types</option>
          <option value="MOVIE">Movies</option>
          <option value="CONCERT">Concerts</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/events/${event.id}`}
            className="flex cursor-pointer flex-col rounded-2xl border border-amber-900/30 bg-stone-900/70 p-5 hover:border-amber-600/50"
          >
            <span className="text-xs uppercase tracking-widest text-amber-400">{event.type}</span>
            <h2 className="mt-1 text-xl font-semibold">{event.title}</h2>
            <p className="mt-2 line-clamp-2 text-sm text-amber-100/70">{event.description}</p>
            <p className="mt-3 text-sm text-amber-200/80">
              {new Date(event.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
            <p className="text-sm text-amber-100/60">{event.venue.name}</p>
            <p className="mt-3 text-sm">
              {event.available === 0 ? (
                <span className="text-rose-300">Sold out · waitlist open</span>
              ) : (
                <span>{event.available} of {event.capacity} seats open</span>
              )}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
