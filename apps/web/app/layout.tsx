import type { Metadata } from "next";
import { Fraunces, Spline_Sans, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import "./globals.css";

const splineSans = Spline_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://theringreceiptionsit.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Ring Receptionist - Never Miss a Call. Turn Every Ring Into a Lead.",
    template: "%s | Ring Receptionist",
  },
  description: "Automatically answers calls, qualifies customers, and sends you real job opportunities so you can focus on the work. AI receptionist for service businesses.",
  keywords: [
    "AI receptionist",
    "automated call answering",
    "virtual receptionist",
    "service business software",
    "lead generation",
    "call answering service",
    "plumber software",
    "HVAC software",
    "electrician software",
    "tree service software",
    "mover software",
    "missed call solution",
    "after hours answering",
    "call qualification",
    "customer qualification",
  ],
  authors: [{ name: "Ring Receptionist" }],
  creator: "Ring Receptionist",
  publisher: "Ring Receptionist",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Ring Receptionist",
    title: "Ring Receptionist - Never Miss a Call. Turn Every Ring Into a Lead.",
    description: "Automatically answers calls, qualifies customers, and sends you real job opportunities so you can focus on the work.",
    images: [
      {
        url: "/favicon.png",
        width: 1200,
        height: 630,
        alt: "Ring Receptionist - AI Receptionist for Service Businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ring Receptionist - Never Miss a Call. Turn Every Ring Into a Lead.",
    description: "Automatically answers calls, qualifies customers, and sends you real job opportunities so you can focus on the work.",
    images: ["/favicon.png"],
    creator: "@ringreceptionist",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
  alternates: {
    canonical: siteUrl,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${splineSans.variable} ${fraunces.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
