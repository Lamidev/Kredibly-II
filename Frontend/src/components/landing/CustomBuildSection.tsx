"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

export function CustomBuildSection() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [projectType, setProjectType] = useState("Custom E-commerce Website");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("2–4 weeks");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    setSubmitted(false);

    try {
      await api.post("/public/custom-inquiry", {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        projectType,
        budget: budget.trim() || undefined,
        timeline,
        details: details.trim() || undefined,
      });

      setSubmitted(true);
      setName("");
      setPhone("");
      setEmail("");
      setBudget("");
      setDetails("");
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          "Could not send your request right now. Please try again in a moment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="custom-builds"
      className="py-16 sm:py-24 bg-gradient-to-b from-[#F7F4FC] to-[#EFE8FA] border-t border-[#DADDD4]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
        {/* Left Copy */}
        <div className="lg:col-span-5 space-y-5 lg:pt-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3b0764]">
            Custom Builds &amp; Bespoke Commerce
          </p>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-[#090D16] tracking-tight leading-[1.06]">
            Need a <span className="text-[#3b0764]">custom</span> website?
          </h2>
          <p className="text-sm sm:text-base text-[#525B6C] leading-relaxed max-w-md">
            Need a bespoke e-commerce storefront, custom checkout integration, or
            a dedicated brand website built from scratch? Tell us what you&apos;re
            building and our engineering team will reach out within 24 hours.
          </p>
        </div>

        {/* Right Form Card */}
        <div className="lg:col-span-7 bg-white border border-[#DADDD4] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h3 className="font-display text-lg sm:text-xl font-bold text-[#090D16]">
              Tell us what you need.
            </h3>
            <span className="text-[11px] font-medium text-[#525B6C]">
              * Required
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#090D16] mb-1.5">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full h-10 px-3 rounded-lg bg-[#fafaf8] border border-[#DADDD4] text-xs text-[#090D16] placeholder:text-slate-400 focus:outline-none focus:border-[#2e1065]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#090D16] mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0803 123 4567"
                  className="w-full h-10 px-3 rounded-lg bg-[#fafaf8] border border-[#DADDD4] text-xs text-[#090D16] placeholder:text-slate-400 focus:outline-none focus:border-[#2e1065]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#090D16] mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full h-10 px-3 rounded-lg bg-[#fafaf8] border border-[#DADDD4] text-xs text-[#090D16] placeholder:text-slate-400 focus:outline-none focus:border-[#2e1065]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#090D16] mb-1.5">
                What are you looking to build? *
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[#fafaf8] border border-[#DADDD4] text-xs text-[#090D16] focus:outline-none focus:border-[#2e1065]"
              >
                <option value="Custom E-commerce Website">
                  Custom E-commerce Website
                </option>
                <option value="Brand / Company Website">
                  Brand / Company Website
                </option>
                <option value="Multi-Vendor Marketplace">
                  Multi-Vendor Marketplace
                </option>
                <option value="Custom Web Application">
                  Custom Web Application
                </option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#090D16] mb-1.5">
                  Budget
                </label>
                <input
                  type="text"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g. ₦350k – ₦1.5M (optional)"
                  className="w-full h-10 px-3 rounded-lg bg-[#fafaf8] border border-[#DADDD4] text-xs text-[#090D16] placeholder:text-slate-400 focus:outline-none focus:border-[#2e1065]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#090D16] mb-1.5">
                  Target Timeline
                </label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-[#fafaf8] border border-[#DADDD4] text-xs text-[#090D16] focus:outline-none focus:border-[#2e1065]"
                >
                  <option value="ASAP (1–2 weeks)">ASAP (1–2 weeks)</option>
                  <option value="2–4 weeks">2–4 weeks</option>
                  <option value="1–2 months">1–2 months</option>
                  <option value="Flexible">Flexible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#090D16] mb-1.5">
                Additional details
              </label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Share key features, reference sites, payment/delivery needs, or anything else we should know..."
                className="w-full p-3 rounded-lg bg-[#fafaf8] border border-[#DADDD4] text-xs text-[#090D16] placeholder:text-slate-400 focus:outline-none focus:border-[#2e1065] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-60 text-white font-display font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Request...</span>
                </>
              ) : (
                <>
                  <span>Send My Request</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {errorMsg && (
              <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMsg}
              </p>
            )}

            {submitted && (
              <p className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Request sent! We&apos;ve emailed a confirmation to your inbox
                  and someone from our team will get back to you shortly.
                </span>
              </p>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
