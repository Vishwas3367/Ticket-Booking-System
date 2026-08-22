import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";
import { expireHoldsAndOffers } from "@/lib/jobs";
import { holdUntil } from "@/lib/utils";
import { z } from "zod";

const schema = z.object({
  seatIds: z.array(z.string()).min(1).max(8),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(["CUSTOMER", "ADMIN"]);
  if (error || !user) return error!;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return jsonError("Select at least one seat");

  await expireHoldsAndOffers();

  const until = holdUntil();
  const ids = [...new Set(parsed.data.seatIds)];

  try {
    await prisma.$transaction(async (tx) => {
      await tx.showSeat.updateMany({
        where: { eventId: params.id, heldByUserId: user.id, status: "HELD" },
        data: { status: "AVAILABLE", heldByUserId: null, heldUntil: null },
      });

      for (const id of ids) {
        const updated = await tx.showSeat.updateMany({
          where: { id, eventId: params.id, status: "AVAILABLE" },
          data: { status: "HELD", heldByUserId: user.id, heldUntil: until },
        });
        if (updated.count !== 1) {
          throw new Error("SEAT_CONFLICT");
        }
      }
    });
  } catch (e) {
    if (e instanceof Error && e.message === "SEAT_CONFLICT") {
      return jsonError("One or more seats were just taken. Please pick again.", 409);
    }
    throw e;
  }

  const held = await prisma.showSeat.findMany({
    where: { id: { in: ids } },
    include: { seat: true },
  });

  return NextResponse.json({ heldUntil: until, seats: held.map((s) => s.seat.label) });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser();
  if (error || !user) return error!;

  await prisma.showSeat.updateMany({
    where: { eventId: params.id, heldByUserId: user.id, status: "HELD" },
    data: { status: "AVAILABLE", heldByUserId: null, heldUntil: null },
  });
  return NextResponse.json({ ok: true });
}
