"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, ShieldCheck, ArrowUpRight } from "lucide-react";

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  children: React.ReactNode;
}

const TABS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Refund & Returns Policy", href: "/refund-policy" },
];

export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  children,
}: LegalLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#090D16] flex flex-col font-sans selection:bg-[#2e1065] selection:text-white">
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-50 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-[#DADDD4]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/krediblyrevamped.png"
                alt="Kredibly"
                className="h-6 sm:h-7 w-auto object-contain"
              />
            </Link>
            <span className="hidden sm:inline-block h-4 w-px bg-[#DADDD4]" />
            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-[#525B6C] hover:text-[#090D16] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#525B6C] hover:text-[#090D16] px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2e1065] hover:bg-[#3b0764] text-white text-xs font-semibold rounded-[8px] transition-all shadow-xs"
            >
              <span>Create Store</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <section className="border-b border-[#DADDD4] bg-[#F3F4EF] relative overflow-hidden py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#DADDD4] text-[11px] font-mono font-bold text-[#2e1065] mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>LEGAL &amp; COMPLIANCE · NIGERIA</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#090D16] leading-tight">
            {title}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-[#525B6C] max-w-2xl leading-relaxed">
            {subtitle}
          </p>

          <div className="mt-6 flex items-center gap-4 text-xs font-mono text-[#525B6C]">
            <span>Last Updated: {lastUpdated}</span>
            <span>•</span>
            <span>Version 2.4</span>
          </div>

          {/* Policy Switcher Tabs (VOÐE & Shopify Style) */}
          <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {TABS.map((tab) => {
              const isActive =
                pathname === tab.href ||
                (tab.href === "/terms" && pathname.includes("/terms-of-service")) ||
                (tab.href === "/privacy" && pathname.includes("/privacy-policy")) ||
                (tab.href === "/refund-policy" && pathname.includes("/refund"));

              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-[#2e1065] text-white shadow-xs"
                      : "bg-white text-[#525B6C] hover:text-[#090D16] border border-[#DADDD4] hover:border-[#2e1065]/40"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Body */}
      <main className="flex-1 py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-white border border-[#DADDD4] rounded-2xl p-6 sm:p-12 shadow-xs prose prose-slate max-w-none prose-headings:font-display prose-headings:font-bold prose-headings:text-[#090D16] prose-p:text-[#525B6C] prose-p:leading-relaxed prose-li:text-[#525B6C] prose-strong:text-[#090D16]">
            {children}
          </div>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-[#DADDD4] bg-[#F3F4EF] py-10 text-xs text-[#525B6C]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-[#DADDD4]/60">
            <div className="flex items-center gap-3">
              <img
                src="/krediblyrevamped.png"
                alt="Kredibly"
                className="h-5 w-auto object-contain opacity-80"
              />
              <span className="text-[11px] text-[#525B6C]">
                Official Trust &amp; Storefront Platform
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium">
              <Link href="/terms" className="hover:text-[#090D16] transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-[#090D16] transition-colors">
                Privacy Policy
              </Link>
              <Link href="/refund-policy" className="hover:text-[#090D16] transition-colors">
                Refund &amp; Returns Policy
              </Link>
              <Link href="/login" className="hover:text-[#090D16] transition-colors">
                Merchant Sign In
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>© {new Date().getFullYear()} Akinbyte Technologies Limited (RC: 9466327). All rights reserved.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Federal Republic of Nigeria · FCCPA &amp; NDPA Compliant</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
