"use client";

import Link from "next/link";
import MarketingNav from "@/components/MarketingNav";
import { motion } from "framer-motion";

export default function TermsPage() {
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
              <span className="text-lg">📋</span>
              Legal
            </span>

            <h1 className="mt-6 text-4xl md:text-5xl font-semibold font-display">
              Terms of Service
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
                  Agreement to Terms
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  By accessing or using theringreceiptionsit.com's services, you agree to be bound by these
                  Terms of Service and all applicable laws and regulations. If you do not agree with any of
                  these terms, you are prohibited from using or accessing our services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Description of Service
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  theringreceiptionsit.com provides an AI-powered phone answering service designed for local
                  service businesses. Our service answers incoming calls on your behalf, collects caller
                  information, schedules appointments, and handles emergency dispatch notifications
                  according to your configured preferences.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Account Registration
                </h2>
                <p className="text-zinc-600 leading-relaxed mb-4">
                  To use our services, you must:
                </p>
                <ul className="list-disc list-inside text-zinc-600 space-y-2">
                  <li>Be at least 18 years old</li>
                  <li>Provide accurate and complete registration information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized use</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Subscription and Billing
                </h2>
                <p className="text-zinc-600 leading-relaxed mb-4">
                  Our service is offered on a subscription basis with the following terms:
                </p>
                <ul className="list-disc list-inside text-zinc-600 space-y-2">
                  <li>Subscriptions are billed monthly in advance</li>
                  <li>Minutes are included based on your plan tier</li>
                  <li>Overage minutes are billed at the rate specified in your plan</li>
                  <li>You may cancel your subscription at any time</li>
                  <li>Refunds are provided on a prorated basis for annual plans only</li>
                  <li>7-day free trial available for new users</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Acceptable Use
                </h2>
                <p className="text-zinc-600 leading-relaxed mb-4">
                  You agree not to use our service to:
                </p>
                <ul className="list-disc list-inside text-zinc-600 space-y-2">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Transmit spam, harassment, or abusive content</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the service for any illegal or fraudulent purpose</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Service Availability
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  We strive to maintain 99.9% uptime for our services. However, we do not guarantee
                  uninterrupted access and may occasionally need to perform maintenance or updates.
                  We will provide reasonable notice for planned maintenance when possible. We are not
                  liable for any losses resulting from service interruptions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Intellectual Property
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  All content, features, and functionality of our service, including but not limited to
                  text, graphics, logos, and software, are the exclusive property of theringreceiptionsit.com
                  Receptionist and are protected by copyright, trademark, and other intellectual
                  property laws. You may not copy, modify, or distribute any part of our service without
                  our prior written consent.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Limitation of Liability
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  To the fullest extent permitted by law, theringreceiptionsit.com shall not be liable
                  for any indirect, incidental, special, consequential, or punitive damages, including
                  but not limited to loss of profits, data, or business opportunities, arising from
                  your use of our service. Our total liability shall not exceed the amount paid by you
                  in the twelve months preceding the claim.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Indemnification
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  You agree to indemnify and hold harmless theringreceiptionsit.com and its officers,
                  directors, employees, and agents from any claims, damages, losses, or expenses arising
                  from your use of the service, your violation of these terms, or your violation of any
                  rights of a third party.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Termination
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  We may terminate or suspend your account immediately, without prior notice or liability,
                  for any reason, including if you breach these Terms of Service. Upon termination, your
                  right to use the service will immediately cease. You may terminate your account at any
                  time through your dashboard or by contacting support.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Governing Law
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  These Terms shall be governed by and construed in accordance with the laws of the State
                  of Texas, without regard to its conflict of law provisions. Any disputes arising from
                  these terms shall be resolved in the state or federal courts located in Travis County, Texas.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Changes to Terms
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  We reserve the right to modify these terms at any time. We will provide notice of
                  significant changes by posting the new Terms of Service on this page and updating the
                  "Last updated" date. Your continued use of the service after such modifications
                  constitutes your acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold font-display text-zinc-900 mb-4">
                  Contact Information
                </h2>
                <p className="text-zinc-600 leading-relaxed">
                  If you have any questions about these Terms of Service, please contact us:
                </p>
                <div className="mt-4 p-4 bg-zinc-50 rounded-xl text-zinc-600">
                  <p>Email: legal@theringreceiptionsit.com</p>
                  <p>Phone: (555) 123-4567</p>
                  <p>Address: Austin, Texas, USA</p>
                </div>
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
              href="/privacy"
              className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              Privacy Policy →
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-[var(--border)] bg-zinc-900 text-white">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-zinc-500">
              © 2026 theringreceiptionsit.com. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-zinc-500">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms" className="text-white">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
