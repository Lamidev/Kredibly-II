"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { compressProductImage } from "@/lib/compressor";
import {
  ArrowLeft,
  Plus,
  Package,
  UploadCloud,
  X,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Tag,
  Layers,
  Sparkles,
  Edit2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Variant {
  name: string;
  price: number;
  stockQuantity: number;
}

interface ProductAttribute {
  label: string;
  value: string;
}

const DETAIL_PRESETS = ["Brand", "Condition", "Material", "Weight / Size"] as const;

interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category?: string | null;
  brand?: string | null;
  attributes?: ProductAttribute[] | null;
  isFeatured?: boolean;
  basePrice: number | string;
  comparePrice?: number | string | null;
  images: string[];
  stockQuantity: number;
  isActive: boolean;
  hasVariants: boolean;
  variants: Array<{
    id: string;
    name: string;
    price: number | string;
    stockQuantity: number;
  }>;
}

export default function ProductsPage() {
  const router = useRouter();
  const { store } = useAuthStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [basePrice, setBasePrice] = useState("");
  const [comparePrice, setComparePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([
    { name: "Size: M", price: 0, stockQuantity: 1 },
  ]);

  // Unique categories already created by this merchant
  const existingCategories = Array.from(
    new Set(
      products
        .map((p) => p.category?.trim())
        .filter((c): c is string => Boolean(c))
    )
  );

  // Image upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState<string>("");

  const fetchProducts = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imagePreviews.length + files.length > 2) {
      setErrorMsg("Maximum 2 images allowed per product.");
      return;
    }

    setCompressing(true);
    setErrorMsg("");

    const newFiles: File[] = [...selectedFiles];
    const newPreviews: string[] = [...imagePreviews];
    let totalOriginal = 0;
    let totalCompressed = 0;

    for (let i = 0; i < files.length && newFiles.length < 2; i++) {
      const result = await compressProductImage(files[i]);
      newFiles.push(result.file);
      newPreviews.push(result.previewUrl);
      totalOriginal += result.originalSizeKB;
      totalCompressed += result.compressedSizeKB;
    }

    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
    setCompressing(false);
    setCompressionStats(
      `WebP compressed: ${totalOriginal} KB ➔ ${totalCompressed} KB (-${Math.round(
        ((totalOriginal - totalCompressed) / totalOriginal) * 100
      )}%)`
    );
  };

  const removeImage = (index: number) => {
    const previewToRemove = imagePreviews[index];
    if (previewToRemove && !previewToRemove.startsWith("blob:")) {
      // It's an existing saved URL
      setExistingImages((prev) =>
        prev.filter((url) => getImageUrl(url) !== previewToRemove)
      );
    } else {
      // It's a newly selected file (calculate index within selectedFiles)
      const existingCount = existingImages.length;
      const fileIndex = index - existingCount;
      if (fileIndex >= 0) {
        setSelectedFiles((prev) => prev.filter((_, i) => i !== fileIndex));
      }
    }
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setEditingProduct(null);
    setExistingImages([]);
    setTitle("");
    setDescription("");
    setCategory("");
    setAttributes([]);
    setIsFeatured(false);
    setBasePrice("");
    setComparePrice("");
    setStockQuantity("1");
    setSelectedFiles([]);
    setImagePreviews([]);
    setCompressionStats("");
    setHasVariants(false);
    setVariants([{ name: "Size: M", price: 0, stockQuantity: 1 }]);
    setErrorMsg("");
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description || "");
    setCategory(product.category || "");
    const existingAttrs = Array.isArray(product.attributes)
      ? product.attributes.filter((a) => a?.label && a?.value)
      : [];
    if (existingAttrs.length > 0) {
      setAttributes(existingAttrs);
    } else if (product.brand) {
      setAttributes([{ label: "Brand", value: product.brand }]);
    } else {
      setAttributes([]);
    }
    setIsFeatured(Boolean(product.isFeatured));
    setBasePrice(String(product.basePrice));
    setComparePrice(product.comparePrice ? String(product.comparePrice) : "");
    setStockQuantity(String(product.stockQuantity));
    setHasVariants(Boolean(product.hasVariants));
    setVariants(
      product.variants && product.variants.length > 0
        ? product.variants.map((v) => ({
            name: v.name,
            price: Number(v.price),
            stockQuantity: v.stockQuantity,
          }))
        : [{ name: "Size: M", price: Number(product.basePrice), stockQuantity: 1 }]
    );
    const savedImgs = product.images || [];
    setExistingImages(savedImgs);
    setImagePreviews(savedImgs.map((img) => getImageUrl(img)));
    setSelectedFiles([]);
    setCompressionStats("");
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleToggleDraft = async (product: Product) => {
    try {
      const nextActive = !product.isActive;
      await api.put(`/products/${product.id}`, { isActive: nextActive });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isActive: nextActive } : p))
      );
      toast.success(
        nextActive ? "Product published to your store!" : "Product moved to Drafts."
      );
    } catch {
      toast.error("Failed to update product visibility.");
    }
  };

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: "",
        price: Number(basePrice) || 0,
        stockQuantity: 1,
      },
    ]);
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const addAttributeRow = (presetLabel?: string) => {
    if (
      presetLabel &&
      attributes.some(
        (a) => a.label.trim().toLowerCase() === presetLabel.toLowerCase()
      )
    ) {
      return;
    }
    setAttributes((prev) => [...prev, { label: presetLabel || "", value: "" }]);
  };

  const removeAttributeRow = (index: number) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  const applyVariantTemplate = (template: "size" | "color" | "storage" | "pack") => {
    const defaultPrice = Number(basePrice) || 0;
    const templates: Record<typeof template, Variant[]> = {
      size: [
        { name: "Size: S", price: defaultPrice, stockQuantity: 5 },
        { name: "Size: M", price: defaultPrice, stockQuantity: 5 },
        { name: "Size: L", price: defaultPrice, stockQuantity: 5 },
      ],
      color: [
        { name: "Color: Black", price: defaultPrice, stockQuantity: 5 },
        { name: "Color: White", price: defaultPrice, stockQuantity: 5 },
      ],
      storage: [
        { name: "128GB", price: defaultPrice, stockQuantity: 3 },
        { name: "256GB", price: defaultPrice, stockQuantity: 3 },
      ],
      pack: [
        { name: "Single Pack", price: defaultPrice, stockQuantity: 10 },
        { name: "Bundle (3x)", price: defaultPrice * 3, stockQuantity: 5 },
      ],
    };
    setVariants(templates[template]);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (description.trim().length < 5) {
      const msg = "Please add a short product description (at least 5 characters).";
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload compressed images to local VPS storage
      let uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        const formData = new FormData();
        selectedFiles.forEach((file) => formData.append("images", file));

        const uploadRes = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        uploadedUrls = uploadRes.data.urls;
      }

      const finalImages = [...existingImages, ...uploadedUrls].slice(0, 2);

      const cleanedAttributes = attributes
        .map((a) => ({ label: a.label.trim(), value: a.value.trim() }))
        .filter((a) => a.label.length > 0 && a.value.length > 0);

      const brandAttr = cleanedAttributes.find(
        (a) => a.label.toLowerCase() === "brand"
      );

      // 2. Create or update product in database
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || null,
        brand: brandAttr ? brandAttr.value : null,
        attributes: cleanedAttributes.length > 0 ? cleanedAttributes : null,
        isFeatured,
        basePrice: Number(basePrice),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        images: finalImages,
        stockQuantity: Number(stockQuantity),
        hasVariants,
        variants: hasVariants ? variants : undefined,
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        toast.success("Product updated successfully!");
      } else {
        await api.post("/products", payload);
        toast.success("Product published to your store!");
      }

      resetForm();
      setModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        `Failed to ${editingProduct ? "update" : "create"} product. Check inputs.`;
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast.success("Product deleted.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete product.");
    }
  };

  const handleStockChange = async (id: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await api.patch(`/products/${id}/stock`, { stockQuantity: newStock });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stockQuantity: newStock } : p))
      );
      toast.success(`Stock updated to ${newStock}.`);
    } catch {
      toast.error("Failed to update stock.");
    }
  };

  const getFullImageUrl = (path: string) => getImageUrl(path);

  return (
    <div className="space-y-6">
      {/* Page Title & Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              Product Catalog
            </h1>
            {!loading && (
              <Badge variant="secondary">
                {store?.subscriptionTier === "BUSINESS"
                  ? `${products.length} products`
                  : `${products.length} / ${
                      store?.subscriptionTier === "PRO" ? 300 : 20
                    } used (incl. drafts)`}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Add products, edit prices, or move items to Draft without losing your data.
          </p>
        </div>

        <Button onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Main Content */}
      <div>
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#2e1065]" />
          </div>
        ) : products.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="text-center py-14 px-6 flex flex-col items-center">
              <div className="h-14 w-14 rounded-2xl bg-[#2e1065]/10 text-[#2e1065] flex items-center justify-center mb-4">
                <Package className="w-7 h-7" />
              </div>
              <h2 className="text-base font-bold text-[#0f172a] mb-1">
                No products added yet
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Add your first product in 30 seconds. Snap 2 photos, set a price, and start sharing your link.
              </p>
              <Button onClick={openCreateModal}>
                <Plus className="w-4 h-4" />
                Add Your First Product
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image banner */}
                  <div className="relative aspect-square w-full bg-slate-100">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={getFullImageUrl(product.images[0])}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                    {!product.isActive && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="warning">Draft (Hidden)</Badge>
                      </div>
                    )}
                    {product.isActive && product.stockQuantity === 0 && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="destructive">Sold Out</Badge>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-[#0f172a] text-sm line-clamp-1">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-[#2e1065] hover:bg-slate-100 transition cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleDraft(product)}
                          className={`p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer ${
                            product.isActive
                              ? "text-slate-500 hover:text-amber-600"
                              : "text-amber-600 hover:text-emerald-600"
                          }`}
                          title={product.isActive ? "Move to Draft" : "Publish to Store"}
                        >
                          {product.isActive ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-[#2e1065]">
                        {formatCurrency(product.basePrice)}
                      </span>
                      {product.comparePrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                    </div>

                    {product.hasVariants && (
                      <Badge variant="secondary">
                        <Layers className="w-3 h-3 text-[#2e1065]" />
                        {product.variants?.length || 0} variants
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Stock Quick Controller */}
                <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
                  <span className="text-slate-500 font-medium">Stock:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStockChange(product.id, product.stockQuantity, -1)}
                      className="h-6 w-6 rounded-md bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-[#0f172a] cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-[#0f172a] px-1">
                      {product.stockQuantity}
                    </span>
                    <button
                      onClick={() => handleStockChange(product.id, product.stockQuantity, 1)}
                      className="h-6 w-6 rounded-md bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-[#0f172a] cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Slide-Over Product Sheet (Full-screen on mobile, right sheet on desktop) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => !submitting && setModalOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity"
          />

          {/* Sheet Panel */}
          <div className="relative z-10 w-full sm:max-w-lg h-full bg-white border-l border-slate-200 shadow-2xl flex flex-col">
            {/* Sticky Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div>
                <h3 className="font-display text-lg font-bold text-[#0f172a] tracking-tight">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingProduct
                    ? "Update your product details and pricing"
                    : "Create a new product listing for your store"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !submitting && setModalOpen(false)}
                aria-label="Close"
                className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              id="product-sheet-form"
              onSubmit={handleCreateProduct}
              className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-5"
            >
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Product Images (Max 2) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Product Images (Max 2)
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {imagePreviews.length}/2 Uploaded
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2.5">
                  {[0, 1].map((slotIdx) => {
                    const preview = imagePreviews[slotIdx];
                    return preview ? (
                      <div
                        key={slotIdx}
                        className="relative aspect-[4/3] rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={preview}
                          alt={`Product slot ${slotIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(slotIdx)}
                          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-red-600 transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div
                        key={slotIdx}
                        className="aspect-[4/3] rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col items-center justify-center text-center p-2"
                      >
                        <Package className="w-4 h-4 text-slate-300 mb-1" />
                        <span className="text-[11px] font-medium text-slate-400">
                          {slotIdx === 0 ? "Slot 1 (Main)" : "Slot 2"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {imagePreviews.length < 2 && (
                  <label className="w-full rounded-xl border border-dashed border-slate-300 hover:border-[#2e1065] bg-slate-50/60 hover:bg-slate-50 flex flex-col items-center justify-center gap-1 py-4 px-3 cursor-pointer transition text-center">
                    <UploadCloud className="w-5 h-5 text-[#2e1065]" />
                    <span className="text-xs font-semibold text-[#0f172a]">
                      {compressing
                        ? "Optimizing image..."
                        : `Upload Image (Slot ${imagePreviews.length + 1})`}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Click to choose a photo (PNG, JPG, WebP)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={compressing}
                    />
                  </label>
                )}

                {compressionStats && (
                  <p className="text-[11px] text-[#2e1065] mt-2 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {compressionStats}
                  </p>
                )}
              </div>

              {/* 2. Title */}
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Silk Midi Dress, iPhone 15 Pro, Red Velvet Cake"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065] text-sm"
                />
              </div>

              {/* 3. Description (Required, directly after Title) */}
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  minLength={5}
                  placeholder="Describe what you're selling — key features, material, size, or what comes in the box..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065] text-sm resize-none"
                />
              </div>

              {/* 4. Category (keeps storefront tabs organized) */}
              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                  Category
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dresses, Skincare, Phones, Pastries"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065] text-sm"
                />
                {existingCategories.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-[11px] text-slate-400">Your categories:</span>
                    {existingCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition cursor-pointer ${
                          category === cat
                            ? "bg-[#2e1065] border-[#2e1065] text-white"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. Pricing & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                    Price (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    placeholder="15000"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                    Compare-at Price (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="Optional old price"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065] text-sm"
                />
              </div>

              {/* 6. More Details (Optional 1-tap dynamic attributes) */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#0f172a]">
                    More Details (Optional)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Tap to add only what fits your product — skip if not needed.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {DETAIL_PRESETS.map((preset) => {
                    const alreadyAdded = attributes.some(
                      (a) => a.label.trim().toLowerCase() === preset.toLowerCase()
                    );
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={alreadyAdded}
                        onClick={() => addAttributeRow(preset)}
                        className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 disabled:opacity-40 transition cursor-pointer"
                      >
                        + {preset}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => addAttributeRow("")}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-dashed border-slate-300 bg-white hover:border-[#2e1065] text-[#2e1065] transition cursor-pointer"
                  >
                    + Custom Detail
                  </button>
                </div>

                {attributes.length > 0 && (
                  <div className="space-y-2">
                    {attributes.map((attr, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Detail (e.g. Material)"
                          value={attr.label}
                          onChange={(e) => {
                            const next = [...attributes];
                            next[idx] = { ...next[idx], label: e.target.value };
                            setAttributes(next);
                          }}
                          className="w-2/5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065]"
                        />
                        <input
                          type="text"
                          placeholder="Value (e.g. 100% Cotton)"
                          value={attr.value}
                          onChange={(e) => {
                            const next = [...attributes];
                            next[idx] = { ...next[idx], value: e.target.value };
                            setAttributes(next);
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065]"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttributeRow(idx)}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Product Options / Variants */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="block text-xs font-semibold text-[#0f172a]">
                      This product has options (Size, Color, Pack, etc.)
                    </span>
                    <span className="block text-[11px] text-slate-500">
                      Turn on if customers need to pick a size, color, or spec.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#2e1065] cursor-pointer"
                  />
                </label>

                {hasVariants && (
                  <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-slate-500 font-medium">
                        Quick templates:
                      </span>
                      <button
                        type="button"
                        onClick={() => applyVariantTemplate("size")}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:border-[#2e1065] cursor-pointer"
                      >
                        Size (S, M, L)
                      </button>
                      <button
                        type="button"
                        onClick={() => applyVariantTemplate("color")}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:border-[#2e1065] cursor-pointer"
                      >
                        Color
                      </button>
                      <button
                        type="button"
                        onClick={() => applyVariantTemplate("storage")}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:border-[#2e1065] cursor-pointer"
                      >
                        Storage
                      </button>
                      <button
                        type="button"
                        onClick={() => applyVariantTemplate("pack")}
                        className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] font-medium text-slate-700 hover:border-[#2e1065] cursor-pointer"
                      >
                        Pack / Bundle
                      </button>
                    </div>

                    <div className="space-y-2">
                      {variants.map((v, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Option (e.g. Size: M)"
                            value={v.name}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[i].name = e.target.value;
                              setVariants(updated);
                            }}
                            className="flex-1 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0f172a]"
                          />
                          <input
                            type="number"
                            placeholder="Price"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[i].price = Number(e.target.value);
                              setVariants(updated);
                            }}
                            className="w-24 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0f172a]"
                          />
                          <input
                            type="number"
                            placeholder="Qty"
                            value={v.stockQuantity}
                            onChange={(e) => {
                              const updated = [...variants];
                              updated[i].stockQuantity = Number(e.target.value);
                              setVariants(updated);
                            }}
                            className="w-16 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0f172a]"
                          />
                          {variants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVariantRow(i)}
                              className="text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addVariantRow}
                      className="text-xs text-[#2e1065] font-semibold hover:underline flex items-center gap-1 pt-0.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add another option
                    </button>
                  </div>
                )}
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-3 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="product-sheet-form"
                disabled={submitting || compressing}
                className="bg-[#2e1065] hover:bg-[#3b0764] text-white"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : editingProduct ? (
                  "Save Changes"
                ) : (
                  "Add Product"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
