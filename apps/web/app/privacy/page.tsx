"use client";

import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import { motion } from "framer-motion";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-900">
      <MarketingNav />

      <main className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm">
              <span className="text-lg">🔒</span>
              Legal
            </span>

            <h1 className="mt-6 text-4xl md:text-5xl font-semibold font-display">
              Privacy Policy
            </h1>
            <p className="mt-4 text-zinc-600">
              Last updated: February 1, 2026
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-12 prose prose-zinc max-w-none"
          >
            <div className="surface-card p-8 md:p-10 space-y-8">
              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Introduction
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  Tree Removal Receptionist ("we," "our," or "us") is committed to protecting your privacy.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard your information
                  when you use our AI-powered phone answering service and website.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Information We Collect
                </h2>
                <p className="text-zinc-600 leading-relaxed mb-4">
                  We collect information that you provide directly to us, including:
                </p>
                <ul className="list-disc list-inside text-zinc-600 space-y-2">
                  <li>Account information (name, email, phone number, business name)</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Call recordings and transcripts from our AI receptionist service</li>
                  <li>Customer data collected during phone calls (caller name, phone number, service requests)</li>
                  <li>Usage data and analytics from our platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  How We Use Your Information
                </h2>
                <p className="text-zinc-600 leading-relaxed mb-4">
                  We use the information we collect to:
                </p>
                <ul className="list-disc list-inside text-zinc-600 space-y-2">
                  <li>Provide, maintain, and improve our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Train and improve our AI models to better serve your business</li>
                  <li>Send you technical notices, updates, and support messages</li>
                  <li>Respond to your comments, questions, and customer service requests</li>
                  <li>Monitor and analyze trends, usage, and activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Data Retention
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  We retain call recordings and transcripts for 90 days by default, after which they are
                  automatically deleted. You can request earlier deletion at any time through your dashboard
                  or by contacting support. Account information is retained for as long as your account is
                  active or as needed to provide you services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Data Security
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  We implement industry-standard security measures to protect your data, including 256-bit
                  encryption for data in transit and at rest, secure data centers, regular security audits,
                  and SOC 2 compliance. However, no method of transmission over the Internet is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  TCPA Compliance
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  Our service is designed to comply with the Telephone Consumer Protection Act (TCPA).
                  We provide appropriate disclosures during calls and maintain records as required by law.
                  Users are responsible for ensuring their use of our service complies with applicable
                  telecommunications regulations.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Your Rights
                </h2>
                <p className="text-zinc-600 leading-relaxed mb-4">
                  Depending on your location, you may have certain rights regarding your personal information:
                </p>
                <ul className="list-disc list-inside text-zinc-600 space-y-2">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Object to or restrict processing</li>
                  <li>Data portability</li>
                  <li>Withdraw consent</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Contact Us
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <div className="mt-4 p-4 bg-zinc-50 rounded-xl text-zinc-600">
                  <p>Email: privacy@treeremovalreceptionist.com</p>
                  <p>Phone: (555) 123-4567</p>
                  <p>Address: Austin, Texas, USA</p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Changes to This Policy
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  We may update this Privacy Policy from time to time. We will notify you of any changes
                  by posting the new Privacy Policy on this page and updating the "Last updated" date.
                  You are advised to review this Privacy Policy periodically for any changes.
                </p>
              </section>
            </div>
          </motion.div>

          <div className="mt-8 flex gap-4">
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              ← Back to Home
            </Link>
            <Link
              href="/terms"
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Terms of Service →
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] bg-zinc-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-zinc-500">
              © 2026 Tree Removal Services. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
