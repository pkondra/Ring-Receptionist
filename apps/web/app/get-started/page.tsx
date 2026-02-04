"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
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

type Profile = {
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
};

const baseDraft = {
  agentName: DEFAULT_AGENT_NAME,
  businessName: DEFAULT_BUSINESS_NAME,
  toneStyle: DEFAULT_TONE_STYLE,
  toneDescription: DEFAULT_TONE_DESCRIPTION,
  customContext: DEFAULT_CUSTOM_CONTEXT,
};

const steps = [
  {
    id: 1,
    label: "Website",
    title: "Paste your website",
    desc: "We scan your site and draft your receptionist settings.",
  },
  {
    id: 2,
    label: "Agent",
    title: "Review + customize",
    desc: "Tune the name, tone, and custom context.",
  },
  {
    id: 3,
    label: "Your info",
    title: "Create your account",
    desc: "We’ll save your profile and start your trial.",
  },
] as const;

const buildWebsiteNotes = (profile: Profile) => {
  const notes = [];
  if (profile.tagline) notes.push(`Tagline: ${profile.tagline}`);
  if (profile.services?.length)
    notes.push(`Services: ${profile.services.join(", ")}`);
  if (profile.service_area) notes.push(`Service area: ${profile.service_area}`);
  if (profile.hours) notes.push(`Hours: ${profile.hours}`);
  if (profile.phone) notes.push(`Phone: ${profile.phone}`);
  if (profile.email) notes.push(`Email: ${profile.email}`);
  if (profile.key_points?.length)
    notes.push(`Key points: ${profile.key_points.join("; ")}`);

  return notes.join("\n");
};

const buildServiceLine = (services: string[]) => {
  const cleaned = services
    .map((service) => service.trim())
    .filter(Boolean);
  if (cleaned.length === 0) {
    return "4. Service needed (plumbing, HVAC, electrical, moving, tree care, etc.)";
  }
  return `4. Service needed (plumbing, HVAC, electrical, moving, tree care, etc.; subtypes: ${cleaned.join(
    ", "
  )})`;
};

const applyServiceLine = (context: string, services: string[]) =>
  context.replace(
    /4\. Service needed \([^)]+\)/,
    buildServiceLine(services)
  );

const mergeCustomContext = (notes: string, profile?: Profile) => {
  const context = profile
    ? applyServiceLine(DEFAULT_CUSTOM_CONTEXT, profile.services ?? [])
    : DEFAULT_CUSTOM_CONTEXT;
  if (!notes) return context;
  return `${context}\n\nWebsite Notes\n${notes}`;
};

