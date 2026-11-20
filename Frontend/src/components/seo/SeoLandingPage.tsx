import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, Sparkles } from "lucide-react";

export interface SeoComparisonRow {
  feature: string;
  kredibly: string;
  other: string;
}

export interface SeoStep {
  title: string;
  description: string;
}

export interface SeoFaq {
  question: string;
  answer: string;
}

export interface SeoHighlight {
  title: string;
  description: string;
}

export interface SeoLandingPageProps {
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  highlightsTitle: string;
  highlights: SeoHighlight[];
  comparisonTitle: string;
  comparisonSubtitle: string;
  otherColumnLabel: string;
  comparisonRows: SeoComparisonRow[];
  stepsTitle: string;
  steps: SeoStep[];
  faqs: SeoFaq[];
}

const ALL_GUIDES = [
  {
    href: "/whatsapp-store-builder",
    label: "WhatsApp Store Builder",
    description: "Turn WhatsApp status views and DMs into structured checkout orders.",
  },
  {
    href: "/instagram-shop-builder",
    label: "Instagram Shop Builder",
    description: "Add one clean bio link where followers browse, pick variants, and pay.",
  },
  {
    href: "/bumpa-alternative",
    label: "Bumpa Alternative",
    description: "Compare Kredibly's free starter tier and 0% Pro commission plans.",
  },
  {
    href: "/catlog-alternative",
    label: "Catlog Alternative",
    description: "See how Kredibly compares for Nigerian social-commerce sellers.",
  },
  {
    href: "/custom-builds",
    label: "Custom Website Builds",
    description: "Need a bespoke e-commerce site built for your brand? Explore custom builds.",
  },
];

/**
 * Reusable SSR editorial landing page for high-intent SEO and GEO routes.
 */
export function SeoLandingPage({
  slug,
  eyebrow,
  title,
  subtitle,
  ctaLabel = "Start Your Free Store",
  highlightsTitle,
  highlights,
  comparisonTitle,
  comparisonSubtitle,
  otherColumnLabel,
  comparisonRows,
  stepsTitle,
  steps,
  faqs,
}: SeoLandingPageProps) {
  const canonicalUrl = `https://usekredibly.com${slug}`;

  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://usekredibly.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: eyebrow,
          item: canonicalUrl,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    },
  ];

  const relatedGuides = ALL_GUIDES.filter((g) => g.href !== slug);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-[#090D16] selection:bg-[#2e1065] selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-[#DADDD4] bg-[#FAF9F5]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src="/krediblyrevamped.png"
              alt="Kredibly"
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </Link>
          <nav className="flex items-center gap-5 text-sm font-medium text-[#5A6577]">
            <Link
              href="/#pricing"
              className="hidden hover:text-[#090D16] transition-colors sm:inline"
            >
              Pricing
            </Link>
            <Link
              href="/custom-builds"
              className="hidden hover:text-[#090D16] transition-colors sm:inline"
            >
              Custom Websites
            </Link>
            <Link
              href="/login"
              className="hover:text-[#090D16] transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#2e1065] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3b0764]"
            >
              Start Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 pb-16 pt-14 text-center sm:px-6 sm:pt-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#DADDD4] bg-white px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#2e1065]">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#090D16] sm:text-5xl sm:leading-[1.12]">
            {title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-[#5A6577] sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2e1065] px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3b0764] sm:w-auto"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex w-full items-center justify-center rounded-full border border-[#DADDD4] bg-white px-7 py-3.5 text-sm font-semibold text-[#090D16] transition-colors hover:border-[#2e1065]/40 sm:w-auto"
            >
              View Naira Pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-[#5A6577]">
            Free Starter plan (₦0/mo) • Up to 20 products • Built-in Nomba checkout
          </p>
        </section>

        {/* Highlights */}
        <section className="border-y border-[#DADDD4] bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-[#090D16] sm:text-3xl">
              {highlightsTitle}
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[#DADDD4] bg-[#FAF9F5] p-6"
                >
                  <CheckCircle2 className="h-6 w-6 text-[#2e1065]" />
                  <h3 className="mt-4 text-lg font-bold text-[#090D16]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5A6577]">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold tracking-tight text-[#090D16] sm:text-3xl">
              {comparisonTitle}
            </h2>
            <p className="mt-3 text-sm text-[#5A6577] sm:text-base">
              {comparisonSubtitle}
            </p>
          </div>

          <div className="mt-10 overflow-hidden rounded-2xl border border-[#DADDD4] bg-white">
            <div className="grid grid-cols-3 border-b border-[#DADDD4] bg-[#FAF9F5] px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-[#5A6577] sm:px-6">
              <div>Feature</div>
              <div className="text-[#2e1065]">Kredibly</div>
              <div>{otherColumnLabel}</div>
            </div>
            {comparisonRows.map((row, idx) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 items-start gap-3 px-4 py-4 text-sm sm:px-6 ${
                  idx !== comparisonRows.length - 1 ? "border-b border-[#DADDD4]" : ""
                }`}
              >
                <div className="font-semibold text-[#090D16]">{row.feature}</div>
                <div className="flex items-start gap-1.5 font-medium text-[#2e1065]">
                  <Check className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{row.kredibly}</span>
                </div>
                <div className="text-[#5A6577]">{row.other}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 3-Step Setup */}
        <section className="border-y border-[#DADDD4] bg-white py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold tracking-tight text-[#090D16] sm:text-3xl">
              {stepsTitle}
            </h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-[#DADDD4] bg-[#FAF9F5] p-6"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#2e1065] text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <h3 className="mt-4 text-lg font-bold text-[#090D16]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#5A6577]">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-[#090D16] sm:text-3xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-[#DADDD4] bg-white p-6"
              >
                <h3 className="text-base font-bold text-[#090D16]">
                  {faq.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#5A6577]">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
          <div className="rounded-3xl bg-[#2e1065] px-6 py-12 text-center text-white sm:px-12">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Ready to launch your official Kredibly store?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-purple-100 sm:text-base">
              Start free on the Starter plan (₦0/month), add your first products in
              minutes, and share your link on WhatsApp, Instagram, and TikTok.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#2e1065] transition-colors hover:bg-purple-50"
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center rounded-full border border-purple-300/40 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Explore Kredibly Home
              </Link>
            </div>
          </div>
        </section>

        {/* Related Guides */}
        <section className="border-t border-[#DADDD4] bg-white py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-lg font-bold text-[#090D16]">
              Explore more Kredibly guides
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedGuides.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="group rounded-xl border border-[#DADDD4] bg-[#FAF9F5] p-4 transition-colors hover:border-[#2e1065]"
                >
                  <div className="flex items-center justify-between text-sm font-bold text-[#090D16] group-hover:text-[#2e1065]">
                    {guide.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#5A6577]">
                    {guide.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#DADDD4] bg-[#FAF9F5] py-8 text-xs text-[#5A6577]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Kredibly by Akinbyte Technologies Limited. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <Link href="/terms" className="hover:text-[#090D16]">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-[#090D16]">
              Privacy
            </Link>
            <Link href="/refund-policy" className="hover:text-[#090D16]">
              Refund Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
