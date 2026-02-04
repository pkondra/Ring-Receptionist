"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* 404 Illustration */}
        <div className="relative">
          <div className="text-[180px] md:text-[220px] font-bold text-zinc-200 leading-none font-display select-none">
            404
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </motion.div>
        </div>

        <h1 className="mt-6 text-3xl font-semibold font-display text-zinc-900">
          Page Not Found
        </h1>
        <p className="mt-3 text-zinc-600">
          Looks like this branch has been trimmed. The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold bg-zinc-900 text-white hover:bg-black transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            Contact Support
          </Link>
        </div>

        <p className="mt-8 text-xs text-zinc-500">
          Error Code: 404 • Page Not Found
        </p>
      </motion.div>
    </div>
  );
}
