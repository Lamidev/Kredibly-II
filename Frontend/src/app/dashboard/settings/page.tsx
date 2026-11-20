"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { getImageUrl } from "@/lib/utils";
import { compressProductImage } from "@/lib/compressor";
import {
  Save,
  Loader2,
  UploadCloud,
  Store,
  RotateCcw,
  Image as ImageIcon,
  X,
  Globe,
  CheckCircle2,
  Circle,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SocialLinksState {
  instagram: string;
  tiktok: string;
  facebook: string;
  twitter: string;
}

interface SettingsFormState {
  name: string;
  slug: string;
  description: string;
  aboutText: string;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  socialLinks: SocialLinksState;
  logoUrl: string;
  bannerUrl: string;
  themeColor: string;
  passFeeToCustomer: boolean;
  allowSearchIndexing: boolean;
}

const EMPTY_SOCIAL: SocialLinksState = {
  instagram: "",
  tiktok: "",
  facebook: "",
  twitter: "",
};

const EMPTY_FORM: SettingsFormState = {
  name: "",
  slug: "",
  description: "",
  aboutText: "",
  whatsappNumber: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  socialLinks: EMPTY_SOCIAL,
  logoUrl: "",
  bannerUrl: "",
  themeColor: "#2e1065",
  passFeeToCustomer: false,
  allowSearchIndexing: true,
};

export default function StoreSettingsPage() {
  const router = useRouter();
  const { updateStore } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string>("STARTER");
  const [activeProductsCount, setActiveProductsCount] = useState<number>(0);

  const [initialForm, setInitialForm] = useState<SettingsFormState>(EMPTY_FORM);
  const [form, setForm] = useState<SettingsFormState>(EMPTY_FORM);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/store/settings");
        const s = res.data.data;
        const sl = (s.socialLinks || {}) as Partial<SocialLinksState>;
        const loaded: SettingsFormState = {
          name: s.name || "",
          slug: s.slug || "",
          description: s.description || "",
          aboutText: s.aboutText || "",
          whatsappNumber: s.whatsappNumber || "",
          contactPhone: s.contactPhone || "",
          contactEmail: s.contactEmail || "",
          address: s.address || "",
          socialLinks: {
            instagram: sl.instagram || "",
            tiktok: sl.tiktok || "",
            facebook: sl.facebook || "",
            twitter: sl.twitter || "",
          },
          logoUrl: s.logoUrl || "",
          bannerUrl: s.bannerUrl || "",
          themeColor: s.themeColor || "#2e1065",
          passFeeToCustomer: Boolean(s.passFeeToCustomer),
          allowSearchIndexing: s.allowSearchIndexing !== false,
        };
        setSubscriptionTier(s.subscriptionTier || "STARTER");
        setActiveProductsCount(Number(s.activeProductsCount || 0));
        setInitialForm(loaded);
        setForm(loaded);
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

  const hasChanges =
    form.name.trim() !== initialForm.name.trim() ||
    form.description.trim() !== initialForm.description.trim() ||
    form.aboutText.trim() !== initialForm.aboutText.trim() ||
    form.whatsappNumber.trim() !== initialForm.whatsappNumber.trim() ||
    form.contactPhone.trim() !== initialForm.contactPhone.trim() ||
    form.contactEmail.trim() !== initialForm.contactEmail.trim() ||
    form.address.trim() !== initialForm.address.trim() ||
    form.socialLinks.instagram.trim() !== initialForm.socialLinks.instagram.trim() ||
    form.socialLinks.tiktok.trim() !== initialForm.socialLinks.tiktok.trim() ||
    form.socialLinks.facebook.trim() !== initialForm.socialLinks.facebook.trim() ||
    form.socialLinks.twitter.trim() !== initialForm.socialLinks.twitter.trim() ||
    form.logoUrl !== initialForm.logoUrl ||
    form.bannerUrl !== initialForm.bannerUrl ||
    form.themeColor !== initialForm.themeColor ||
    form.passFeeToCustomer !== initialForm.passFeeToCustomer ||
    form.allowSearchIndexing !== initialForm.allowSearchIndexing;

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    try {
      const { file: compressed } = await compressProductImage(file);
      const fd = new FormData();
      fd.append("images", compressed);
      const res = await api.post("/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data.urls?.[0];
      if (url) {
        setForm((prev) => ({ ...prev, bannerUrl: url }));
        toast.success("Cover banner uploaded! Click Save Changes to apply.");
      }
    } catch {
      toast.error("Failed to upload cover banner.");
    } finally {
      setUploadingBanner(false);
    }
  };

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
        toast.success("Logo uploaded! Click Save Changes to apply.");
      }
    } catch {
      toast.error("Failed to upload store logo.");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleDiscard = () => {
    setForm(initialForm);
    toast.info("Changes discarded.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasChanges) return;
    setSaving(true);

    try {
      const res = await api.put("/store/settings", {
        name: form.name,
        description: form.description,
        aboutText: form.aboutText,
        whatsappNumber: form.whatsappNumber,
        contactPhone: form.contactPhone || null,
        contactEmail: form.contactEmail || null,
        address: form.address || null,
        socialLinks: form.socialLinks,
        logoUrl: form.logoUrl || null,
        bannerUrl: form.bannerUrl || null,
        themeColor: form.themeColor,
        allowSearchIndexing: form.allowSearchIndexing,
        ...(subscriptionTier !== "STARTER"
          ? { passFeeToCustomer: form.passFeeToCustomer }
          : {}),
      });

      updateStore(res.data.data);
      const sl = (res.data.data.socialLinks || {}) as Partial<SocialLinksState>;
      const saved: SettingsFormState = {
        ...form,
        name: res.data.data.name || form.name,
        description: res.data.data.description || "",
        aboutText: res.data.data.aboutText || "",
        whatsappNumber: res.data.data.whatsappNumber || form.whatsappNumber,
        contactPhone: res.data.data.contactPhone || "",
        contactEmail: res.data.data.contactEmail || "",
        address: res.data.data.address || "",
        socialLinks: {
          instagram: sl.instagram || "",
          tiktok: sl.tiktok || "",
          facebook: sl.facebook || "",
          twitter: sl.twitter || "",
        },
        logoUrl: res.data.data.logoUrl || "",
        bannerUrl: res.data.data.bannerUrl || "",
        allowSearchIndexing: res.data.data.allowSearchIndexing !== false,
      };
      setInitialForm(saved);
      setForm(saved);
      toast.success("Store settings saved successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const isPaidPlan = subscriptionTier !== "STARTER";

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
          Store Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Update your store name, logo, WhatsApp number, and brand details.
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
              This information appears on your dashboard, storefront, and WhatsApp link previews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Logo Upload */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
                <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                  {form.logoUrl ? (
                    <img
                      src={getImageUrl(form.logoUrl)}
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
                    Shown on your merchant dashboard, storefront header, and social share cards.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
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
                    {form.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, logoUrl: "" })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
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

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                  About Your Store (Shown on your storefront About page)
                </label>
                <textarea
                  rows={4}
                  maxLength={3000}
                  value={form.aboutText}
                  onChange={(e) =>
                    setForm({ ...form, aboutText: e.target.value })
                  }
                  placeholder="Share your brand story, what makes your products special, store hours, or return/delivery promises..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  If left blank, your About page will automatically display your store bio and contact info.
                </p>
              </div>

              {/* Optional Cover Banner */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#0f172a]">
                      Storefront Cover Banner (Optional)
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Add a wide banner image for your storefront header, or leave blank for a clean minimal header.
                    </p>
                  </div>
                  {form.bannerUrl && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, bannerUrl: "" })}
                      className="text-xs font-semibold text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                {form.bannerUrl ? (
                  <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                    <img
                      src={getImageUrl(form.bannerUrl)}
                      alt="Store banner"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <label className="w-full py-5 rounded-xl border border-dashed border-slate-300 hover:border-[#2e1065] bg-slate-50/70 flex flex-col items-center justify-center gap-1 cursor-pointer transition text-center">
                    {uploadingBanner ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#2e1065]" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                    )}
                    <span className="text-xs font-semibold text-[#0f172a]">
                      {uploadingBanner ? "Uploading banner..." : "Upload Cover Banner"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Recommended: wide landscape photo (PNG, JPG, WebP)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Storefront Footer: Address, Numbers & Social Media */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div>
                  <p className="text-xs font-bold text-[#0f172a]">
                    Contact, Address &amp; Social Media (Storefront Footer)
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Only the details you fill in will appear in your storefront footer.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                    Store / Pickup Address
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="e.g. Suite 14, Lekki Phase 1, Lagos"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      Customer Support Phone
                    </label>
                    <input
                      type="text"
                      value={form.contactPhone}
                      onChange={(e) =>
                        setForm({ ...form, contactPhone: e.target.value })
                      }
                      placeholder="e.g. 0801 234 5678"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={form.contactEmail}
                      onChange={(e) =>
                        setForm({ ...form, contactEmail: e.target.value })
                      }
                      placeholder="e.g. hello@yourstore.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      Instagram Handle or Link
                    </label>
                    <input
                      type="text"
                      value={form.socialLinks.instagram}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: {
                            ...form.socialLinks,
                            instagram: e.target.value,
                          },
                        })
                      }
                      placeholder="@yourstore"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      TikTok Handle or Link
                    </label>
                    <input
                      type="text"
                      value={form.socialLinks.tiktok}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: {
                            ...form.socialLinks,
                            tiktok: e.target.value,
                          },
                        })
                      }
                      placeholder="@yourstore"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      Facebook Page
                    </label>
                    <input
                      type="text"
                      value={form.socialLinks.facebook}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: {
                            ...form.socialLinks,
                            facebook: e.target.value,
                          },
                        })
                      }
                      placeholder="https://facebook.com/yourstore"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      X (Twitter) Handle or Link
                    </label>
                    <input
                      type="text"
                      value={form.socialLinks.twitter}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          socialLinks: {
                            ...form.socialLinks,
                            twitter: e.target.value,
                          },
                        })
                      }
                      placeholder="@yourstore"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-sm text-[#0f172a] focus:outline-none focus:border-[#2e1065]"
                    />
                  </div>
                </div>
              </div>

              {/* Google & AI Search Visibility */}
              {(() => {
                const hasLogo = Boolean(form.logoUrl);
                const hasBio = Boolean(
                  form.description.trim() || form.aboutText.trim()
                );
                const hasAddress = Boolean(form.address.trim());
                const hasSocial = Boolean(
                  form.socialLinks.instagram.trim() ||
                    form.socialLinks.tiktok.trim() ||
                    form.socialLinks.facebook.trim() ||
                    form.socialLinks.twitter.trim()
                );
                const hasProducts = activeProductsCount >= 3;
                const meetsGoogleRequirements =
                  hasLogo && hasBio && hasAddress && hasSocial && hasProducts;
                const isLiveOnGoogle =
                  meetsGoogleRequirements && form.allowSearchIndexing;

                return (
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Globe className="w-4 h-4 text-[#2e1065] mt-0.5 shrink-0" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-xs font-bold text-[#0f172a]">
                              Show My Store on Google &amp; AI Search
                            </p>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isLiveOnGoogle
                                  ? "bg-emerald-100 text-emerald-800"
                                  : !form.allowSearchIndexing
                                  ? "bg-slate-200 text-slate-700"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {isLiveOnGoogle
                                ? "Ready for Google"
                                : !form.allowSearchIndexing
                                ? "Hidden by you"
                                : "Complete checklist"}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Let shoppers find your store on Google, ChatGPT, and AI search automatically when your store meets all 5 requirements below. Your phone number, address, and social links also auto-update in your storefront footer.
                          </p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={form.allowSearchIndexing}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            allowSearchIndexing: e.target.checked,
                          })
                        }
                        aria-label="Show my store on Google and AI search"
                        className="w-4 h-4 accent-[#2e1065] cursor-pointer shrink-0"
                      />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 pt-1">
                      {[
                        {
                          done: hasLogo,
                          label: "Upload store logo",
                        },
                        {
                          done: hasBio,
                          label: "Add store bio or about text",
                        },
                        {
                          done: hasAddress,
                          label: "Add store address",
                        },
                        {
                          done: hasSocial,
                          label: "Add 1+ social media link",
                        },
                        {
                          done: hasProducts,
                          label: `Publish 3+ products (${Math.min(activeProductsCount, 3)}/3)`,
                        },
                      ].map((req) => (
                        <div
                          key={req.label}
                          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-medium ${
                            req.done
                              ? "border-emerald-200 bg-emerald-50/70 text-emerald-900"
                              : "border-slate-200 bg-white text-slate-600"
                          }`}
                        >
                          {req.done ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          <span>{req.label}</span>
                        </div>
                      ))}
                    </div>

                    {!form.allowSearchIndexing && (
                      <p className="text-[11px] text-slate-500">
                        Turning this off asks Google to remove your store on its next recrawl (usually a few days).
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Only shown for Pro / Business plans */}
              {isPaidPlan && (
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200 gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#0f172a]">
                      Pass Payment Processing Fee to Buyer
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      When enabled, checkout adds a 1.5% Payment Processing fee (capped at ₦2,000) so you receive 100% of your product price.
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
              )}

              {/* Action Bar — Only active when unsaved changes exist */}
              {hasChanges && (
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <p className="text-xs font-medium text-slate-600">
                    You have unsaved changes.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDiscard}
                      disabled={saving}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </Button>
                    <Button type="submit" size="sm" disabled={saving}>
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      <span>Save Changes</span>
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
