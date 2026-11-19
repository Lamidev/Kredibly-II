"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { CustomBuildSection } from "@/components/landing/CustomBuildSection";
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
  Plus,
} from "lucide-react";

const WHY_SWITCH_ITEMS = [
  {
    num: "01",
    title: "Stop answering \"How much?\" 50 times a day.",
    body: "Instead of repeating prices, sizes, and bank account numbers in WhatsApp and Instagram DMs for hours, send one clean shop link where buyers see everything and order themselves.",
  },
  {
    num: "02",
    title: "Only real, confirmed bank alerts.",
    body: "Say goodbye to fake transfer alerts and edited screenshots. Every bank transfer or card payment is verified automatically in seconds before your order is marked paid.",
  },
  {
    num: "03",
    title: "Fast 30-second checkout for your buyers.",
    body: "Most websites force shoppers to sign up and remember passwords before paying. Kredibly lets customers add to cart, enter their delivery address, and pay immediately.",
  },
  {
    num: "04",
    title: "Launch yourself—no expensive developer needed.",
    body: "You don't have to pay heavy fees to a web designer or get billed in US Dollars. Set up your full online store from your phone in minutes, free to start.",
  },
  {
    num: "05",
    title: "Automatic order tracking & customer records.",
    body: "Stop writing orders in paper notebooks. Every buyer's phone number, delivery address, and purchase history is saved neatly in your dashboard—ready for instant payout.",
  },
];

type BillingCycle = "monthly" | "quarterly" | "biannual" | "annual";

