"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function SummaryPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/events/${params.id}/summary`)
      .then((r) => r.json())
      .then(setData);
  }, [params.id]);

  if (!data) return <p>Loading summary…</p>;
  if (data.error) return <p className="text-rose-300">{data.error}</p>;

  return (
    <div>
      <h1 className="text-3xl font-semibold">Event summary</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Confirmed" value={data.summary.confirmedBookings} />
        <Stat label="Cancelled" value={data.summary.cancelledBookings} />
        <Stat label="Tickets sold" value={data.summary.ticketsSold} />
        <Stat label="Revenue" value={`₹${(data.summary.revenue / 100).toFixed(0)}`} />
      </div>
      <h2 className="mt-8 text-xl">Waitlist</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {(data.waitlist || []).length === 0 && <li className="text-amber-100/60">No waitlist activity.</li>}
        {(data.waitlist || []).map((w: any) => (
          <li key={`${w.category}-${w.status}`} className="rounded-xl border border-amber-900/30 p-3">
            {w.category} · {w.status} · {w._count}
          </li>
        ))}
      </ul>
      <h2 className="mt-8 text-xl">Bookings</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-amber-900/40 text-amber-200/70">
              <th className="py-2 pr-4">Ref</th>
              <th className="py-2 pr-4">Customer</th>
              <th className="py-2 pr-4">Seats</th>
              <th className="py-2 pr-4">Total</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.bookings?.map((b: any) => (
              <tr key={b.id} className="border-b border-amber-900/20">
                <td className="py-2 pr-4">{b.reference}</td>
                <td className="py-2 pr-4">{b.user.name}</td>
                <td className="py-2 pr-4">{b.seats.map((s: any) => s.seat.label).join(", ")}</td>
                <td className="py-2 pr-4">₹{(b.total / 100).toFixed(0)}</td>
                <td className="py-2">{b.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-amber-900/30 bg-stone-900 p-4">
      <p className="text-xs uppercase tracking-wide text-amber-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
