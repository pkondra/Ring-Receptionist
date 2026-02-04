import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!stripeSecretKey) {
    return NextResponse.json(
      { error: "STRIPE_SECRET_KEY not configured" },
      { status: 500 }
    );
  }

  const { getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const workspace = await fetchQuery(api.workspaces.getMyWorkspace, {}, { token });
  if (!workspace?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No Stripe customer found" },
      { status: 400 }
    );
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-06-20",
  });

  const origin = req.nextUrl.origin;

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${origin}/dashboard/billing`,
  });

  return NextResponse.json({ url: session.url });
}
