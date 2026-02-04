import { NextRequest, NextResponse } from "next/server";

const MODEL = "gpt-4o-mini";
const MAX_CHARS = 12000;

const businessSchema = {
  name: "business_profile",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      business_name: { type: ["string", "null"] },
      tagline: { type: ["string", "null"] },
      services: {
        type: "array",
        items: { type: "string" },
      },
      service_area: { type: ["string", "null"] },
      hours: { type: ["string", "null"] },
      phone: { type: ["string", "null"] },
      email: { type: ["string", "null"] },
      tone_style: { type: ["string", "null"] },
      tone_description: { type: ["string", "null"] },
      key_points: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: [
      "business_name",
      "tagline",
      "services",
      "service_area",
      "hours",
      "phone",
      "email",
      "tone_style",
      "tone_description",
      "key_points",
    ],
  },
  strict: true,
};

const stripHtml = (html: string) =>
  html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const extractTitle = (html: string) => {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match?.[1]?.trim() ?? "";
};

const normalizeUrl = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    const parsed = new URL(withProtocol);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const isPrivateHost = (hostname: string) => {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  if (lower === "localhost" || lower.endsWith(".local")) return true;
  const parts = lower.split(".");
  if (parts.length === 4 && parts.every((part) => /^\d+$/.test(part))) {
    const nums = parts.map((part) => Number(part));
    if (nums[0] === 10) return true;
    if (nums[0] === 127) return true;
    if (nums[0] === 192 && nums[1] === 168) return true;
    if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) return true;
  }
  return false;
};

const fallbackProfile = (text: string, title: string) => {
  const email =
    text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
  const phone =
    text.match(/(\+?\d[\d\s().-]{7,}\d)/)?.[0]?.trim() ?? null;

  return {
    business_name: title || null,
    tagline: null,
    services: [],
    service_area: null,
    hours: null,
    phone,
    email,
    tone_style: null,
    tone_description: null,
    key_points: [],
  };
};

export async function POST(req: NextRequest) {
  const body: { url?: string } = await req.json();
  const url = normalizeUrl(body.url ?? "");
  if (!url) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (isPrivateHost(url.hostname)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  let html = "";
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TreeRemovalReceptionist/1.0; +https://treeremovalreceptionist.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch website" },
        { status: 502 }
      );
    }
    html = await response.text();
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch website" },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeout);
  }

  const title = extractTitle(html);
  const text = stripHtml(html);
  const sample = text.slice(0, MAX_CHARS);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      profile: fallbackProfile(sample, title),
      source: "fallback",
    });
  }

  const payload = {
    model: MODEL,
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: businessSchema,
    },
    messages: [
      {
        role: "system",
        content:
          "Extract a concise business profile from the website content. Use null for unknown fields and empty arrays where needed. Tone should reflect the site's copy if possible.",
      },
      {
        role: "user",
        content: `URL: ${url.toString()}\nTitle: ${title}\nContent:\n${sample}`,
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI onboarding error:", errorText);
    return NextResponse.json(
      { error: "Failed to analyze website" },
      { status: 502 }
    );
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();

  const content = data.choices?.[0]?.message?.content ?? "{}";
  let profile = fallbackProfile(sample, title);
  try {
    profile = JSON.parse(content) as typeof profile;
  } catch (err) {
    console.error("Failed to parse onboarding JSON:", err);
  }

  return NextResponse.json({ profile, source: "openai" });
}
