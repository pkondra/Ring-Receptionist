"use client";

import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const stats = [
  {
    value: "62%",
    label: "of callers hang up without leaving a message",
  },
  {
    value: "35%",
    label: "of tree emergencies occur after business hours",
  },
  {
    value: "$1,200",
    label: "average revenue from a single emergency call",
  },
  {
    value: "85%",
    label: "of homeowners choose whoever picks up first",
  },
];

const painPoints = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: "Voicemails Don't Convert",
    body: "When a massive oak branch crashes through a roof, that homeowner isn't leaving a message. They're dialing the next arborist.",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
    title: "Storms Strike at Night",
    body: "The worst tree damage happens during evening thunderstorms. Your phone rings at 11 PM—are you answering?",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "High-Value Work Walks Away",
    body: "Emergency tree removal isn't cheap. Each unanswered call is potentially thousands in lost revenue going to your competition.",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "Your Hands Are Full",
    body: "Hard to grab your phone when you're operating a bucket truck or rigging a dangerous limb. Those calls go unanswered.",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-500",
  },
];

const capabilities = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Urgent Call Routing",
    body: "Instantly recognizes hazardous situations—downed power lines, trees on structures, blocked roads—and alerts your on-call crew.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Smart Scheduling",
    body: "Checks your availability and books estimates directly into your calendar. Wake up to a full schedule.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Territory Verification",
    body: "Confirms callers are within your service radius before booking. No more wasted drive time to jobs outside your zone.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Junk Call Blocker",
    body: "Automatically screens out solicitors, robocalls, and marketing pitches. Your time is spent on real customers only.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Round-the-Clock Coverage",
    body: "Weekends, holidays, 3 AM ice storms—every call gets answered professionally, every single time.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Works With Your Tools",
    body: "Connects seamlessly with Arborgold, Jobber, ServiceTitan, Google Calendar, and more.",
  },
];

const beforeList = [
  {
    title: "Storm Calls Go to Voicemail",
    body: "A severe weather alert hits your area. Phones light up but you're already on a job. Those callers move on.",
  },
  {
    title: "Chainsaw in Hand, Phone in Pocket",
    body: "You hear the buzz but can't stop mid-cut. By the time you check, they've already hired someone else.",
  },
  {
    title: "Never Truly Off the Clock",
    body: "Dinner with family, your kid's game, a rare vacation—the phone is always on your mind.",
  },
  {
    title: "Big Crews Have Big Advantages",
    body: "Larger companies have dedicated office staff answering around the clock. Hard to compete solo.",
  },
];

const afterList = [
  {
    title: "Every Storm Call Captured",
    body: "AI picks up instantly, collects all the details, and dispatches your team for true emergencies.",
  },
  {
    title: "Stay Focused, Stay Safe",
    body: "Keep both hands on the equipment. Customer details are waiting in your dashboard when you're done.",
  },
  {
    title: "Reclaim Your Personal Time",
    body: "Be fully present at dinner and weekends. Every inquiry is handled without you lifting a finger.",
  },
  {
    title: "Level the Playing Field",
    body: "Professional phone presence at a fraction of what big operations pay. Callers can't tell the difference.",
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
    callCenter: "15-60 seconds average",
    ours: "Under 2 seconds",
    oursIcon: true,
  },
  {
    label: "Industry Knowledge",
    fullTime: true,
    callCenter: false,
    ours: "Trained on arboriculture",
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
    callCenter: "Additional fees apply",
    ours: "Built-in, no extra cost",
    oursIcon: true,
  },
];

const testimonials = [
  {
    quote:
      "Since switching, I haven't missed a single storm call. Last month alone that meant three emergency removals I would have lost. The ROI is obvious.",
    name: "Marcus Chen",
    meta: "Chen's Tree Experts • Portland, OR",
    avatar: "MC",
  },
  {
    quote:
      "My wife noticed the difference first—I'm actually present at family dinners now. The AI handles everything and the summaries are incredibly detailed.",
    name: "Robert Okonkwo",
    meta: "Okonkwo Arborist Services • Atlanta, GA",
    avatar: "RO",
  },
  {
    quote:
      "Clients constantly compliment our 'office staff.' When I tell them it's AI, they don't believe me. It's that natural.",
    name: "Sarah Blackwood",
    meta: "Blackwood Tree Care • Minneapolis, MN",
    avatar: "SB",
  },
];

