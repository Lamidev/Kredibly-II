"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api, API_BASE_URL } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency } from "@/lib/utils";
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

interface Variant {
  name: string;
  price: number;
  stockQuantity: number;
}

interface Product {
  id: string;
  title: string;
  slug: string;
  description?: string;
  category?: string | null;
  brand?: string | null;
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
  const [brand, setBrand] = useState("");
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
        prev.filter((url) => getFullImageUrl(url) !== previewToRemove)
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
    setBrand("");
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
    setBrand(product.brand || "");
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
    setImagePreviews(savedImgs.map((img) => getFullImageUrl(img)));
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
    } catch {
      alert("Failed to update product visibility.");
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

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
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

      // 2. Create or update product in database
      const payload = {
        title,
        description,
        category: category.trim() || null,
        brand: brand.trim() || null,
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
      } else {
        await api.post("/products", payload);
      }

      resetForm();
      setModalOpen(false);
      await fetchProducts();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message ||
          `Failed to ${editingProduct ? "update" : "create"} product. Check inputs.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert("Failed to delete product.");
    }
  };

  const handleStockChange = async (id: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    try {
      await api.patch(`/products/${id}/stock`, { stockQuantity: newStock });
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, stockQuantity: newStock } : p))
      );
    } catch {
      alert("Failed to update stock");
    }
  };

  const getFullImageUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    const base = API_BASE_URL.replace("/api", "");
    return `${base}${path}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-16">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-white">Product Catalog</h1>
            {!loading && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-900 border border-slate-800 text-slate-300">
                {store?.subscriptionTier === "BUSINESS"
                  ? `${products.length} products`
                  : `${products.length} / ${
                      store?.subscriptionTier === "PRO" ? 300 : 20
                    } used (incl. drafts)`}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={openCreateModal}
          className="px-3.5 py-1.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-brand-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 px-4 rounded-3xl bg-slate-900/40 border border-slate-800/80 flex flex-col items-center max-w-lg mx-auto">
            <div className="h-14 w-14 rounded-2xl bg-brand-500/10 text-brand-500 flex items-center justify-center mb-4">
              <Package className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">
              No products added yet
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Add your first product in 30 seconds. Snap 2 photos, set a price, and start sharing your link.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Image banner */}
                  <div className="relative aspect-square w-full bg-slate-950">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={getFullImageUrl(product.images[0])}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <Package className="w-12 h-12" />
                      </div>
                    )}
                    {!product.isActive && (
                      <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-700 text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider backdrop-blur">
                        Draft (Hidden)
                      </div>
                    )}
                    {product.isActive && product.stockQuantity === 0 && (
                      <div className="absolute top-3 left-3 bg-red-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur">
                        Sold Out
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-sm line-clamp-1">
                        {product.title}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => openEditModal(product)}
                          className="p-1 text-slate-400 hover:text-white transition"
                          title="Edit product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleDraft(product)}
                          className={`p-1 transition ${
                            product.isActive
                              ? "text-slate-400 hover:text-amber-400"
                              : "text-amber-400 hover:text-emerald-400"
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
                          className="p-1 text-slate-500 hover:text-red-400 transition"
                          title="Delete product"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-extrabold text-brand-400">
                        {formatCurrency(product.basePrice)}
                      </span>
                      {product.comparePrice && (
                        <span className="text-xs text-slate-500 line-through">
                          {formatCurrency(product.comparePrice)}
                        </span>
                      )}
                    </div>

                    {product.hasVariants && (
                      <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                        <Layers className="w-3 h-3 text-brand-500" />
                        {product.variants?.length || 0} variants
                      </div>
                    )}
                  </div>
                </div>

                {/* Stock Quick Controller */}
                <div className="p-4 pt-0 border-t border-slate-800/60 mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Stock:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStockChange(product.id, product.stockQuantity, -1)}
                      className="h-6 w-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-white"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-white px-1">
                      {product.stockQuantity}
                    </span>
                    <button
                      onClick={() => handleStockChange(product.id, product.stockQuantity, 1)}
                      className="h-6 w-6 rounded-md bg-slate-800 hover:bg-slate-700 flex items-center justify-center font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl my-8 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {editingProduct ? "Edit Product" : "Add New Product"}
                </h3>
                <p className="text-xs text-slate-400">
                  Quick mobile listing (max 2 compressed images).
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              {/* Image Uploader */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Product Photos (Max 2)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {imagePreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950"
                    >
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-2 right-2 h-6 w-6 rounded-full bg-slate-950/80 text-white flex items-center justify-center hover:bg-red-500 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {imagePreviews.length < 2 && (
                    <label className="aspect-square rounded-2xl border-2 border-dashed border-slate-800 hover:border-brand-500/50 bg-slate-950/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition p-3 text-center">
                      <UploadCloud className="w-6 h-6 text-slate-500" />
                      <span className="text-[11px] text-slate-400 font-medium">
                        {compressing ? "Optimizing..." : "Add Photo"}
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
                </div>

                {compressionStats && (
                  <p className="text-[11px] text-brand-400 mt-2 font-mono flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-500" />
                    {compressionStats}
                  </p>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Vintage Denim Jacket or iPhone 16 Pro"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              {/* Custom Category & Brand */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sneakers, Laptops, Wigs"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Brand / Condition Tag
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Apple, Nike, Brand New"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              </div>

              {/* Quick 1-Tap Chips for Existing Categories */}
              {existingCategories.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500">Quick select:</span>
                  {existingCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition ${
                        category === cat
                          ? "bg-purple-900 border-purple-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selling Price (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    placeholder="15000"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Compare Price (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="20000 (Slash)"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Available Quantity in Stock
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Material, fit, or special instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 text-sm resize-none"
                />
              </div>

              {/* Variants Toggle */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-slate-300">
                    This product has variants (Sizes, Colors)
                  </span>
                  <input
                    type="checkbox"
                    checked={hasVariants}
                    onChange={(e) => setHasVariants(e.target.checked)}
                    className="h-4 w-4 rounded accent-brand-500"
                  />
                </label>

                {hasVariants && (
                  <div className="mt-3 space-y-2.5 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                    {variants.map((v, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Size 42 / Black"
                          value={v.name}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[i].name = e.target.value;
                            setVariants(updated);
                          }}
                          className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
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
                          className="w-20 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
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
                          className="w-16 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                        />
                        {variants.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVariantRow(i)}
                            className="text-slate-500 hover:text-red-400"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addVariantRow}
                      className="text-xs text-brand-400 font-semibold hover:underline flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3 h-3" /> Add another variant
                    </button>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || compressing}
                  className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-brand-500/20"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    editingProduct ? "Save Changes" : "Publish Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
