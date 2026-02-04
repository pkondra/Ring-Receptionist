import { NextRequest, NextResponse } from "next/server";

const MODEL = "gpt-4o-mini";
const MAX_CHARS = 18000;
const MAX_EXTRA_PAGES = 5;
const MAX_SITEMAP_URLS = 40;
const MAX_HTML_BYTES = 2_000_000;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const stripWww = (hostname: string) =>
  hostname.toLowerCase().startsWith("www.")
    ? hostname.toLowerCase().slice(4)
    : hostname.toLowerCase();

const isAllowedHost = (hostname: string, baseHost: string) => {
  if (!hostname) return false;
  if (isPrivateHost(hostname)) return false;
  const base = stripWww(baseHost);
  const candidate = stripWww(hostname);
  if (candidate === base) return true;
  if (candidate.endsWith(`.${base}`)) return true;
  return false;
};

const normalizeInternalUrl = (raw: string, base: URL) => {
  try {
    const resolved = new URL(raw, base);
    if (!["http:", "https:"].includes(resolved.protocol)) return null;
    if (!isAllowedHost(resolved.hostname, base.hostname)) return null;
    resolved.hash = "";
    return resolved;
  } catch {
    return null;
  }
};

const fetchHtml = async (target: URL, controller: AbortController) => {
  const response = await fetch(target.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; RingReceptionist/1.0; +https://ringreceptionist.com)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: controller.signal,
  });
  if (!response.ok) return null;
  const lengthHeader = response.headers.get("content-length");
  if (lengthHeader && Number(lengthHeader) > MAX_HTML_BYTES) {
    return null;
  }
  const html = await response.text();
  return html.length > MAX_HTML_BYTES ? html.slice(0, MAX_HTML_BYTES) : html;
};

const extractInternalLinks = (html: string, base: URL) => {
  const links = new Set<string>();
  const regex = /href=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null = null;
  while ((match = regex.exec(html))) {
    const raw = match[1];
    if (!raw) continue;
    if (
      raw.startsWith("mailto:") ||
      raw.startsWith("tel:") ||
      raw.startsWith("javascript:") ||
      raw.startsWith("#")
    ) {
      continue;
    }
    const normalized = normalizeInternalUrl(raw, base);
    if (!normalized) continue;
    const path = normalized.pathname.toLowerCase();
    if (
      path.endsWith(".pdf") ||
      path.endsWith(".jpg") ||
      path.endsWith(".jpeg") ||
      path.endsWith(".png") ||
      path.endsWith(".webp")
    ) {
      continue;
    }
    links.add(normalized.toString());
  }
  return Array.from(links);
};

const scoreUrl = (url: string) => {
  const lower = url.toLowerCase();
  let score = 0;
  const keywords = [
    "service",
    "services",
    "about",
    "contact",
    "locations",
    "areas",
    "pricing",
    "book",
    "schedule",
    "emergency",
    "plumb",
    "hvac",
    "electric",
    "moving",
  ];
  for (const keyword of keywords) {
    if (lower.includes(keyword)) score += 2;
  }
  if (lower.includes("blog")) score -= 2;
  if (lower.includes("privacy") || lower.includes("terms")) score -= 3;
  return score;
};

const parseSitemapUrls = (xml: string) => {
  const matches = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi));
  return matches.map((m) => m[1].trim()).filter(Boolean);
};

const fetchSitemapCandidates = async (base: URL, controller: AbortController) => {
  const candidates = new Set<string>();
  const origin = base.origin;
  candidates.add(`${origin}/sitemap.xml`);
  candidates.add(`${origin}/sitemap_index.xml`);

  try {
    const robotsUrl = new URL("/robots.txt", origin);
    const robots = await fetch(robotsUrl.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RingReceptionist/1.0; +https://ringreceptionist.com)",
      },
      signal: controller.signal,
    });
    if (robots.ok) {
      const text = await robots.text();
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        const match = line.match(/^sitemap:\s*(.+)$/i);
        if (match) {
          const normalized = normalizeInternalUrl(match[1].trim(), base);
          if (normalized) candidates.add(normalized.toString());
        }
      }
    }
  } catch {
    // ignore
  }

  return Array.from(candidates);
};

