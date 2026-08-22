import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";
import { expireHoldsAndOffers } from "@/lib/jobs";

export async function GET(_: NextRequest, { params }: { params: { token: string } }) {
  await expireHoldsAndOffers();
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  const offer = await prisma.waitlistOffer.findUnique({
    where: { token: params.token },
    include: {
      event: { include: { venue: true, prices: true } },
      waitlistEntry: true,
    },
  });
  if (!offer) return jsonError("Offer not found", 404);
  if (offer.userId !== user.id && user.role !== "ADMIN") return jsonError("Forbidden", 403);

  const seatIds = JSON.parse(offer.showSeatIds) as string[];
  const seats = await prisma.showSeat.findMany({
    where: { id: { in: seatIds } },
    include: { seat: true },
  });

  return NextResponse.json({ offer, seats });
}