const FAQS = [
  {
    value: "item-1",
    q: "Do I need a laptop or computer to use Kredibly?",
    a: "No. You can do everything 100% on your phone. You can create your store, upload photos, set prices, and manage new orders straight from your mobile phone browser without needing a laptop or web designer.",
  },
  {
    value: "item-2",
    q: "How do I receive my money when someone buys from my store?",
    a: "All your sales go directly into your secure Kredibly store balance. With one tap, you can withdraw your money straight into any Nigerian bank account (GTBank, Zenith, Access, First Bank, Kuda, OPay, Moniepoint, etc.).",
  },
  {
    value: "item-3",
    q: "Will my customers have to download an app or create a password to buy?",
    a: "No. Your customers do not need to download any app or remember passwords. They simply tap your link on WhatsApp, Instagram, or TikTok, see all your goods, and checkout with their delivery address in 30 seconds.",
  },
  {
    value: "item-4",
    q: "What happens if a customer sends a fake transfer alert?",
    a: "Our system connects directly to the bank. An order is ONLY marked as paid when the money is actually confirmed. You never have to guess, argue with customers, or inspect fake transfer screenshots again.",
  },
  {
    value: "item-5",
    q: "Can I get my own shop link with my brand name?",
    a: "Yes. The moment you sign up, you get your own clean link like yourbrand.kredibly.shop. You can put this link in your Instagram bio, WhatsApp status, or TikTok profile. You can also connect your own custom website (like yourbrand.com or yourbrand.ng) on paid plans.",
  },
  {
    value: "item-6",
    q: "Do I have to pay before testing Kredibly?",
    a: "No. You can start completely free. You can add up to 20 products and start receiving customer orders with zero upfront cost. You only choose a paid subscription plan when your business is ready to grow.",
  },
  {
    value: "item-7",
    q: "How do I know when someone places a new order?",
    a: "You get an instant alert on your phone and email with the customer's name, phone number, the items they purchased, and their delivery address so you can dispatch with 100% confidence.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [claimInput, setClaimInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState("");

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
  const [openSwitchIndex, setOpenSwitchIndex] = useState<number>(0);

  useEffect(() => {
    const raw = claimInput.toLowerCase().trim().replace(/[^a-z0-9]/g, "");
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
            message: `${raw}.kredibly.shop is available!`,
            suggestions: [],
          });
        } else {
          const suggestions =
            data?.suggestions && data.suggestions.length > 0
              ? data.suggestions
              : [`${raw}ng`, `${raw}store`, `shop${raw}`];
          setCheckResult({
            status: "taken",
            slug: raw,
            message: data?.message || `${raw}.kredibly.shop is already taken`,
            suggestions,
          });
        }
      } catch (err) {
        const reserved = new Set(["admin", "api", "dashboard", "kredibly", "shop", "login", "register", "urbanluxe", "urban-luxe"]);
        if (reserved.has(raw)) {
          setCheckResult({
            status: "taken",
            slug: raw,
            message: `${raw}.kredibly.shop is reserved`,
            suggestions: [`${raw}ng`, `${raw}store`, `shop${raw}`],
          });
        } else {
          setCheckResult({
            status: "available",
            slug: raw,
            message: `${raw}.kredibly.shop is available!`,
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
        monthly: { amount: "₦5,000", period: "/ Month" },
        quarterly: { amount: "₦14,500", period: "/ 3 Months (₦4,833/mo)" },
        biannual: { amount: "₦27,500", period: "/ 6 Months (₦4,583/mo)" },
        annual: { amount: "₦55,000", period: "/ 1 Year (₦4,583/mo)" },
      },
      deluxe: {
        monthly: { amount: "₦10,000", period: "/ Month" },
        quarterly: { amount: "₦28,500", period: "/ 3 Months (₦9,500/mo)" },
        biannual: { amount: "₦55,000", period: "/ 6 Months (₦9,167/mo)" },
        annual: { amount: "₦110,000", period: "/ 1 Year (₦9,167/mo)" },
      },
      ultimate: {
        monthly: { amount: "₦20,000", period: "/ Month" },
        quarterly: { amount: "₦57,000", period: "/ 3 Months (₦19,000/mo)" },
        biannual: { amount: "₦110,000", period: "/ 6 Months (₦18,333/mo)" },
        annual: { amount: "₦220,000", period: "/ 1 Year (₦18,333/mo)" },
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
              Features
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
              Why Kredibly
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
              Help &amp; Questions
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
              <span>Create Free Store</span>
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
                Features
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
                Why Kredibly
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
                Help &amp; Questions
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
                Create Free Store
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
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[72px] font-display font-bold tracking-tight leading-[1.06] text-[#090D16]">
              Put your products online.{" "}
              <span className="text-[#3b0764]">Start taking orders.</span>
            </h1>

            {/* Subhead */}
            <p className="text-base sm:text-lg md:text-xl text-[#525B6C] max-w-2xl mx-auto font-normal leading-relaxed">
              Create your own online store, add your products, and share your store link anywhere. Customers can browse, order and pay online.
            </p>

            {/* Interactive Domain Claimer with Real-Time Brand Availability Checking */}
            <div className="w-full max-w-xl mx-auto space-y-3">
              <form
                onSubmit={handleClaimSubmit}
                className="w-full bg-white border border-[#CBD5E1] hover:border-[#2e1065] focus-within:border-[#2e1065] p-2 rounded-xl shadow-[0_10px_30px_-8px_rgba(46,16,101,0.12)] flex flex-col sm:flex-row items-center gap-2 transition-all"
              >
                <div className="flex items-center flex-1 w-full pl-3.5 pr-2 py-2 font-mono">
                  <input
                    type="text"
                    required
                    placeholder="yourbrandname"
                    value={claimInput}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    onChange={(e) => setClaimInput(e.target.value)}
                    className="bg-transparent text-[#090D16] font-bold placeholder-[#94A3B8] focus:outline-none w-full lowercase text-[16px] sm:text-sm"
                  />
                  <span className="text-[#64748B] select-none shrink-0 text-[15px] sm:text-sm font-semibold ml-1">
                    .kredibly.shop
                  </span>
                  {isChecking && (
                    <Loader2 className="w-4 h-4 text-[#2e1065] animate-spin shrink-0 ml-1" />
                  )}
                </div>

                <button
                  type="submit"
                  className={`w-full sm:w-auto px-7 py-3.5 text-white font-display font-bold rounded-[8px] transition-all flex items-center justify-center gap-2 text-xs sm:text-sm shrink-0 shadow-sm cursor-pointer ${
                    checkResult.status === "available"
                      ? "bg-[#3b0764] hover:bg-[#2e1065]"
                      : "bg-[#2e1065] hover:bg-[#3b0764]"
                  }`}
                >
                  <span>{checkResult.status === "available" ? "Create your free store" : "Create your free store"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Dynamic Availability & Smart Suggestion Feedback */}
              {claimInput.trim() && (
                <div className="min-h-[28px] flex flex-col items-center justify-center gap-2 text-xs">
                  {checkResult.status === "available" && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-[#2e1065] font-mono font-semibold animate-in fade-in">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#3b0764] shrink-0" />
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

              {/* Frictionless Assurance — Straight line on mobile, purple checkmarks */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 text-[10.5px] sm:text-[13px] text-[#64748B] font-medium pt-1 whitespace-nowrap">
                <span className="flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#3b0764] shrink-0" />
                  <span>Free to start</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-[#CBD5E1] shrink-0" />
                <span className="flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#3b0764] shrink-0" />
                  <span>Scale as you grow</span>
                </span>
                <span className="w-1 h-1 rounded-full bg-[#CBD5E1] shrink-0" />
                <span className="flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#3b0764] shrink-0" />
                  <span>No coding required</span>
                </span>
              </div>
            </div>
          </div>

          {/* Seller Platform Value Strip (Replaces Storefront Mockup for Instant 5-Second Clarity) */}
          <div className="mt-12 sm:mt-16 relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white border border-[#DADDD4] rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F7F4FC] border border-[#2e1065]/15 text-[#2e1065] flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3b0764]">
                  01 // YOUR STORE
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#090D16]">
                One Link for All Your Products
              </h3>
              <p className="text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                Get <code className="font-mono text-[#2e1065] font-semibold">yourbrand.kredibly.shop</code> with product pages, sizes, colors, and live stock ready to share on WhatsApp, IG, and TikTok.
              </p>
            </div>

            <div className="bg-white border border-[#DADDD4] rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F7F4FC] border border-[#2e1065]/15 text-[#2e1065] flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3b0764]">
                  02 // CHECKOUT
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#090D16]">
                Customers Order &amp; Pay Online
              </h3>
              <p className="text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                Shoppers add to cart, pick their state delivery fee, and pay by instant bank transfer—no DM back-and-forth or fake transfer screenshots.
              </p>
            </div>

            <div className="bg-white border border-[#DADDD4] rounded-2xl p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#F7F4FC] border border-[#2e1065]/15 text-[#2e1065] flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3b0764]">
                  03 // PAYOUTS
                </span>
              </div>
              <h3 className="font-display text-lg font-bold text-[#090D16]">
                Organized Orders &amp; Wallet
              </h3>
              <p className="text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                Manage every paid order from one dashboard, notify buyers automatically on dispatch, and withdraw anytime or via 8:00 AM auto-settlement.
              </p>
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
                  01 // EVERYTHING YOU NEED
                </span>
              </div>
              <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-[#090D16] leading-[1.06]">
                A full online store of your own. Without the developer price tag.
              </h2>
              <p className="text-sm sm:text-base text-[#525B6C] font-normal leading-relaxed">
                Whether you sell fashion, beauty, gadgets, food, or handmade goods — Kredibly gives you a complete e-commerce website that&apos;s as easy to run as chatting on your phone.
              </p>
            </div>

            {/* E-Commerce Capabilities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Feature 1 */}
              <div className="bg-white border border-[#DADDD4] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#2e1065] transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#DADDD4] flex items-center justify-center text-[#2e1065]">
                      <Package className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F3F4EF] text-[#090D16] rounded-xs border border-[#DADDD4]">
                      SAVE TIME &amp; ENERGY
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
                      Stop Answering &ldquo;How Much?&rdquo; All Day
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                      Put all your goods, colors, sizes, and prices in one clean link. Instead of sending 50 pictures and repeating prices in DM every time a customer asks, just share your store link. Customers browse everything themselves.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4EF] flex items-center justify-between text-xs font-mono text-[#525B6C]">
                  <span>Saves 4+ hours of manual chat every day</span>
                  <span className="font-bold text-[#3b0764]">BROWSE EASILY →</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white border border-[#DADDD4] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#2e1065] transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#DADDD4] flex items-center justify-center text-[#2e1065]">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F3F4EF] text-[#090D16] rounded-xs border border-[#DADDD4]">
                      100% REAL ALERTS
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
                      No More Fake Bank Transfer Screenshots
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                      Most customers prefer direct bank transfers. With Kredibly, customers get a dedicated transfer account per order, and our system confirms the real payment in seconds. You will never lose goods to fake transfer alerts again.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4EF] flex items-center justify-between text-xs font-mono text-[#525B6C]">
                  <span>Zero fake transfer alert losses</span>
                  <span className="font-bold text-[#3b0764]">100% AUTOMATED →</span>
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
                      30-SECOND CHECKOUT
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
                      Customers Buy Fast with No Passwords
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                      Nobody likes remembering passwords or downloading new apps. On your Kredibly store, customers simply pick what they want, enter their name, phone number, and delivery address, and pay in 30 seconds.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4EF] flex items-center justify-between text-xs font-mono text-[#525B6C]">
                  <span>No apps or passwords required</span>
                  <span className="font-bold text-[#3b0764]">FAST CHECKOUT →</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-white border border-[#DADDD4] rounded-xl p-6 sm:p-8 flex flex-col justify-between shadow-xs hover:border-[#2e1065] transition-colors">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-[#FAF9F5] border border-[#DADDD4] flex items-center justify-center text-[#2e1065]">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F3F4EF] text-[#090D16] rounded-xs border border-[#DADDD4]">
                      DIRECT TO YOUR BANK
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#090D16]">
                      Money Sent Straight to Your Bank Account
                    </h3>
                    <p className="mt-2.5 text-xs sm:text-sm text-[#525B6C] leading-relaxed">
                      Every naira you earn goes into your secure store balance. Withdraw straight to GTBank, Zenith, Access, Kuda, Moniepoint, OPay, or any Nigerian bank account with just one tap anytime you want.
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F3F4EF] flex items-center justify-between text-xs font-mono text-[#525B6C]">
                  <span>Direct payout to any Nigerian bank</span>
                  <span className="font-bold text-[#3b0764]">1-CLICK CASHOUT →</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Section 3: How It Works — Minimalist Editorial Timeline on Very Light Purple */}
        <section id="how-it-works" className="py-20 sm:py-28 bg-[#F7F4FC]">
          <div className="px-4 sm:px-6 max-w-6xl mx-auto">
            {/* Keep Header & Sub-header text and positioning */}
            <div className="space-y-4 mb-16 sm:mb-20">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-5 h-[2px] bg-[#3b0764]" />
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                  02 // 4 SIMPLE STEPS
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-[#090D16] max-w-xl leading-[1.06]">
                  Ready to sell in under two minutes.
                </h2>
                <p className="text-sm sm:text-base text-[#525B6C] max-w-md font-normal leading-relaxed">
                  Designed for busy sellers. If you know how to send a photo on WhatsApp, you already know how to run your Kredibly store.
                </p>
              </div>
            </div>

            {/* Reference-Style Open 4-Column Editorial Steps (No Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
              {[
                {
                  num: "01",
                  tag: "CLAIM LINK",
                  title: "Choose Your Store Name",
                  desc: "Pick a simple web address like yourbrand.kredibly.shop. No computer or web designer needed.",
                },
                {
                  num: "02",
                  tag: "ADD GOODS",
                  title: "Snap & Add Your Goods",
                  desc: "Take photos of your items with your phone camera, type your price, and save. It looks clean automatically.",
                },
                {
                  num: "03",
                  tag: "SHARE LINK",
                  title: "Share on Social Media",
                  desc: "Put your link on your WhatsApp status, Instagram bio, or TikTok profile. Customers see your goods immediately.",
                },
                {
                  num: "04",
                  tag: "GET PAID",
                  title: "Receive Orders & Deliver",
                  desc: "Get an instant notification whenever an order is paid for, with the customer's exact delivery address.",
                },
              ].map((step) => (
                <div key={step.num} className="space-y-4">
                  {/* Top Dot + Thin Hairline */}
                  <div className="flex items-center">
                    <span className="w-2 h-2 rounded-full bg-[#3b0764] shrink-0" />
                    <span className="h-[1px] w-full bg-[#3b0764]/20" />
                  </div>

                  {/* Step Number / Tag */}
                  <p className="text-[10.5px] font-mono font-semibold tracking-[0.16em] uppercase text-[#3b0764]">
                    {step.num} / {step.tag}
                  </p>

                  {/* Title & Calm Description */}
                  <div className="space-y-2">
                    <h3 className="text-lg font-display font-bold text-[#090D16] leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[13px] text-[#525B6C] leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Section 4: Why Switch — White Canvas, Left Editorial Photo + Right Accordion */}
        <section
          id="competitive-edge"
          className="py-20 sm:py-28 bg-white border-y border-[#DADDD4]"
        >
          <div className="px-4 sm:px-6 max-w-6xl mx-auto">
            {/* Keep Header & Sub-header text and positioning */}
            <div className="space-y-4 mb-12 sm:mb-16">
              <div className="inline-flex items-center gap-2.5">
                <span className="w-5 h-[2px] bg-[#3b0764]" />
                <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                  03 // WHY SWITCH?
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-[#090D16] max-w-xl leading-[1.06]">
                  Selling in DMs is exhausting. There is a better way.
                </h2>
                <p className="text-sm sm:text-base text-[#525B6C] max-w-md font-normal leading-relaxed">
                  See why social media sellers are moving from stressful manual chats to a clean Kredibly shop link.
                </p>
              </div>
            </div>

            {/* 2-Column Split: Left Image (Matches Right Accordion Height) + Right Accordion */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              {/* Left High-Resolution Editorial Photo */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden bg-[#1a0b2e] min-h-[380px] sm:min-h-[440px] lg:min-h-0">
                <img
                  src="/why-switch.jpg"
                  alt="Nigerian online merchant preparing an order"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#090D16]/90 via-[#090D16]/25 to-transparent" />
                <div className="relative z-10 h-full flex flex-col justify-end p-6 sm:p-8 text-white">
                  <span className="text-[10px] font-mono font-bold tracking-[0.2em] uppercase text-purple-200 mb-2">
                    BUILT FOR SOCIAL SELLERS
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-white">
                    Sell smarter.
                    <br />
                    Zero DM stress.
                  </h3>
                </div>
              </div>

              {/* Right Accordion List (Reference Design) */}
              <div className="lg:col-span-7 flex flex-col justify-center">
                <div className="divide-y divide-[#E5E7E0] border-y border-[#E5E7E0]">
                  {WHY_SWITCH_ITEMS.map((item, idx) => {
                    const isOpen = openSwitchIndex === idx;
                    return (
                      <div key={item.num} className="py-5 sm:py-6">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenSwitchIndex(isOpen ? -1 : idx)
                          }
                          aria-expanded={isOpen}
                          className="w-full flex items-start sm:items-center justify-between gap-4 text-left group cursor-pointer"
                        >
                          <div className="flex items-start sm:items-center gap-4 sm:gap-6 min-w-0">
                            <span className="text-xs font-mono font-bold text-[#3b0764] shrink-0 pt-1 sm:pt-0">
                              {item.num}
                            </span>
                            <span className="font-display text-lg sm:text-[22px] font-bold text-[#090D16] leading-snug group-hover:text-[#3b0764] transition-colors">
                              {item.title}
                            </span>
                          </div>

                          <span
                            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all border ${
                              isOpen
                                ? "bg-[#2e1065] border-[#2e1065] text-white"
                                : "bg-white border-[#DADDD4] text-[#090D16] group-hover:border-[#2e1065]"
                            }`}
                          >
                            {isOpen ? (
                              <X className="w-4 h-4" />
                            ) : (
                              <Plus className="w-4 h-4" />
                            )}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="pl-8 sm:pl-11 pr-10 pt-3">
                            <p className="text-sm text-[#525B6C] leading-relaxed">
                              {item.body}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Section 5: Subscription Plans (Kept UI/UX as requested) */}
        <section id="pricing" className="py-20 sm:py-28 bg-[#F7F4FC]">
          <div className="px-4 sm:px-6 max-w-6xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center justify-center gap-2.5">
              <span className="w-5 h-[2px] bg-[#3b0764]" />
              <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
                04 // SIMPLE, HONEST PRICING
              </span>
              <span className="w-5 h-[2px] bg-[#3b0764]" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-[#090D16]">
              Start free today. Pay only as your business grows.
            </h2>
            <p className="text-sm sm:text-base text-[#525B6C]">
              No hidden charges. No surprise monthly deductions from your ATM card.
            </p>

            {/* Billing Cycle Selector — Straight single line on desktop/tablet, smooth scroll on mobile */}
            <div className="pt-4 flex justify-center">
              <div className="inline-flex items-center justify-center p-1.5 rounded-xl bg-white/80 backdrop-blur-sm border border-[#2e1065]/15 shadow-xs max-w-full overflow-x-auto scrollbar-none">
                <div className="flex items-center gap-1.5 shrink-0">
                  {(
                    [
                      { id: "monthly", label: "Monthly" },
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
                    <span>Official <code className="font-mono text-[#3b0764]">yourname.kredibly.shop</code></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Verified Storefront &amp; Order Tracking</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Instant Bank Transfer &amp; Card Checkout</span>
                  </li>
                  <li className="flex items-center gap-2 text-[#525B6C]">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>2.5% fee (includes payment processing)</span>
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
                    <span><strong>0% Kredibly Commission</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Choose who pays Nomba DVA fee</span>
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
                    <span><strong>0% Kredibly Commission</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Choose who pays Nomba DVA fee</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Discount Slash &amp; Coupon Codes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>8:00 AM Auto T+1 &amp; Instant Payouts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Customer Directory &amp; Order History</span>
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
                    <span><strong>0% Kredibly Commission</strong></span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>8:00 AM Auto T+1 &amp; Instant Payouts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#3b0764] shrink-0" />
                    <span>Priority Support &amp; Custom Onboarding</span>
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
                  05 // QUESTIONS &amp; ANSWERS
                </span>
                <span className="w-5 h-[2px] bg-[#3b0764]" />
              </div>
              <h2 className="text-3xl sm:text-5xl font-display font-bold tracking-tight text-[#090D16]">
                Answers to your questions.
              </h2>
              <p className="text-sm sm:text-base text-[#525B6C]">
                Everything you need to know about setting up your shop, receiving orders, and getting paid.
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
                  START SELLING TODAY
                </span>
                <span className="w-5 h-[2px] bg-[#3b0764]" />
              </div>

              <h2 className="font-display text-2xl sm:text-4xl md:text-5xl font-bold text-[#090D16] max-w-2xl leading-tight">
                Your competitors are still writing account numbers in Instagram DMs.
              </h2>

              <p className="text-sm sm:text-base text-[#525B6C] max-w-xl leading-relaxed">
                Give your business the official respect it deserves. Create your free online store with 20 products in under 2 minutes.
              </p>

              <div className="pt-2 w-full sm:w-auto">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-[#2e1065] hover:bg-[#3b0764] text-white font-display font-bold rounded-[8px] transition flex items-center justify-center gap-2 text-sm shadow-md hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Create Your Free Store Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Custom Website / E-commerce Inquiry Section */}
      <CustomBuildSection />

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
                The modern storefront builder and instant checkout platform for Nigerian social sellers and independent brands.
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
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newsletterEmail.trim() || newsletterLoading) return;
                  setNewsletterLoading(true);
                  setNewsletterMsg("");
                  try {
                    const res = await api.post("/public/newsletter", {
                      email: newsletterEmail.trim(),
                    });
                    setNewsletterMsg(
                      res.data?.message ||
                        "You're in the loop! Check your inbox for a welcome note."
                    );
                    setNewsletterEmail("");
                  } catch (err: any) {
                    setNewsletterMsg(
                      err.response?.data?.message ||
                        "Could not subscribe right now. Please try again."
                    );
                  } finally {
                    setNewsletterLoading(false);
                  }
                }}
                className="space-y-2 max-w-sm"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    required
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="bg-white border border-[#DADDD4] rounded-lg px-3.5 py-2 text-[16px] sm:text-xs text-[#090D16] placeholder-[#94A3B8] focus:outline-none focus:border-[#2e1065] flex-1"
                  />
                  <button
                    type="submit"
                    disabled={newsletterLoading}
                    className="px-4 py-2 bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-60 text-white text-xs font-semibold rounded-[8px] transition-colors shrink-0 cursor-pointer"
                  >
                    {newsletterLoading ? "Joining..." : "Subscribe"}
                  </button>
                </div>
                {newsletterMsg && (
                  <p className="text-[11px] font-medium text-[#2e1065]">
                    {newsletterMsg}
                  </p>
                )}
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
                    Refund &amp; Returns Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Trust & Support */}
            <div className="space-y-3">
              <h4 className="font-display font-bold text-[#090D16] uppercase tracking-wider text-[11px]">
                Trust &amp; Support
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5 text-[#3b0764] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3b0764] animate-pulse" />
                  <span>Verified Instant Checkout</span>
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
            <p>© {new Date().getFullYear()} Akinbyte Technologies Limited (RC: 9466327). All rights reserved.</p>
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

          {/* Regulatory & Payment Partner Disclaimer */}
          <div className="mt-5 pt-4 border-t border-[#DADDD4]/70 text-[11px] text-[#525B6C] leading-relaxed text-center sm:text-left">
            <p>
              Payment processing services are provided by licensed financial institutions.{" "}
              Kredibly is a commerce technology platform operated by{" "}
              <span className="font-semibold text-[#090D16]">
                Akinbyte Technologies Limited (RC: 9466327)
              </span>
              , not a bank. Virtual account collection and bank settlement services are powered by our regulated financial partners.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
