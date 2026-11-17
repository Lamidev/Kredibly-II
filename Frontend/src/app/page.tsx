"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ShieldCheck,
  Zap,
  ArrowRight,
  ArrowUpRight,
  Store,
  CheckCircle2,
  Wallet,
  XCircle,
  AlertCircle,
  Menu,
  X,
  Smartphone,
  Lock,
  Building2,
  ShoppingBag,
  CreditCard,
  Package,
  Loader2,
  Sparkles,
} from "lucide-react";

type BillingCycle = "quarterly" | "biannual" | "annual";

const FAQS = [
  {
    value: "item-1",
    q: "How does Kredibly buyer protection work without holding my money hostage?",
    a: "When a customer pays, funds are secured in your store wallet so you can dispatch with 100% confidence. Once you deliver the package and mark it Delivered in your dashboard, a 24-hour quiet timer runs. Even if the customer forgets to confirm or goes offline, your money automatically unlocks to your Available Balance and can be withdrawn directly to your Nigerian bank account in 1 click.",
  },
  {
    value: "item-2",
    q: "Can shoppers bypass checkout and message me on WhatsApp to haggle or send fake alerts?",
    a: "Never. To protect you from time-wasters, ghosting, and fake transfer screenshots, your direct WhatsApp order routing only unlocks on the customer's verified receipt AFTER their payment has been confirmed by our automated system. Every message you receive is an already paid, verified order ready for delivery.",
  },
  {
    value: "item-3",
    q: "Do I have to pay transaction fees or commissions on my sales?",
    a: "On all paid subscription plans, Kredibly charges 0% platform commission—you keep 100% of your product asking prices. On the Free Starter tier, you can list up to 20 products and test the waters with zero upfront cost, with only a modest 2.5% fee on completed sales until you are ready to upgrade.",
  },
  {
    value: "item-4",
    q: "Do my customers need to download an app or create a password to buy?",
    a: "Never. Forcing Instagram or TikTok shoppers to download apps or remember passwords causes over 35% cart abandonment. Shoppers simply enter their delivery address and phone number, pay via instant Bank Transfer or Card in 30 seconds, and can track their delivery status anytime using just their phone number.",
  },
  {
    value: "item-5",
    q: "How do I withdraw my money? Which Nigerian banks and FinTechs are supported?",
    a: "You can link any Nigerian commercial bank or licensed FinTech account (GTBank, Access, Zenith, UBA, First Bank, OPay, Kuda, Moniepoint, Palmpay). When you request a withdrawal, your money is settled directly into your account in 1 click via automated instant bank transfer.",
  },
  {
    value: "item-6",
    q: "What happens if a customer claims they didn't receive their order or tries to dispute it?",
    a: "You are fully protected. When fulfilling an order, you can upload waybill slips, rider contact info, or tracking proof directly in your dashboard. Our merchant dispute team reviews delivery confirmation evidence so genuine sellers are never unfairly debited or victimized by false buyer claims.",
  },
  {
    value: "item-7",
    q: "Can I connect my own custom website domain (like mybrand.ng or mybrand.com)?",
    a: "Yes. While every store automatically gets an official, high-speed kredibly.shop/yourbrand link on sign-up, you can also link your own independent domain (like yourbrand.ng or yourbrand.com) on Deluxe and Ultimate plans with free automatic SSL certificates.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [claimInput, setClaimInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("quarterly");

  // Real-time Brand Handle Availability Checking
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    status: "idle" | "available" | "taken" | "invalid";
    slug: string;
    message: string;
    suggestions: string[];
  }>({
    status: "idle",
    slug: "",
    message: "",
    suggestions: [],
  });

  useEffect(() => {
    const raw = claimInput.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
    if (!raw) {
      setCheckResult({ status: "idle", slug: "", message: "", suggestions: [] });
      setIsChecking(false);
      return;
    }

    if (raw.length < 3) {
      setCheckResult({
        status: "invalid",
        slug: raw,
        message: "Brand handle must be at least 3 characters",
        suggestions: [],
      });
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/check-slug?slug=${encodeURIComponent(raw)}`);
        const data = res.data?.data;
        if (data?.available) {
          setCheckResult({
            status: "available",
            slug: raw,
            message: `kredibly.shop/${raw} is available!`,
            suggestions: [],
          });
        } else {
          const suggestions =
            data?.suggestions && data.suggestions.length > 0
              ? data.suggestions
              : [`${raw}-ng`, `${raw}-store`, `shop-${raw}`];
          setCheckResult({
            status: "taken",
            slug: raw,
            message: data?.message || `kredibly.shop/${raw} is already taken`,
            suggestions,
          });
        }
      } catch (err) {
        const reserved = new Set(["admin", "api", "dashboard", "kredibly", "shop", "login", "register", "urban-luxe"]);
        if (reserved.has(raw)) {
          setCheckResult({
            status: "taken",
            slug: raw,
            message: `kredibly.shop/${raw} is reserved`,
            suggestions: [`${raw}-ng`, `${raw}-store`, `shop-${raw}`],
          });
        } else {
          setCheckResult({
            status: "available",
            slug: raw,
            message: `kredibly.shop/${raw} is available!`,
            suggestions: [],
          });
        }
      } finally {
        setIsChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [claimInput]);

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = claimInput.toLowerCase().trim().replace(/[^a-z0-9-]/g, "");
    if (!raw) {
      router.push("/register");
      return;
    }
    router.push(`/register?slug=${encodeURIComponent(raw)}&storeName=${encodeURIComponent(claimInput.trim())}`);
  };

  const getPlanPrice = (tier: "starterPlus" | "deluxe" | "ultimate") => {
    const table = {
      starterPlus: {
        quarterly: { amount: "₦14,500", period: "/ 3 Months" },
        biannual: { amount: "₦27,500", period: "/ 6 Months" },
        annual: { amount: "₦55,000", period: "/ 1 Year" },
      },
      deluxe: {
        quarterly: { amount: "₦28,500", period: "/ 3 Months" },
        biannual: { amount: "₦55,000", period: "/ 6 Months" },
        annual: { amount: "₦110,000", period: "/ 1 Year" },
      },
      ultimate: {
        quarterly: { amount: "₦57,000", period: "/ 3 Months" },
        biannual: { amount: "₦110,000", period: "/ 6 Months" },
        annual: { amount: "₦220,000", period: "/ 1 Year" },
      },
    };
    return table[tier][billingCycle];
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-[#090D16] font-sans selection:bg-[#3b0764] selection:text-white overflow-x-hidden">
      {/* 1. Sticky Top Navigation Bar */}
      <header className="sticky top-4 z-50 px-4 sm:px-6 w-full max-w-6xl mx-auto">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-white/95 backdrop-blur-md border border-[#DADDD4] rounded-xl shadow-[0_4px_20px_-4px_rgba(9,13,22,0.06)]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/krediblyrevamped.png"
              alt="Kredibly"
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-[13.5px] font-medium text-[#525B6C] hover:text-[#090D16] transition-colors"
            >
              Capabilities
            </a>
            <a
              href="#how-it-works"
              className="text-[13.5px] font-medium text-[#525B6C] hover:text-[#090D16] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#competitive-edge"
              className="text-[13.5px] font-medium text-[#525B6C] hover:text-[#090D16] transition-colors"
            >
              The Reality
            </a>
            <a
              href="#pricing"
              className="text-[13.5px] font-medium text-[#525B6C] hover:text-[#090D16] transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-[13.5px] font-medium text-[#525B6C] hover:text-[#090D16] transition-colors"
            >
              FAQ
            </a>
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-[#525B6C] hover:text-[#090D16] px-3 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#2e1065] hover:bg-[#3b0764] text-white text-xs font-semibold rounded-[8px] transition-all hover:-translate-y-0.5 shadow-xs group"
            >
              <span>Start Free Store</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#090D16] hover:bg-slate-100 rounded-md"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden mt-2 p-5 bg-white border border-[#DADDD4] rounded-xl shadow-xl space-y-4">
            <nav className="flex flex-col gap-3">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#090D16] py-1 border-b border-slate-100"
              >
                Capabilities
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#090D16] py-1 border-b border-slate-100"
              >
                How It Works
              </a>
              <a
                href="#competitive-edge"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#090D16] py-1 border-b border-slate-100"
              >
                The Reality
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#090D16] py-1 border-b border-slate-100"
              >
                Pricing
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#090D16] py-1"
              >
                FAQ
              </a>
            </nav>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link
                href="/login"
                className="py-2.5 text-center text-xs font-semibold border border-slate-200 rounded-[8px] text-[#090D16]"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="py-2.5 text-center text-xs font-semibold bg-[#2e1065] text-white rounded-[8px]"
              >
                Start Free
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* 2. Hero Section — Bespoke Kredibly Diagonal Prism & Architectural Crosshair Canvas */}
        <section className="relative pt-14 sm:pt-22 pb-18 sm:pb-26 px-4 sm:px-6 max-w-6xl mx-auto overflow-hidden mt-2">
          {/* Bespoke Kredibly Geometric Diagonal Lattice & Precision Dot Matrix (Zero Arches) */}
          <div
            className="absolute inset-0 pointer-events-none opacity-65"
            style={{
              backgroundImage:
                "radial-gradient(rgba(46, 16, 101, 0.14) 1px, transparent 1px), linear-gradient(135deg, rgba(46, 16, 101, 0.03) 25%, transparent 25%, transparent 50%, rgba(46, 16, 101, 0.03) 50%, rgba(46, 16, 101, 0.03) 75%, transparent 75%, transparent)",
              backgroundSize: "24px 24px, 64px 64px",
              maskImage:
                "radial-gradient(ellipse 80% 70% at 50% 35%, black 40%, transparent 100%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 70% at 50% 35%, black 40%, transparent 100%)",
            }}
          />

          {/* Soft Horizontal Royal Purple Prism Beam behind the Claim Bar */}
          <div className="absolute top-36 left-1/2 -translate-x-1/2 w-[85%] max-w-3xl h-36 bg-gradient-to-r from-transparent via-[#3b0764]/10 to-transparent blur-2xl pointer-events-none" />

          {/* Architectural Corner Registration Marks */}
          <div className="hidden sm:block absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-[#3b0764]/30 pointer-events-none" />
          <div className="hidden sm:block absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-[#3b0764]/30 pointer-events-none" />

          <div className="relative z-10 text-center max-w-4xl mx-auto space-y-6">
            {/* Architectural Line + Eyebrow */}
            <div className="inline-flex items-center justify-center gap-3">
              <span className="w-6 h-[2px] bg-[#3b0764]" />
              <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                YOUR BUSINESS, ONLINE
              </span>
              <span className="w-6 h-[2px] bg-[#3b0764]" />
            </div>

            {/* Display Headline */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[72px] font-display font-extrabold tracking-tight leading-[1.06] text-[#090D16]">
              Turn your social media into your{" "}
              <span className="text-[#3b0764]">online store.</span>
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg md:text-xl text-[#525B6C] max-w-2xl mx-auto font-normal leading-relaxed">
              Create a beautiful online store in 2 minutes. Add your products, share your link on WhatsApp, TikTok or Instagram, and let customers shop and pay with ease.
            </p>

            {/* Interactive Domain Claimer with Real-Time Brand Availability Checking */}
            <div className="w-full max-w-xl mx-auto space-y-3">
              <form
                onSubmit={handleClaimSubmit}
                className="w-full bg-white border border-[#CBD5E1] hover:border-[#2e1065] focus-within:border-[#2e1065] p-2 rounded-xl shadow-[0_10px_30px_-8px_rgba(46,16,101,0.12)] flex flex-col sm:flex-row items-center gap-2 transition-all"
              >
                <div className="flex items-center flex-1 w-full pl-3.5 pr-2 py-2 font-mono">
                  <span className="text-[#64748B] select-none shrink-0 text-[16px] sm:text-sm font-semibold">
                    kredibly.shop/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="your-brand-name"
                    value={claimInput}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    onChange={(e) => setClaimInput(e.target.value)}
                    className="bg-transparent text-[#090D16] font-bold placeholder-[#94A3B8] focus:outline-none w-full ml-1 lowercase text-[16px] sm:text-sm"
                  />
                  {isChecking && (
                    <Loader2 className="w-4 h-4 text-[#2e1065] animate-spin shrink-0 ml-1" />
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full sm:w-auto px-7 py-3.5 text-white font-display font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0 shadow-sm cursor-pointer ${
                    checkResult.status === "available"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-[#2e1065] hover:bg-[#3b0764]"
                  }`}
                >
                  <span>{checkResult.status === "available" ? "Claim Store Now" : "Claim Your Store"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Dynamic Availability & Smart Suggestion Feedback */}
              {claimInput.trim() && (
                <div className="min-h-[28px] flex flex-col items-center justify-center gap-2 text-xs">
                  {checkResult.status === "available" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-mono font-semibold animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{checkResult.message}</span>
                    </div>
                  )}

                  {checkResult.status === "taken" && (
                    <div className="space-y-2 animate-in fade-in w-full text-center">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-mono font-semibold">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{checkResult.message}</span>
                      </div>

                      {checkResult.suggestions.length > 0 && (
                        <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
                          <span className="font-mono text-[11px] text-[#64748B]">Try available:</span>
                          {checkResult.suggestions.map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => setClaimInput(sug)}
                              className="px-2.5 py-1 rounded-md bg-white border border-[#DADDD4] hover:border-[#2e1065] hover:bg-[#FAF9F5] text-[#2e1065] font-mono text-[11.5px] font-bold transition-all shadow-2xs cursor-pointer"
                            >
                              +{sug}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {checkResult.status === "invalid" && (
                    <p className="text-[11px] font-mono text-[#64748B]">
                      {checkResult.message}
                    </p>
                  )}
                </div>
              )}

              {/* Frictionless Assurance */}
              <div className="flex items-center justify-center gap-2 text-xs sm:text-[13px] text-[#64748B] font-medium pt-1">
                <span>No coding.</span>
                <span className="w-1 h-1 rounded-full bg-[#CBD5E1]" />
                <span>No complicated setup.</span>
              </div>
            </div>
          </div>

          {/* Live Storefront Preview Showcase — Unboxed & Realistic */}
          <div className="mt-14 sm:mt-18 relative z-10">
            <div className="bg-white border border-[#DADDD4] rounded-2xl shadow-[0_16px_40px_-12px_rgba(9,13,22,0.08)] overflow-hidden">
              {/* Browser / App Window Chrome */}
              <div className="bg-[#F3F4EF] border-b border-[#DADDD4] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#E2E8F0] border border-[#CBD5E1]" />
                  <span className="w-3 h-3 rounded-full bg-[#E2E8F0] border border-[#CBD5E1]" />
                  <span className="w-3 h-3 rounded-full bg-[#E2E8F0] border border-[#CBD5E1]" />
                </div>

                <div className="flex-1 max-w-md mx-auto hidden sm:flex items-center justify-center gap-2 px-3 py-1 bg-white border border-[#DADDD4] rounded-md text-xs font-mono text-[#525B6C]">
                  <Lock className="w-3 h-3 text-[#3b0764]" />
                  <span className="text-[#090D16] font-semibold">kredibly.shop/urban-luxe</span>
                  <span className="text-[10px] text-emerald-600 font-bold ml-1">• LIVE STORE</span>
                </div>

                <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-[#3b0764]">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ACCEPTING ORDERS</span>
                </div>
              </div>

              {/* Realistic Storefront Canvas (Clean, Unboxed Luxury Presentation) */}
              <div className="p-5 sm:p-8 bg-[#FAF9F5] space-y-6">
                {/* Store Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E7E9E2]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#2e1065] text-white flex items-center justify-center font-display font-extrabold text-sm shrink-0 shadow-xs">
                      UL
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-extrabold text-lg sm:text-xl text-[#090D16]">
                          Urban Luxe Boutique
                        </h4>
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xs">
                          VERIFIED ESCROW STORE
                        </span>
                      </div>
                      <p className="text-xs text-[#525B6C] mt-0.5">
                        Designer heels, luxury handbags, watches &amp; signature fragrances • Lagos, Nigeria
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <span className="px-3 py-1 rounded-[6px] bg-white border border-[#DADDD4] text-xs font-mono font-bold text-[#3b0764] shadow-2xs">
                      kredibly.shop/urban-luxe
                    </span>
                  </div>
                </div>

                {/* Category Navigation Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-medium scrollbar-none">
                  <span className="px-3.5 py-1.5 rounded-[6px] bg-[#2e1065] text-white shrink-0 font-semibold shadow-2xs">
                    All Items (18)
                  </span>
                  <span className="px-3.5 py-1.5 rounded-[6px] bg-white text-[#525B6C] shrink-0 border border-[#DADDD4] hover:text-[#090D16] transition-colors cursor-pointer">
                    Heels &amp; Shoes
                  </span>
                  <span className="px-3.5 py-1.5 rounded-[6px] bg-white text-[#525B6C] shrink-0 border border-[#DADDD4] hover:text-[#090D16] transition-colors cursor-pointer">
                    Designer Handbags
                  </span>
                  <span className="px-3.5 py-1.5 rounded-[6px] bg-white text-[#525B6C] shrink-0 border border-[#DADDD4] hover:text-[#090D16] transition-colors cursor-pointer">
                    Watches &amp; Jewelry
                  </span>
                  <span className="px-3.5 py-1.5 rounded-[6px] bg-white text-[#525B6C] shrink-0 border border-[#DADDD4] hover:text-[#090D16] transition-colors cursor-pointer">
                    Signature Perfumes
                  </span>
                </div>

                {/* 4 Realistic Product Cards in Responsive Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-1">
                  {/* Product 1 */}
                  <div className="group flex flex-col justify-between space-y-3">
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-white border border-[#E7E9E2] shadow-2xs">
                      <img
                        src="/demo/heels.jpg"
                        alt="Milan Stiletto Pointed Heels"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-xs bg-black/75 backdrop-blur-xs text-white font-mono text-[9px] font-bold">
                        IN STOCK: 5
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#717A8A] block">
                        Heels &amp; Shoes
                      </span>
                      <h5 className="font-display font-bold text-xs sm:text-sm text-[#090D16] truncate">
                        Milan Stiletto Pointed Heels
                      </h5>
                      <p className="text-[11px] text-[#525B6C] truncate">
                        Black &amp; Gold • Sizes 37 - 42
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="font-mono text-sm sm:text-base font-extrabold text-[#090D16]">
                          ₦38,500
                        </span>
                        <span className="px-3 py-1 bg-[#2e1065] group-hover:bg-[#3b0764] text-white text-[11px] font-bold rounded-[6px] transition-colors">
                          Buy Now
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product 2 */}
                  <div className="group flex flex-col justify-between space-y-3">
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-white border border-[#E7E9E2] shadow-2xs">
                      <img
                        src="/demo/bag.jpg"
                        alt="Quilted Leather Crossbody Bag"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-xs bg-black/75 backdrop-blur-xs text-white font-mono text-[9px] font-bold">
                        IN STOCK: 3
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#717A8A] block">
                        Handbags
                      </span>
                      <h5 className="font-display font-bold text-xs sm:text-sm text-[#090D16] truncate">
                        Quilted Leather Crossbody Bag
                      </h5>
                      <p className="text-[11px] text-[#525B6C] truncate">
                        Genuine Leather • Burgundy
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="font-mono text-sm sm:text-base font-extrabold text-[#090D16]">
                          ₦45,000
                        </span>
                        <span className="px-3 py-1 bg-[#2e1065] group-hover:bg-[#3b0764] text-white text-[11px] font-bold rounded-[6px] transition-colors">
                          Buy Now
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product 3 */}
                  <div className="group flex flex-col justify-between space-y-3">
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-white border border-[#E7E9E2] shadow-2xs">
                      <img
                        src="/demo/watch.jpg"
                        alt="Minimalist Chrono Wristwatch"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-xs bg-black/75 backdrop-blur-xs text-white font-mono text-[9px] font-bold">
                        IN STOCK: 7
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#717A8A] block">
                        Watches &amp; Jewelry
                      </span>
                      <h5 className="font-display font-bold text-xs sm:text-sm text-[#090D16] truncate">
                        Minimalist Chrono Wristwatch
                      </h5>
                      <p className="text-[11px] text-[#525B6C] truncate">
                        Matte Black Dial • Steel Band
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="font-mono text-sm sm:text-base font-extrabold text-[#090D16]">
                          ₦62,000
                        </span>
                        <span className="px-3 py-1 bg-[#2e1065] group-hover:bg-[#3b0764] text-white text-[11px] font-bold rounded-[6px] transition-colors">
                          Buy Now
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Product 4 */}
                  <div className="group flex flex-col justify-between space-y-3">
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-white border border-[#E7E9E2] shadow-2xs">
                      <img
                        src="/demo/perfume.jpg"
                        alt="Maison Oud Signature EDP"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-xs bg-black/75 backdrop-blur-xs text-white font-mono text-[9px] font-bold">
                        IN STOCK: 4
                      </span>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase tracking-wider text-[#717A8A] block">
                        Fragrances
                      </span>
                      <h5 className="font-display font-bold text-xs sm:text-sm text-[#090D16] truncate">
                        Maison Oud Signature EDP
                      </h5>
                      <p className="text-[11px] text-[#525B6C] truncate">
                        Long-Lasting 100ml Eau De Parfum
                      </p>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="font-mono text-sm sm:text-base font-extrabold text-[#090D16]">
                          ₦28,000
                        </span>
                        <span className="px-3 py-1 bg-[#2e1065] group-hover:bg-[#3b0764] text-white text-[11px] font-bold rounded-[6px] transition-colors">
                          Buy Now
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3 Value Callouts at the Bottom */}
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#DADDD4] bg-[#F3F4EF] border-t border-[#DADDD4]">
                <div className="p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#DADDD4] flex items-center justify-center shrink-0 text-[#3b0764]">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-display font-bold text-xs sm:text-sm text-[#090D16]">
                      Your Store in Bio
                    </h5>
                    <p className="text-[11px] text-[#525B6C] mt-0.5">
                      Put <code className="font-mono text-[#3b0764]">kredibly.shop/name</code> in your social media bio. No coding needed.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#DADDD4] flex items-center justify-center shrink-0 text-[#3b0764]">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-display font-bold text-xs sm:text-sm text-[#090D16]">
                      Instant Automated Payment
                    </h5>
                    <p className="text-[11px] text-[#525B6C] mt-0.5">
                      Customers pay via bank transfer or card. Confirmed automatically in seconds.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-white border border-[#DADDD4] flex items-center justify-center shrink-0 text-[#3b0764]">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-display font-bold text-xs sm:text-sm text-[#090D16]">
                      Keep 100% of Your Prices
                    </h5>
                    <p className="text-[11px] text-[#525B6C] mt-0.5">
                      0% platform fee on paid plans. Withdraw earnings directly to your bank anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Section 2: Capabilities — Built For Every Industry on #F3F4EF */}
        <section
          id="features"
          className="py-20 sm:py-28 bg-[#F3F4EF] border-y border-[#DADDD4]"
        >
          <div className="px-4 sm:px-6 max-w-6xl mx-auto">
            {/* Keep Header & Sub-header text and positioning */}
            <div className="max-w-2xl mb-14 sm:mb-16 space-y-3">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-5 h-[2px] bg-[#3b0764]" />
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                  01 // BUILT FOR EVERY INDUSTRY
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#090D16] leading-[1.06]">
                Everything your store needs. Zero technical headaches.
              </h2>
              <p className="text-sm sm:text-base text-[#525B6C] font-normal leading-relaxed">
                Whether you sell gadgets, sneakers, bone-straight wigs, skincare, or cakes — Kredibly adapts to your catalog automatically.
              </p>
            </div>

            {/* E-Commerce Capabilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="bg-white border border-[#DADDD4] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#2e1065] transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#DADDD4] flex items-center justify-center text-[#2e1065]">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F3F4EF] text-[#090D16] rounded-xs border border-[#DADDD4]">
                      INSTANT CONFIRMATION
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
                      Accept Cards &amp; Instant Bank Transfers
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                      Most Nigerian customers prefer direct bank transfers. Kredibly gives your customers automated bank transfer and card options, verifying payments in seconds without you needing to confirm screenshots or check bank apps.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4EF] flex items-center justify-between text-xs font-mono text-[#525B6C]">
                  <span>Zero fake transfer alerts</span>
                  <span className="font-bold text-[#3b0764]">100% AUTOMATED →</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white border border-[#DADDD4] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#2e1065] transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#DADDD4] flex items-center justify-center text-[#2e1065]">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F3F4EF] text-[#090D16] rounded-xs border border-[#DADDD4]">
                      SMART CATALOG
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
                      Custom Categories &amp; Fast Photo Optimizer
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                      Never get boxed into rigid templates. Type whatever categories match your business—Shoe Sizes, Wig Lengths, Phone Models, or Skincare Types. Photos taken on your phone are automatically optimized so your store loads in less than a second on mobile data.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4EF] flex items-center justify-between text-xs font-mono text-[#525B6C]">
                  <span>Sub-second mobile loading</span>
                  <span className="font-bold text-[#3b0764]">AUTO-OPTIMIZED →</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-white border border-[#DADDD4] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#2e1065] transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#DADDD4] flex items-center justify-center text-[#2e1065]">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F3F4EF] text-[#090D16] rounded-xs border border-[#DADDD4]">
                      ZERO PASSWORDS
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
                      30-Second Guest Checkout &amp; Order Tracking
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                      Forcing shoppers to sign up and remember passwords causes 35% cart abandonment. On Kredibly, customers enter their delivery address and phone number, pay instantly, and track their order live with just their phone number.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4EF] flex items-center justify-between text-xs font-mono text-[#525B6C]">
                  <span>Phone-first order tracking</span>
                  <span className="font-bold text-[#3b0764]">FAST CHECKOUT →</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-white border border-[#DADDD4] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#2e1065] transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#DADDD4] flex items-center justify-center text-[#2e1065]">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F3F4EF] text-[#090D16] rounded-xs border border-[#DADDD4]">
                      BUYER TRUST
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
                      Built-In Buyer Trust &amp; 1-Click Bank Payouts
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                      First-time followers buy with total peace of mind because their payment is protected until delivery. Once you fulfill an order, funds are ready for instant 1-click withdrawal to any Nigerian bank (GTBank, Access, Zenith, OPay, Kuda, and more).
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4EF] flex items-center justify-between text-xs font-mono text-[#525B6C]">
                  <span>Direct settlement to your bank</span>
                  <span className="font-bold text-[#3b0764]">1-CLICK WITHDRAWAL →</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Section 3: How It Works — Connected Horizontal Pipeline on #FAF9F5 */}
        <section id="how-it-works" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto">
          {/* Keep Header & Sub-header text and positioning */}
          <div className="space-y-4 mb-16 sm:mb-20">
            <div className="inline-flex items-center gap-2.5">
              <span className="w-5 h-[2px] bg-[#3b0764]" />
              <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                02 // EASY 4-STEP SETUP
              </span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#090D16] max-w-xl leading-[1.06]">
                Up and selling in under two minutes.
              </h2>
              <p className="text-sm sm:text-base text-[#525B6C] max-w-md font-normal leading-relaxed">
                Designed for busy vendors. If you know how to post a picture on WhatsApp status or Instagram, you already know how to run your Kredibly store.
              </p>
            </div>
          </div>

          {/* Connected 4-Node Horizontal Pipeline */}
          <div className="relative">
            {/* Connecting Horizontal Rail on Desktop */}
            <div className="hidden lg:block absolute top-7 left-10 right-10 h-[2px] bg-gradient-to-r from-[#2e1065] via-[#3b0764]/40 to-[#DADDD4]" />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              {[
                {
                  num: "01",
                  time: "60 SECS",
                  title: "Claim Your Store Handle",
                  desc: "Pick your official web address like kredibly.shop/yourbrand. Zero hosting fees or coding required.",
                  footer: "kredibly.shop/yourbrand",
                },
                {
                  num: "02",
                  time: "30 SECS",
                  title: "Snap & Custom Categorize",
                  desc: "Upload product photos from your phone camera. Create your own custom categories and set your prices.",
                  footer: "Auto WebP (<85KB)",
                },
                {
                  num: "03",
                  time: "INSTANT",
                  title: "Put Link in Social Bio",
                  desc: "Shoppers browse in under 1 second and pay via instant Bank Transfer or Card with built-in buyer trust.",
                  footer: "100% Buyer Trust",
                },
                {
                  num: "04",
                  time: "1-CLICK",
                  title: "Deliver & Cash Out",
                  desc: "Buyer receives their verified receipt and order link. Deliver the package and withdraw 100% to your bank.",
                  footer: "Direct Bank Payout",
                },
              ].map((step) => (
                <div
                  key={step.num}
                  className="bg-white border border-[#DADDD4] rounded-xl p-6 flex flex-col justify-between shadow-2xs hover:border-[#2e1065] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-10 h-10 rounded-[8px] bg-[#2e1065] text-white font-mono font-bold text-sm flex items-center justify-center shadow-xs">
                        {step.num}
                      </div>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F3F4EF] border border-[#DADDD4] text-[#090D16] rounded-xs">
                        {step.time}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-display font-bold text-[#090D16] mb-2">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-3.5 border-t border-[#F3F4EF] flex items-center justify-between text-[11px] font-mono text-[#3b0764] font-bold">
                    <span>{step.footer}</span>
                    <span>→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Section 4: The Competitive Edge — 3-Column Reality Check on #F3F4EF */}
        <section
          id="competitive-edge"
          className="py-20 sm:py-28 bg-[#F3F4EF] border-y border-[#DADDD4]"
        >
          <div className="px-4 sm:px-6 max-w-6xl mx-auto">
            {/* Keep Header & Sub-header text and positioning */}
            <div className="space-y-4 mb-14 sm:mb-18">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-5 h-[2px] bg-[#3b0764]" />
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                  03 // THE COMPETITIVE EDGE
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-extrabold tracking-tight text-[#090D16] max-w-xl leading-[1.06]">
                  Why the old way is costing you 60% of your orders.
                </h2>
                <p className="text-sm sm:text-base text-[#525B6C] max-w-md font-normal leading-relaxed">
                  Most Nigerian vendors are trapped between messy WhatsApp DM chats and expensive foreign builders that don&apos;t solve buyer scam hesitation.
                </p>
              </div>
            </div>

            {/* 3-Column Reality Comparison Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              {/* Option 1: WhatsApp / Instagram DMs */}
              <div className="bg-white border border-[#DADDD4] rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xs border border-rose-200">
                      THE DM TRAP
                    </span>
                    <XCircle className="w-5 h-5 text-rose-500" />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-[#090D16]">
                      Selling in Social Media DMs
                    </h3>
                    <p className="text-xs text-[#525B6C] mt-1 leading-relaxed">
                      Manual, stressful, and loses high-value customers.
                    </p>
                  </div>

                  <ul className="space-y-3 pt-3 border-t border-[#F3F4EF] text-xs text-[#525B6C]">
                    <li className="flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Spending 6+ hours answering repetitive &ldquo;How much?&rdquo; messages</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Customers ghost because they fear sending money to personal accounts</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Falling victim to fake payment alert screenshots and bank delays</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>Manually managing stock and orders in paper notebooks</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-[#F3F4EF] text-center">
                  <span className="text-xs font-mono font-bold text-rose-600">
                    68% First-Time Shopper Drop-Off
                  </span>
                </div>
              </div>

              {/* Option 2: Shopify / Complex Builders */}
              <div className="bg-white border border-[#DADDD4] rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-xs">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xs border border-amber-200">
                      COMPLEX BUILDERS
                    </span>
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-[#090D16]">
                      Foreign Website Builders
                    </h3>
                    <p className="text-xs text-[#525B6C] mt-1 leading-relaxed">
                      Expensive, difficult to manage, and billed in USD.
                    </p>
                  </div>

                  <ul className="space-y-3 pt-3 border-t border-[#F3F4EF] text-xs text-[#525B6C]">
                    <li className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>$39/month billed in USD + expensive plugins and template fees</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Requires hiring a web developer or weeks of complex configuration</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>Forces shoppers to create accounts and passwords before buying</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>No built-in escrow trust tailored to Nigerian shoppers</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-[#F3F4EF] text-center">
                  <span className="text-xs font-mono font-bold text-amber-700">
                    Overpriced &amp; Too Complicated
                  </span>
                </div>
              </div>

              {/* Option 3: Kredibly Storefront (Highlighted in Dark Purple) */}
              <div className="bg-[#2e1065] text-white rounded-xl p-6 sm:p-7 flex flex-col justify-between shadow-lg relative border-2 border-[#3b0764]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-white/15 rounded-xs text-purple-200">
                      THE KREDIBLY STANDARD
                    </span>
                    <ShieldCheck className="w-5 h-5 text-purple-300" />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-bold text-white">
                      Your Official Kredibly Store
                    </h3>
                    <p className="text-xs text-purple-200 mt-1 leading-relaxed">
                      Instant setup, automated payments, and 100% peace of mind.
                    </p>
                  </div>

                  <ul className="space-y-3 pt-3 border-t border-white/15 text-xs text-purple-100">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Launch your store in 2 minutes with zero coding or developer fees</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Instant payment confirmation (cards &amp; transfers)—no fake alerts</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Built-in buyer protection so first-time followers buy with confidence</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>0% platform commission on paid plans—keep 100% of your prices</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>1-click instant withdrawal to any Nigerian bank</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 border-t border-white/15 text-center">
                  <Link
                    href="/register"
                    className="w-full py-2.5 bg-white hover:bg-slate-100 text-[#2e1065] font-display font-bold text-xs rounded-[8px] transition inline-flex items-center justify-center gap-1.5"
                  >
                    <span>Start Free (20 Products)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Section 5: Subscription Plans (Kept UI/UX as requested) */}
        <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 max-w-6xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center justify-center gap-2.5">
              <span className="w-5 h-[2px] bg-[#3b0764]" />
              <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                04 // CHOOSE YOUR SUBSCRIPTION PLAN
              </span>
              <span className="w-5 h-[2px] bg-[#3b0764]" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#090D16]">
              Start free with 20 products. Scale as you grow.
            </h2>
            <p className="text-sm sm:text-base text-[#525B6C]">
              On paid plans, Kredibly charges <strong>0% platform commission</strong>—you receive 100% of your product asking price.
            </p>

            {/* Billing Cycle Selector — Straight single line on desktop/tablet, smooth scroll on mobile */}
            <div className="pt-4 inline-flex items-center justify-center p-1.5 rounded-xl bg-[#F3F4EF] border border-[#DADDD4] max-w-full overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1.5 shrink-0">
                {(
                  [
                    { id: "quarterly", label: "Quarterly (3 Mos)" },
                    { id: "biannual", label: "Biannually (6 Mos)" },
                    { id: "annual", label: "Annually (1 Year · Save 15%)" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setBillingCycle(tab.id)}
                    className={`whitespace-nowrap px-4 py-2 rounded-[8px] text-xs font-display font-bold transition-all cursor-pointer ${
                      billingCycle === tab.id
                        ? "bg-[#2e1065] text-white shadow-xs"
                        : "text-[#525B6C] hover:text-[#090D16]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {/* Plan 1: Free Starter */}
            <div className="bg-white rounded-2xl border border-[#DADDD4] p-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-[#090D16]">
                    Test The Waters
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#090D16] mt-2">
                    Starter (Free)
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-3xl font-extrabold text-[#090D16]">
                      ₦0
                    </span>
                    <span className="text-xs text-[#525B6C]">/ up to ₦200k sales</span>
                  </div>
                  <p className="text-xs text-[#525B6C] mt-2 leading-relaxed">
                    Launch your official store and list up to 20 products with zero upfront cost.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-[#090D16] pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span><strong>20 Products</strong> &amp; Unlimited Orders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Official <code className="font-mono text-[#3b0764]">kredibly.shop/name</code></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>100% Escrow Buyer Protection</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Instant Bank Transfer &amp; Card Checkout</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#525B6C]">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>2.5% transaction fee on sales</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 w-full py-3 rounded-[8px] border border-[#2e1065] text-[#2e1065] hover:bg-[#2e1065] hover:text-white text-xs font-bold text-center transition-colors"
              >
                Start Free Today
              </Link>
            </div>

            {/* Plan 2: Starter Plus */}
            <div className="bg-white rounded-2xl border border-[#DADDD4] p-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-[#090D16]">
                    Growing Sellers
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#090D16] mt-2">
                    Starter Plus
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1 flex-wrap">
                    <span className="font-display text-3xl font-extrabold text-[#090D16]">
                      {getPlanPrice("starterPlus").amount}
                    </span>
                    <span className="text-xs text-[#525B6C]">
                      {getPlanPrice("starterPlus").period}
                    </span>
                  </div>
                  <p className="text-xs text-[#525B6C] mt-2 leading-relaxed">
                    Zero platform commission—keep 100% of your product asking prices.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-[#090D16] pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span><strong>50 Products</strong> &amp; Unlimited Orders</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span><strong>0% Platform Fee</strong> (Keep 100% price)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Custom Category Filter Pills</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Sound &amp; WhatsApp Order Alerts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Sales Record &amp; Customer CRM</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 w-full py-3 rounded-[8px] bg-[#2e1065] hover:bg-[#3b0764] text-white text-xs font-bold text-center transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Plan 3: Deluxe (Highlighted) */}
            <div className="bg-white rounded-2xl border-2 border-[#3b0764] p-6 flex flex-col justify-between shadow-[0_12px_32px_-8px_rgba(59,7,100,0.15)] relative">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-[#3b0764] text-white">
                    Most Popular
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-[#090D16]">
                    Deluxe (Pro)
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1 flex-wrap">
                    <span className="font-display text-3xl font-extrabold text-[#090D16]">
                      {getPlanPrice("deluxe").amount}
                    </span>
                    <span className="text-xs text-[#525B6C]">
                      {getPlanPrice("deluxe").period}
                    </span>
                  </div>
                  <p className="text-xs text-[#525B6C] mt-2 leading-relaxed">
                    Ideal for established stores with sizeable inventory and staff.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-[#090D16] pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span><strong>200 Products</strong> &amp; Unlimited Variants</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span><strong>0% Platform Fee</strong> (Keep 100% price)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Connect Custom Domain</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Discount Slash &amp; Coupon Codes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>3 Staff Accounts (Role Management)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Export Customer Phonebook (CSV)</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 w-full py-3 rounded-[8px] bg-[#3b0764] hover:bg-[#2e1065] text-white text-xs font-bold text-center transition-colors shadow-sm"
              >
                Get Started
              </Link>
            </div>

            {/* Plan 4: Ultimate */}
            <div className="bg-white rounded-2xl border border-[#DADDD4] p-6 flex flex-col justify-between shadow-2xs">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-xs bg-slate-100 text-[#090D16]">
                    High Volume
                  </span>
                  <h3 className="font-display text-lg font-bold text-[#090D16] mt-2">
                    Ultimate (Scale)
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1 flex-wrap">
                    <span className="font-display text-3xl font-extrabold text-[#090D16]">
                      {getPlanPrice("ultimate").amount}
                    </span>
                    <span className="text-xs text-[#525B6C]">
                      {getPlanPrice("ultimate").period}
                    </span>
                  </div>
                  <p className="text-xs text-[#525B6C] mt-2 leading-relaxed">
                    Built for major brands with large catalogs and multi-staff operations.
                  </p>
                </div>

                <ul className="space-y-2.5 text-xs text-[#090D16] pt-4 border-t border-slate-100">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span><strong>1,000+ Products</strong> &amp; Department View</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span><strong>Free .com.ng Domain</strong> (On Annual)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Automated Daily Bank Sweep</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Meta / TikTok Tracking Pixels</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>10 Staff Accounts + Priority Call Support</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 w-full py-3 rounded-[8px] bg-[#2e1065] hover:bg-[#3b0764] text-white text-xs font-bold text-center transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Section 6: Interactive Frequently Asked Questions Accordion (shadcn/ui) on #F3F4EF */}
        <section
          id="faq"
          className="py-20 sm:py-28 bg-[#F3F4EF] border-t border-[#DADDD4]"
        >
          <div className="px-4 sm:px-6 max-w-4xl mx-auto">
            <div className="space-y-4 mb-12 sm:mb-16 text-center">
              <div className="inline-flex items-center justify-center gap-2.5">
                <span className="w-5 h-[2px] bg-[#3b0764]" />
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                  05 // FREQUENTLY ASKED QUESTIONS
                </span>
                <span className="w-5 h-[2px] bg-[#3b0764]" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-[#090D16]">
                Answers to your questions.
              </h2>
              <p className="text-sm sm:text-base text-[#525B6C]">
                Everything you need to know about our Escrow protection, payouts, and store setup.
              </p>
            </div>

            <Accordion
              type="single"
              collapsible
              defaultValue="item-1"
              className="space-y-3"
            >
              {FAQS.map((faq) => (
                <AccordionItem
                  key={faq.value}
                  value={faq.value}
                  className="bg-white border border-[#DADDD4] rounded-xl px-5 sm:px-6 py-1 data-[state=open]:border-[#3b0764] shadow-2xs transition-colors"
                >
                  <AccordionTrigger className="font-display font-bold text-base sm:text-lg text-[#090D16] hover:no-underline py-4 text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-xs sm:text-sm text-[#525B6C] leading-relaxed pt-1 pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* 8. Final High-Converting CTA Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="bg-white border border-[#DADDD4] rounded-2xl p-8 sm:p-16 text-center space-y-6 relative overflow-hidden shadow-[0_16px_40px_-12px_rgba(9,13,22,0.08)]">
            {/* Geometric Diagonal Lattice & Precision Dot Matrix (Same Pattern as Hero) */}
            <div
              className="absolute inset-0 pointer-events-none opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(46, 16, 101, 0.14) 1px, transparent 1px), linear-gradient(135deg, rgba(46, 16, 101, 0.03) 25%, transparent 25%, transparent 50%, rgba(46, 16, 101, 0.03) 50%, rgba(46, 16, 101, 0.03) 75%, transparent 75%, transparent)",
                backgroundSize: "24px 24px, 64px 64px",
                maskImage:
                  "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
              }}
            />

            {/* Soft Royal Purple Prism Beam behind CTA */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-2xl h-36 bg-gradient-to-r from-transparent via-[#3b0764]/10 to-transparent blur-2xl pointer-events-none" />

            {/* Architectural Corner Registration Marks */}
            <div className="hidden sm:block absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-[#3b0764]/30 pointer-events-none" />
            <div className="hidden sm:block absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-[#3b0764]/30 pointer-events-none" />
            <div className="hidden sm:block absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-[#3b0764]/30 pointer-events-none" />
            <div className="hidden sm:block absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-[#3b0764]/30 pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center space-y-6">
              <div className="h-12 w-12 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] text-[#2e1065] flex items-center justify-center shadow-xs">
                <Store className="w-6 h-6" />
              </div>

              <div className="inline-flex items-center justify-center gap-2.5">
                <span className="w-5 h-[2px] bg-[#3b0764]" />
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                  OFFICIAL SOCIAL COMMERCE
                </span>
                <span className="w-5 h-[2px] bg-[#3b0764]" />
              </div>

              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#090D16] max-w-2xl leading-tight">
                Your competitors are still sending bank accounts in Instagram DMs.
              </h2>

              <p className="text-sm sm:text-base text-[#525B6C] max-w-xl leading-relaxed">
                Give your business the official credibility it deserves. Launch your store with 20 products free in under 2 minutes.
              </p>

              <div className="pt-2 w-full sm:w-auto">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-[#2e1065] hover:bg-[#3b0764] text-white font-display font-bold rounded-[8px] transition flex items-center justify-center gap-2 text-sm shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Claim Your Store Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Minimalist VOÐE-Style Footer */}
      <footer className="border-t border-[#DADDD4] bg-[#F3F4EF] pt-12 pb-10 text-xs text-[#525B6C]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Top Section: Brand Tagline & Newsletter */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 pb-10 border-b border-[#DADDD4]">
            <div className="space-y-3 max-w-md">
              <Link href="/" className="inline-block">
                <img
                  src="/krediblyrevamped.png"
                  alt="Kredibly"
                  className="h-6 sm:h-7 w-auto object-contain"
                />
              </Link>
              <p className="text-xs text-[#525B6C] leading-relaxed">
                The modern storefront builder and escrow trust platform for Nigerian social sellers and independent brands.
              </p>
            </div>

            {/* Newsletter: Stay In The Loop (VOÐE Signature) */}
            <div className="w-full lg:w-auto">
              <h4 className="font-display font-bold text-[#090D16] uppercase tracking-wider text-[11px] mb-1.5">
                STAY IN THE LOOP
              </h4>
              <p className="text-xs text-[#525B6C] mb-3 max-w-sm">
                Get merchant growth playbooks, product drops, and e-commerce insights.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  alert("Thank you for subscribing to Kredibly updates!");
                }}
                className="flex items-center gap-2 max-w-sm"
              >
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="bg-white border border-[#DADDD4] rounded-lg px-3.5 py-2 text-[16px] sm:text-xs text-[#090D16] placeholder-[#94A3B8] focus:outline-none focus:border-[#2e1065] flex-1"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#2e1065] hover:bg-[#3b0764] text-white text-xs font-semibold rounded-[8px] transition-colors shrink-0 cursor-pointer"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          {/* Clean Link Columns (2 Cols on Mobile, 4 Cols on Desktop) */}
          <div className="py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8 border-b border-[#DADDD4]">
            {/* Col 1: Explore */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-[#090D16] uppercase tracking-wider text-[11px]">
                Explore
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#features" className="hover:text-[#090D16] transition-colors">
                    Capabilities
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:text-[#090D16] transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-[#090D16] transition-colors">
                    Pricing Plans
                  </a>
                </li>
                <li>
                  <a href="#faq" className="hover:text-[#090D16] transition-colors">
                    Merchant FAQs
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 2: Merchants */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-[#090D16] uppercase tracking-wider text-[11px]">
                Merchants
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/register" className="hover:text-[#090D16] transition-colors">
                    Start Free Store
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-[#090D16] transition-colors">
                    Merchant Sign In
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-[#090D16] transition-colors">
                    Seller Dashboard
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Policies & Legal */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-[#090D16] uppercase tracking-wider text-[11px]">
                Policies &amp; Legal
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/terms" className="hover:text-[#090D16] transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-[#090D16] transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/refund-policy" className="hover:text-[#090D16] transition-colors">
                    Refund &amp; Escrow Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust & Support */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-[#090D16] uppercase tracking-wider text-[11px]">
                Trust &amp; Security
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Escrow Shield Active</span>
                </li>
                <li>
                  <a
                    href="mailto:support@usekredibly.com"
                    className="hover:text-[#090D16] transition-colors"
                  >
                    support@usekredibly.com
                  </a>
                </li>
                <li className="text-[#525B6C]">
                  Lagos, Nigeria
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar (VOÐE / Modern Minimalist) */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11.5px] text-[#525B6C]">
            <p>© {new Date().getFullYear()} Kredibly Technologies Limited. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
              <Link href="/terms" className="hover:text-[#090D16] transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/privacy" className="hover:text-[#090D16] transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/refund-policy" className="hover:text-[#090D16] transition-colors">
                Refund Policy
              </Link>
              <span>•</span>
              <span className="font-medium text-[#090D16]">Nigeria (NGN ₦)</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
