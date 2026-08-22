import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const q = req.nextUrl.searchParams.get("q");
  const events = await prisma.event.findMany({
    where: {
      ...(type && type !== "ALL" ? { type } : {}),
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
              { venue: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: {
      venue: true,
      prices: true,
      organiser: { select: { name: true } },
      _count: { select: { showSeats: true } },
    },
    orderBy: { startsAt: "asc" },
  });

  const withAvailability = await Promise.all(
    events.map(async (event) => {
      const available = await prisma.showSeat.count({
        where: { eventId: event.id, status: "AVAILABLE" },
      });
      const booked = await prisma.showSeat.count({
        where: { eventId: event.id, status: "BOOKED" },
      });
      return { ...event, available, booked, capacity: event._count.showSeats };
    })
  );

  return NextResponse.json({ events: withAvailability });
}

const schema = z.object({
  title: z.string().min(2),
  type: z.enum(["MOVIE", "CONCERT"]),
  description: z.string().min(4),
  venueId: z.string().min(1),
  startsAt: z.string(),
  prices: z.array(z.object({ category: z.string(), price: z.number().int().min(1) })).min(1),
});

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(["ORGANISER", "ADMIN"]);
  if (error || !user) return error!;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return jsonError("Invalid event payload");

  const venue = await prisma.venue.findUnique({
    where: { id: parsed.data.venueId },
    include: { seats: true },
  });
  if (!venue) return jsonError("Venue not found", 404);

  const event = await prisma.event.create({
    data: {
      organiserId: user.role === "ORGANISER" ? user.id : user.id,
      venueId: venue.id,
      title: parsed.data.title,
      type: parsed.data.type,
      description: parsed.data.description,
      startsAt: new Date(parsed.data.startsAt),
      prices: { create: parsed.data.prices },
    },
  });

  await prisma.showSeat.createMany({
    data: venue.seats.map((seat) => ({
      eventId: event.id,
      seatId: seat.id,
      status: "AVAILABLE",
    })),
  });

  return NextResponse.json({ event }, { status: 201 });
}
