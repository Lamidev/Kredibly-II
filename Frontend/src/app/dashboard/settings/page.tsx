"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { compressProductImage } from "@/lib/compressor";
import {
  ArrowLeft,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Store,
} from "lucide-react";

export default function StoreSettingsPage() {
  const router = useRouter();
  const { updateStore } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    whatsappNumber: "",
    logoUrl: "",
    themeColor: "#2e1065",
    passFeeToCustomer: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/store/settings");
        const s = res.data.data;
        setForm({
          name: s.name || "",
          slug: s.slug || "",
          description: s.description || "",
          whatsappNumber: s.whatsappNumber || "",
          logoUrl: s.logoUrl || "",
          themeColor: s.themeColor || "#2e1065",
          passFeeToCustomer: Boolean(s.passFeeToCustomer),
        });
      } catch (err: any) {
        if (err.response?.status === 401) {
          router.push("/login");
        } else {
          setErrorMsg("Failed to load store settings.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    setErrorMsg("");
    try {
      const { file: compressed } = await compressProductImage(file);
      const fd = new FormData();
      fd.append("images", compressed);
      const res = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.urls?.[0];
      if (url) {
        setForm((prev) => ({ ...prev, logoUrl: url }));
      }
    } catch {
      setErrorMsg("Failed to upload store logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await api.put("/store/settings", {
        name: form.name,
        description: form.description,
        whatsappNumber: form.whatsappNumber,
        logoUrl: form.logoUrl || null,
        themeColor: form.themeColor,
        passFeeToCustomer: form.passFeeToCustomer,
      });

      updateStore(res.data.data);
      setSuccessMsg("Store settings saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const getFullImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL.replace("/api", "")}${path}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-bold text-white">Store Settings</h1>
        </div>
        {form.slug && (
          <Link
            href={`/${form.slug}`}
            target="_blank"
            className="text-xs font-mono text-brand-400 hover:underline"
          >
            kredibly.shop/{form.slug}
          </Link>
        )}
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6"
          >
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Logo Upload */}
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                {form.logoUrl ? (
                  <img
                    src={getFullImageUrl(form.logoUrl)}
                    alt={form.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Store className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-white">Store Logo</p>
                <p className="text-[11px] text-slate-400">
                  Shown on your storefront header and WhatsApp/social link previews.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer transition">
                  {uploadingLogo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                  <span>{uploadingLogo ? "Uploading..." : "Upload Logo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Store Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  WhatsApp Order Number *
                </label>
                <input
                  type="text"
                  required
                  value={form.whatsappNumber}
                  onChange={(e) =>
                    setForm({ ...form, whatsappNumber: e.target.value })
                  }
                  placeholder="08012345678"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Store Bio / Description (Used for SEO &amp; WhatsApp Previews)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Tell buyers what you sell, delivery timelines, and pickup info..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-xs font-bold text-white">
                  Pass Payment Protection Fee to Buyer (Pro &amp; Business Only)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When enabled on Pro or Business plans, checkout adds a 1.5% Escrow &amp; Payment Protection fee (capped at ₦2,000) so you receive 100% of your product price. On the Starter plan, buyers always pay the exact product price.
                </p>
              </div>
              <input
                type="checkbox"
                checked={form.passFeeToCustomer}
                onChange={(e) =>
                  setForm({ ...form, passFeeToCustomer: e.target.checked })
                }
                className="w-4 h-4 accent-brand-500 cursor-pointer"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-md shadow-brand-500/20"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>Save Settings</span>
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
