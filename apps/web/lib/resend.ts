type SendEmailArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

type CallEmailArgs = {
  to: string;
  ownerName?: string | null;
  businessName?: string | null;
  agentName?: string | null;
  callerPhone?: string | null;
  summary?: string | null;
  startedAt?: number | null;
  endedAt?: number | null;
  dashboardUrl: string;
};

type LeadEmailArgs = {
  to: string;
  ownerName?: string | null;
  businessName?: string | null;
  callerName?: string | null;
  callerPhone?: string | null;
  address?: string | null;
  reason?: string | null;
  urgency?: string | null;
  summary?: string | null;
  dashboardUrl: string;
};

type WelcomeEmailArgs = {
  to: string;
  name?: string | null;
  dashboardUrl: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom =
  process.env.RESEND_FROM_EMAIL ??
  "Ring Receptionist <noreply@hello.ringreceptionist.com>";

function asArray(value: string | string[]) {
  return Array.isArray(value) ? value : [value];
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function line(label: string, value?: string | null) {
  if (!value) return "";
  return `<p style="margin:0 0 8px 0;"><strong>${escapeHtml(
    label
  )}:</strong> ${escapeHtml(value)}</p>`;
}

function formatDuration(startedAt?: number | null, endedAt?: number | null) {
  if (!startedAt || !endedAt || endedAt <= startedAt) return null;
  const seconds = Math.floor((endedAt - startedAt) / 1000);
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  return minutes > 0 ? `${minutes}m ${remSeconds}s` : `${remSeconds}s`;
}

export async function sendResendEmail(args: SendEmailArgs) {
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFrom,
      to: asArray(args.to),
      subject: args.subject,
      html: args.html,
      text: args.text,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Resend send failed (${response.status}): ${errorText || "Unknown error"}`
    );
  }
}

export async function sendWelcomeEmail(args: WelcomeEmailArgs) {
  const firstName = args.name?.split(" ")[0] ?? "there";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
      <h1 style="margin:0 0 16px 0;font-size:26px;">Welcome to Ring Receptionist</h1>
      <p style="margin:0 0 12px 0;">Hi ${escapeHtml(firstName)},</p>
      <p style="margin:0 0 12px 0;">Your account is ready. You can now configure your AI receptionist, review calls, and track leads.</p>
      <p style="margin:0 0 20px 0;">Open your dashboard to continue setup and start receiving calls.</p>
      <a href="${escapeHtml(
        args.dashboardUrl
      )}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:600;">Open Dashboard</a>
    </div>
  `;
  await sendResendEmail({
    to: args.to,
    subject: "Welcome to Ring Receptionist",
    html,
  });
}

export async function sendCallCompletedEmail(args: CallEmailArgs) {
  const duration = formatDuration(args.startedAt, args.endedAt);
  const summaryText = args.summary?.trim() || "No summary available for this call.";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
      <h2 style="margin:0 0 14px 0;font-size:22px;">New call completed</h2>
      <p style="margin:0 0 14px 0;">${
        args.businessName ? escapeHtml(args.businessName) : "Your receptionist"
      } just completed a call.</p>
      ${line("Agent", args.agentName)}
      ${line("Caller phone", args.callerPhone)}
      ${line("Duration", duration)}
      ${line("Summary", summaryText)}
      <p style="margin:16px 0 0 0;">
        <a href="${escapeHtml(
          args.dashboardUrl
        )}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:600;">View Calls</a>
      </p>
    </div>
  `;
  await sendResendEmail({
    to: args.to,
    subject: "New call completed",
    html,
  });
}

export async function sendLeadCapturedEmail(args: LeadEmailArgs) {
  const summaryText = args.summary?.trim() || "No summary available for this call.";
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
      <h2 style="margin:0 0 14px 0;font-size:22px;">New lead captured</h2>
      <p style="margin:0 0 14px 0;">${
        args.businessName ? escapeHtml(args.businessName) : "Your receptionist"
      } captured a new lead from a recent call.</p>
      ${line("Name", args.callerName)}
      ${line("Phone", args.callerPhone)}
      ${line("Address", args.address)}
      ${line("Service", args.reason)}
      ${line("Urgency", args.urgency)}
      ${line("Summary", summaryText)}
      <p style="margin:16px 0 0 0;">
        <a href="${escapeHtml(
          args.dashboardUrl
        )}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:999px;font-weight:600;">View Leads</a>
      </p>
    </div>
  `;
  await sendResendEmail({
    to: args.to,
    subject: "New lead captured",
    html,
  });
}
