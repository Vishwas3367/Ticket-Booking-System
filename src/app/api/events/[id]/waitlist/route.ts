import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";
import { expireHoldsAndOffers } from "@/lib/jobs";
import { z } from "zod";

const schema = z.object({ category: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { user, error } = await requireUser(["CUSTOMER", "ADMIN"]);
  if (error || !user) return error!;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return jsonError("Choose a seat category");

  await expireHoldsAndOffers();

  const available = await prisma.showSeat.count({
    where: { eventId: params.id, status: "AVAILABLE", seat: { category: parsed.data.category } },
  });
  if (available > 0) {
    return jsonError("Seats are still available in this category. Book from the map instead.");
  }

  const existing = await prisma.waitlistEntry.findFirst({
    where: {
      userId: user.id,
      eventId: params.id,
      category: parsed.data.category,
      status: { in: ["WAITING", "OFFERED"] },
    },
  });
  if (existing) return jsonError("You are already on this waitlist", 409);

  const entry = await prisma.waitlistEntry.create({
    data: {
      userId: user.id,
      eventId: params.id,
      category: parsed.data.category,
      status: "WAITING",
    },
  });
  return NextResponse.json({ entry }, { status: 201 });
}
