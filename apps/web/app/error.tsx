"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Error Illustration */}
        <div className="relative">
          <div className="text-[180px] md:text-[220px] font-bold text-zinc-200 leading-none font-display select-none">
            500
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center">
              <svg className="w-12 h-12 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </motion.div>
        </div>

        <h1 className="mt-6 text-3xl font-semibold font-display text-zinc-900">
          Something Went Wrong
        </h1>
        <p className="mt-3 text-zinc-600">
          We hit a snag while processing your request. Our team has been notified and is working on it.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold bg-zinc-900 text-white hover:bg-black transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 transition-colors"
          >
            Back to Home
          </Link>
        </div>

        {error.digest && (
          <p className="mt-8 text-xs text-zinc-500">
            Error ID: {error.digest}
          </p>
        )}
      </motion.div>
    </div>
  );
}
