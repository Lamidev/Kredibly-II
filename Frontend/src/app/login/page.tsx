"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { Eye, EyeOff, X, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [formData, setFormData] = useState({
    emailOrPhone: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", formData);
      const { token, user, stores } = res.data.data;
      const primaryStore = stores[0];
      setAuth(token, user, primaryStore);
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Invalid login credentials. Please try again.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-[100vw] overflow-x-hidden bg-white flex flex-col justify-between font-sans text-[#0f172a]">
      {/* Minimal Top Bar: Brand Logo Left, Circular Close Button Right */}
      <header className="w-full px-5 sm:px-12 pt-5 sm:pt-6 pb-2 flex items-center justify-between shrink-0">
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
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] text-[#1e293b] flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </Link>
      </header>

      {/* Vertically & Horizontally Centered Auth Form Container */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-6 sm:py-10 w-full max-w-full overflow-x-hidden">
        <div className="w-full max-w-[420px] mx-auto my-auto">
          {/* Heading */}
          <div className="mb-6 sm:mb-7">
            <h1 className="font-display text-[25px] sm:text-[28px] font-bold text-[#0f172a] tracking-[-0.7px] leading-tight">
              Sign in to your account
            </h1>
            <p className="text-[13px] text-[#64748b] mt-1">
              Enter your email or phone number to manage your store
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
            <div className="min-w-0">
              <label
                htmlFor="login-identifier"
                className="block text-[12px] font-medium text-[#1e293b] mb-1.5"
              >
                Email address or Phone number <span className="text-red-500">*</span>
              </label>
              <input
                id="login-identifier"
                type="text"
                required
                autoComplete="username"
                value={formData.emailOrPhone}
                onChange={(e) =>
                  setFormData({ ...formData, emailOrPhone: e.target.value })
                }
                placeholder="you@example.com or 08012345678"
                className="w-full min-w-0 max-w-full box-border h-[45px] sm:h-[46px] rounded-[6px] px-3 sm:px-4 bg-[#f4f5f7] focus:bg-white text-[13.5px] text-[#0f172a] placeholder:text-[13px] placeholder:text-[#94a3b8] border border-[#e2e8f0] focus:border-[#3b0764] focus:ring-2 focus:ring-[#3b0764]/10 outline-none transition-all"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="login-password"
                className="block text-[12px] font-medium text-[#1e293b] mb-1.5"
              >
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative w-full">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
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

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[46px] rounded-[6px] bg-[#2e1065] hover:bg-[#3b0764] disabled:opacity-60 text-white font-semibold text-[13.5px] flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </div>
          </form>

          {/* Sign up prompt */}
          <p className="text-center text-[13px] text-[#64748b] mt-6">
            Don&apos;t have a store yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#0f172a] underline underline-offset-4 hover:text-[#3b0764] transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </main>

      {/* Bottom balancer */}
      <div className="h-6 sm:h-8 shrink-0" aria-hidden="true" />
    </div>
  );
}