const faqs = [
  {
    q: "Is the AI trained on tree care terminology?",
    a: "Absolutely. It understands arborist-specific language—crown reduction, hazard assessment, cabling, stump grinding, root pruning—and can intelligently triage based on urgency and job type.",
  },
  {
    q: "Can callers tell they're speaking with AI?",
    a: "The voice is warm, professional, and conversational. Most callers assume they've reached a human receptionist. We regularly hear feedback about how friendly 'your staff' is.",
  },
  {
    q: "What details does it gather from callers?",
    a: "Contact info, property address, tree species and size when known, nature of the issue, hazard indicators, access considerations, timeline preferences, and how they'd like to be reached.",
  },
  {
    q: "How do I review my calls?",
    a: "Every conversation is transcribed and summarized in your dashboard. You'll see exactly what was discussed before returning any call.",
  },
  {
    q: "How quickly does it pick up?",
    a: "Under two seconds. No hold music, no phone tree menus, no 'please wait for the next available representative.' Instant professional response.",
  },
  {
    q: "Can I adjust when I'm available for bookings?",
    a: "Yes. Sync your calendar and update availability anytime. The AI respects your schedule and only books slots you've marked open.",
  },
];

const trustBadges = [
  { icon: "🛡️", label: "TCPA Compliant" },
  { icon: "🔒", label: "Enterprise-Grade Security" },
  { icon: "📋", label: "Month-to-Month" },
  { icon: "🇺🇸", label: "US Support Team" },
  { icon: "✨", label: "Full Setup Included" },
];