const discoverSitemapUrls = async (base: URL, controller: AbortController) => {
  const sitemapUrls = await fetchSitemapCandidates(base, controller);
  const pageUrls: string[] = [];
  const sitemapQueue = [...sitemapUrls];
  let processed = 0;

  while (sitemapQueue.length && processed < 3) {
    const sitemapUrl = sitemapQueue.shift();
    if (!sitemapUrl) break;
    const normalized = normalizeInternalUrl(sitemapUrl, base);
    if (!normalized) continue;
    try {
      const response = await fetch(normalized.toString(), {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RingReceptionist/1.0; +https://ringreceptionist.com)",
        },
        signal: controller.signal,
      });
      if (!response.ok) continue;
      const xml = await response.text();
      const urls = parseSitemapUrls(xml);
      if (xml.includes("<sitemapindex")) {
        for (const url of urls) {
          if (sitemapQueue.length < 4) sitemapQueue.push(url);
        }
      } else {
        for (const url of urls) {
          const page = normalizeInternalUrl(url, base);
          if (page) pageUrls.push(page.toString());
        }
      }
      processed += 1;
    } catch {
      continue;
    }
  }

  return pageUrls.slice(0, MAX_SITEMAP_URLS);
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
  const timeout = setTimeout(() => controller.abort(), 15000);

  let html = "";
  try {
    const responseHtml = await fetchHtml(url, controller);
    if (!responseHtml) {
      return NextResponse.json({
        profile: fallbackProfile(url.hostname, url.hostname),
        source: "fallback",
        warning: "Failed to fetch website",
      });
    }
    html = responseHtml;
  } catch (err) {
    return NextResponse.json({
      profile: fallbackProfile(url.hostname, url.hostname),
      source: "fallback",
      warning: "Failed to fetch website",
    });
  } finally {
    clearTimeout(timeout);
  }

  const hints = buildProfileHints(html);
  const title = hints.title || extractTitle(html);

  const extraPaths = [
    "/services",
    "/our-services",
    "/service-areas",
    "/about",
    "/contact",
    "/locations",
    "/pricing",
  ];

  const candidateUrls = new Set<string>();
  extraPaths.forEach((path) => {
    const nextUrl = normalizeInternalUrl(path, url);
    if (nextUrl) candidateUrls.add(nextUrl.toString());
  });

  const sitemapUrls = await discoverSitemapUrls(url, controller);
  sitemapUrls.forEach((item) => candidateUrls.add(item));

  extractInternalLinks(html, url).forEach((item) =>
    candidateUrls.add(item)
  );

  const rankedUrls = Array.from(candidateUrls)
    .map((item) => ({ url: item, score: scoreUrl(item) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_EXTRA_PAGES)
    .map((item) => item.url);

  const extraTexts: string[] = [];
  for (const item of rankedUrls) {
    if (extraTexts.length >= MAX_EXTRA_PAGES) break;
    try {
      const nextUrl = normalizeInternalUrl(item, url);
      if (!nextUrl) continue;
      const extraHtml = await fetchHtml(nextUrl, controller);
      if (!extraHtml) continue;
      const extraText = stripHtml(extraHtml);
      if (extraText) extraTexts.push(extraText);
    } catch {
      continue;
    }
  }

  const text = stripHtml(html);
  const combined = [text, ...extraTexts].join("\n");
  const sample = combined.slice(0, MAX_CHARS);

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
          "Extract a concise business profile from the website content. Use null for unknown fields and empty arrays where needed. Tone should reflect the site's copy if possible. The services array should include specific sub-services or offerings (e.g., blocked drain cleaning, geyser repair) rather than generic categories. key_points should capture differentiators like service area, warranties, scheduling, pricing transparency, or 24/7 availability.",
      },
      {
        role: "user",
        content: `URL: ${url.toString()}
Title: ${title}
Meta description: ${hints.description || "n/a"}
Site name: ${hints.siteName || "n/a"}
JSON-LD hints: ${hints.jsonLd ? JSON.stringify(hints.jsonLd) : "n/a"}
Content:\n${sample}`,
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
    return NextResponse.json({
      profile: fallbackProfile(sample, title),
      source: "fallback",
      warning: "OpenAI extraction failed",
    });
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
