import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";

interface EditorialCtaBannerProps {
  eyebrow?: string;
  heading?: string;
  description?: string;
  ctaLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

/**
 * Shared architectural CTA card matching Kredibly's homepage pre-footer banner.
 */
export function EditorialCtaBanner({
  eyebrow = "START SELLING TODAY",
  heading = "Ready to launch your official store?",
  description = "Start free on Kredibly (₦0/month), upload your first 3 products, and get found on WhatsApp, Instagram, and Google.",
  ctaLabel = "Create Your Free Store",
  secondaryHref,
  secondaryLabel,
}: EditorialCtaBannerProps) {
  return (
    <div className="bg-white border border-[#DADDD4] rounded-2xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-[0_16px_40px_-12px_rgba(9,13,22,0.08)]">
      {/* Geometric Diagonal Lattice & Precision Dot Matrix */}
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

      <div className="relative z-10 flex flex-col items-center space-y-5">
        <div className="h-12 w-12 rounded-xl bg-[#FAF9F5] border border-[#DADDD4] text-[#2e1065] flex items-center justify-center shadow-xs">
          <Store className="w-6 h-6" />
        </div>

        <div className="inline-flex items-center justify-center gap-2.5">
          <span className="w-5 h-[2px] bg-[#3b0764]" />
          <span className="text-[11px] font-mono tracking-[0.2em] uppercase font-bold text-[#3b0764]">
            {eyebrow}
          </span>
          <span className="w-5 h-[2px] bg-[#3b0764]" />
        </div>

        <h2 className="font-display text-2xl sm:text-4xl font-bold text-[#090D16] max-w-2xl leading-tight">
          {heading}
        </h2>

        <p className="text-sm sm:text-base text-[#525B6C] max-w-xl leading-relaxed">
          {description}
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
          <Link
            href="https://usekredibly.com/register"
            className="w-full sm:w-auto px-8 py-4 bg-[#2e1065] hover:bg-[#3b0764] text-white font-display font-bold rounded-[8px] transition flex items-center justify-center gap-2 text-sm shadow-md hover:-translate-y-0.5 cursor-pointer"
          >
            <span>{ctaLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="w-full sm:w-auto px-6 py-4 rounded-[8px] border border-[#DADDD4] bg-white hover:border-[#2e1065]/40 text-xs font-semibold text-[#090D16] transition flex items-center justify-center"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
