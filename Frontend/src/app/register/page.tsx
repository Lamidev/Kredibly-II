"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import {
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [formData, setFormData] = useState({
    phoneNumber: "",
    email: "",
    password: "",
    storeName: "",
    slug: "",
    description: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  const [slugStatus, setSlugStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Email verification step state
  const [verifyStep, setVerifyStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Pre-populate storeName and slug if passed from landing page claim bar
  useEffect(() => {
    const prefillStoreName = searchParams.get("storeName");
    const prefillSlug = searchParams.get("slug");
    if (prefillStoreName || prefillSlug) {
      const slugVal = (prefillSlug || prefillStoreName || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, "");

      setFormData((prev) => ({
        ...prev,
        storeName: prefillStoreName || prefillSlug || "",
        slug: slugVal,
      }));
    }
  }, [searchParams]);

  // Auto-generate slug from storeName
  const handleStoreNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]/g, "");

    setFormData((prev) => ({
      ...prev,
      storeName: name,
      slug: generatedSlug,
    }));
  };

  // Debounced slug check
  useEffect(() => {
    if (!formData.slug || formData.slug.length < 3) {
      setSlugStatus({ checking: false });
      return;
    }

    const timer = setTimeout(async () => {
      setSlugStatus({ checking: true });
      try {
        const res = await api.get(`/auth/check-slug?slug=${formData.slug}`);
        setSlugStatus({
          checking: false,
          available: res.data.data.available,
          message: res.data.data.message,
        });
      } catch {
        setSlugStatus({ checking: false, available: true });
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const fullName = `${firstName} ${lastName}`.trim() || firstName.trim();

    try {
      const res = await api.post("/auth/register", {
        ...formData,
        fullName,
      });
      const data = res.data.data;

      if (data?.requiresEmailVerification) {
        setPendingEmail(data.email || formData.email.trim());
        setVerifyStep(true);
        setResendCooldown(60);
        toast.success("Verification code sent! Check your email.");
        return;
      }

      const { token, user, store } = data;
      setAuth(token, user, store);
      toast.success("Your store is live! Welcome to Kredibly.");
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Registration failed. Please check your details.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setVerifying(true);

    try {
      const res = await api.post("/auth/verify-email", {
        email: pendingEmail,
        code: verificationCode.trim(),
      });
      const { token, user, store } = res.data.data;
      setAuth(token, user, store);
      toast.success("Email verified! Welcome to Kredibly.");
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Invalid or expired verification code.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setErrorMessage("");

    try {
      await api.post("/auth/resend-verification", { email: pendingEmail });
      setResendCooldown(60);
      toast.success("A new 6-digit code has been sent to your email.");
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Failed to resend verification code.";
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setResending(false);
    }
  };

  if (verifyStep) {
    return (
      <div className="w-full max-w-full font-sans">
        <div className="mb-6">
          <h1 className="font-display text-[25px] sm:text-[28px] font-bold text-[#0f172a] tracking-[-0.7px] leading-tight">
            Verify your email
          </h1>
          <p className="text-[13px] text-[#64748b] mt-1">
            We sent a 6-digit confirmation code to{" "}
            <span className="font-semibold text-[#0f172a]">{pendingEmail}</span>.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-600 text-[12.5px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerifyCode} className="space-y-4">
          <div>
            <label
              htmlFor="verify-code-input"
              className="block text-[12px] font-medium text-[#1e293b] mb-1.5"
            >
              6-Digit Verification Code <span className="text-red-500">*</span>
            </label>
            <input
              id="verify-code-input"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              value={verificationCode}
              onChange={(e) =>
                setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="w-full h-12 px-4 rounded-[8px] bg-[#f8fafc] focus:bg-white border border-[#e2e8f0] focus:border-[#2e1065] text-center font-mono text-xl font-bold tracking-[0.35em] text-[#0f172a] outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={verifying || verificationCode.length !== 6}
            className="w-full h-[46px] rounded-[8px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify &amp; Launch Store</span>
            )}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-[#64748b]">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || resending}
            className="font-semibold text-[#2e1065] hover:underline disabled:opacity-50 cursor-pointer"
          >
            {resending
              ? "Sending..."
              : resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
          </button>

          <button
            type="button"
            onClick={() => {
              setVerifyStep(false);
              setVerificationCode("");
              setErrorMessage("");
            }}
            className="hover:text-[#0f172a] cursor-pointer"
          >
            Back to signup
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full font-sans">
      {/* Heading */}
      <div className="mb-6 sm:mb-7">
        <h1 className="font-display text-[25px] sm:text-[28px] font-bold text-[#0f172a] tracking-[-0.7px] leading-tight">
          Create an account
        </h1>
        <p className="text-[13px] text-[#64748b] mt-1">
          Enter your details to create an account and launch your store
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-600 text-[12.5px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4 w-full">
        {/* First Name & Last Name */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full">
          <div className="min-w-0">
            <label
              htmlFor="register-first-name"
              className="block text-[12px] font-medium text-[#1e293b] mb-1.5 truncate"
            >
              First name <span className="text-red-500">*</span>
            </label>
            <input
              id="register-first-name"
              type="text"
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="w-full min-w-0 max-w-full box-border h-[45px] sm:h-[46px] rounded-[6px] px-3 sm:px-4 bg-[#f4f5f7] focus:bg-white text-[13.5px] text-[#0f172a] placeholder:text-[13px] placeholder:text-[#94a3b8] border border-[#e2e8f0] focus:border-[#3b0764] focus:ring-2 focus:ring-[#3b0764]/10 outline-none transition-all"
            />
          </div>

          <div className="min-w-0">
            <label
              htmlFor="register-last-name"
              className="block text-[12px] font-medium text-[#1e293b] mb-1.5 truncate"
            >
              Last name
            </label>
            <input
              id="register-last-name"
              type="text"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full min-w-0 max-w-full box-border h-[45px] sm:h-[46px] rounded-[6px] px-3 sm:px-4 bg-[#f4f5f7] focus:bg-white text-[13.5px] text-[#0f172a] placeholder:text-[13px] placeholder:text-[#94a3b8] border border-[#e2e8f0] focus:border-[#3b0764] focus:ring-2 focus:ring-[#3b0764]/10 outline-none transition-all"
            />
          </div>
        </div>

        {/* Store Name & Address */}
        <div className="min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="register-store-name"
              className="block text-[12px] font-medium text-[#1e293b] truncate"
            >
              Store / Brand name <span className="text-red-500">*</span>
            </label>
            {formData.slug && (
              <span
                className={`text-[11px] font-mono font-semibold flex items-center gap-1 ${
                  slugStatus.available === false
                    ? "text-rose-600"
                    : "text-[#3b0764]"
                }`}
              >
                {formData.slug}.kredibly.shop
                {slugStatus.checking ? (
                  <Loader2 className="w-3 h-3 animate-spin text-[#3b0764]" />
                ) : slugStatus.available === true ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                ) : slugStatus.available === false ? (
                  <span className="text-[10px] text-rose-600 font-bold ml-1">
                    • Taken
                  </span>
                ) : null}
              </span>
            )}
          </div>
          <input
            id="register-store-name"
            type="text"
            required
            value={formData.storeName}
            onChange={handleStoreNameChange}
            placeholder="e.g. Urban Threads or Swot Gadgets"
            className={`w-full min-w-0 max-w-full box-border h-[45px] sm:h-[46px] rounded-[6px] px-3 sm:px-4 bg-[#f4f5f7] focus:bg-white text-[13.5px] text-[#0f172a] placeholder:text-[13px] placeholder:text-[#94a3b8] border outline-none transition-all ${
              slugStatus.available === false
                ? "border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                : "border-[#e2e8f0] focus:border-[#3b0764] focus:ring-2 focus:ring-[#3b0764]/10"
            }`}
          />
          {formData.slug && slugStatus.available === false && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-rose-600 font-medium">Handle taken. Try:</span>
              {[
                `${formData.slug}ng`,
                `the${formData.slug}`,
                `${formData.slug}official`,
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, slug: sug }));
                  }}
                  className="font-mono px-2 py-0.5 rounded bg-purple-50 text-[#3b0764] border border-purple-200 hover:bg-purple-100 text-[10.5px] cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* What do you sell? (Optional -> powers Hero & Share Previews) */}
        <div className="min-w-0">
          <label
            htmlFor="register-store-description"
            className="block text-[12px] font-medium text-[#1e293b] mb-1.5"
          >
            What do you sell? <span className="text-[#94a3b8] font-normal">(Optional)</span>
          </label>
          <input
            id="register-store-description"
            type="text"
            maxLength={300}
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="e.g. Women's dresses, sneakers, skincare, or homemade cakes"
            className="w-full min-w-0 max-w-full box-border h-[45px] sm:h-[46px] rounded-[6px] px-3 sm:px-4 bg-[#f4f5f7] focus:bg-white text-[13.5px] text-[#0f172a] placeholder:text-[13px] placeholder:text-[#94a3b8] border border-[#e2e8f0] focus:border-[#3b0764] focus:ring-2 focus:ring-[#3b0764]/10 outline-none transition-all"
          />
        </div>

        {/* Email Address */}
        <div className="min-w-0">
          <label
            htmlFor="register-email"
            className="block text-[12px] font-medium text-[#1e293b] mb-1.5"
          >
            Email address <span className="text-red-500">*</span>
          </label>
          <input
            id="register-email"
            type="email"
            required
            autoComplete="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="you@example.com"
            className="w-full min-w-0 max-w-full box-border h-[45px] sm:h-[46px] rounded-[6px] px-3 sm:px-4 bg-[#f4f5f7] focus:bg-white text-[13.5px] text-[#0f172a] placeholder:text-[13px] placeholder:text-[#94a3b8] border border-[#e2e8f0] focus:border-[#3b0764] focus:ring-2 focus:ring-[#3b0764]/10 outline-none transition-all"
          />
        </div>

        {/* Phone Number */}
        <div className="min-w-0">
          <label
            htmlFor="register-phone"
            className="block text-[12px] font-medium text-[#1e293b] mb-1.5"
          >
            Phone Number (Preferably WhatsApp) <span className="text-red-500">*</span>
          </label>
          <input
            id="register-phone"
            type="tel"
            required
            autoComplete="tel"
            value={formData.phoneNumber}
            onChange={(e) =>
              setFormData({ ...formData, phoneNumber: e.target.value })
            }
            placeholder="+234 812 345 6789"
            className="w-full min-w-0 max-w-full box-border h-[45px] sm:h-[46px] rounded-[6px] px-3 sm:px-4 bg-[#f4f5f7] focus:bg-white text-[13.5px] text-[#0f172a] placeholder:text-[13px] placeholder:text-[#94a3b8] border border-[#e2e8f0] focus:border-[#3b0764] focus:ring-2 focus:ring-[#3b0764]/10 outline-none transition-all"
          />
        </div>

        {/* Password */}
        <div className="min-w-0">
          <label
            htmlFor="register-password"
            className="block text-[12px] font-medium text-[#1e293b] mb-1.5"
          >
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative w-full">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              required
              minLength={6}
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="••••••••••••"
              className="w-full min-w-0 max-w-full box-border h-[45px] sm:h-[46px] rounded-[6px] pl-3 sm:pl-4 pr-10 bg-[#f4f5f7] focus:bg-white text-[13.5px] text-[#0f172a] placeholder:text-[13px] placeholder:text-[#94a3b8] border border-[#e2e8f0] focus:border-[#3b0764] focus:ring-2 focus:ring-[#3b0764]/10 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || slugStatus.available === false}
            className="w-full h-[46px] rounded-[6px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-60 text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </div>
      </form>

      {/* Sign in prompt */}
      <p className="text-center text-[13px] text-[#64748b] mt-6">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-[#0f172a] underline underline-offset-4 hover:text-[#3b0764] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-[#FAF9F5] flex flex-col justify-between font-sans text-[#0f172a] relative">
      {/* Bespoke Geometric Diagonal Lattice & Precision Dot Matrix (Same Pattern as Hero) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(rgba(46, 16, 101, 0.14) 1px, transparent 1px), linear-gradient(135deg, rgba(46, 16, 101, 0.03) 25%, transparent 25%, transparent 50%, rgba(46, 16, 101, 0.03) 50%, rgba(46, 16, 101, 0.03) 75%, transparent 75%, transparent)",
          backgroundSize: "24px 24px, 64px 64px",
          maskImage:
            "radial-gradient(ellipse 85% 75% at 50% 45%, black 40%, transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 75% at 50% 45%, black 40%, transparent 100%)",
        }}
      />

      {/* Soft Horizontal Royal Purple Prism Beam */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85%] max-w-2xl h-44 bg-gradient-to-r from-transparent via-[#3b0764]/10 to-transparent blur-3xl pointer-events-none" />

      {/* Architectural Corner Registration Marks */}
      <div className="hidden sm:block absolute top-6 left-6 w-4 h-4 border-t-2 border-l-2 border-[#3b0764]/30 pointer-events-none" />
      <div className="hidden sm:block absolute top-6 right-6 w-4 h-4 border-t-2 border-r-2 border-[#3b0764]/30 pointer-events-none" />
      <div className="hidden sm:block absolute bottom-6 left-6 w-4 h-4 border-b-2 border-l-2 border-[#3b0764]/30 pointer-events-none" />
      <div className="hidden sm:block absolute bottom-6 right-6 w-4 h-4 border-b-2 border-r-2 border-[#3b0764]/30 pointer-events-none" />

      {/* Minimal Top Bar: Brand Logo Left, Circular Close Button Right */}
      <header className="w-full px-5 sm:px-12 pt-5 sm:pt-6 pb-2 flex items-center justify-between shrink-0 relative z-20">
        <Link href="/" className="flex items-center gap-2.5 group min-w-0">
          <img
            src="/krediblyrevamped.png"
            alt="Kredibly"
            className="h-7 sm:h-8 w-auto object-contain"
          />
        </Link>

        <Link
          href="/"
          aria-label="Close and return home"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 hover:bg-white border border-[#DADDD4] text-[#1e293b] flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-2xs"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </Link>
      </header>

      {/* Vertically & Horizontally Centered Auth Form Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-5 py-6 sm:py-10 w-full max-w-full overflow-x-hidden relative z-10">
        <div className="w-full max-w-[420px] mx-auto my-auto bg-white/95 backdrop-blur-md border border-[#DADDD4] p-6 sm:p-8 rounded-2xl shadow-[0_16px_40px_-12px_rgba(9,13,22,0.08)]">
          <Suspense fallback={<div className="h-96" />}>
            <RegisterFormContent />
          </Suspense>
        </div>
      </main>

      {/* Bottom balancer */}
      <div className="h-6 sm:h-8 shrink-0" aria-hidden="true" />
    </div>
  );
}
