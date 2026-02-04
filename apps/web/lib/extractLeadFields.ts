/**
 * Client-side lead field extraction helpers.
 *
 * Primary extraction uses the server-side GPT-4o-mini endpoint.
 * Heuristics are kept as a fallback for offline/dev scenarios.
 */

export interface ExtractedFields {
  callerName?: string;
  phone?: string;
  address?: string;
  reason?: string;
  numberOfTrees?: string;
  sizeEstimate?: string;
  urgency?: string;
  hazards?: string;
  accessConstraints?: string;
  preferredWindow?: string;
}

export type LeadMessage = {
  role: "user" | "agent";
  content: string;
};

const PHONE_REGEX = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const URGENCY_KEYWORDS = [
  "urgent",
  "emergency",
  "asap",
  "immediately",
  "right away",
  "dangerous",
];
const HAZARD_KEYWORDS = [
  "power line",
  "powerline",
  "electrical",
  "tree on house",
  "tree fell on",
  "blocked road",
  "road blocked",
  "leaning on",
  "about to fall",
];
const SIZE_KEYWORDS = [
  "small",
  "medium",
  "large",
  "huge",
  "massive",
  "tall",
  "feet",
  "foot",
  "meters",
  "metres",
];
const TIME_KEYWORDS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "morning",
  "afternoon",
  "evening",
  "tomorrow",
  "next week",
  "this week",
];

export function extractLeadFields(
  messages: Array<{ role: string; content: string }>
): ExtractedFields {
  const fields: ExtractedFields = {};
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content);
  const allText = userMessages.join(" ");
  const allTextLower = allText.toLowerCase();

  // Phone number
  const phoneMatch = allText.match(PHONE_REGEX);
  if (phoneMatch) {
    fields.phone = phoneMatch[0];
  }

  // Urgency detection
  if (URGENCY_KEYWORDS.some((kw) => allTextLower.includes(kw))) {
    fields.urgency = "urgent";
  }

  // Hazard detection
  const detectedHazards = HAZARD_KEYWORDS.filter((kw) =>
    allTextLower.includes(kw)
  );
  if (detectedHazards.length > 0) {
    fields.hazards = detectedHazards.join(", ");
    if (!fields.urgency) fields.urgency = "urgent";
  }

  // Size estimate detection
  const sizeMatches = SIZE_KEYWORDS.filter((kw) =>
    allTextLower.includes(kw)
  );
  if (sizeMatches.length > 0) {
    // Find the sentence containing size info
    for (const msg of userMessages) {
      const lower = msg.toLowerCase();
      if (SIZE_KEYWORDS.some((kw) => lower.includes(kw))) {
        fields.sizeEstimate = msg.length > 100 ? msg.slice(0, 100) : msg;
        break;
      }
    }
  }

  // Preferred time window
  for (const msg of userMessages) {
    const lower = msg.toLowerCase();
    if (TIME_KEYWORDS.some((kw) => lower.includes(kw))) {
      fields.preferredWindow = msg.length > 100 ? msg.slice(0, 100) : msg;
      break;
    }
  }

  // Name detection: look for "my name is X" or "I'm X" or "this is X"
  const namePatterns = [
    /my name is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i,
    /(?:I'm|I am) ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/,
    /this is ([A-Z][a-z]+(?: [A-Z][a-z]+)?)/i,
  ];
  for (const pattern of namePatterns) {
    const match = allText.match(pattern);
    if (match) {
      fields.callerName = match[1];
      break;
    }
  }

  // Address detection: look for number + street pattern
  const addressMatch = allText.match(
    /\b\d+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd|Court|Ct|Way|Place|Pl)\b/i
  );
  if (addressMatch) {
    fields.address = addressMatch[0];
  }

  // Number of trees: look for digit + "tree(s)"
  const treeCountMatch = allText.match(
    /(\d+)\s+tree/i
  );
  if (treeCountMatch) {
    fields.numberOfTrees = treeCountMatch[1];
  }

  return fields;
}

function normalizeFields(fields: ExtractedFields): ExtractedFields {
  const normalized: ExtractedFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        normalized[key as keyof ExtractedFields] = trimmed;
      }
    }
  }
  return normalized;
}

export async function extractLeadFieldsWithAI(
  messages: LeadMessage[],
  options?: { signal?: AbortSignal }
): Promise<ExtractedFields> {
  if (messages.length === 0) return {};

  try {
    const res = await fetch("/api/lead-extraction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: options?.signal,
    });

    if (!res.ok) {
      throw new Error("Lead extraction failed");
    }

    const data: { fields?: ExtractedFields } = await res.json();
    if (!data.fields) {
      throw new Error("No fields returned");
    }

    return normalizeFields(data.fields);
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw err;
    }
    return normalizeFields(extractLeadFields(messages));
  }
}
