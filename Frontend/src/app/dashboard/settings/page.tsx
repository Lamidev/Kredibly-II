"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { compressProductImage } from "@/lib/compressor";
import { Save, Loader2, UploadCloud, Store } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function StoreSettingsPage() {
  const router = useRouter();
  const { updateStore } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    whatsappNumber: "",
    logoUrl: "",
    themeColor: "#2e1065",
    passFeeToCustomer: false,
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
          toast.error("Failed to load store settings.");
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
        toast.success("Logo uploaded! Click Save Settings to apply.");
      }
    } catch {
      toast.error("Failed to upload store logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

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
      toast.success("Store settings saved successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings.");
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
          Store Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Update your store name, logo, WhatsApp number, and checkout preferences.
        </p>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Brand Profile</CardTitle>
            <CardDescription>
              This information appears on your storefront and WhatsApp link previews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Upload */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {form.logoUrl ? (
                    <img
                      src={getFullImageUrl(form.logoUrl)}
                      alt={form.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-bold text-[#0f172a]">Store Logo</p>
                  <p className="text-[11px] text-slate-500">
                    Shown on your storefront header and social share cards.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-[#0f172a] cursor-pointer transition">
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
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
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
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 gap-4">
                <div>
                  <p className="text-xs font-bold text-[#0f172a]">
                    Pass Payment Protection Fee to Buyer (Pro &amp; Business Only)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    When enabled on Pro or Business plans, checkout adds a 1.5% Escrow &amp; Payment Protection fee (capped at ₦2,000) so you receive 100% of your product price. On the Starter plan, buyers always pay the exact product price.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={form.passFeeToCustomer}
                  onChange={(e) =>
                    setForm({ ...form, passFeeToCustomer: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#2e1065] cursor-pointer shrink-0"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Settings</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
