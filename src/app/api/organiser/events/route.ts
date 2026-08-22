import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export async function GET() {
  const { user, error } = await requireUser(["ORGANISER", "ADMIN"]);
  if (error || !user) return error!;

  const events = await prisma.event.findMany({
    where: user.role === "ADMIN" ? {} : { organiserId: user.id },
    include: {
      venue: true,
      prices: true,
      _count: { select: { bookings: true } },
    },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json({ events });
}
