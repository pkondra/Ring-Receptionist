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

// Decorative tree/nature icons for the background
const TreeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" opacity="0.12">
    <path d="M12 2L8 8h2v3H8l-4 6h5v5h6v-5h5l-4-6h-2V8h2L12 2z" />
  </svg>
);

const LeafIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" opacity="0.12">
    <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
  </svg>
);

const SawIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" opacity="0.10">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1" fill="none" />
  </svg>
);

const StumpIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" opacity="0.10">
    <ellipse cx="12" cy="18" rx="8" ry="3" />
    <path d="M4 18V14c0-2 3.58-4 8-4s8 2 8 4v4" />
    <ellipse cx="12" cy="10" rx="8" ry="3" />
  </svg>
);

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
        <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
          {/* Background decorative icons */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              <TreeIcon className="absolute w-16 h-16 text-emerald-700 top-20 left-[5%]" />
              <LeafIcon className="absolute w-12 h-12 text-emerald-600 top-32 left-[15%] rotate-45" />
              <SawIcon className="absolute w-14 h-14 text-emerald-700 top-48 left-[8%]" />
              <StumpIcon className="absolute w-10 h-10 text-emerald-600 top-64 left-[12%]" />
              <LeafIcon className="absolute w-8 h-8 text-emerald-700 top-80 left-[6%] -rotate-12" />

              <TreeIcon className="absolute w-14 h-14 text-emerald-700 top-16 right-[8%]" />
              <LeafIcon className="absolute w-10 h-10 text-emerald-600 top-28 right-[15%] -rotate-45" />
              <SawIcon className="absolute w-12 h-12 text-emerald-700 top-44 right-[5%]" />
              <StumpIcon className="absolute w-14 h-14 text-emerald-600 top-56 right-[12%]" />
              <TreeIcon className="absolute w-10 h-10 text-emerald-700 top-72 right-[7%]" />
              <LeafIcon className="absolute w-16 h-16 text-emerald-600 top-20 right-[25%] rotate-12" />
            </motion.div>
          </div>

          <div className="relative mx-auto max-w-4xl text-center">
            {/* Badge */}
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm"
            >
              <span className="text-lg">🌲</span>
              Built for Tree Care Professionals
            </motion.span>

            {/* Main Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-8 text-5xl md:text-6xl lg:text-7xl font-semibold text-zinc-900 font-display leading-tight"
            >
              Your Calls Answered
              <br />
              <span className="text-emerald-600">Day and Night</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg md:text-xl text-zinc-600 max-w-2xl mx-auto"
            >
              The <strong>AI receptionist built for arborists</strong> answers every ring, qualifies each lead, handles emergencies, and lets you focus on what you do best—caring for trees.
            </motion.p>

            {/* Feature badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-zinc-600"
            >
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Natural conversation
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Direct calendar booking
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Zero spam calls
              </span>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <SignedOut>
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold btn-primary transition-transform hover:scale-105"
                >
                  Start Your Free Trial
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm transition-transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Listen to a Demo
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold btn-primary transition-transform hover:scale-105"
                >
                  Open Dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-base font-semibold bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm transition-transform hover:scale-105"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Listen to a Demo
                </Link>
              </SignedIn>
            </motion.div>

            {/* Revenue highlight */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-800"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Capture 3+ extra jobs weekly — that's significant monthly revenue
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-zinc-500"
            >
              {trustBadges.map((badge) => (
                <span key={badge.label} className="inline-flex items-center gap-1.5">
                  <span>{badge.icon}</span>
                  {badge.label}
                </span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Stats Section */}
        <section id="stats-section" className="bg-[#1a1a1a] py-14 md:py-20">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mx-auto max-w-6xl px-6"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.value}
                  variants={fadeInUp}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="text-center py-6 px-4"
                >
                  <div className="text-5xl md:text-6xl font-bold text-white font-display">
                    {stat.value}
                  </div>
                  <div className="w-12 h-0.5 bg-emerald-500 mx-auto mt-4 mb-3" />
                  <div className="text-sm text-zinc-400 leading-relaxed">{stat.label}</div>
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
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-semibold font-display">
                The Hidden Cost of Missed Calls
              </h2>
              <p className="mt-4 text-lg text-zinc-600">
                Every unanswered ring is a potential customer choosing your competitor instead.
              </p>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-12 grid gap-5 md:grid-cols-2"
            >
              {painPoints.map((point, index) => (
                <motion.div
                  key={point.title}
                  variants={fadeInUp}
                  transition={{ duration: 0.5 }}
                  whileHover={{ y: -4 }}
                  className="surface-card p-6 flex gap-4"
                >
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${point.iconBg} ${point.iconColor} flex items-center justify-center`}>
                    {point.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {point.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-600">{point.body}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* What Our Service Does Section */}
        <section id="features-section" className="px-6 py-20 md:py-28 bg-[var(--surface)]">
          <div className="mx-auto max-w-6xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-semibold font-display">
                How We Handle Your Calls
              </h2>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-12 grid gap-8 md:grid-cols-3"
            >
              {capabilities.map((cap, index) => (
                <motion.div
                  key={cap.title}
                  variants={scaleIn}
                  transition={{ duration: 0.5 }}
                  whileHover={{ scale: 1.02 }}
                  className="text-center"
                >
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    {cap.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                    {cap.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600">{cap.body}</p>
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
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-semibold font-display">
                The Transformation
              </h2>
              <p className="mt-4 text-lg text-zinc-600">
                What changes when every call gets answered professionally
              </p>
            </motion.div>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {/* Before */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="surface-card p-8 relative"
              >
                <span className="absolute -top-3 left-6 inline-flex rounded-full bg-rose-500 text-white text-xs font-bold uppercase tracking-wide px-4 py-1.5">
                  Before
                </span>
                <div className="mt-4 space-y-5">
                  {beforeList.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900">{item.title}</h4>
                        <p className="mt-1 text-sm text-zinc-600">{item.body}</p>
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
                className="surface-card p-8 relative border-emerald-200"
              >
                <span className="absolute -top-3 left-6 inline-flex rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-wide px-4 py-1.5">
                  After
                </span>
                <div className="mt-4 space-y-5">
                  {afterList.map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-zinc-900">{item.title}</h4>
                        <p className="mt-1 text-sm text-zinc-600">{item.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Comparison Table Section */}
        <section id="compare-section" className="px-6 py-20 md:py-28 bg-[var(--surface)]">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-semibold font-display">
                How We Compare
              </h2>
              <p className="mt-4 text-lg text-zinc-600">
                See how AI-powered answering measures up to traditional options
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-12 overflow-hidden rounded-2xl border border-[var(--border)] bg-white"
            >
              {/* Table Header */}
              <div className="grid grid-cols-4 text-sm bg-zinc-50 border-b border-[var(--border)]">
                <div className="p-5 font-semibold text-zinc-700"></div>
                <div className="p-5 text-center">
                  <div className="text-xs text-zinc-500">In-House</div>
                  <div className="font-semibold text-zinc-900">Receptionist</div>
                </div>
                <div className="p-5 text-center">
                  <div className="text-xs text-zinc-500">Outsourced</div>
                  <div className="font-semibold text-zinc-900">Call Center</div>
                </div>
                <div className="p-5 text-center bg-emerald-50 border-l-2 border-emerald-500">
                  <div className="text-xs text-emerald-600 font-medium">Tree Removal</div>
                  <div className="font-semibold text-zinc-900">Receptionist</div>
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
                  className={`grid grid-cols-4 text-sm ${idx !== compareRows.length - 1 ? 'border-b border-[var(--border)]' : ''}`}
                >
                  <div className="p-5 font-medium text-zinc-700">{row.label}</div>
                  <div className="p-5 text-center text-zinc-500">
                    {typeof row.fullTime === 'boolean' ? (
                      row.fullTime ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-rose-500">✗</span>
                      )
                    ) : row.fullTime}
                  </div>
                  <div className="p-5 text-center text-zinc-500">
                    {typeof row.callCenter === 'boolean' ? (
                      row.callCenter ? (
                        <span className="text-emerald-600">✓</span>
                      ) : (
                        <span className="text-rose-500">✗</span>
                      )
                    ) : row.callCenter}
                  </div>
                  <div className="p-5 text-center bg-emerald-50/50 border-l-2 border-emerald-500 font-semibold text-emerald-700">
                    {row.oursIcon && <span className="text-emerald-600 mr-1">✓</span>}
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
              className="text-center max-w-3xl mx-auto"
            >
              <h2 className="text-4xl md:text-5xl font-semibold font-display">
                Trusted by Arborists
              </h2>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="mt-12 grid gap-6 md:grid-cols-3"
            >
              {testimonials.map((t, index) => (
                <motion.div
                  key={t.name}
                  variants={fadeInUp}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.3 }}
                  className="surface-card p-6"
                >
                  <div className="text-amber-400 text-lg tracking-tight">★★★★★</div>
                  <p className="mt-4 text-sm text-zinc-600 leading-relaxed">"{t.quote}"</p>
                  <div className="mt-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-semibold">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">{t.name}</div>
                      <div className="text-xs text-zinc-500">{t.meta}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq-section" className="px-6 py-20 md:py-28 bg-[var(--surface)]">
          <div className="mx-auto max-w-3xl">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <h2 className="text-4xl md:text-5xl font-semibold font-display">
                Common Questions
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
              className="mt-12 space-y-4"
            >
              {faqs.map((faq, idx) => (
                <motion.div
                  key={faq.q}
                  variants={fadeInUp}
                  className="surface-card overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                  >
                    <span className="font-semibold text-zinc-900 pr-4">{faq.q}</span>
                    <motion.svg
                      animate={{ rotate: openFaq === idx ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="w-5 h-5 text-zinc-400 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
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
                        <div className="px-6 pb-5 text-sm text-zinc-600 leading-relaxed">
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
        <section className="px-6 py-20 md:py-28">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h2 className="text-4xl md:text-5xl font-semibold font-display">
              Stop Losing Leads Tonight
            </h2>
            <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">
              Join tree care professionals who capture every opportunity. Your 7-day trial is completely free—no payment info required.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <SignedOut>
                <Link
                  href="/get-started"
                  className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold btn-primary transition-transform hover:scale-105"
                >
                  Begin Free Trial
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm transition-transform hover:scale-105"
                >
                  See Pricing Plans
                </Link>
              </SignedOut>
              <SignedIn>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold btn-primary transition-transform hover:scale-105"
                >
                  Open Dashboard
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-full px-8 py-4 text-base font-semibold bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm transition-transform hover:scale-105"
                >
                  See Pricing Plans
                </Link>
              </SignedIn>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 text-sm text-zinc-500"
            >
              No credit card required • Cancel anytime • Setup included
            </motion.p>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] bg-zinc-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
            {/* Brand */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center">
                  <span className="text-white text-xl">🌲</span>
                </div>
                <span className="text-xl font-semibold">Tree Removal Receptionist</span>
              </div>
              <p className="text-sm text-zinc-400 max-w-sm">
                AI-powered phone answering designed specifically for tree care businesses. Capture every lead, handle emergencies, grow your operation.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="text-zinc-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Product</h4>
              <ul className="space-y-3 text-sm">
                <li><Link href="/pricing" className="text-zinc-300 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link href="/get-started" className="text-zinc-300 hover:text-white transition-colors">Get Started</Link></li>
                <li><Link href="/dashboard" className="text-zinc-300 hover:text-white transition-colors">Dashboard</Link></li>
                <li><a href="#" className="text-zinc-300 hover:text-white transition-colors">Demo Call</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Company</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-zinc-300 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><a href="#" className="text-zinc-300 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white transition-colors">TCPA Compliance</a></li>
                <li><a href="#" className="text-zinc-300 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-zinc-500">
              © 2026 Tree Removal Services. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <span className="flex items-center gap-2">
                <span>🇺🇸</span>
                Built in the USA
              </span>
              <span className="flex items-center gap-2">
                <span>🔒</span>
                SOC 2 Compliant
              </span>
              <span className="flex items-center gap-2">
                <span>⚡</span>
                99.9% Uptime
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