export default function GetStartedPage() {
  const router = useRouter();
  const { user, isSignedIn } = useUser();
  const [step, setStep] = useState(1);
  const [website, setWebsite] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customContextTouched, setCustomContextTouched] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(baseDraft);
  const [contact, setContact] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const ensureAccountSetup = useMutation(api.users.ensureAccountSetup);
  const updateUserProfile = useMutation(api.users.updateUserProfile);
  const createAgent = useMutation(api.agentConfigs.createAgent);

  const workspace = useQuery(
    api.workspaces.getMyWorkspace,
    isSignedIn ? {} : "skip"
  );

  useEffect(() => {
    const storedDraft = localStorage.getItem("onboardingDraft");
    const storedContact = localStorage.getItem("onboardingContact");
    const storedStep = localStorage.getItem("onboardingStep");
    if (storedDraft) {
      try {
        setDraft(JSON.parse(storedDraft) as typeof baseDraft);
      } catch {
        localStorage.removeItem("onboardingDraft");
      }
    }
    if (storedContact) {
      try {
        setContact(JSON.parse(storedContact) as typeof contact);
      } catch {
        localStorage.removeItem("onboardingContact");
      }
    }
    if (storedStep) {
      const parsed = Number(storedStep);
      if (parsed >= 1 && parsed <= 3) setStep(parsed);
    }
  }, []);

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
    const pending = localStorage.getItem("onboardingPending");
    if (isSignedIn && pending === "1" && !creating) {
      localStorage.removeItem("onboardingPending");
      void finalizeOnboarding();
    }
  }, [isSignedIn, creating]);

  const analyzeWebsite = async () => {
    if (!website.trim()) {
      setError("Please enter a website URL.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to analyze website");
      }
      const data: { profile: Profile } = await res.json();
      const nextProfile = data.profile;
      setProfile(nextProfile);

      const notes = buildWebsiteNotes(nextProfile);
      setDraft((prev) => {
        const suggestedBusiness =
          nextProfile.business_name?.trim() || prev.businessName;
        const suggestedAgent =
          nextProfile.business_name?.trim() && prev.agentName === DEFAULT_AGENT_NAME
            ? `${nextProfile.business_name} Receptionist`
            : prev.agentName;

        return {
          agentName: suggestedAgent,
          businessName:
            prev.businessName === DEFAULT_BUSINESS_NAME
              ? suggestedBusiness
              : prev.businessName,
          toneStyle:
            prev.toneStyle === DEFAULT_TONE_STYLE && nextProfile.tone_style
              ? nextProfile.tone_style
              : prev.toneStyle,
          toneDescription:
            prev.toneDescription === DEFAULT_TONE_DESCRIPTION &&
            nextProfile.tone_description
              ? nextProfile.tone_description
              : prev.toneDescription,
          customContext: customContextTouched
            ? prev.customContext
            : mergeCustomContext(notes, nextProfile),
        };
      });
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const persistDraftForSignup = () => {
    localStorage.setItem("onboardingDraft", JSON.stringify(draft));
    localStorage.setItem("onboardingContact", JSON.stringify(contact));
    localStorage.setItem("onboardingStep", String(step));
    localStorage.setItem("onboardingPending", "1");
  };

  const finalizeOnboarding = async () => {
    if (!isSignedIn) return;
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
        name: contact.name || undefined,
        email: contact.email || undefined,
        phone: contact.phone || undefined,
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
        voiceId: DEFAULT_VOICE_ID,
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

      localStorage.removeItem("onboardingDraft");
      localStorage.removeItem("onboardingContact");
      localStorage.removeItem("onboardingStep");

      router.push("/pricing");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create your agent"
      );
    } finally {
      setCreating(false);
    }
  };

  const progress = useMemo(
    () => `${step} / ${steps.length}`,
    [step]
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-900">
      <MarketingNav />

      <main className="px-6 pb-20 pt-10 md:pt-16">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[0.35fr_0.65fr]">
            <aside className="space-y-6">
              <div className="surface-card p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                  Onboarding
                </p>
                <h1 className="mt-3 text-3xl md:text-4xl font-semibold font-display">
                  Build your AI receptionist in minutes.
                </h1>
                <p className="mt-3 text-sm text-zinc-600">
                  We pull what we can from your website, then you fine-tune the
                  script before starting your free trial.
                </p>
              </div>

              <div className="surface-card p-6">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Progress</span>
                  <span>{progress}</span>
                </div>
                <div className="mt-4 space-y-4">
                  {steps.map((item) => {
                    const active = step === item.id;
                    const done = step > item.id;
                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border px-4 py-3 transition ${
                          active
                            ? "border-emerald-400 bg-emerald-50"
                            : "border-[var(--border)] bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                              done
                                ? "bg-emerald-600 text-white"
                                : active
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {item.id}
                          </div>
                          <div>
                            <div className="text-xs uppercase text-zinc-500">
                              {item.label}
                            </div>
                            <div className="text-sm font-semibold">
                              {item.title}
                            </div>
                            <div className="text-xs text-zinc-500">
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="surface-card p-6">
                <h3 className="text-sm font-semibold text-zinc-900">
                  Agent snapshot
                </h3>
                <div className="mt-4 space-y-2 text-sm text-zinc-600">
                  <div>
                    <span className="text-xs uppercase text-zinc-400">Agent</span>
                    <div className="font-semibold text-zinc-900">
                      {draft.agentName}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-zinc-400">
                      Business
                    </span>
                    <div className="font-semibold text-zinc-900">
                      {draft.businessName}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-zinc-400">
                      Tone
                    </span>
                    <div className="text-sm text-zinc-600">
                      {draft.toneStyle}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500">
                    Custom context length: {draft.customContext.length} chars
                  </div>
                </div>
              </div>
            </aside>

            <section className="surface-card p-6 md:p-8">
              {error && (
                <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold font-display">
                      Start with your website
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                      Paste your site and we will draft a custom receptionist
                      profile you can edit.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-wide text-zinc-500">
                      Website URL
                    </label>
                    <input
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="https://ringreceptionist.com"
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                    />
                    <div className="text-xs text-zinc-500">
                      We only use your public website content to personalize
                      your agent.
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={analyzeWebsite}
                      disabled={loading}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary disabled:opacity-60"
                    >
                      {loading ? "Analyzing..." : "Analyze Website"}
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-outline"
                    >
                      Skip for now
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-semibold font-display">
                        Review your agent
                      </h2>
                      <p className="mt-2 text-sm text-zinc-600">
                        Adjust the name, tone, and custom context before we
                        create your receptionist.
                      </p>
                    </div>
                    {profile && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Website analyzed
                      </span>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Business name
                      </label>
                      <input
                        value={draft.businessName}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            businessName: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Agent name
                      </label>
                      <input
                        value={draft.agentName}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            agentName: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Tone style
                      </label>
                      <input
                        value={draft.toneStyle}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            toneStyle: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Tone description
                      </label>
                      <input
                        value={draft.toneDescription}
                        onChange={(e) =>
                          setDraft((prev) => ({
                            ...prev,
                            toneDescription: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-wide text-zinc-500">
                      Custom context
                    </label>
                    <textarea
                      value={draft.customContext}
                      onChange={(e) => {
                        setCustomContextTouched(true);
                        setDraft((prev) => ({
                          ...prev,
                          customContext: e.target.value,
                        }));
                      }}
                      rows={10}
                      className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                    />
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setStep(1)}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-outline"
                    >
                      Back
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold font-display">
                      Your details
                    </h2>
                    <p className="mt-2 text-sm text-zinc-600">
                      We use this for account setup and call notifications.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Full name
                      </label>
                      <input
                        value={contact.name}
                        onChange={(e) =>
                          setContact((prev) => ({
                            ...prev,
                            name: e.target.value,
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
                        onChange={(e) =>
                          setContact((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-wide text-zinc-500">
                        Phone
                      </label>
                      <input
                        value={contact.phone}
                        onChange={(e) =>
                          setContact((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setStep(2)}
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
                        {creating
                          ? "Creating your agent..."
                          : "Create agent & continue to pricing"}
                      </button>
                    </SignedIn>
                    <SignedOut>
                      <SignUpButton mode="modal" forceRedirectUrl="/get-started">
                        <button
                          onClick={persistDraftForSignup}
                          className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary"
                        >
                          Create account & continue
                        </button>
                      </SignUpButton>
                    </SignedOut>
                  </div>

                  <p className="text-xs text-zinc-500">
                    You will start your 7-day trial after choosing a plan. No
                    charge today.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
