import { prisma } from "./prisma";
import { offerUntil, makeOfferToken } from "./utils";
import { sendWaitlistOfferEmail } from "./email";

export async function expireHoldsAndOffers() {
  const now = new Date();

  await prisma.showSeat.updateMany({
    where: { status: "HELD", heldUntil: { lt: now } },
    data: { status: "AVAILABLE", heldByUserId: null, heldUntil: null },
  });

  const expiredOffers = await prisma.waitlistOffer.findMany({
    where: { status: "OFFERED", expiresAt: { lt: now } },
  });

  for (const offer of expiredOffers) {
    const seatIds = JSON.parse(offer.showSeatIds) as string[];
    await prisma.$transaction(async (tx) => {
      await tx.waitlistOffer.update({
        where: { id: offer.id },
        data: { status: "EXPIRED" },
      });
      await tx.waitlistEntry.update({
        where: { id: offer.waitlistEntryId },
        data: { status: "WAITING", queuedAt: now },
      });
      await tx.showSeat.updateMany({
        where: { id: { in: seatIds }, status: "HELD" },
        data: { status: "AVAILABLE", heldByUserId: null, heldUntil: null, bookingId: null },
      });
    });
    await assignWaitlistSeats(offer.eventId, offer.category);
  }
}

export async function assignWaitlistSeats(eventId: string, category: string, attempt = 0) {
  const next = await prisma.waitlistEntry.findFirst({
    where: { eventId, category, status: "WAITING" },
    orderBy: { queuedAt: "asc" },
    include: { user: true, event: { include: { venue: true } } },
  });
  if (!next) return null;

  const available = await prisma.showSeat.findMany({
    where: { eventId, status: "AVAILABLE", seat: { category } },
    include: { seat: true },
    take: 1,
  });
  if (available.length === 0) return null;

  const seats = available;
  const expiresAt = offerUntil();
  const token = makeOfferToken();

  try {
    await prisma.$transaction(async (tx) => {
      for (const showSeat of seats) {
        const updated = await tx.showSeat.updateMany({
          where: { id: showSeat.id, status: "AVAILABLE" },
          data: {
            status: "HELD",
            heldByUserId: next.userId,
            heldUntil: expiresAt,
          },
        });
        if (updated.count !== 1) {
          throw new Error("SEAT_RACE");
        }
      }
      await tx.waitlistEntry.update({
        where: { id: next.id },
        data: { status: "OFFERED" },
      });
      await tx.waitlistOffer.create({
        data: {
          token,
          waitlistEntryId: next.id,
          eventId,
          userId: next.userId,
          category,
          showSeatIds: JSON.stringify(seats.map((s) => s.id)),
          expiresAt,
          status: "OFFERED",
        },
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SEAT_RACE" && attempt < 3) {
      return assignWaitlistSeats(eventId, category, attempt + 1);
    }
    throw e;
  }

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  await sendWaitlistOfferEmail({
    to: next.user.email,
    name: next.user.name,
    eventTitle: next.event.title,
    seats: seats.map((s) => s.seat.label),
    link: `${appUrl}/waitlist/offer/${token}`,
    expiresAt,
  });

  return { token, userId: next.userId };
}
