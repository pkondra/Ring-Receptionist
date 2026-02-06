"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import MarketingNav from "@/components/MarketingNav";
import { servicePages, type ServicePage } from "@/lib/servicePages";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

const trustBadges = [
  { icon: "🛡️", label: "TCPA Compliant" },
  { icon: "🔒", label: "Enterprise-Grade Security" },
  { icon: "📋", label: "Month-to-Month" },
  { icon: "🌎", label: "Multi-Industry Ready" },
  { icon: "✨", label: "Full Setup Included" },
];

export default function ServicePageContent({ page }: { page: ServicePage }) {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [websiteInput, setWebsiteInput] = useState("");

  const themeStyle = {
    "--service-accent": page.theme.accent,
    "--service-accent-strong": page.theme.accentStrong,
    "--service-accent-soft": page.theme.accentSoft,
  } as CSSProperties;

  const serviceLabel = page.label;
  const serviceLower = page.label.toLowerCase();

  const stats = [
    {
      value: "62%",
      label: `of ${serviceLower} callers hang up without leaving a message`,
    },
    {
      value: "35%",
      label: "of inbound calls come after hours",
    },
    {
      value: "$1,200",
      label: "average job value lost to missed calls",
    },
    {
      value: "85%",
      label: "of customers hire whoever answers first",
    },
  ];

  const painPoints = [
    {
      title: "Voicemails Don't Convert",
      body: `When a customer needs ${serviceLower} help, they rarely leave a message. They call the next business on the list.`,
    },
    {
      title: "After-Hours Peaks",
      body: `Night and weekend ${serviceLower} calls are the highest value. If no one answers, you lose the job.`,
    },
    {
      title: "High-Value Jobs Walk Away",
      body: "Emergency service isn't cheap. Each unanswered call can be thousands in lost revenue.",
    },
    {
      title: "You're On the Job",
      body: `Hard to grab the phone while you're busy with ${serviceLower} work. Those calls go unanswered.`,
    },
  ];

  const capabilities = [
    {
      title: "Urgent Call Routing",
      body: "Recognizes emergencies and flags them immediately so your team can respond fast.",
    },
    {
      title: "Smart Scheduling",
      body: "Checks availability and books estimates directly into your calendar.",
    },
    {
      title: "Service Area Check",
      body: "Confirms callers are within your service radius before booking.",
    },
    {
      title: "Junk Call Blocker",
      body: "Automatically screens out solicitors, robocalls, and spam.",
    },
    {
      title: "Round-the-Clock Coverage",
      body: "Weekends, holidays, late nights—every call gets answered professionally.",
    },
    {
      title: "Works With Your Tools",
      body: "Connects with Jobber, ServiceTitan, Housecall Pro, and Google Calendar.",
    },
  ];

  const beforeList = [
    {
      title: `Urgent ${serviceLabel} Calls Go to Voicemail`,
      body: "Customers need help now. If no one answers, they move on immediately.",
    },
    {
      title: "Hands Full, Phone in Pocket",
      body: "You're in the middle of the job and can't stop. That lead disappears.",
    },
    {
      title: "Never Truly Off the Clock",
      body: "Dinner, weekends, and days off still get interrupted by ringing phones.",
    },
    {
      title: "Big Crews Have the Advantage",
      body: "Larger companies keep staff on the line all day. Small teams lose the race.",
    },
  ];

  const afterList = [
    {
      title: "Every Call Captured",
      body: "AI picks up instantly, collects details, and flags emergencies.",
    },
    {
      title: "Stay Focused, Stay Safe",
      body: "Keep both hands on the job. Details wait in your dashboard.",
    },
    {
      title: "Reclaim Your Personal Time",
      body: "Every inquiry is handled without you lifting a finger.",
    },
    {
      title: "Compete Like the Big Guys",
      body: "Professional phone presence at a fraction of the cost.",
    },
  ];

  const compareRows = [
    {
      label: "Monthly Investment",
      fullTime: "$3,500+",
      callCenter: "$500-1,500",
      ours: "From $49",
    },
    {
      label: "Availability",
      fullTime: "Business hours only",
      callCenter: "24/7 at premium rates",
      ours: "24/7/365 included",
      oursIcon: true,
    },
    {
      label: "Pickup Speed",
      fullTime: "Depends on workload",
      callCenter: "15-60 seconds avg.",
      ours: "Under 2 seconds",
      oursIcon: true,
    },
    {
      label: "Industry Knowledge",
      fullTime: true,
      callCenter: false,
      ours: "Trained on your services",
      oursIcon: true,
    },
    {
      label: "Direct Booking",
      fullTime: true,
      callCenter: "Message taking only",
      ours: "Real-time scheduling",
      oursIcon: true,
    },
    {
      label: "Emergency Protocols",
      fullTime: "If they're available",
      callCenter: "Additional fees",
      ours: "Built-in, no extra cost",
      oursIcon: true,
    },
  ];

  const testimonials = [
    {
      quote: "We stopped missing emergency calls after hours. ROI showed up fast.",
      name: "Alyssa Gomez",
      meta: `${serviceLabel} • Portland, OR`,
      avatar: "AG",
    },
    {
      quote: "My team focuses on the job instead of the phone. Summaries are clear.",
      name: "Robert Okonkwo",
      meta: `${serviceLabel} • Atlanta, GA`,
      avatar: "RO",
    },
    {
      quote: "Customers think it's a real receptionist. That was the goal.",
      name: "Sarah Blackwood",
      meta: `${serviceLabel} • Minneapolis, MN`,
      avatar: "SB",
    },
  ];

  return (
    <div
      className="min-h-screen bg-[var(--background)] text-zinc-900 overflow-x-hidden"
      style={themeStyle}
    >
      <MarketingNav />

      <main>
        <section className="px-6 pt-20 pb-24 md:pt-32 md:pb-36">
          <div className="mx-auto max-w-4xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 rounded-full border bg-white px-5 py-2.5 text-sm font-medium text-zinc-800 shadow-sm border-[color:var(--service-accent-soft)]"
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse bg-[color:var(--service-accent)]"
              />
              {page.heroTag}
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-10 text-5xl md:text-6xl lg:text-7xl font-semibold text-zinc-900 font-display leading-[1.1] tracking-tight"
            >
              {page.heroTitle}
              <br />
              <span className="text-[color:var(--service-accent-strong)]">
                {page.heroHighlight}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed"
            >
              {page.heroSubtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            >
              <input
                value={websiteInput}
                onChange={(e) => setWebsiteInput(e.target.value)}
                placeholder="Enter your website (optional)"
                className="w-full sm:w-[340px] rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--service-accent-soft)]"
              />
              <button
                onClick={() => {
                  const trimmed = websiteInput.trim();
                  const href = trimmed
                    ? `/get-started?website=${encodeURIComponent(trimmed)}`
                    : "/get-started";
                  router.push(href);
                }}
                className="rounded-full px-6 py-3 text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 transition-all"
              >
                Get Started
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-zinc-600"
            >
              <span className="inline-flex items-center gap-2.5 bg-white px-4 py-2 rounded-full border border-zinc-200/60">
                <svg
                  className="w-4 h-4 text-[color:var(--service-accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Natural conversation
              </span>
              <span className="inline-flex items-center gap-2.5 bg-white px-4 py-2 rounded-full border border-zinc-200/60">
                <svg
                  className="w-4 h-4 text-[color:var(--service-accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Direct calendar booking
              </span>
              <span className="inline-flex items-center gap-2.5 bg-white px-4 py-2 rounded-full border border-zinc-200/60">
                <svg
                  className="w-4 h-4 text-[color:var(--service-accent)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Blocks spam calls
              </span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/get-started"
                className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 transition-all hover:shadow-xl hover:shadow-zinc-900/25"
              >
                Get Started
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm transition-all"
              >
                View Pricing
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12 flex flex-col items-center gap-4"
            >
              <div className="flex -space-x-3">
                {["MC", "RO", "SB", "JT", "AL"].map((initials) => (
                  <div
                    key={initials}
                    className="w-10 h-10 rounded-full bg-[color:var(--service-accent-soft)] border-2 border-white flex items-center justify-center text-xs font-semibold text-[color:var(--service-accent-strong)]"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-600">
                <span className="font-semibold text-zinc-900">500+</span> service
                businesses trust us with their calls
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-10 pt-8 border-t border-zinc-200/60 flex flex-wrap justify-center gap-x-8 gap-y-3 text-xs text-zinc-500"
            >
              {trustBadges.map((badge) => (
                <span key={badge.label} className="inline-flex items-center gap-2">
                  <span className="text-base">{badge.icon}</span>
                  {badge.label}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="bg-zinc-900 py-16 md:py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mx-auto max-w-6xl px-6"
          >
            <motion.p
              variants={fadeIn}
              className="text-center text-[color:var(--service-accent)] text-sm font-medium tracking-wide uppercase mb-12"
            >
              Missed Calls Cost Real Revenue
            </motion.p>
            <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-zinc-800 rounded-2xl overflow-hidden">
              {stats.map((stat) => (
                <motion.div
                  key={stat.value}
                  variants={fadeInUp}
                  className="bg-zinc-900 text-center py-10 px-6"
                >
                  <div className="text-4xl md:text-5xl font-bold text-white font-display tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm text-zinc-400 leading-relaxed mt-3">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="px-6 py-16 md:py-20 bg-[var(--surface)]">
          <div className="mx-auto max-w-6xl">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-semibold font-display">
                Other Service Industries
              </h2>
              <p className="mt-3 text-sm text-zinc-600">
                Same platform, tailored language. Explore other industries.
              </p>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {servicePages
                .filter((service) => service.slug !== page.slug)
                .map((service) => (
                  <Link
                    key={service.slug}
                    href={`/services/${service.slug}`}
                    className="surface-card p-5 text-center hover:-translate-y-1 transition-transform"
                  >
                    <div className="text-sm font-semibold text-zinc-900">
                      {service.label}
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      {service.heroTag}
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 mb-4">
                The Real Cost of Missed Calls
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                Why {serviceLabel} Businesses Lose Calls
              </h2>
              <p className="mt-5 text-lg text-zinc-600">
                When your phone rings and no one picks up, that customer doesn't
                wait—they call the next name on the list.
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-14 grid gap-6 md:grid-cols-2"
            >
              {painPoints.map((point) => (
                <motion.div
                  key={point.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm hover:shadow-md hover:border-zinc-300/80 transition-all"
                >
                  <div className="flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[color:var(--service-accent-soft)] text-[color:var(--service-accent-strong)] flex items-center justify-center transition-transform group-hover:scale-110">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="pt-1">
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {point.title}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                        {point.body}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28 bg-zinc-50">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--service-accent)] mb-4">
                Powerful Features
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                Everything Your {serviceLabel} Phone System Should Do
              </h2>
              <p className="mt-5 text-lg text-zinc-600">
                Built specifically for service businesses with features that
                actually matter.
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {capabilities.map((cap) => (
                <motion.div
                  key={cap.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm hover:shadow-md hover:border-[color:var(--service-accent-soft)] transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-[color:var(--service-accent-soft)] text-[color:var(--service-accent-strong)] flex items-center justify-center mb-4 transition-all group-hover:scale-110">
                    {cap.title === "Urgent Call Routing" && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {cap.title === "Smart Scheduling" && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                    {cap.title === "Service Area Check" && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                    {cap.title === "Junk Call Blocker" && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                    {cap.title === "Round-the-Clock Coverage" && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {cap.title === "Works With Your Tools" && (
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">
                    {cap.body}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 mb-4">
                See the Difference
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                Before vs After for {serviceLabel}
              </h2>
            </motion.div>
            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl border border-zinc-200 p-8 relative shadow-sm"
              >
                <div className="absolute -top-4 left-6 inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider px-4 py-2">
                  <svg className="w-3.5 h-3.5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Without Us
                </div>
                <div className="mt-4 space-y-6">
                  {beforeList.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900">
                          {item.title}
                        </h4>
                        <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
                          {item.body}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl border-2 p-8 relative shadow-sm ring-1"
                style={{
                  borderColor: "var(--service-accent-soft)",
                  boxShadow: "0 0 0 1px var(--service-accent-soft)",
                }}
              >
                <div
                  className="absolute -top-4 left-6 inline-flex items-center gap-2 rounded-full text-white text-xs font-bold uppercase tracking-wider px-4 py-2"
                  style={{ backgroundColor: "var(--service-accent-strong)" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  With Us
                </div>
                <div className="mt-4 space-y-6">
                  {afterList.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[color:var(--service-accent-soft)] text-[color:var(--service-accent-strong)] flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900">
                          {item.title}
                        </h4>
                        <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">
                          {item.body}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28 bg-zinc-50">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 mb-4">
                Compare Your Options
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                How We Compare for {serviceLabel}
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-14 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="grid grid-cols-4 text-sm bg-zinc-50 border-b border-zinc-200">
                <div className="p-5 font-semibold text-zinc-700"></div>
                <div className="p-5 text-center border-l border-zinc-200">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">In-House</div>
                  <div className="font-semibold text-zinc-900 mt-1">Receptionist</div>
                </div>
                <div className="p-5 text-center border-l border-zinc-200">
                  <div className="text-xs text-zinc-500 uppercase tracking-wider">Outsourced</div>
                  <div className="font-semibold text-zinc-900 mt-1">Call Center</div>
                </div>
                <div
                  className="p-5 text-center text-white"
                  style={{ backgroundColor: "var(--service-accent-strong)" }}
                >
                  <div className="text-xs uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.7)" }}>
                    AI-Powered
                  </div>
                  <div className="font-semibold mt-1">theringreceiptionsit.com</div>
                </div>
              </div>
              {compareRows.map((row, idx) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`grid grid-cols-4 text-sm ${idx !== compareRows.length - 1 ? "border-b border-zinc-100" : ""} hover:bg-zinc-50/50 transition-colors`}
                >
                  <div className="p-5 font-medium text-zinc-800">{row.label}</div>
                  <div className="p-5 text-center text-zinc-500 border-l border-zinc-100">
                    {typeof row.fullTime === "boolean" ? (
                      row.fullTime ? (
                        <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </span>
                      ) : (
                        <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </span>
                      )
                    ) : row.fullTime}
                  </div>
                  <div className="p-5 text-center text-zinc-500 border-l border-zinc-100">
                    {typeof row.callCenter === "boolean" ? (
                      row.callCenter ? (
                        <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </span>
                      ) : (
                        <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-rose-100 text-rose-500">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </span>
                      )
                    ) : row.callCenter}
                  </div>
                  <div className="p-5 text-center border-l font-medium"
                    style={{
                      backgroundColor: "var(--service-accent-soft)",
                      color: "var(--service-accent-strong)",
                    }}
                  >
                    {row.oursIcon && (
                      <span className="inline-flex w-5 h-5 items-center justify-center rounded-full text-white mr-2" style={{ backgroundColor: "var(--service-accent-strong)" }}>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      </span>
                    )}
                    {row.ours}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 mb-4">
                Customer Stories
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                What {serviceLabel} Teams Say
              </h2>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-14 grid gap-6 md:grid-cols-3"
            >
              {testimonials.map((t) => (
                <motion.div
                  key={t.name}
                  variants={fadeInUp}
                  whileHover={{ y: -6, transition: { duration: 0.2 } }}
                  className="bg-white rounded-2xl border border-zinc-200/80 p-7 shadow-sm hover:shadow-md hover:border-zinc-300/80 transition-all"
                >
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <p className="mt-5 text-sm text-zinc-600 leading-relaxed">"{t.quote}"</p>
                  <div className="mt-6 pt-5 border-t border-zinc-100 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[color:var(--service-accent-soft)] text-[color:var(--service-accent-strong)] flex items-center justify-center text-sm font-bold">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900">{t.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{t.meta}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28 bg-zinc-50">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 mb-4">
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                Answers for {serviceLabel}
              </h2>
              <p className="mt-4 text-lg text-zinc-600">
                Everything you need to know before getting started
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-12 space-y-3"
            >
              {page.faq.map((faq, idx) => (
                <motion.div
                  key={faq.q}
                  variants={fadeInUp}
                  className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-zinc-50/50 transition-colors"
                  >
                    <span className="font-semibold text-zinc-900 pr-4">
                      {faq.q}
                    </span>
                    <motion.div
                      animate={{ rotate: openFaq === idx ? 45 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0"
                    >
                      <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                      </svg>
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFaq === idx && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-6 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-28 bg-zinc-900">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium mb-6"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "var(--service-accent)" }}
            >
              <span className="w-2 h-2 rounded-full bg-[color:var(--service-accent)] animate-pulse" />
              Start capturing leads today
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display text-white leading-tight">
              Ready to Never Miss Another Call?
            </h2>
            <p className="mt-5 text-lg text-zinc-400 max-w-xl mx-auto">
              Join 500+ service businesses who capture every opportunity. Start
              your free trial today—card required, $0 today.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/get-started"
                className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg transition-all"
              >
                Get Started
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold border border-zinc-700 text-white hover:bg-zinc-800 hover:border-zinc-600 transition-all"
              >
                View Pricing
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[color:var(--service-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                7-day free trial
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[color:var(--service-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No contracts
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[color:var(--service-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cancel anytime
              </span>
            </motion.div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
