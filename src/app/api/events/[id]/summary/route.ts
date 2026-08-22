import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(["ORGANISER", "ADMIN"]);
  if (error || !user) return error!;

  const event = await prisma.event.findUnique({ where: { id: params.id } });
  if (!event) return jsonError("Event not found", 404);
  if (user.role === "ORGANISER" && event.organiserId !== user.id) {
    return jsonError("Forbidden", 403);
  }

  const bookings = await prisma.booking.findMany({
    where: { eventId: params.id },
    include: {
      user: { select: { name: true, email: true } },
      seats: { include: { seat: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const cancelled = bookings.filter((b) => b.status === "CANCELLED");
  const revenue = confirmed.reduce((sum, b) => sum + b.total, 0);

  const waitlist = await prisma.waitlistEntry.groupBy({
    by: ["category", "status"],
    where: { eventId: params.id },
    _count: true,
  });

  return NextResponse.json({
    summary: {
      confirmedBookings: confirmed.length,
      cancelledBookings: cancelled.length,
      ticketsSold: confirmed.reduce((sum, b) => sum + b.seats.length, 0),
      revenue,
    },
    waitlist,
    bookings,
  });
}
