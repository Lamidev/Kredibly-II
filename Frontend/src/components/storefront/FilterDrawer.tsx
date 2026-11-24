"use client";

import { useState, useMemo, useEffect } from "react";
import {
  StoreProduct,
  extractStoreCategories,
  extractStoreAttributes,
} from "@/types/storefront";
import { RotateCcw, X, Plus, Minus } from "lucide-react";

export interface FilterState {
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  category: string;
  attributes: Record<string, string[]>;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: StoreProduct[];
  filters: FilterState;
  onChange: (next: FilterState) => void;
  onReset: () => void;
}

export function FilterDrawer({
  isOpen,
  onClose,
  products,
  filters,
  onChange,
  onReset,
}: FilterDrawerProps) {
  const [minDraft, setMinDraft] = useState(filters.minPrice);
  const [maxDraft, setMaxDraft] = useState(filters.maxPrice);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    price: true,
    availability: true,
    category: true,
  });

  useEffect(() => {
    setMinDraft(filters.minPrice);
    setMaxDraft(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  const categories = useMemo(
    () => extractStoreCategories(products),
    [products]
  );

  // Automatically build deduplicated filterable attribute groups from whatever attributes the merchant's products have
  const dynamicAttributes = useMemo(
    () => extractStoreAttributes(products),
    [products]
  );

  if (!isOpen) return null;

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAttributeValue = (label: string, value: string) => {
    const current = filters.attributes[label] || [];
    const exists = current.includes(value);
    const updated = exists
      ? current.filter((v) => v !== value)
      : [...current, value];

    const nextAttrs = { ...filters.attributes };
    if (updated.length > 0) nextAttrs[label] = updated;
    else delete nextAttrs[label];

    onChange({ ...filters, attributes: nextAttrs });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/30 backdrop-blur-[2px]"
      />

      {/* Left Half-Way Sheet */}
      <div className="relative z-10 w-[82vw] sm:w-[360px] h-full bg-white border-r border-[#daddd4] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e6e8e1] flex items-center justify-between shrink-0">
          <h2 className="font-display text-base font-bold text-[#20231e]">
            Filters
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onReset}
              className="text-xs font-semibold text-[#62665d] hover:text-[#20231e] inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="p-1 rounded-full text-[#62665d] hover:text-[#20231e] hover:bg-[#f3f4ef] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Filter Sections */}
        <div className="flex-1 overflow-y-auto px-5 py-4 divide-y divide-[#e6e8e1]">
          {/* 1. Price Range (Input fields only, no slider) */}
          <div className="pb-4">
            <button
              type="button"
              onClick={() => toggleSection("price")}
              className="w-full flex items-center justify-between py-2 text-xs font-bold uppercase tracking-wider text-[#20231e] cursor-pointer"
            >
              <span>Price Range</span>
              {openSections.price ? (
                <Minus className="w-3.5 h-3.5 text-[#62665d]" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-[#62665d]" />
              )}
            </button>

            {openSections.price && (
              <div className="pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#62665d] mb-1">
                      Min (₦)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={minDraft}
                      onChange={(e) => setMinDraft(e.target.value)}
                      className="w-full h-9 px-3 rounded-[6px] border border-[#daddd4] text-xs text-[#20231e] focus:outline-none focus:border-[#2e1065]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#62665d] mb-1">
                      Max (₦)
                    </label>
                    <input
                      type="number"
                      min={0}
                      placeholder="5,000,000"
                      value={maxDraft}
                      onChange={(e) => setMaxDraft(e.target.value)}
                      className="w-full h-9 px-3 rounded-[6px] border border-[#daddd4] text-xs text-[#20231e] focus:outline-none focus:border-[#2e1065]"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      ...filters,
                      minPrice: minDraft,
                      maxPrice: maxDraft,
                    });
                    onClose();
                  }}
                  className="w-full h-9 rounded-[6px] bg-[#2e1065] hover:bg-[#3b0764] text-white text-xs font-bold transition cursor-pointer"
                >
                  Apply Price Filter
                </button>
              </div>
            )}
          </div>

          {/* 2. Availability */}
          <div className="py-4">
            <button
              type="button"
              onClick={() => toggleSection("availability")}
              className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-[#20231e] cursor-pointer"
            >
              <span>Availability</span>
              {openSections.availability ? (
                <Minus className="w-3.5 h-3.5 text-[#62665d]" />
              ) : (
                <Plus className="w-3.5 h-3.5 text-[#62665d]" />
              )}
            </button>

            {openSections.availability && (
              <div className="pt-2.5 space-y-2">
                <label className="flex items-center gap-2.5 text-xs text-[#20231e] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.inStockOnly}
                    onChange={(e) =>
                      onChange({ ...filters, inStockOnly: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#2e1065] rounded"
                  />
                  <span>In Stock Only</span>
                </label>
                <label className="flex items-center gap-2.5 text-xs text-[#20231e] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.onSaleOnly}
                    onChange={(e) =>
                      onChange({ ...filters, onSaleOnly: e.target.checked })
                    }
                    className="h-4 w-4 accent-[#2e1065] rounded"
                  />
                  <span>On Sale / Discounted</span>
                </label>
              </div>
            )}
          </div>

          {/* 3. Category (Auto-shown if merchant has categories) */}
          {categories.length > 0 && (
            <div className="py-4">
              <button
                type="button"
                onClick={() => toggleSection("category")}
                className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-[#20231e] cursor-pointer"
              >
                <span>Category</span>
                {openSections.category ? (
                  <Minus className="w-3.5 h-3.5 text-[#62665d]" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-[#62665d]" />
                )}
              </button>

              {openSections.category && (
                <div className="pt-2.5 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => onChange({ ...filters, category: "all" })}
                    className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition cursor-pointer ${
                      filters.category === "all"
                        ? "bg-[#2e1065]/10 text-[#2e1065] font-semibold"
                        : "text-[#62665d] hover:text-[#20231e]"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => onChange({ ...filters, category: cat.key })}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs flex items-center justify-between transition cursor-pointer ${
                        filters.category === cat.key
                          ? "bg-[#2e1065]/10 text-[#2e1065] font-semibold"
                          : "text-[#62665d] hover:text-[#20231e]"
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className="text-[11px] opacity-70">{cat.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Dynamic Product Attributes (Brand, Condition, Material, etc.) */}
          {dynamicAttributes.map((attr) => {
            const sectionKey = `attr:${attr.label}`;
            const isSecOpen = Boolean(openSections[sectionKey]);
            const selectedVals = filters.attributes[attr.label] || [];

            return (
              <div key={attr.label} className="py-4">
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  className="w-full flex items-center justify-between py-1 text-xs font-bold uppercase tracking-wider text-[#20231e] cursor-pointer"
                >
                  <span>{attr.label}</span>
                  {isSecOpen ? (
                    <Minus className="w-3.5 h-3.5 text-[#62665d]" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-[#62665d]" />
                  )}
                </button>

                {isSecOpen && (
                  <div className="pt-2.5 space-y-2">
                    {attr.values.map((val) => (
                      <label
                        key={val}
                        className="flex items-center gap-2.5 text-xs text-[#20231e] cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedVals.includes(val)}
                          onChange={() => toggleAttributeValue(attr.label, val)}
                          className="h-4 w-4 accent-[#2e1065] rounded"
                        />
                        <span>{val}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
