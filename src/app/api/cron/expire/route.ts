import { NextRequest, NextResponse } from "next/server";
import { expireHoldsAndOffers } from "@/lib/jobs";
import { jsonError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  const vercelCron = req.headers.get("x-vercel-cron");
  if (secret && header !== `Bearer ${secret}` && vercelCron !== "1") {
    return jsonError("Unauthorized cron", 401);
  }
  await expireHoldsAndOffers();
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
