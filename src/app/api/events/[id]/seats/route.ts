import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, getCurrentUser } from "@/lib/auth";
import { expireHoldsAndOffers } from "@/lib/jobs";
import { holdTtlSeconds } from "@/lib/utils";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await expireHoldsAndOffers();
  const user = await getCurrentUser();

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { venue: true, prices: true },
  });
  if (!event) return jsonError("Event not found", 404);

  const showSeats = await prisma.showSeat.findMany({
    where: { eventId: params.id },
    include: { seat: true },
    orderBy: [{ seat: { row: "asc" } }, { seat: { col: "asc" } }],
  });

  const seats = showSeats.map((s) => {
    const mine = user && s.heldByUserId === user.id && s.status === "HELD";
    return {
      id: s.id,
      seatId: s.seatId,
      row: s.seat.row,
      col: s.seat.col,
      label: s.seat.label,
      category: s.seat.category,
      status: mine ? "MINE" : s.status,
      heldUntil: s.heldUntil,
    };
  });

  const byCategory = event.prices.map((p) => {
    const catSeats = seats.filter((s) => s.category === p.category);
    const available = catSeats.filter((s) => s.status === "AVAILABLE").length;
    return { category: p.category, price: p.price, available, total: catSeats.length };
  });

  return NextResponse.json({
    venue: event.venue,
    prices: event.prices,
    holdTtlSeconds: holdTtlSeconds(),
    byCategory,
    seats,
  });
}
