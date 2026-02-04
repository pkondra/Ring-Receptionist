"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { motion } from "framer-motion";
import MarketingNav from "@/components/MarketingNav";
import type { ServicePage } from "@/lib/servicePages";

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function ServicePageContent({ page }: { page: ServicePage }) {
  const themeStyle = {
    "--service-accent": page.theme.accent,
    "--service-accent-strong": page.theme.accentStrong,
    "--service-accent-soft": page.theme.accentSoft,
    "--service-glow-1": page.theme.glowOne,
    "--service-glow-2": page.theme.glowTwo,
    "--service-glow-3": page.theme.glowThree,
  } as CSSProperties;

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-zinc-900"
      style={themeStyle}
    >
      <MarketingNav />

      <main>
        <section className="relative px-6 pt-20 pb-20 md:pt-28 md:pb-28 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[760px] h-[760px] rounded-full blur-3xl bg-[color:var(--service-glow-1)]/50" />
            <div className="absolute -bottom-16 -left-16 w-[360px] h-[360px] rounded-full blur-3xl bg-[color:var(--service-glow-2)]/70" />
            <div className="absolute -bottom-16 -right-16 w-[360px] h-[360px] rounded-full blur-3xl bg-[color:var(--service-glow-3)]/70" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2.5 rounded-full border bg-white/80 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-zinc-800 shadow-sm border-[color:var(--service-accent-soft)]"
            >
              <span className="w-2 h-2 rounded-full animate-pulse bg-[color:var(--service-accent)]" />
              {page.heroTag}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-10 text-4xl md:text-6xl font-semibold text-zinc-900 font-display leading-[1.1]"
            >
              {page.heroTitle}
              <br />
              <span className="text-[color:var(--service-accent-strong)]">
                {page.heroHighlight}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-6 text-lg text-zinc-600 max-w-2xl mx-auto"
            >
              {page.heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="mt-8 flex flex-wrap justify-center gap-3 text-sm text-zinc-600"
            >
              {page.exampleCalls.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-2.5 bg-white/70 px-4 py-2 rounded-full border border-zinc-200/60"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--service-accent)]" />
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/get-started"
                className="rounded-full px-7 py-3 text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 transition-all"
              >
                Get Started
              </Link>
              <Link
                href="/pricing"
                className="rounded-full px-7 py-3 text-sm font-semibold bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 transition-colors"
              >
                View Pricing
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="px-6 pb-20 md:pb-28">
          <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Calls answered instantly",
                body: "Every incoming call is picked up in seconds, with no voicemail dead-ends.",
              },
              {
                title: "Qualified lead details",
                body: "We capture service type, address, urgency, and scheduling preferences so you can quote faster.",
              },
              {
                title: "Always-on coverage",
                body: "Nights, weekends, and holidays are handled automatically without burning out your team.",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                variants={fadeInUp}
                className="surface-card p-6 border border-transparent hover:border-[color:var(--service-accent-soft)] transition"
              >
                <h3 className="text-lg font-semibold text-zinc-900">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm text-zinc-600">{item.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="px-6 py-20 md:py-24 bg-[var(--surface)]">
          <div className="mx-auto max-w-6xl">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-semibold font-display">
                Why {page.label} choose Ring Receptionist
              </h2>
              <p className="mt-4 text-sm text-zinc-600">
                A single system for calls, summaries, and scheduling—without
                adding headcount.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Always on, always consistent",
                  body: "Every caller hears the same professional experience, no matter the hour.",
                },
                {
                  title: "Leads in your dashboard",
                  body: "Transcripts, summaries, and lead fields land in one place.",
                },
                {
                  title: "Works with your stack",
                  body: "Syncs with calendars and CRMs so your team moves fast.",
                },
            ].map((item) => (
                <div
                  key={item.title}
                  className="surface-card p-6 border border-transparent hover:border-[color:var(--service-accent-soft)] transition"
                >
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-zinc-600">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-semibold font-display">
                Frequently asked questions
              </h2>
            </div>
            <div className="mt-8 space-y-3">
              {page.faq.map((item) => (
                <details key={item.q} className="surface-card p-5">
                  <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm text-zinc-600">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 md:pb-24">
          <div className="mx-auto max-w-6xl surface-card p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-semibold font-display">
              Ready to capture every lead?
            </h2>
            <p className="mt-3 text-sm text-zinc-500">
              Start your 7-day free trial. Cancel anytime.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/get-started"
                className="rounded-full px-6 py-2.5 text-sm font-medium btn-primary text-center"
              >
                Get Started
              </Link>
              <Link
                href="/pricing"
                className="rounded-full px-6 py-2.5 text-sm font-medium btn-outline text-center"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
