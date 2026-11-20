"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import {
  formatCurrency,
  formatNumberInput,
  getImageUrl,
  parseNumberInput,
} from "@/lib/utils";
import { compressProductImage } from "@/lib/compressor";
import {
  Plus,
  Package,
  UploadCloud,
  X,
  Trash2,
  AlertCircle,
  Loader2,
  Layers,
  Edit2,
  Eye,
  EyeOff,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";

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
  const [activeTab, setActiveTab] = useState<"all" | "published" | "drafts">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "price-asc" | "price-desc" | "low-stock"
  >("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 12;
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [maxImages, setMaxImages] = useState(2);

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

  // Lock background page scroll while the slide-over product sheet is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery, sortBy]);

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
    api
      .get("/subscription/overview")
      .then((res) => {
        const limit = Number(res.data?.data?.maxImagesPerProduct);
        if (limit >= 1) setMaxImages(limit);
      })
      .catch(() => {});
  }, []);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (imagePreviews.length + files.length > maxImages) {
      setErrorMsg(`Maximum ${maxImages} images allowed per product on your current plan.`);
      e.target.value = "";
      return;
    }

    setCompressing(true);
    setErrorMsg("");

    const newFiles: File[] = [...selectedFiles];
    const newPreviews: string[] = [...imagePreviews];

    for (let i = 0; i < files.length && newPreviews.length < maxImages; i++) {
      const result = await compressProductImage(files[i]);
      newFiles.push(result.file);
      newPreviews.push(result.previewUrl);
    }

    setSelectedFiles(newFiles);
    setImagePreviews(newPreviews);
    setCompressing(false);
    e.target.value = "";
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
    const hasDiscount =
      product.comparePrice !== null &&
      product.comparePrice !== undefined &&
      Number(product.comparePrice) > Number(product.basePrice);
    if (hasDiscount) {
      setBasePrice(formatNumberInput(product.comparePrice!));
      setComparePrice(formatNumberInput(product.basePrice));
    } else {
      setBasePrice(formatNumberInput(product.basePrice));
      setComparePrice("");
    }
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

  const actualPriceNum = parseNumberInput(basePrice);
  const discountPriceNum = comparePrice.trim()
    ? parseNumberInput(comparePrice)
    : null;
  const effectiveSellingPrice =
    discountPriceNum !== null &&
    discountPriceNum >= 100 &&
    discountPriceNum < actualPriceNum
      ? discountPriceNum
      : actualPriceNum;

  const isTitleValid =
    title.trim().length >= 2 && /[a-zA-Z]/.test(title.trim());
  const isDescValid = description.trim().length >= 5;
  const isActualPriceValid = actualPriceNum >= 100;
  const isDiscountValid =
    discountPriceNum === null ||
    (discountPriceNum >= 100 && discountPriceNum < actualPriceNum);
  const isStockValid =
    stockQuantity.trim() !== "" &&
    /^\d+$/.test(stockQuantity.trim()) &&
    Number(stockQuantity) >= 0;
  const areVariantsValid =
    !hasVariants ||
    (variants.length > 0 &&
      variants.every(
        (v) =>
          v.name.trim().length > 0 &&
          /[a-zA-Z]/.test(v.name.trim()) &&
          v.price >= 50 &&
          Number.isInteger(v.stockQuantity) &&
          v.stockQuantity >= 0
      ));

  const isFormValid =
    isTitleValid &&
    isDescValid &&
    isActualPriceValid &&
    isDiscountValid &&
    isStockValid &&
    areVariantsValid;

  const addVariantRow = () => {
    setVariants((prev) => [
      ...prev,
      {
        name: "",
        price: effectiveSellingPrice || 0,
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
    const defaultPrice = effectiveSellingPrice || 0;
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

      const finalImages = [...existingImages, ...uploadedUrls].slice(0, maxImages);

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
        basePrice:
          discountPriceNum !== null &&
          discountPriceNum >= 100 &&
          discountPriceNum < actualPriceNum
            ? discountPriceNum
            : actualPriceNum,
        comparePrice:
          discountPriceNum !== null &&
          discountPriceNum >= 100 &&
          discountPriceNum < actualPriceNum
            ? actualPriceNum
            : null,
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

  const publishedCount = products.filter((p) => p.isActive).length;
  const draftCount = products.filter((p) => !p.isActive).length;
  const displayedProducts = products
    .filter((p) => {
      if (activeTab === "published") return p.isActive;
      if (activeTab === "drafts") return !p.isActive;
      return true;
    })
    .filter((p) => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.category || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === "price-asc") {
        return Number(a.basePrice) - Number(b.basePrice);
      }
      if (sortBy === "price-desc") {
        return Number(b.basePrice) - Number(a.basePrice);
      }
      if (sortBy === "low-stock") {
        return a.stockQuantity - b.stockQuantity;
      }
      return 0;
    });

  const paginatedProducts = displayedProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div className="space-y-5">
      {/* Page Title & Add Action (Compact opposite title on mobile) */}
      <div className="flex items-start sm:items-center justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-extrabold text-[#0f172a] tracking-tight truncate">
              Product Catalog
            </h1>
            {!loading && (
              <Badge variant="secondary" className="text-[10px] sm:text-xs">
                {store?.subscriptionTier === "BUSINESS"
                  ? `${products.length} products`
                  : `${products.length} / ${
                      store?.subscriptionTier === "PRO" ? 300 : 20
                    } used`}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Add products, edit prices, or move items to Draft without losing your data.
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          size="sm"
          className="shrink-0 h-9 px-3 sm:h-10 sm:px-4 text-xs sm:text-sm"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Filter Tabs + Search + Sort */}
      {!loading && products.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "all"
                    ? "bg-[#2e1065] text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0f172a]"
                }`}
              >
                All ({products.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("published")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "published"
                    ? "bg-[#2e1065] text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0f172a]"
                }`}
              >
                Published ({publishedCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("drafts")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                  activeTab === "drafts"
                    ? "bg-[#2e1065] text-white"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#0f172a]"
                }`}
              >
                Drafts ({draftCount})
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort products"
              className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-[#0f172a] focus:outline-none focus:border-[#2e1065] cursor-pointer"
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="low-stock">Stock: Low to High</option>
            </select>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products by name, category, or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 focus:bg-white border border-slate-200 text-xs sm:text-sm text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065]"
            />
          </div>
        </div>
      )}

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
        ) : displayedProducts.length === 0 ? (
          <Card className="max-w-lg mx-auto">
            <CardContent className="text-center py-12 px-6 flex flex-col items-center">
              <p className="text-sm font-bold text-[#0f172a]">
                {searchQuery
                  ? "No matching products"
                  : activeTab === "drafts"
                  ? "No products in Drafts"
                  : "No published products"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {searchQuery
                  ? "Try another search term."
                  : activeTab === "drafts"
                  ? "Click \"Move to Draft\" on any product to hide it from your storefront."
                  : "Publish a draft product or add a new product to show it on your storefront."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Desktop Table View (matching clean admin table design) */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-500 bg-slate-50/70">
                      <th className="py-3 px-4 font-semibold">Product</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold">Price</th>
                      <th className="py-3 px-4 font-semibold">Inventory</th>
                      <th className="py-3 px-4 font-semibold">Category</th>
                      <th className="py-3 px-4 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedProducts.map((product) => {
                      const baseNum = Number(product.basePrice || 0);
                      const compareNum = Number(product.comparePrice || 0);
                      const hasDiscount = compareNum > baseNum && baseNum > 0;
                      const discountPct = hasDiscount
                        ? Math.max(
                            1,
                            Math.round(((compareNum - baseNum) / compareNum) * 100)
                          )
                        : 0;
                      const subMeta = [
                        product.brand,
                        product.hasVariants
                          ? `${product.variants?.length || 0} options`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ");

                      return (
                        <tr
                          key={product.id}
                          className="hover:bg-slate-50/70 transition"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3 min-w-[200px]">
                              <div className="h-11 w-11 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                                {product.images && product.images.length > 0 ? (
                                  <img
                                    src={getFullImageUrl(product.images[0])}
                                    alt={product.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-slate-300">
                                    <Package className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-[#0f172a] text-xs sm:text-sm truncate max-w-[260px]">
                                  {product.title}
                                </p>
                                {subMeta && (
                                  <p className="text-[11px] text-slate-500 truncate max-w-[260px]">
                                    {subMeta}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            {!product.isActive ? (
                              <Badge variant="warning">Draft</Badge>
                            ) : product.stockQuantity === 0 ? (
                              <Badge variant="destructive">Sold Out</Badge>
                            ) : (
                              <Badge variant="success">Active</Badge>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-bold text-xs sm:text-sm ${
                                  hasDiscount ? "text-red-600" : "text-[#0f172a]"
                                }`}
                              >
                                {formatCurrency(baseNum)}
                              </span>
                              {hasDiscount && (
                                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-bold">
                                  -{discountPct}%
                                </span>
                              )}
                            </div>
                            {hasDiscount && (
                              <p className="text-[11px] text-slate-400 line-through">
                                {formatCurrency(compareNum)}
                              </p>
                            )}
                          </td>

                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg p-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  handleStockChange(
                                    product.id,
                                    product.stockQuantity,
                                    -1
                                  )
                                }
                                aria-label="Decrease stock"
                                className="h-6 w-6 rounded bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-[#0f172a] cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-mono font-bold text-[#0f172a] min-w-[26px] text-center">
                                {product.stockQuantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  handleStockChange(
                                    product.id,
                                    product.stockQuantity,
                                    1
                                  )
                                }
                                aria-label="Increase stock"
                                className="h-6 w-6 rounded bg-white hover:bg-slate-100 flex items-center justify-center font-bold text-[#0f172a] cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                            {product.category || "—"}
                          </td>

                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openEditModal(product)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-[#2e1065] hover:bg-slate-100 transition cursor-pointer"
                                title="Edit product"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleDraft(product)}
                                className={`p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer ${
                                  product.isActive
                                    ? "text-slate-500 hover:text-amber-600"
                                    : "text-amber-600 hover:text-emerald-600"
                                }`}
                                title={
                                  product.isActive
                                    ? "Move to Draft"
                                    : "Publish to Store"
                                }
                              >
                                {product.isActive ? (
                                  <EyeOff className="w-4 h-4" />
                                ) : (
                                  <Eye className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                title="Delete product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile 1-Column List Cards (Full title + inline stock controls) */}
            <div className="md:hidden space-y-3">
              {paginatedProducts.map((product) => {
                const baseNum = Number(product.basePrice || 0);
                const compareNum = Number(product.comparePrice || 0);
                const hasDiscount = compareNum > baseNum && baseNum > 0;
                const discountPct = hasDiscount
                  ? Math.max(
                      1,
                      Math.round(((compareNum - baseNum) / compareNum) * 100)
                    )
                  : 0;

                return (
                  <Card key={product.id} className="overflow-hidden">
                    <div className="p-3.5 flex items-start gap-3">
                      {/* Thumbnail */}
                      <div className="h-16 w-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={getFullImageUrl(product.images[0])}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Full-width Title, Price & Status */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-[#0f172a] text-sm line-clamp-2 leading-snug">
                            {product.title}
                          </h3>
                          {!product.isActive ? (
                            <Badge variant="warning" className="shrink-0">
                              Draft
                            </Badge>
                          ) : product.stockQuantity === 0 ? (
                            <Badge variant="destructive" className="shrink-0">
                              Sold Out
                            </Badge>
                          ) : (
                            <Badge variant="success" className="shrink-0">
                              Active
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-sm font-extrabold ${
                              hasDiscount ? "text-red-600" : "text-[#2e1065]"
                            }`}
                          >
                            {formatCurrency(baseNum)}
                          </span>
                          {hasDiscount && (
                            <>
                              <span className="text-xs text-slate-400 line-through">
                                {formatCurrency(compareNum)}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 text-[10px] font-bold">
                                -{discountPct}%
                              </span>
                            </>
                          )}
                        </div>

                        {(product.category || product.hasVariants) && (
                          <p className="text-[11px] text-slate-500">
                            {[
                              product.category,
                              product.hasVariants
                                ? `${product.variants?.length || 0} options`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mobile Bottom Bar: Stock Stepper + Actions */}
                    <div className="px-3.5 py-2.5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-500 font-medium">Stock:</span>
                        <div className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                          <button
                            type="button"
                            onClick={() =>
                              handleStockChange(
                                product.id,
                                product.stockQuantity,
                                -1
                              )
                            }
                            aria-label="Decrease stock"
                            className="h-7 w-7 rounded bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-[#0f172a] cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-mono font-bold text-[#0f172a] min-w-[24px] text-center">
                            {product.stockQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleStockChange(
                                product.id,
                                product.stockQuantity,
                                1
                              )
                            }
                            aria-label="Increase stock"
                            className="h-7 w-7 rounded bg-slate-50 hover:bg-slate-100 flex items-center justify-center font-bold text-[#0f172a] cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(product)}
                          className="p-2 rounded-lg text-slate-600 hover:text-[#2e1065] hover:bg-white transition cursor-pointer"
                          title="Edit product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDraft(product)}
                          className={`p-2 rounded-lg hover:bg-white transition cursor-pointer ${
                            product.isActive
                              ? "text-slate-600 hover:text-amber-600"
                              : "text-amber-600 hover:text-emerald-600"
                          }`}
                          title={
                            product.isActive
                              ? "Move to Draft"
                              : "Publish to Store"
                          }
                        >
                          {product.isActive ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          title="Delete product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            <Pagination
              currentPage={currentPage}
              totalItems={displayedProducts.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      {/* Slide-Over Product Sheet (Full-screen on mobile, right sheet on desktop) */}
      {modalOpen && (
        <div className="fixed inset-0 !mt-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div
            onClick={() => !submitting && setModalOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity"
          />

          {/* Sheet Panel */}
          <div className="relative z-10 w-screen sm:w-full sm:max-w-lg h-[100dvh] sm:h-full bg-white sm:border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
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

              {/* 1. Product Images (Tier-based limit) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Product Images (Max {maxImages})
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {imagePreviews.length}/{maxImages} Uploaded
                  </span>
                </div>

                <div className={`grid gap-3 mb-2.5 ${maxImages > 2 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
                  {Array.from({ length: maxImages }, (_, slotIdx) => {
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
                          aria-label={`Remove image ${slotIdx + 1}`}
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
                          {slotIdx === 0 ? "Slot 1 (Main)" : `Slot ${slotIdx + 1}`}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {imagePreviews.length < maxImages && (
                  <label className="w-full rounded-xl border border-dashed border-slate-300 hover:border-[#2e1065] bg-slate-50/60 hover:bg-slate-50 flex flex-col items-center justify-center gap-1 py-4 px-3 cursor-pointer transition text-center">
                    <UploadCloud className="w-5 h-5 text-[#2e1065]" />
                    <span className="text-xs font-semibold text-[#0f172a]">
                      {compressing
                        ? "Optimizing images..."
                        : imagePreviews.length === 0
                        ? `Upload Images (Up to ${maxImages} at once)`
                        : `Add More Images (${maxImages - imagePreviews.length} ${
                            maxImages - imagePreviews.length === 1 ? "slot" : "slots"
                          } left)`}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Select 1 or up to {maxImages - imagePreviews.length} photos at once (PNG, JPG, WebP)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageSelect}
                      disabled={compressing}
                    />
                  </label>
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
                  maxLength={150}
                  placeholder="e.g. Silk Midi Dress, iPhone 15 Pro, Red Velvet Cake"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065] text-sm"
                />
                {title.length > 0 && !isTitleValid && (
                  <p className="text-[11px] text-red-600 mt-1">
                    Enter a valid product name (at least 2 letters).
                  </p>
                )}
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
                {description.length > 0 && !isDescValid && (
                  <p className="text-[11px] text-red-600 mt-1">
                    Description must be at least 5 characters.
                  </p>
                )}
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
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      Actual Price (₦) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="15,000"
                      value={basePrice}
                      onChange={(e) =>
                        setBasePrice(formatNumberInput(e.target.value))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065] text-sm"
                    />
                    {basePrice.length > 0 && !isActualPriceValid && (
                      <p className="text-[11px] text-red-600 mt-1">
                        Minimum price is ₦100.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                      Discount Price (₦)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Optional sale price"
                      value={comparePrice}
                      onChange={(e) =>
                        setComparePrice(formatNumberInput(e.target.value))
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:border-[#2e1065] text-sm"
                    />
                    {comparePrice.length > 0 && !isDiscountValid && (
                      <p className="text-[11px] text-red-600 mt-1">
                        Must be ₦100+ and lower than Actual Price.
                      </p>
                    )}
                  </div>
                </div>
                {discountPriceNum !== null &&
                  isDiscountValid &&
                  isActualPriceValid && (
                    <p className="text-[11px] text-slate-500">
                      Customers pay{" "}
                      <span className="font-bold text-[#2e1065]">
                        {formatCurrency(discountPriceNum)}
                      </span>{" "}
                      and{" "}
                      <span className="line-through text-slate-400">
                        {formatCurrency(actualPriceNum)}
                      </span>{" "}
                      will be crossed out{" "}
                      <span className="font-bold text-red-600">
                        (-{Math.max(1, Math.round(((actualPriceNum - discountPriceNum) / actualPriceNum) * 100))}% OFF)
                      </span>
                      .
                    </p>
                  )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f172a] mb-1.5">
                  Stock Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  placeholder="1"
                  value={stockQuantity}
                  onChange={(e) =>
                    setStockQuantity(e.target.value.replace(/\D/g, ""))
                  }
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
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHasVariants(checked);
                      if (
                        checked &&
                        variants.length === 1 &&
                        variants[0].price === 0 &&
                        effectiveSellingPrice > 0
                      ) {
                        setVariants([
                          { ...variants[0], price: effectiveSellingPrice },
                        ]);
                      }
                    }}
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

                    <div className="space-y-2.5">
                      <div className="grid grid-cols-[1fr_92px_58px_20px] gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 px-0.5">
                        <span>Option Name</span>
                        <span>Price (₦)</span>
                        <span>Qty</span>
                        <span />
                      </div>
                      {variants.map((v, i) => {
                        const badName =
                          v.name.trim().length > 0 &&
                          !/[a-zA-Z]/.test(v.name.trim());
                        return (
                          <div key={i} className="space-y-1">
                            <div className="grid grid-cols-[1fr_92px_58px_20px] items-center gap-2">
                              <input
                                type="text"
                                placeholder="e.g. Size: M"
                                value={v.name}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[i].name = e.target.value;
                                  setVariants(updated);
                                }}
                                className="w-full min-w-0 px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0f172a]"
                              />
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="15,000"
                                value={v.price > 0 ? formatNumberInput(v.price) : ""}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[i].price = parseNumberInput(e.target.value);
                                  setVariants(updated);
                                }}
                                className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0f172a]"
                              />
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="1"
                                value={String(v.stockQuantity)}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  const digits = e.target.value.replace(/\D/g, "");
                                  updated[i].stockQuantity = digits ? Number(digits) : 0;
                                  setVariants(updated);
                                }}
                                className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-xs text-[#0f172a] text-center"
                              />
                              {variants.length > 1 ? (
                                <button
                                  type="button"
                                  onClick={() => removeVariantRow(i)}
                                  className="text-slate-400 hover:text-red-600 cursor-pointer flex items-center justify-center"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <span />
                              )}
                            </div>
                            {badName && (
                              <p className="text-[10px] text-red-600">
                                Option name must include text (e.g. Size: 42 or 128GB), not just numbers.
                              </p>
                            )}
                          </div>
                        );
                      })}
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
                disabled={submitting || compressing || !isFormValid}
                className="bg-[#2e1065] hover:bg-[#3b0764] text-white disabled:opacity-45 disabled:cursor-not-allowed"
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
