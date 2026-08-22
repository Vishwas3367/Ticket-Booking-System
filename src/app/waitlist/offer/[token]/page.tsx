"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function OfferPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [offer, setOffer] = useState<any>(null);
  const [seats, setSeats] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    fetch(`/api/waitlist/offers/${params.token}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, status: r.status, d })))
      .then(({ ok, status, d }) => {
        if (status === 401) {
          setNeedLogin(true);
          return;
        }
        if (!ok) setError(d.error);
        else {
          setOffer(d.offer);
          setSeats(d.seats || []);
        }
      });
  }, [params.token]);

  async function accept() {
    const res = await fetch(`/api/events/${offer.eventId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerToken: params.token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    router.push("/bookings");
  }

  if (needLogin) {
    return (
      <p>
        Please{" "}
        <Link className="text-amber-300" href={`/login?next=/waitlist/offer/${params.token}`}>
          log in
        </Link>{" "}
        as the waitlisted customer to complete this offer.
      </p>
    );
  }
  if (error) return <p className="text-rose-300">{error}</p>;
  if (!offer) return <p>Loading offer…</p>;

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-amber-900/30 bg-stone-900 p-6">
      <h1 className="text-2xl font-semibold">Waitlist offer</h1>
      <p className="mt-2">{offer.event.title}</p>
      <p className="text-sm text-amber-100/70">Seats: {seats.map((s) => s.seat.label).join(", ")}</p>
      <p className="mt-2 text-sm">Expires {new Date(offer.expiresAt).toLocaleString("en-IN")}</p>
      <button type="button" onClick={accept} className="mt-6 h-11 w-full cursor-pointer rounded-lg bg-emerald-700">
        Complete booking
      </button>
    </div>
  );
}
