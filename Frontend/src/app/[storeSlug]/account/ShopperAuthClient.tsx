"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { useShopperStore } from "@/store/useShopperStore";
import { StoreData } from "@/types/storefront";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from "lucide-react";

export function ShopperAuthClient({
  store,
  mode,
}: {
  store: StoreData;
  mode: "login" | "register";
}) {
  const router = useRouter();
  const { setShopperAuth } = useShopperStore();

  const [view, setView] = useState<
    "login" | "register" | "verify" | "forgot" | "reset"
  >(mode);

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await api.post(`/shopper/${store.slug}/login`, {
        email,
        password,
      });
      const { token, customer } = res.data.data;
      setShopperAuth(store.slug, token, customer);
      toast.success(`Welcome back to ${store.name}!`);
      router.push(`/${store.slug}/account`);
    } catch (err: any) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || "Invalid email or password.";
      if (status === 403) {
        setView("verify");
        setCooldown(60);
      }
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await api.post(`/shopper/${store.slug}/register`, {
        fullName,
        phoneNumber,
        email,
        password,
      });
      setView("verify");
      setCooldown(60);
      toast.success("Verification code sent to your email!");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.message ||
        "Registration failed.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await api.post(`/shopper/${store.slug}/verify-email`, {
        email,
        code,
      });
      const { token, customer } = res.data.data;
      setShopperAuth(store.slug, token, customer);
      toast.success(`Welcome to ${store.name}!`);
      router.push(`/${store.slug}/account`);
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Invalid or expired verification code.";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMsg("");
    try {
      await api.post(`/shopper/${store.slug}/resend-verification`, { email });
      setCooldown(60);
      toast.success("Verification code resent!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend code.");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await api.post(`/shopper/${store.slug}/forgot-password`, { email });
      setView("reset");
      toast.success("If that email exists, a 6-digit reset code was sent.");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Could not send reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      await api.post(`/shopper/${store.slug}/reset-password`, {
        email,
        code,
        newPassword,
      });
      toast.success("Password reset! You can now sign in.");
      setCode("");
      setNewPassword("");
      setView("login");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Invalid or expired reset code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#0f172a] font-sans flex flex-col justify-center px-4 py-10">
      <div className="w-full max-w-[420px] mx-auto bg-white border border-[#e2e8f0] rounded-2xl p-6 sm:p-8 shadow-sm">
        {/* Store Branding Header */}
        <div className="mb-6">
          <Link
            href={`/${store.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] mb-5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {store.name}</span>
          </Link>

          <div className="flex items-center gap-3 mb-4">
            {store.logoUrl ? (
              <img
                src={getImageUrl(store.logoUrl)}
                alt={store.name}
                className="h-11 w-11 rounded-xl object-cover border border-[#e2e8f0]"
              />
            ) : (
              <div className="h-11 w-11 rounded-xl bg-[#2e1065] text-white flex items-center justify-center font-display font-extrabold text-base">
                {store.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-display text-sm font-extrabold uppercase tracking-tight text-[#0f172a]">
                {store.name}
              </p>
              <p className="text-[11px] text-[#64748b]">Customer Account</p>
            </div>
          </div>

          <h1 className="font-display text-2xl font-bold text-[#0f172a] tracking-tight">
            {view === "login" && "Welcome back"}
            {view === "register" && "Create an account"}
            {view === "verify" && "Verify your email"}
            {view === "forgot" && "Forgot password?"}
            {view === "reset" && "Reset your password"}
          </h1>
          <p className="text-xs text-[#64748b] mt-1">
            {view === "login" &&
              `Sign in to view your ${store.name} orders and saved address`}
            {view === "register" &&
              `Save your address for faster checkout on ${store.name}`}
            {view === "verify" && `Enter the 6-digit code sent to ${email}`}
            {view === "forgot" && "Enter your email to receive a 6-digit reset code"}
            {view === "reset" && `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-[6px] bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* LOGIN */}
        {view === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#1e293b] mb-1.5">
                Email address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-[45px] rounded-[6px] px-3.5 bg-[#f4f5f7] focus:bg-white text-sm border border-[#e2e8f0] focus:border-[#2e1065] outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-[#1e293b]">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg("");
                    setView("forgot");
                  }}
                  className="text-xs font-semibold text-[#2e1065] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[45px] rounded-[6px] px-3.5 pr-10 bg-[#f4f5f7] focus:bg-white text-sm border border-[#e2e8f0] focus:border-[#2e1065] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] rounded-[8px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </button>

            <p className="text-center text-xs text-[#64748b] pt-2">
              New to {store.name}?{" "}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setView("register");
                }}
                className="font-semibold text-[#2e1065] hover:underline cursor-pointer"
              >
                Create an account
              </button>
            </p>
          </form>
        )}

        {/* REGISTER */}
        {view === "register" && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-[#1e293b] mb-1.5">
                Full name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Chidi Okafor"
                className="w-full h-[45px] rounded-[6px] px-3.5 bg-[#f4f5f7] focus:bg-white text-sm border border-[#e2e8f0] focus:border-[#2e1065] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1e293b] mb-1.5">
                Phone number *
              </label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="08031234567"
                className="w-full h-[45px] rounded-[6px] px-3.5 bg-[#f4f5f7] focus:bg-white text-sm border border-[#e2e8f0] focus:border-[#2e1065] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1e293b] mb-1.5">
                Email address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-[45px] rounded-[6px] px-3.5 bg-[#f4f5f7] focus:bg-white text-sm border border-[#e2e8f0] focus:border-[#2e1065] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#1e293b] mb-1.5">
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full h-[45px] rounded-[6px] px-3.5 pr-10 bg-[#f4f5f7] focus:bg-white text-sm border border-[#e2e8f0] focus:border-[#2e1065] outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] rounded-[8px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create Account"
              )}
            </button>

            <p className="text-center text-xs text-[#64748b] pt-2">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setErrorMsg("");
                  setView("login");
                }}
                className="font-semibold text-[#2e1065] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          </form>
        )}

        {/* VERIFY EMAIL */}
        {view === "verify" && (
          <form onSubmit={handleVerify} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              autoFocus
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="000000"
              className="w-full h-12 px-4 rounded-[8px] bg-[#f8fafc] focus:bg-white border border-[#e2e8f0] focus:border-[#2e1065] text-center font-mono text-xl font-bold tracking-[0.35em] outline-none"
            />

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full h-[46px] rounded-[8px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Verify Email"
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-[#64748b]">
              <button
                type="button"
                onClick={handleResend}
                disabled={cooldown > 0}
                className="font-semibold text-[#2e1065] hover:underline disabled:opacity-50 cursor-pointer"
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
              <button
                type="button"
                onClick={() => setView("login")}
                className="hover:text-[#0f172a] cursor-pointer"
              >
                Back to login
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD */}
        {view === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full h-[45px] rounded-[6px] px-3.5 bg-[#f4f5f7] focus:bg-white text-sm border border-[#e2e8f0] focus:border-[#2e1065] outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-[46px] rounded-[8px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Send Reset Code"
              )}
            </button>
            <button
              type="button"
              onClick={() => setView("login")}
              className="w-full text-center text-xs text-[#64748b] hover:text-[#0f172a] cursor-pointer"
            >
              Back to login
            </button>
          </form>
        )}

        {/* RESET PASSWORD */}
        {view === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="6-digit code"
              className="w-full h-11 px-4 rounded-[8px] bg-[#f8fafc] border border-[#e2e8f0] focus:border-[#2e1065] text-center font-mono text-base font-bold tracking-[0.25em] outline-none"
            />
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="w-full h-[45px] rounded-[6px] px-3.5 bg-[#f4f5f7] focus:bg-white text-sm border border-[#e2e8f0] focus:border-[#2e1065] outline-none"
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full h-[46px] rounded-[8px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-50 text-white font-display font-bold text-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Update Password"
              )}
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-[#f1f5f9] text-center">
          <Link
            href={`/${store.slug}`}
            className="text-xs font-medium text-[#64748b] hover:text-[#0f172a]"
          >
            Continue shopping as guest →
          </Link>
        </div>
      </div>
    </div>
  );
}
