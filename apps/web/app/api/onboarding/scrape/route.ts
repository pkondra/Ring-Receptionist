import { NextRequest, NextResponse } from "next/server";

const MODEL = "gpt-4o-mini";
const MAX_CHARS = 12000;
const MAX_HTML_BYTES = 500_000;
const FETCH_TIMEOUT_MS = 4000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10; // Vercel Hobby limit

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

const extractMeta = (html: string, name: string) => {
  const regex = new RegExp(
    `<meta[^>]+(?:name|property)=[\"']${name}[\"'][^>]*content=[\"']([^\"']+)[\"'][^>]*>`,
    "i"
  );
  const match = html.match(regex);
  return match?.[1]?.trim() ?? "";
};

const extractJsonLd = (html: string) => {
  const scripts = Array.from(
    html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  );
  const nodes: any[] = [];
  for (const match of scripts) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      const collect = (node: any) => {
        if (!node) return;
        if (Array.isArray(node)) {
          node.forEach(collect);
          return;
        }
        if (node["@graph"]) {
          collect(node["@graph"]);
          return;
        }
        if (typeof node === "object") {
          nodes.push(node);
        }
      };
      collect(parsed);
    } catch {
      continue;
    }
  }
  return nodes;
};

const formatAddress = (address: any) => {
  if (!address) return null;
  if (typeof address === "string") return address;
  const parts = [
    address.streetAddress,
    address.addressLocality,
    address.addressRegion,
    address.postalCode,
    address.addressCountry,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
};

const extractServicesFromJsonLd = (node: any) => {
  const services: string[] = [];
  const add = (value: any) => {
    if (!value) return;
    if (Array.isArray(value)) {
      value.forEach(add);
      return;
    }
    if (typeof value === "string") {
      services.push(value);
      return;
    }
    if (typeof value === "object") {
      if (value.name) services.push(value.name);
      if (value.itemListElement) add(value.itemListElement);
      if (value.itemOffered) add(value.itemOffered);
    }
  };
  add(node.hasOfferCatalog);
  add(node.makesOffer);
  add(node.serviceType);
  return services;
};

const findBusinessNode = (nodes: any[]) => {
  const preferredTypes = [
    "LocalBusiness",
    "ProfessionalService",
    "Plumber",
    "HVACBusiness",
    "Electrician",
    "MovingCompany",
    "HomeAndConstructionBusiness",
  ];
  return nodes.find((node) => {
    const type = node["@type"];
    if (!type) return false;
    const types = Array.isArray(type) ? type : [type];
    return types.some((t) => preferredTypes.includes(String(t)));
  });
};

const buildProfileHints = (html: string) => {
  const title = extractTitle(html);
  const description =
    extractMeta(html, "description") || extractMeta(html, "og:description");
  const siteName = extractMeta(html, "og:site_name");

  const nodes = extractJsonLd(html);
  const business = findBusinessNode(nodes) ?? nodes[0];

  const jsonLd = business
    ? {
        name: business.name ?? null,
        slogan: business.slogan ?? null,
        description: business.description ?? null,
        telephone: business.telephone ?? null,
        email: business.email ?? null,
        openingHours: business.openingHours ?? null,
        areaServed:
          business.areaServed?.name ??
          business.areaServed ??
          business.serviceArea?.name ??
          business.serviceArea ??
          null,
        address: formatAddress(business.address),
        priceRange: business.priceRange ?? null,
        services: extractServicesFromJsonLd(business),
      }
    : null;

  return { title, description, siteName, jsonLd };
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

export async function POST(req: NextRequest) {
  const body: { url?: string } = await req.json();
  const url = normalizeUrl(body.url ?? "");
  if (!url) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  if (isPrivateHost(url.hostname)) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Fetch only the main page - no extra pages to stay within timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let html = "";
  try {
    const response = await fetch(url.toString(), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch website (${response.status})` },
        { status: 502 }
      );
    }

    html = await response.text();
    if (html.length > MAX_HTML_BYTES) {
      html = html.slice(0, MAX_HTML_BYTES);
    }
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : "Failed to fetch website";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const hints = buildProfileHints(html);
  const title = hints.title || extractTitle(html);
  const text = stripHtml(html).slice(0, MAX_CHARS);

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
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
          "Extract a concise business profile from the website content. Use null for unknown fields and empty arrays where needed. Tone should reflect the site's copy if possible. The services array should include specific sub-services or offerings (e.g., blocked drain cleaning, geyser repair) rather than generic categories. key_points should capture differentiators like service area, warranties, scheduling, pricing transparency, or 24/7 availability.",
      },
      {
        role: "user",
        content: `URL: ${url.toString()}
Title: ${title}
Meta description: ${hints.description || "n/a"}
Site name: ${hints.siteName || "n/a"}
JSON-LD hints: ${hints.jsonLd ? JSON.stringify(hints.jsonLd) : "n/a"}
Content:\n${text}`,
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
      { error: "Failed to analyze website", details: errorText },
      { status: 502 }
    );
  }

  const data: {
    choices?: Array<{ message?: { content?: string } }>;
  } = await response.json();

  const content = data.choices?.[0]?.message?.content ?? "{}";
  let profile: {
    business_name: string | null;
    tagline: string | null;
    services: string[];
    service_area: string | null;
    hours: string | null;
    phone: string | null;
    email: string | null;
    tone_style: string | null;
    tone_description: string | null;
    key_points: string[];
  } = {
    business_name: title || null,
    tagline: null,
    services: [],
    service_area: null,
    hours: null,
    phone: null,
    email: null,
    tone_style: null,
    tone_description: null,
    key_points: [],
  };
  try {
    profile = JSON.parse(content) as typeof profile;
  } catch (err) {
    console.error("Failed to parse onboarding JSON:", err);
  }

  return NextResponse.json({ profile, source: "openai" });
}
