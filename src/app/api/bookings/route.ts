import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { bookingQrDataUrl } from "@/lib/qr";
import { expireHoldsAndOffers } from "@/lib/jobs";

export async function GET() {
  const { user, error } = await requireUser();
  if (error || !user) return error!;
  await expireHoldsAndOffers();

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: {
      event: { include: { venue: true } },
      seats: { include: { seat: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withQr = await Promise.all(
    bookings.map(async (b) => ({
      ...b,
      qrDataUrl: b.status === "CONFIRMED" ? await bookingQrDataUrl(b.reference) : null,
    }))
  );

  const waitlist = await prisma.waitlistEntry.findMany({
    where: { userId: user.id },
    include: {
      event: { select: { id: true, title: true, startsAt: true } },
      offers: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ bookings: withQr, waitlist });
}
