"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navSections = [
  {
    label: "Home",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: HomeIcon },
      { label: "Billing", href: "/dashboard/billing", icon: CardIcon },
    ],
  },
  {
    label: "Build",
    items: [
      { label: "Agents", href: "/dashboard/agents", icon: BotIcon },
      {
        label: "Knowledge Base",
        href: "/dashboard/knowledge",
        icon: BookIcon,
      },
    ],
  },
  {
    label: "Evaluate",
    items: [
      { label: "Leads", href: "/dashboard/leads", icon: UsersIcon },
      { label: "Calls", href: "/dashboard/calls", icon: PhoneIcon },
    ],
  },
  {
    label: "Schedule",
    items: [
      {
        label: "Appointments",
        href: "/dashboard/appointments",
        icon: CalendarIcon,
      },
    ],
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-5">
      {navSections.map((section) => (
        <div key={section.label} className="space-y-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-[0.2em] px-2">
            {section.label}
          </div>
          <div className="flex flex-col gap-2">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-black text-white shadow-sm ring-1 ring-black/20"
                      : "bg-black text-white/90 hover:text-white hover:shadow-sm"
                  }`}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-10.5z" />
    </svg>
  );
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v3m-6 9v-2a6 6 0 0 1 12 0v2m-9 5h6a3 3 0 0 0 3-3v-3H6v3a3 3 0 0 0 3 3z" />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5.5V19a2 2 0 0 1-2 2h0" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 14a4 4 0 1 0-8 0" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 12a3 3 0 1 0-3-3 3 3 0 0 0 3 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 20a4 4 0 0 0-4-4" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5.5a2.5 2.5 0 0 1 2.5-2.5h2l2 5-2 1.5a12 12 0 0 0 5 5l1.5-2 5 2v2A2.5 2.5 0 0 1 16.5 21 13.5 13.5 0 0 1 3 7.5z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 3v3m10-3v3M4 9h16M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
    </svg>
  );
}

function CardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2H3V7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 11h18v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 15h3" />
    </svg>
  );
}
