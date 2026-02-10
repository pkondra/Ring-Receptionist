"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import MarketingNav from "@/components/MarketingNav";
import { api } from "@convex/_generated/api";
import {
  DEFAULT_AGENT_NAME,
  DEFAULT_BUSINESS_NAME,
  DEFAULT_CUSTOM_CONTEXT,
  DEFAULT_EMERGENCY_INSTRUCTIONS,
  DEFAULT_EMERGENCY_TRIGGERS,
  DEFAULT_QUALIFICATION_GOALS,
  DEFAULT_TONE_DESCRIPTION,
  DEFAULT_TONE_STYLE,
  DEFAULT_VOICE_ID,
} from "@/lib/agentDefaults";

type CoverageMode = "businessHours" | "always" | "custom";

type VoiceOption = {
  voice_id: string;
  name: string;
  category?: string;
  preview_url?: string;
  labels?: Record<string, string>;
};

type OnboardingStorage = {
  step: number;
  website: string;
  draft: {
    agentName: string;
    businessName: string;
    toneStyle: string;
    toneDescription: string;
    customContext: string;
  };
  voiceId: string;
  contact: {
    name: string;
    email: string;
    phone: string;
    acceptTerms: boolean;
  };
  callHandling: {
    mode: CoverageMode;
    businessHoursStart: string;
    businessHoursEnd: string;
    customSchedule: string;
  };
  customContextTouched: boolean;
};

const STORAGE_KEY = "onboardingStateV3";
const PENDING_KEY = "onboardingPending";

const baseDraft = {
  agentName: DEFAULT_AGENT_NAME,
  businessName: DEFAULT_BUSINESS_NAME,
  toneStyle: DEFAULT_TONE_STYLE,
  toneDescription: DEFAULT_TONE_DESCRIPTION,
  customContext: DEFAULT_CUSTOM_CONTEXT,
};

const baseContact = {
  name: "",
  email: "",
  phone: "",
  acceptTerms: false,
};

const baseCallHandling = {
  mode: "businessHours" as CoverageMode,
  businessHoursStart: "08:00",
  businessHoursEnd: "18:00",
  customSchedule: "",
};

const steps = [
  {
    id: 1,
    label: "Website",
    title: "Business URL",
    desc: "Demo mode: URL captured now, advanced scraping comes next.",
  },
  {
    id: 2,
    label: "Voice",
    title: "Choose Voice",
    desc: "Preview ElevenLabs voices and pick your receptionist voice.",
  },
  {
    id: 3,
    label: "Coverage",
    title: "Call Hours",
    desc: "Define when Benny should answer your inbound calls.",
  },
  {
    id: 4,
    label: "Contact",
    title: "Account Setup",
    desc: "Save your contact profile and create your configured agent.",
  },
  {
    id: 5,
    label: "Billing",
    title: "Start Trial",
    desc: "Pick a plan and activate your 7-day free trial.",
  },
] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const normalizeWebsite = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  try {
    return new URL(withProtocol);
  } catch {
    return null;
  }
};

const titleCase = (value: string) => {
  if (!value) return value;
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
};

const applyBusinessName = (context: string, businessName?: string | null) => {
  if (!businessName) return context;
  return context.replace(/theringreceiptionsit.com/g, businessName);
};

const guessBusinessNameFromWebsite = (rawWebsite: string) => {
  const parsed = normalizeWebsite(rawWebsite);
  if (!parsed) return null;
  const host = parsed.hostname.replace(/^www\./i, "");
  const root = host.split(".")[0] ?? "";
  const normalized = root.replace(/[-_]+/g, " ").trim();
  return normalized ? titleCase(normalized) : null;
};

const HOURS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
];

