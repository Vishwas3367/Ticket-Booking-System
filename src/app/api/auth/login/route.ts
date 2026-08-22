import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setAuthCookie, verifyPassword, jsonError } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return jsonError("Invalid credentials");

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return jsonError("Invalid email or password", 401);
  }

  const session = { id: user.id, email: user.email, name: user.name, role: user.role as "CUSTOMER" | "ORGANISER" | "ADMIN" };
  await setAuthCookie(session);
  return NextResponse.json({ user: session });
}
