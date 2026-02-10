import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@convex/_generated/api";
import { sendWelcomeEmail } from "@/lib/resend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getDashboardUrl(reqOrigin: string) {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : reqOrigin);
  return `${base}/dashboard`;
}

export async function POST(request: Request) {
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "convex" });
  if (!userId || !token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await fetchQuery(api.users.getMyUser, {}, { token });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.email) {
    return NextResponse.json({ success: true, skipped: "missing_email" });
  }

  if (user.welcomeEmailSentAt) {
    return NextResponse.json({ success: true, skipped: "already_sent" });
  }

  try {
    const dashboardUrl = getDashboardUrl(request.url ? new URL(request.url).origin : "");
    await sendWelcomeEmail({
      to: user.email,
      name: user.name,
      dashboardUrl,
    });
    await fetchMutation(api.users.markWelcomeEmailSent, {}, { token });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Welcome email send failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send welcome email",
      },
      { status: 502 }
    );
  }
}
