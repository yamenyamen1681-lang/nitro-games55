"use client";

import React, { useState, useEffect } from "react";
import { CartProvider, useCart } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { TrustBadges } from "@/components/TrustBadges";
import { DealsSection } from "@/components/DealsSection";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ProductSection } from "@/components/ProductSection";
import { CustomerReviews } from "@/components/CustomerReviews";
import { NewsletterSection } from "@/components/NewsletterSection";
import { Footer } from "@/components/Footer";
import { CartDrawer } from "@/components/CartDrawer";
import { CheckoutModal } from "@/components/CheckoutModal";
import { QuickViewModal } from "@/components/QuickViewModal";
import { LiveSalesToast } from "@/components/LiveSalesToast";
import { FloatingActions } from "@/components/FloatingActions";
import { AdminDashboardModal } from "@/components/AdminDashboardModal";
import { Product, INITIAL_PRODUCTS, ShowcaseConfig, DEFAULT_SHOWCASE } from "@/lib/data";

function NitroGamesApp() {
  const { toastMessage, showToast } = useCart();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [showcase, setShowcase] = useState<ShowcaseConfig>(DEFAULT_SHOWCASE);

  // Wrapped setters: update UI state AND mirror to localStorage as a fast-paint
  // cache for next load. The database (via the API) is always the source of
  // truth — the cache is only ever used for the first render, then overwritten.
  const applyProducts = (list: Product[]) => {
    setProducts(list);
    try {
      localStorage.setItem("nitro_products_v2", JSON.stringify(list));
    } catch (e) {
      console.warn("Storage cache error:", e);
    }
  };

  const applyShowcase = (cfg: ShowcaseConfig) => {
    setShowcase(cfg);
    try {
      localStorage.setItem("nitro_showcase_v2", JSON.stringify(cfg));
    } catch (e) {
      console.warn("Storage cache error:", e);
    }
  };

  // Showcase config: paint instantly from cache, then reconcile with the DB
  useEffect(() => {
    try {
      const raw = localStorage.getItem("nitro_showcase_v2");
      if (raw) {
        const parsed = JSON.parse(raw) as ShowcaseConfig;
        if (parsed && typeof parsed === "object") {
          setShowcase({ ...DEFAULT_SHOWCASE, ...parsed });
        }
      }
    } catch (e) {
      console.warn("showcase config parse error:", e);
    }

    async function loadShowcaseFromApi() {
      try {
        const res = await fetch("/api/settings?key=showcase", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.value) {
          applyShowcase({ ...DEFAULT_SHOWCASE, ...data.value });
        }
      } catch (err) {
        console.warn("Using cached showcase config:", err);
      }
    }
    loadShowcaseFromApi();
  }, []);

  // Products: paint instantly from cache, then always reconcile with the DB
  // (this is what makes admin edits show up on every device/browser)
  useEffect(() => {
    try {
      const cached = localStorage.getItem("nitro_products_v2");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed);
        }
      }
    } catch (e) {
      console.warn("localStorage parse error:", e);
    }

    async function loadFromApi() {
      try {
        const res = await fetch("/api/products", { cache: "no-store" });
        const data = await res.json();
        if (data.products?.length) {
          applyProducts(data.products);
        }
      } catch (err) {
        console.warn("Using bundled products:", err);
      }
    }
    loadFromApi();
  }, []);

  // Secret shortcut: Ctrl + Shift + A
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setIsAdminOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-[#05070d] text-gray-100 flex flex-col justify-between selection:bg-[#00a3ff] selection:text-black relative overflow-x-hidden">
      {/* Animated aurora backdrop */}
      <div className="aurora-stage">
        <div className="tech-grid" />
        <div className="aurora-blob" style={{ width: 420, height: 420, top: "-8%", right: "6%", background: "#00a3ff" }} />
        <div className="aurora-blob" style={{ width: 380, height: 380, top: "35%", left: "4%", background: "#00e5ff", animationDelay: "-6s" }} />
        <div className="aurora-blob" style={{ width: 340, height: 340, bottom: "-6%", right: "28%", background: "#5b8cff", animationDelay: "-12s" }} />
      </div>

      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50">
          <div className="px-5 py-3 rounded-2xl panel border-[#00a3ff]/60 text-white text-xs sm:text-sm font-bold flex items-center gap-2.5 shadow-2xl">
            <span className="w-2 h-2 rounded-full bg-[#00a3ff] animate-ping" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      <Header
        onSearchChange={(q) => setSearchQuery(q)}
        onCategorySelect={(cat) => setSelectedCategory(cat)}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <main className="flex-1 relative z-10">
        <HeroSection
          products={products}
          showcase={showcase}
          onCategorySelect={(cat) => setSelectedCategory(cat)}
        />
        <TrustBadges />
        <DealsSection products={products} />
        <CategoryGrid
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />
        <ProductSection
          products={products}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
          searchQuery={searchQuery}
        />
        <CustomerReviews />
        <NewsletterSection />
      </main>

      <Footer onOpenAdmin={() => setIsAdminOpen(true)} onSelectCategory={(cat) => setSelectedCategory(cat)} />

      <CartDrawer />
      <CheckoutModal />
      <QuickViewModal />
      <LiveSalesToast />
      <FloatingActions />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onProductsUpdate={applyProducts}
        showToast={showToast}
        showcase={showcase}
        onShowcaseUpdate={applyShowcase}
      />
    </div>
  );
}

export default function Home() {
  return (
    <CartProvider>
      <NitroGamesApp />
    </CartProvider>
  );
}
