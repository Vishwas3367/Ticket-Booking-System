import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, requireUser } from "@/lib/auth";
import { rowLabel } from "@/lib/utils";
import { z } from "zod";

export async function GET() {
  const venues = await prisma.venue.findMany({
    include: { _count: { select: { seats: true, events: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ venues });
}

const schema = z.object({
  name: z.string().min(2),
  address: z.string().min(2),
  rows: z.number().int().min(1).max(26),
  cols: z.number().int().min(1).max(20),
  premiumRows: z.number().int().min(0).max(26).default(2),
});

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser(["ADMIN"]);
  if (error || !user) return error!;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return jsonError("Invalid venue payload");

  const { name, address, rows, cols, premiumRows } = parsed.data;
  const venue = await prisma.venue.create({
    data: { name, address, rows, cols, adminId: user.id },
  });

  const seats = [];
  for (let r = 1; r <= rows; r++) {
    const category = r <= premiumRows ? "PREMIUM" : "STANDARD";
    for (let c = 1; c <= cols; c++) {
      seats.push({
        venueId: venue.id,
        row: r,
        col: c,
        label: `${rowLabel(r)}${c}`,
        category,
      });
    }
  }
  await prisma.seat.createMany({ data: seats });
  return NextResponse.json({ venue }, { status: 201 });
}
