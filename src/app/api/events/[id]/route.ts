import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/auth";
import { expireHoldsAndOffers } from "@/lib/jobs";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await expireHoldsAndOffers();
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      venue: true,
      prices: true,
      organiser: { select: { id: true, name: true } },
    },
  });
  if (!event) return jsonError("Event not found", 404);

  const counts = await prisma.showSeat.groupBy({
    by: ["status"],
    where: { eventId: event.id },
    _count: true,
  });
  const statusCounts = Object.fromEntries(counts.map((c) => [c.status, c._count]));
  return NextResponse.json({ event, statusCounts });
}
