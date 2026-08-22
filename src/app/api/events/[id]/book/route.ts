import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";
import { expireHoldsAndOffers } from "@/lib/jobs";
import { makeBookingReference } from "@/lib/utils";
import { sendBookingEmail } from "@/lib/email";
import { bookingQrDataUrl } from "@/lib/qr";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(["CUSTOMER", "ADMIN"]);
  if (error || !user) return error!;

  await expireHoldsAndOffers();
  const body = await req.json().catch(() => ({}));
  const offerToken = typeof body.offerToken === "string" ? body.offerToken : null;

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { venue: true, prices: true },
  });
  if (!event) return jsonError("Event not found", 404);

  const held = await prisma.showSeat.findMany({
    where: { eventId: params.id, heldByUserId: user.id, status: "HELD" },
    include: { seat: true },
  });
  if (held.length === 0) return jsonError("No seats on hold. Select seats first.");

  const now = new Date();
  if (held.some((s) => s.heldUntil && s.heldUntil < now)) {
    await expireHoldsAndOffers();
    return jsonError("Your hold expired. Please select seats again.", 409);
  }

  const priceMap = Object.fromEntries(event.prices.map((p) => [p.category, p.price]));
  const total = held.reduce((sum, s) => sum + (priceMap[s.seat.category] || 0), 0);
  const reference = makeBookingReference();

  let booking;
  try {
    booking = await prisma.$transaction(async (tx) => {
      for (const seat of held) {
        const updated = await tx.showSeat.updateMany({
          where: {
            id: seat.id,
            status: "HELD",
            heldByUserId: user.id,
          },
          data: { status: "BOOKED" },
        });
        if (updated.count !== 1) throw new Error("SEAT_CONFLICT");
      }
      const created = await tx.booking.create({
        data: {
          reference,
          userId: user.id,
          eventId: event.id,
          status: "CONFIRMED",
          total,
        },
      });
      await tx.showSeat.updateMany({
        where: { id: { in: held.map((s) => s.id) } },
        data: { bookingId: created.id, heldByUserId: null, heldUntil: null },
      });

      if (offerToken) {
        const offer = await tx.waitlistOffer.findUnique({ where: { token: offerToken } });
        if (offer && offer.userId === user.id && offer.status === "OFFERED") {
          await tx.waitlistOffer.update({ where: { id: offer.id }, data: { status: "ACCEPTED" } });
          await tx.waitlistEntry.update({
            where: { id: offer.waitlistEntryId },
            data: { status: "FULFILLED" },
          });
        }
      }
      return created;
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SEAT_CONFLICT") {
      return jsonError("Those seats are no longer held. Please try again.", 409);
    }
    throw e;
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  const emailResult = await sendBookingEmail({
    to: user.email,
    name: user.name,
    eventTitle: event.title,
    startsAt: event.startsAt,
    venue: event.venue.name,
    seats: held.map((s) => s.seat.label),
    reference,
    total,
  });
  const qrDataUrl = await bookingQrDataUrl(reference);

  return NextResponse.json({
    booking: { ...booking, email: dbUser?.email },
    qrDataUrl,
    email: emailResult,
  });
}