// Animation variants
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
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-900 overflow-x-hidden">
      <MarketingNav />

      <main>
        {/* Hero Section */}
        <section className="relative px-6 pt-20 pb-24 md:pt-32 md:pb-36 overflow-hidden">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-emerald-100/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full bg-emerald-50/50 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-amber-50/30 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            {/* Badge */}
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2.5 rounded-full border border-emerald-300/60 bg-white/80 backdrop-blur-sm px-5 py-2.5 text-sm font-medium text-zinc-800 shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Built for Tree Care Professionals
            </motion.span>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-10 text-5xl md:text-6xl lg:text-7xl font-semibold text-zinc-900 font-display leading-[1.1] tracking-tight"
            >
              Never Miss Another
              <br />
              <span className="text-emerald-600">Emergency Call</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8 text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed"
            >
              The AI receptionist that answers every call, qualifies leads, and handles emergencies—so you can focus on the job, not the phone.
            </motion.p>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-zinc-600"
            >
              <span className="inline-flex items-center gap-2.5 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-200/60">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Natural conversation
              </span>
              <span className="inline-flex items-center gap-2.5 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-200/60">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Direct calendar booking
              </span>
              <span className="inline-flex items-center gap-2.5 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-zinc-200/60">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Blocks spam calls
              </span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <SignedOut>
                <Link
                  href="/get-started"
                  className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 transition-all hover:shadow-xl hover:shadow-zinc-900/25"
                >
                  Start Free Trial
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm transition-all"
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Hear a Demo Call
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20 transition-all hover:shadow-xl hover:shadow-zinc-900/25"
                >
                  Open Dashboard
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold bg-white border border-zinc-200 text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm transition-all"
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Hear a Demo Call
                </Link>
              </SignedIn>
            </motion.div>

            {/* Social proof */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12 flex flex-col items-center gap-4"
            >
              <div className="flex -space-x-3">
                {['MC', 'RO', 'SB', 'JT', 'AL'].map((initials, i) => (
                  <div key={initials} className="w-10 h-10 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-emerald-700">
                    {initials}
                  </div>
                ))}
              </div>
              <p className="text-sm text-zinc-600">
                <span className="font-semibold text-zinc-900">500+</span> tree care professionals trust us with their calls
              </p>
            </motion.div>

            {/* Trust badges */}
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

        {/* Stats Section */}
        <section id="stats-section" className="bg-zinc-900 py-16 md:py-24">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mx-auto max-w-6xl px-6"
          >
            <motion.p variants={fadeIn} className="text-center text-emerald-400 text-sm font-medium tracking-wide uppercase mb-12">
              The Problem You Already Know
            </motion.p>
            <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-4 bg-zinc-800 rounded-2xl overflow-hidden">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.value}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-zinc-900 text-center py-10 px-6"
                >
                  <div className="text-4xl md:text-5xl font-bold text-white font-display tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-sm text-zinc-400 leading-relaxed mt-3">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Why Tree Companies Need Section */}
        <section id="why-section" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                The Real Cost of Missed Calls
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                Every Missed Call Is Revenue<br className="hidden md:block" /> Lost to Your Competition
              </h2>
              <p className="mt-5 text-lg text-zinc-600">
                When your phone rings and no one picks up, that customer doesn't wait—they call the next name on the list.
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-14 grid gap-6 md:grid-cols-2"
            >
              {painPoints.map((point, index) => (
                <motion.div
                  key={point.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm hover:shadow-md hover:border-zinc-300/80 transition-all"
                >
                  <div className="flex gap-5">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${point.iconBg} ${point.iconColor} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      {point.icon}
                    </div>
                    <div className="pt-1">
                      <h3 className="text-lg font-semibold text-zinc-900">
                        {point.title}
                      </h3>
                      <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{point.body}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* What Our Service Does Section */}
        <section id="features-section" className="px-6 py-20 md:py-28 bg-zinc-50">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 mb-4">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Powerful Features
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                Everything Your Phone System Should Do
              </h2>
              <p className="mt-5 text-lg text-zinc-600">
                Built specifically for tree care businesses with features that actually matter.
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {capabilities.map((cap, index) => (
                <motion.div
                  key={cap.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="group bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 transition-all group-hover:bg-emerald-100 group-hover:scale-110">
                    {cap.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600 leading-relaxed">{cap.body}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Before vs After Section */}
        <section id="before-after-section" className="px-6 py-20 md:py-28">
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                See the Difference
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                What Changes When Every<br className="hidden md:block" /> Call Gets Answered
              </h2>
            </motion.div>
            <div className="mt-14 grid gap-8 lg:grid-cols-2">
              {/* Before */}
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
                        <h4 className="font-semibold text-zinc-900">{item.title}</h4>
                        <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">{item.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* After */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="bg-white rounded-2xl border-2 border-emerald-200 p-8 relative shadow-sm ring-1 ring-emerald-100"
              >
                <div className="absolute -top-4 left-6 inline-flex items-center gap-2 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-2">
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
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mt-0.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900">{item.title}</h4>
                        <p className="mt-1.5 text-sm text-zinc-600 leading-relaxed">{item.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Comparison Table Section */}
        <section id="compare-section" className="px-6 py-20 md:py-28 bg-zinc-50">
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Compare Your Options
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                How We Stack Up Against<br className="hidden md:block" /> Traditional Solutions
              </h2>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-14 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              {/* Table Header */}
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
                <div className="p-5 text-center bg-emerald-600 text-white">
                  <div className="text-xs text-emerald-100 uppercase tracking-wider">AI-Powered</div>
                  <div className="font-semibold mt-1">Tree Receptionist</div>
                </div>
              </div>
              {/* Table Body */}
              {compareRows.map((row, idx) => (
                <motion.div
                  key={row.label}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  className={`grid grid-cols-4 text-sm ${idx !== compareRows.length - 1 ? 'border-b border-zinc-100' : ''} hover:bg-zinc-50/50 transition-colors`}
                >
                  <div className="p-5 font-medium text-zinc-800">{row.label}</div>
                  <div className="p-5 text-center text-zinc-500 border-l border-zinc-100">
                    {typeof row.fullTime === 'boolean' ? (
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
                    {typeof row.callCenter === 'boolean' ? (
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
                  <div className="p-5 text-center bg-emerald-50/70 border-l border-emerald-100 font-medium text-emerald-800">
                    {row.oursIcon && (
                      <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-emerald-600 text-white mr-2">
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

        {/* Testimonials Section */}
        <section id="testimonials-section" className="px-6 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto"
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 mb-4">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Customer Stories
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                Trusted by Tree Care<br className="hidden md:block" /> Professionals Nationwide
              </h2>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-14 grid gap-6 md:grid-cols-3"
            >
              {testimonials.map((t, index) => (
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
                    <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
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

        {/* FAQ Section */}
        <section id="faq-section" className="px-6 py-20 md:py-28 bg-zinc-50">
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
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                FAQ
              </span>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display leading-tight">
                Questions? We Have Answers
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
              {faqs.map((faq, idx) => (
                <motion.div
                  key={faq.q}
                  variants={fadeInUp}
                  className="bg-white rounded-xl border border-zinc-200/80 overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-zinc-50/50 transition-colors"
                  >
                    <span className="font-semibold text-zinc-900 pr-4">{faq.q}</span>
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

        {/* CTA Section */}
        <section className="px-6 py-20 md:py-28 relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-zinc-900" />
          <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="relative mx-auto max-w-3xl text-center"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Start capturing leads today
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold font-display text-white leading-tight">
              Ready to Never Miss<br className="hidden md:block" /> Another Call?
            </h2>
            <p className="mt-5 text-lg text-zinc-400 max-w-xl mx-auto">
              Join 500+ tree care professionals who capture every opportunity. Start your free trial today—no credit card required.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <SignedOut>
                <Link
                  href="/get-started"
                  className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg transition-all"
                >
                  Start Free Trial
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
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="group inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg transition-all"
                >
                  Open Dashboard
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
              </SignedIn>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-zinc-500"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                7-day free trial
              </span>
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Cancel anytime
              </span>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
            {/* Brand */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold">Tree Removal Receptionist</span>
              </div>
              <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
                AI-powered phone answering designed specifically for tree care businesses. Capture every lead, handle emergencies, grow your operation.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/pricing" className="text-zinc-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/get-started" className="text-zinc-400 hover:text-white transition-colors">Get Started</Link></li>
                <li><Link href="/dashboard" className="text-zinc-400 hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-2">
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/contact" className="text-zinc-400 hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="lg:col-span-3">
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-14 pt-8 border-t border-zinc-800/80">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-sm text-zinc-500">
                © 2026 Tree Removal Receptionist. All rights reserved.
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-sm text-zinc-500">
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                  Built in the USA
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  SOC 2 Compliant
                </span>
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  99.9% Uptime
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
