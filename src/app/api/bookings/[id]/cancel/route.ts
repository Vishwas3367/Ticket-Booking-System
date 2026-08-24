import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";
import { assignWaitlistSeats, expireHoldsAndOffers } from "@/lib/jobs";
import { sendCancellationEmail } from "@/lib/email";

export async function POST(
  _: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, error } = await requireUser();

  if (error || !user) return error!;

  await expireHoldsAndOffers();

  const booking = await prisma.booking.findUnique({
    where: { id: params.id },
    include: {
      seats: {
        include: {
          seat: true,
        },
      },
      user: true,
      event: true,
    },
  });

  if (!booking) return jsonError("Booking not found", 404);

  if (booking.userId !== user.id && user.role !== "ADMIN") {
    return jsonError("Forbidden", 403);
  }

  if (booking.status !== "CONFIRMED") {
    return jsonError("Booking is not active");
  }

  const categories = [
    ...new Set(booking.seats.map((s) => s.seat.category)),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED" },
    });

    await tx.showSeat.updateMany({
      where: { bookingId: booking.id },
      data: {
        status: "AVAILABLE",
        bookingId: null,
        heldByUserId: null,
        heldUntil: null,
      },
    });
  });

  for (const category of categories) {
    await assignWaitlistSeats(booking.eventId, category);
  }

  await sendCancellationEmail({
    to: booking.user.email,
    name: booking.user.name,
    eventTitle: booking.event.title,
    seats: booking.seats.map((s) => s.seat.label),
    reference: booking.reference,
  });

  return NextResponse.json({ ok: true });
}