const hourLabel = (value: string) => {
  const [rawHour] = value.split(":");
  const hour = Number(rawHour);
  const suffix = hour >= 12 ? "pm" : "am";
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized} ${suffix}`;
};

export default function GetStartedPage() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();

  const [step, setStep] = useState(1);
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [customContextTouched, setCustomContextTouched] = useState(false);

  const [draft, setDraft] = useState(baseDraft);
  const [voiceId, setVoiceId] = useState(DEFAULT_VOICE_ID);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [voicesError, setVoicesError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [contact, setContact] = useState(baseContact);
  const [callHandling, setCallHandling] = useState(baseCallHandling);

  const ensureAccountSetup = useMutation(api.users.ensureAccountSetup);
  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const createAgent = useMutation(api.agentConfigs.createAgent);

  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isSignedIn ? {} : "skip"
  );

  const activeStep = creating ? 5 : step;

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.voice_id === voiceId),
    [voices, voiceId]
  );

  const progress = useMemo(
    () => `${activeStep} / ${steps.length}`,
    [activeStep]
  );

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as Partial<OnboardingStorage>;
      if (typeof parsed.step === "number" && parsed.step >= 1 && parsed.step <= 4) {
        setStep(parsed.step);
      }
      if (typeof parsed.website === "string") {
        setWebsite(parsed.website);
      }
      if (parsed.draft) {
        setDraft((prev) => ({ ...prev, ...parsed.draft }));
      }
      if (parsed.voiceId) {
        setVoiceId(parsed.voiceId);
      }
      if (parsed.contact) {
        setContact((prev) => ({ ...prev, ...parsed.contact }));
      }
      if (parsed.callHandling) {
        setCallHandling((prev) => ({ ...prev, ...parsed.callHandling }));
      }
      if (typeof parsed.customContextTouched === "boolean") {
        setCustomContextTouched(parsed.customContextTouched);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const websiteParam = params.get("website");
    if (websiteParam && !website.trim()) {
      setWebsite(websiteParam);
    }
  }, [website]);

  useEffect(() => {
    if (!user) return;
    setContact((prev) => ({
      ...prev,
      name: prev.name || user.fullName || "",
      email:
        prev.email ||
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        "",
    }));
  }, [user]);

  useEffect(() => {
    const loadVoices = async () => {
      setVoicesLoading(true);
      setVoicesError(null);
      try {
        const res = await fetch("/api/elevenlabs/voices", { cache: "no-store" });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || "Failed to load voices");
        }
        const payload = (await res.json()) as { voices?: VoiceOption[] };
        const list = (payload.voices || [])
          .filter((voice) => Boolean(voice.voice_id))
          .slice(0, 12);

        setVoices(list);

        if (list.length > 0) {
          setVoiceId((current) => {
            if (list.some((voice) => voice.voice_id === current)) {
              return current;
            }
            return list[0].voice_id;
          });
        }
      } catch (err) {
        setVoicesError(err instanceof Error ? err.message : "Failed to load voices");
      } finally {
        setVoicesLoading(false);
      }
    };

    void loadVoices();
  }, []);

  useEffect(() => {
    const pending = localStorage.getItem(PENDING_KEY);
    if (isSignedIn && pending === "1" && !creating) {
      localStorage.removeItem(PENDING_KEY);
      void finalizeOnboarding();
    }
  }, [isSignedIn, creating]);

  const persistState = (nextStep = step) => {
    const snapshot: OnboardingStorage = {
      step: nextStep,
      website,
      draft,
      voiceId,
      contact,
      callHandling,
      customContextTouched,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  };

  const clearStoredState = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PENDING_KEY);
  };

  const validateContact = () => {
    if (!contact.name.trim()) {
      setError("Enter your full name to continue.");
      setStep(4);
      return false;
    }
    if (!contact.email.trim()) {
      setError("Enter your email to continue.");
      setStep(4);
      return false;
    }
    if (!contact.phone.trim()) {
      setError("Enter your phone number to continue.");
      setStep(4);
      return false;
    }
    if (!contact.acceptTerms) {
      setError("Accept the terms to continue.");
      setStep(4);
      return false;
    }
    return true;
  };

  const continueFromWebsiteStep = () => {
    setError(null);
    const normalized = normalizeWebsite(website);
    if (!normalized) {
      setError("Enter a valid business website URL.");
      return;
    }

    const normalizedWebsite = normalized.toString();
    setWebsite(normalizedWebsite);

    const guessedBusinessName = guessBusinessNameFromWebsite(normalizedWebsite);
    if (guessedBusinessName) {
      setDraft((prev) => {
        const nextBusinessName =
          prev.businessName === DEFAULT_BUSINESS_NAME
            ? guessedBusinessName
            : prev.businessName;
        const nextAgentName =
          prev.agentName === DEFAULT_AGENT_NAME
            ? `${nextBusinessName} Receptionist`
            : prev.agentName;

        return {
          ...prev,
          businessName: nextBusinessName,
          agentName: nextAgentName,
          customContext: customContextTouched
            ? prev.customContext
            : applyBusinessName(DEFAULT_CUSTOM_CONTEXT, nextBusinessName),
        };
      });
    }

    setStep(2);
  };

  const persistForSignup = () => {
    persistState(4);
    localStorage.setItem(PENDING_KEY, "1");
  };

  const buildCallHandlingPayload = () => {
    if (callHandling.mode === "always") {
      return {
        mode: "always" as CoverageMode,
      };
    }

    if (callHandling.mode === "custom") {
      return {
        mode: "custom" as CoverageMode,
        customSchedule: callHandling.customSchedule.trim(),
      };
    }

    return {
      mode: "businessHours" as CoverageMode,
      businessHoursStart: callHandling.businessHoursStart,
      businessHoursEnd: callHandling.businessHoursEnd,
    };
  };

  const finalizeOnboarding = async () => {
    setError(null);

    if (!validateContact()) {
      return;
    }

    if (!isSignedIn) {
      setError("Create your account first to continue.");
      return;
    }

    const normalizedWebsite = normalizeWebsite(website);
    if (!normalizedWebsite) {
      setError("Enter a valid website URL before creating the agent.");
      setStep(1);
      return;
    }

    setCreating(true);
    try {
      let workspaceId = workspace?._id;
      if (!workspaceId) {
        const result = await ensureAccountSetup({
          createDefaultAgent: false,
        });
        workspaceId = result.workspaceId;
      }

      await updateUserProfile({
        name: contact.name.trim() || undefined,
        email: contact.email.trim() || undefined,
        phone: contact.phone.trim() || undefined,
      });

      await fetch("/api/notifications/welcome", {
        method: "POST",
      }).catch(() => {
        // Continue onboarding even if email service is temporarily unavailable.
      });

      await createAgent({
        workspaceId,
        agentName: draft.agentName,
        businessName: draft.businessName,
        tone: {
          style: draft.toneStyle,
          description: draft.toneDescription,
        },
        customContext: draft.customContext,
        voiceId: voiceId || DEFAULT_VOICE_ID,
        onboardingWebsiteUrl: normalizedWebsite.toString(),
        callHandling: buildCallHandlingPayload(),
        qualificationGoals: DEFAULT_QUALIFICATION_GOALS.map((goal) => ({
          key: goal.key,
          label: goal.label,
          required: goal.required,
        })),
        emergencyProtocol: {
          triggers: DEFAULT_EMERGENCY_TRIGGERS,
          instructions: DEFAULT_EMERGENCY_INSTRUCTIONS,
        },
      });

      clearStoredState();
      router.push("/pricing");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create your agent"
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-900">
      <MarketingNav />

      <main className="px-6 pb-20 pt-10 md:pt-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
              Onboarding
            </p>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold font-display">
              Setup your AI receptionist
            </h1>
            <p className="mt-3 text-sm text-zinc-600">
              One focused step at a time. We will create your configured agent and
              then send you to pricing to start the 7-day trial.
            </p>
          </div>

          <section className="surface-card mt-8 p-6 md:p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-zinc-600">
                Step {activeStep} of {steps.length}
              </div>
              <div className="text-xs text-zinc-500">{progress}</div>
            </div>

            <div className="mt-3 h-2 w-full rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-zinc-900 transition-all"
                style={{
                  width: `${Math.max((activeStep / steps.length) * 100, 8)}%`,
                }}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {steps.map((item) => {
                const active = activeStep === item.id;
                const done = activeStep > item.id;
                return (
                  <span
                    key={item.id}
                    className={`rounded-full px-3 py-1 text-xs border ${
                      active
                        ? "border-zinc-900 bg-zinc-900 text-white"
                        : done
                        ? "border-zinc-900 bg-zinc-100 text-zinc-900"
                        : "border-[var(--border)] bg-white text-zinc-500"
                    }`}
                  >
                    {item.id}. {item.label}
                  </span>
                );
              })}
            </div>

            {error && (
              <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {creating ? (
                <motion.div
                  key="step-creating"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="mt-8 space-y-4"
                >
                  <h2 className="text-2xl font-semibold font-display">
                    Creating your agent
                  </h2>
                  <p className="text-sm text-zinc-600">
                    Saving contact details and agent configuration. Redirecting to
                    pricing next.
                  </p>
                  <div className="surface-muted p-4 text-sm text-zinc-700">
                    Please keep this page open for a few seconds.
                  </div>
                </motion.div>
              ) : step === 1 ? (
                <motion.div
                  key="step-1"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="mt-8 space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-semibold font-display">
                      Add your business website
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                      Demo mode: we capture your URL now. Advanced scraping will be
                      re-enabled next.
                    </p>
                  </div>

                  <div className="surface-muted p-4 text-sm text-zinc-700">
                    Use your primary website so setup follows your business context.
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-wide text-zinc-500">
                      Website URL
                    </label>
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://yourbusiness.com"
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={continueFromWebsiteStep}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              ) : step === 2 ? (
                <motion.div
                  key="step-2"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="mt-8 space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-semibold font-display">
                      Listen and choose your voice
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                      Pick one ElevenLabs voice for the receptionist. You can edit it
                      later in settings.
                    </p>
                  </div>

                  {previewUrl && (
                    <div className="surface-muted p-4">
                      <div className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
                        Voice sample
                      </div>
                      <audio controls autoPlay src={previewUrl} className="w-full" />
                    </div>
                  )}

                  {voicesLoading && (
                    <div className="surface-muted p-4 text-sm text-zinc-600">
                      Loading voices...
                    </div>
                  )}

                  {voicesError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      {voicesError}
                    </div>
                  )}

                  <div className="grid gap-3 md:grid-cols-2">
                    {voices.map((voice) => {
                      const isSelected = voice.voice_id === voiceId;
                      return (
                        <div
                          key={voice.voice_id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setVoiceId(voice.voice_id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setVoiceId(voice.voice_id);
                            }
                          }}
                          className={`text-left rounded-2xl border p-4 transition cursor-pointer ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-[var(--border)] bg-white hover:bg-zinc-50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-zinc-900">
                                {voice.name}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {voice.category || "General"}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="text-xs font-semibold rounded-full bg-emerald-600 text-white px-2 py-1">
                                Selected
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-zinc-500">Sample:</span>
                            {voice.preview_url ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setPreviewUrl(voice.preview_url || null);
                                }}
                                className="text-xs font-medium underline text-zinc-800"
                              >
                                Play preview
                              </button>
                            ) : (
                              <span className="text-xs text-zinc-400">Not available</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-outline"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        persistState(3);
                        setStep(3);
                      }}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              ) : step === 3 ? (
                <motion.div
                  key="step-3"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="mt-8 space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-semibold font-display">
                      When should the agent answer calls?
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                      Set your preferred call handling schedule.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <label className="block rounded-2xl border border-[var(--border)] bg-white p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={callHandling.mode === "businessHours"}
                          onChange={() =>
                            setCallHandling((prev) => ({
                              ...prev,
                              mode: "businessHours",
                            }))
                          }
                        />
                        <div>
                          <div className="text-sm font-semibold">Business hours only</div>
                          <div className="text-xs text-zinc-500">
                            Agent answers during your selected business hours.
                          </div>
                        </div>
                      </div>

                      {callHandling.mode === "businessHours" && (
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <label className="text-xs uppercase tracking-wide text-zinc-500">
                              Start time
                            </label>
                            <select
                              value={callHandling.businessHoursStart}
                              onChange={(event) =>
                                setCallHandling((prev) => ({
                                  ...prev,
                                  businessHoursStart: event.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
                            >
                              {HOURS.map((time) => (
                                <option key={time} value={time}>
                                  {hourLabel(time)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs uppercase tracking-wide text-zinc-500">
                              End time
                            </label>
                            <select
                              value={callHandling.businessHoursEnd}
                              onChange={(event) =>
                                setCallHandling((prev) => ({
                                  ...prev,
                                  businessHoursEnd: event.target.value,
                                }))
                              }
                              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm"
                            >
                              {HOURS.map((time) => (
                                <option key={time} value={time}>
                                  {hourLabel(time)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </label>

                    <label className="block rounded-2xl border border-[var(--border)] bg-white p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={callHandling.mode === "always"}
                          onChange={() =>
                            setCallHandling((prev) => ({
                              ...prev,
                              mode: "always",
                            }))
                          }
                        />
                        <div>
                          <div className="text-sm font-semibold">24/7 coverage</div>
                          <div className="text-xs text-zinc-500">
                            Agent answers at all times.
                          </div>
                        </div>
                      </div>
                    </label>

                    <label className="block rounded-2xl border border-[var(--border)] bg-white p-4 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          checked={callHandling.mode === "custom"}
                          onChange={() =>
                            setCallHandling((prev) => ({
                              ...prev,
                              mode: "custom",
                            }))
                          }
                        />
                        <div>
                          <div className="text-sm font-semibold">Custom schedule</div>
                          <div className="text-xs text-zinc-500">
                            Use a freeform schedule note.
                          </div>
                        </div>
                      </div>

                      {callHandling.mode === "custom" && (
                        <textarea
                          value={callHandling.customSchedule}
                          onChange={(event) =>
                            setCallHandling((prev) => ({
                              ...prev,
                              customSchedule: event.target.value,
                            }))
                          }
                          rows={3}
                          placeholder="Mon-Fri 8am-6pm, Sat 9am-2pm, Sun off"
                          className="mt-4 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                        />
                      )}
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setStep(2)}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-outline"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => {
                        persistState(4);
                        setStep(4);
                      }}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary"
                    >
                      Continue
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="step-4"
                  variants={fadeInUp}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="mt-8 space-y-6"
                >
                  <div>
                    <h2 className="text-2xl font-semibold font-display">
                      Contact and account setup
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                      We use this information for account setup and notifications.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Full name
                      </label>
                      <input
                        value={contact.name}
                        onChange={(event) =>
                          setContact((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Email
                      </label>
                      <input
                        value={contact.email}
                        onChange={(event) =>
                          setContact((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Phone number
                      </label>
                      <input
                        value={contact.phone}
                        onChange={(event) =>
                          setContact((prev) => ({
                            ...prev,
                            phone: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      />
                    </div>
                  </div>

                  <label className="surface-muted p-4 flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={contact.acceptTerms}
                      onChange={(event) =>
                        setContact((prev) => ({
                          ...prev,
                          acceptTerms: event.target.checked,
                        }))
                      }
                      className="mt-1"
                    />
                    <span className="text-sm text-zinc-700">
                      I agree to the Terms of Service and Privacy Policy.
                    </span>
                  </label>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setStep(3)}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-outline"
                    >
                      Back
                    </button>

                    <SignedIn>
                      <button
                        onClick={finalizeOnboarding}
                        disabled={creating}
                        className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary disabled:opacity-60"
                      >
                        Create agent and continue to pricing
                      </button>
                    </SignedIn>

                    <SignedOut>
                      <SignUpButton mode="modal" forceRedirectUrl="/get-started">
                        <button
                          onClick={persistForSignup}
                          className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary"
                        >
                          Create account and continue
                        </button>
                      </SignUpButton>
                    </SignedOut>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div className="surface-muted mt-4 p-4 text-sm text-zinc-700">
            <div className="text-xs uppercase tracking-wide text-zinc-500 mb-1">
              Configuration snapshot
            </div>
            <div>
              <span className="font-semibold">Business:</span> {draft.businessName}
            </div>
            <div>
              <span className="font-semibold">Voice:</span>{" "}
              {selectedVoice?.name || "Default voice"}
            </div>
            <div>
              <span className="font-semibold">Coverage:</span>{" "}
              {callHandling.mode === "always"
                ? "24/7 coverage"
                : callHandling.mode === "custom"
                ? "Custom schedule"
                : `${hourLabel(callHandling.businessHoursStart)} - ${hourLabel(
                    callHandling.businessHoursEnd
                  )}`}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
