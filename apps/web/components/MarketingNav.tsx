"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function MarketingNav() {
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const scrollToSection = (sectionId: string) => {
    if (pathname !== "/") {
      window.location.href = `/#${sectionId}`;
      return;
    }
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="relative z-20 bg-transparent">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/favicon.png"
            alt="Ring Receptionist"
            width={36}
            height={36}
            className="rounded-xl"
          />
          <div className="leading-tight">
            <div className="text-base font-semibold text-zinc-900">
              Ring Receptionist
            </div>
            <div className="text-xs text-zinc-500">AI Receptionist</div>
          </div>
        </Link>

        {/* Center Navigation */}
        <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 lg:flex">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            Home
          </Link>
          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button className="flex items-center gap-1 hover:text-zinc-900 transition-colors">
              Solutions
              <svg className={`w-4 h-4 transition-transform ${solutionsOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
            {solutionsOpen && (
              <div className="absolute top-full left-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-zinc-200 py-2 z-50">
                <Link
                  href="/services/plumbers"
                  className="block px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                >
                  Plumbers
                </Link>
                <Link
                  href="/services/hvac"
                  className="block px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                >
                  HVAC
                </Link>
                <Link
                  href="/services/electricians"
                  className="block px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                >
                  Electricians
                </Link>
                <Link
                  href="/services/movers"
                  className="block px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                >
                  Movers
                </Link>
                <Link
                  href="/services/tree"
                  className="block px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                >
                  Tree Services
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={() => scrollToSection('features-section')}
            className="hover:text-zinc-900 transition-colors"
          >
            Features
          </button>
          <button
            onClick={() => scrollToSection('compare-section')}
            className="hover:text-zinc-900 transition-colors"
          >
            Compare
          </button>
          <button
            onClick={() => scrollToSection('testimonials-section')}
            className="hover:text-zinc-900 transition-colors"
          >
            Testimonials
          </button>
          <Link href="/pricing" className="hover:text-zinc-900 transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-zinc-900 transition-colors">
            Contact
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-zinc-600 hover:text-zinc-900"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <Link
            href="/sign-in?redirect_url=/dashboard"
            className="hidden sm:inline-flex rounded-full px-4 py-2.5 text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 transition-colors"
          >
            Login
          </Link>

          <SignedOut>
            <Link
              href="/get-started"
              className="hidden sm:inline-flex rounded-full px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white hover:bg-black transition-colors"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in?redirect_url=/dashboard"
              className="sm:hidden rounded-full px-4 py-2.5 text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 transition-colors"
            >
              Login
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="rounded-full px-5 py-2.5 text-sm font-medium bg-zinc-900 text-white hover:bg-black transition-colors"
            >
              Dashboard
            </Link>
          </SignedIn>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-zinc-200 shadow-lg z-50">
          <nav className="flex flex-col px-6 py-4 space-y-4 text-sm font-medium text-zinc-600">
            <Link href="/" className="hover:text-zinc-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link
              href="/services/plumbers"
              className="hover:text-zinc-900 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Plumbers
            </Link>
            <Link
              href="/services/hvac"
              className="hover:text-zinc-900 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              HVAC
            </Link>
            <Link
              href="/services/electricians"
              className="hover:text-zinc-900 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Electricians
            </Link>
            <Link
              href="/services/movers"
              className="hover:text-zinc-900 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Movers
            </Link>
            <Link
              href="/services/tree"
              className="hover:text-zinc-900 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Tree Services
            </Link>
            <button
              onClick={() => scrollToSection('features-section')}
              className="text-left hover:text-zinc-900 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('compare-section')}
              className="text-left hover:text-zinc-900 transition-colors"
            >
              Compare
            </button>
            <button
              onClick={() => scrollToSection('testimonials-section')}
              className="text-left hover:text-zinc-900 transition-colors"
            >
              Testimonials
            </button>
            <Link href="/pricing" className="hover:text-zinc-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Pricing
            </Link>
            <Link href="/contact" className="hover:text-zinc-900 transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Contact
            </Link>
            <SignedOut>
              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/sign-in?redirect_url=/dashboard"
                  className="rounded-full px-4 py-2.5 text-sm font-medium border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  href="/get-started"
                  className="rounded-full px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white hover:bg-black transition-colors text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </SignedOut>
            <SignedIn>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-2.5 text-sm font-medium bg-zinc-900 text-white hover:bg-black transition-colors text-center"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
            </SignedIn>
          </nav>
        </div>
      )}
    </header>
  );
}
