import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";
import { z } from "zod";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const venue = await prisma.venue.findUnique({
    where: { id: params.id },
    include: {
      seats: { orderBy: [{ row: "asc" }, { col: "asc" }] },
      _count: { select: { events: true } },
    },
  });
  if (!venue) return jsonError("Venue not found", 404);
  return NextResponse.json({ venue });
}

const patchSchema = z.object({
  name: z.string().min(2).optional(),
  address: z.string().min(2).optional(),
  seats: z
    .array(
      z.object({
        id: z.string(),
        category: z.enum(["PREMIUM", "STANDARD"]),
      })
    )
    .optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(["ADMIN"]);
  if (error || !user) return error!;

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) return jsonError("Invalid venue update");

  const venue = await prisma.venue.findUnique({ where: { id: params.id } });
  if (!venue) return jsonError("Venue not found", 404);

  await prisma.venue.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.address ? { address: parsed.data.address } : {}),
    },
  });

  if (parsed.data.seats?.length) {
    await prisma.$transaction(
      parsed.data.seats.map((seat) =>
        prisma.seat.update({
          where: { id: seat.id },
          data: { category: seat.category },
        })
      )
    );
  }

  const updated = await prisma.venue.findUnique({
    where: { id: params.id },
    include: { seats: { orderBy: [{ row: "asc" }, { col: "asc" }] } },
  });
  return NextResponse.json({ venue: updated });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(["ADMIN"]);
  if (error || !user) return error!;

  const venue = await prisma.venue.findUnique({
    where: { id: params.id },
    include: { _count: { select: { events: true } } },
  });
  if (!venue) return jsonError("Venue not found", 404);
  if (venue._count.events > 0) {
    return jsonError("Remove events at this venue before deleting it.");
  }

  await prisma.venue.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
