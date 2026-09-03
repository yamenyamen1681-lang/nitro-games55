"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Product, CategoryType, CATEGORIES_META, ShowcaseConfig, DEFAULT_SHOWCASE } from "@/lib/data";
import {
  X,
  Lock,
  Unlock,
  Plus,
  Edit,
  Trash2,
  Save,
  AlertCircle,
  Search,
  LogOut,
  ShieldAlert,
  Monitor
} from "lucide-react";

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductsUpdate: (updatedList: Product[]) => void;
  showToast: (msg: string) => void;
  showcase?: ShowcaseConfig;
  onShowcaseUpdate?: (cfg: ShowcaseConfig) => void;
}

const PRESET_IMAGES = [
  { label: "كيبورد RGB", url: "/images/keyboard-custom-rgb.jpg" },
  { label: "ماوس 8K", url: "/images/mouse-pro-8k.jpg" },
  { label: "ماوس باد ياباني", url: "/images/mousepad-pro.jpg" },
  { label: "ماوس باد سرعة", url: "/images/mousepad-speed.jpg" },
  { label: "مايكروفون استوديو", url: "/images/microphone-pro.jpg" },
  { label: "سماعة محيطية", url: "/images/headset-pro.jpg" },
];

export const AdminDashboardModal: React.FC<AdminDashboardModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductsUpdate,
  showToast,
  showcase,
  onShowcaseUpdate,
}) => {
  const [tab, setTab] = useState<"products" | "showcase">("products");
  const [sc, setSc] = useState<ShowcaseConfig>(showcase ?? DEFAULT_SHOWCASE);
  
  React.useEffect(() => {
    if (isOpen && showcase) setSc(showcase);
  }, [isOpen, showcase]);

  const commitShowcase = (next: ShowcaseConfig) => {
    setSc(next);
    onShowcaseUpdate?.(next);
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "showcase", value: next }),
    }).catch((err) => {
      console.warn("Showcase save error:", err);
      showToast("تعذر حفظ إعدادات المربع المميز في قاعدة البيانات ⚠️");
    });
  };

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<CategoryType>("keyboards");
  const [price, setPrice] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<string>("");
  const [description, setDescription] = useState("");
  const [brand, setBrand] = useState("");
  const [badge, setBadge] = useState("");
  const [imageUrl, setImageUrl] = useState("/images/keyboard-custom-rgb.jpg");

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = passwordInput.trim();
    if (entered === "Yamen2009Yamen") {
      setIsAuthenticated(true);
      setAuthError("");
      setPasswordInput("");
      showToast("تم التحقق بنجاح.. أهلاً بك في لوحة تحكم المشرف ⚡");
    } else {
      setAuthError("كلمة المرور غير صحيحة! يرجى إعادة المحاولة.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setEditingProduct(null);
    onClose();
  };

  const startEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setTitle(prod.title);
    setCategory(prod.category);
    setPrice(String(prod.price));
    setOriginalPrice(prod.originalPrice ? String(prod.originalPrice) : "");
    setDescription(prod.description);
    setBrand(prod.brand);
    setBadge(prod.badge || "");
    setImageUrl(prod.image);
    const formElem = document.getElementById("admin-product-form");
    if (formElem) {
      formElem.scrollIntoView({ behavior: "smooth" });
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setTitle("");
    setPrice("");
    setOriginalPrice("");
    setDescription("");
    setBrand("");
    setBadge("");
    setImageUrl("/images/keyboard-custom-rgb.jpg");
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price) {
      alert("يرجى إدخال اسم المنتج والسعر بالشيكل ₪");
      return;
    }

    const numPrice = Number(price);
    const numOrigPrice = originalPrice ? Number(originalPrice) : undefined;
    const discount =
      numOrigPrice && numOrigPrice > numPrice
        ? Math.round(((numOrigPrice - numPrice) / numOrigPrice) * 100)
        : 0;

    if (editingProduct) {
      try {
        const res = await fetch("/api/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingProduct.id,
            title: title.trim(),
            category,
            price: numPrice,
            originalPrice: numOrigPrice,
            description: description.trim(),
            brand: brand.trim() || "Nitro Games",
            badge: badge.trim() || null,
            image: imageUrl.trim(),
          }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "update failed");

        const updatedProducts = products.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                title: title.trim(),
                category,
                price: numPrice,
                originalPrice: numOrigPrice,
                discountPercent: discount,
                description: description.trim(),
                brand: brand.trim() || "Nitro Games",
                badge: badge.trim() || undefined,
                image: imageUrl.trim() || "/images/keyboard-custom-rgb.jpg",
              }
            : p
        );
        onProductsUpdate(updatedProducts);
        showToast(`تم تحديث بيانات "${title.slice(0, 24)}..." على كل الأجهزة! 💾`);
      } catch (err) {
        console.warn("Product update error:", err);
        showToast("تعذر حفظ التعديل في قاعدة البيانات — حاول مرة أخرى ⚠️");
        return;
      }
    } else {
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            category,
            price: numPrice,
            originalPrice: numOrigPrice,
            description: description.trim(),
            brand: brand.trim() || "Nitro Games",
            badge: badge.trim() || "جديد بالمتجر ⭐",
            image: imageUrl.trim(),
          }),
        });
        const data = await res.json();
        if (!data.success || !data.product) throw new Error(data.message || "insert failed");

        onProductsUpdate([data.product as Product, ...products]);
        showToast(`تمت إضافة "${title.slice(0, 24)}..." إلى المتجر على كل الأجهزة! 🚀`);
      } catch (err) {
        console.warn("Product insert error:", err);
        showToast("تعذر إضافة المنتج في قاعدة البيانات — حاول مرة أخرى ⚠️");
        return;
      }
    }

    cancelEdit();
  };

  const handleDeleteProduct = async (id: number, prodTitle: string) => {
    if (!window.confirm(`حذف نهائي للمنتج: "${prodTitle}"؟`)) {
      return;
    }

    const previousProducts = [...products];
    onProductsUpdate(products.filter((p) => p.id !== id));
    showToast("جاري حذف المنتج...");

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "delete failed");

      showToast("تم حذف المنتج من المتجر بنجاح 🗑️");
    } catch (err) {
      console.warn("Product delete error:", err);
      onProductsUpdate(previousProducts);
      showToast("تعذر الاتصال بقاعدة البيانات للحذف ⚠️");
    }
  };

  const filteredList = products
    .filter((p) => (filterCategory === "all" ? true : p.category === filterCategory))
    .filter(
      (p) =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-2xl bg-[#0b1120] border border-[#00a3ff]/35 shadow-[0_0_40px_rgba(0,163,255,0.2)] overflow-hidden my-8 text-right">
        {/* Top Header */}
        <div className="p-6 pb-4 border-b border-[#1c2942] bg-[#120e09] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1e170e] text-gray-400 hover:text-white hover:bg-[#253048] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500/25 transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white font-['Cairo']">لوحة تحكم إدارة المتجر السرية</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#00a3ff]/15 text-[#00a3ff] border border-[#00a3ff]/30 font-mono">
                  ADMIN ONLY
                </span>
              </div>
              <div className="text-xs text-gray-400">
                إدارة كاملة لمنتجات NITRO GAMES (إضافة، تعديل، وحذف)
              </div>
            </div>

            <div className="w-11 h-11 rounded-xl bg-[#1e170e] border border-[#00a3ff]/40 flex items-center justify-center text-[#00a3ff] shadow-[0_0_15px_rgba(0,163,255,0.3)]">
              {isAuthenticated ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        {isAuthenticated && (
          <div className="px-6 pt-5 flex items-center gap-2 border-b border-[#1c2942]">
            <button
              onClick={() => setTab("products")}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl cursor-pointer transition-all flex items-center gap-2 ${
                tab === "products"
                  ? "bg-[#0b1120] text-[#00a3ff] border-x border-t border-[#1c2942]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إدارة المنتجات</span>
            </button>
            <button
              onClick={() => setTab("showcase")}
              className={`px-4 py-2.5 text-xs font-bold rounded-t-xl cursor-pointer transition-all flex items-center gap-2 ${
                tab === "showcase"
                  ? "bg-[#0b1120] text-[#00a3ff] border-x border-t border-[#1c2942]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>المربع المميز (الشاشة الرئيسية)</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 max-w-md mx-auto text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-[#1e170e] border border-[#00a3ff]/30 flex items-center justify-center mx-auto text-[#00a3ff] shadow-[0_0_20px_rgba(0,163,255,0.2)]">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white font-['Cairo']">منطقة المشرف المحمية</h3>
              <p className="text-xs text-gray-400">
                أدخل كلمة المرور السرية للمشرف للوصول إلى لوحة التحكم والتحكم بالمنتجات.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-right">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">
                  كلمة المرور السرية:
                </label>
                <input
                  type="password"
                  required
                  placeholder="أدخل كلمة المرور..."
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError("");
                  }}
                  className="w-full bg-[#152034] border border-[#27405f] text-sm text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#00a3ff] text-center tracking-widest font-mono"
                  autoFocus
                />
              </div>

              {authError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-400 justify-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#00a3ff] hover:bg-[#0088dd] text-black font-black text-sm py-3.5 rounded-xl cursor-pointer transition-all shadow-[0_0_20px_rgba(0,163,255,0.4)]"
              >
                دخول لوحة التحكم 🚀
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 font-mono pt-1">
                <ShieldAlert className="w-3.5 h-3.5 text-[#00a3ff]" />
                <span>الوصول مشفر ومقتصر على المشرف فقط</span>
              </div>
            </form>
          </div>
        ) : tab === "showcase" ? (
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
            <div className="p-6 rounded-2xl bg-[#101a2e] border border-[#1c2942] space-y-4">
              <h4 className="text-sm font-black text-white font-['Cairo']">إعدادات المربع المميز</h4>
              <p className="text-xs text-gray-400">يمكنك هنا تخصيص المنتجات التي تظهر في الواجهة الرئيسية للمتجر.</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-8 max-h-[75vh] overflow-y-auto">
            <div
              id="admin-product-form"
              className="p-6 rounded-2xl bg-[#101a2e] border border-[#1c2942] space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#1c2942] pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400">
                    {editingProduct ? "تعديل المنتج المحدد:" : "نموذج إضافة منتج جديد:"}
                  </span>
                  {editingProduct && (
                    <span className="text-xs font-bold text-[#00a3ff]">#{editingProduct.id}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs text-gray-400 hover:text-white px-2.5 py-1 rounded-lg bg-[#1c2942] cursor-pointer"
                    >
                      إلغاء التعديل
                    </button>
                  )}
                  <h4 className="text-sm font-black text-white flex items-center gap-1.5 font-['Cairo']">
                    <Plus className="w-4 h-4 text-[#00a3ff]" />
                    <span>{editingProduct ? "تعديل بيانات المنتج" : "إضافة منتج جديد للكتالوج"}</span>
                  </h4>
                </div>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      اسم المنتج الكامل <span className="text-[#00a3ff]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: كيبورد Wooting 60HE+"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-[#16223a] border border-[#27405f] text-xs sm:text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00a3ff]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      الفئة <span className="text-[#00a3ff]">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as CategoryType)}
                      className="w-full bg-[#16223a] border border-[#27405f] text-xs sm:text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00a3ff]"
                    >
                      {CATEGORIES_META.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      السعر الحالي (بالشيكل ₪) <span className="text-[#00a3ff]">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="599"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-[#16223a] border border-[#27405f] text-xs sm:text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00a3ff] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      السعر القديم قبل الخصم (اختياري)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="799"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(e.target.value)}
                      className="w-full bg-[#16223a] border border-[#27405f] text-xs sm:text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00a3ff] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">الماركة / العلامة التجارية</label>
                    <input
                      type="text"
                      placeholder="Nitro Games"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-[#16223a] border border-[#27405f] text-xs sm:text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00a3ff]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">شارة العرض المميزة (Badge)</label>
                    <input
                      type="text"
                      placeholder="الأكثر مبيعاً 🔥"
                      value={badge}
                      onChange={(e) => setBadge(e.target.value)}
                      className="w-full bg-[#16223a] border border-[#27405f] text-xs sm:text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00a3ff]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-300 block mb-1">رابط صورة المنتج (URL)</label>
                    <input
                      type="text"
                      placeholder="/images/..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#16223a] border border-[#27405f] text-xs sm:text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00a3ff] font-mono"
                    />
                  </div>
                </div>

                {/* Quick Preset Images */}
                <div>
                  <label className="text-[11px] font-bold text-gray-400 block mb-1.5">صور مقترحة جاهزة:</label>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_IMAGES.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(img.url)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          imageUrl === img.url
                            ? "bg-[#00a3ff] text-black border-[#00a3ff] font-bold"
                            : "bg-[#16223a] text-gray-300 border-[#27405f] hover:border-[#00a3ff]"
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">وصف المنتج ومميزاته</label>
                  <textarea
                    rows={2}
                    placeholder="اكتب وصفاً مختصراً للمنتج..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#16223a] border border-[#27405f] text-xs sm:text-sm text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#00a3ff]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-5 py-3 rounded-xl bg-[#1c2942] hover:bg-[#27405f] text-gray-300 text-xs font-bold transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#00a3ff] hover:bg-[#0088dd] text-black font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(0,163,255,0.4)] transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{editingProduct ? "حفظ التعديلات وتحديث المتجر" : "نشر المنتج فوراً في المتجر 🚀"}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Products List Management */}
            <div className="p-6 rounded-2xl bg-[#101a2e] border border-[#1c2942] space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-[#1c2942] pb-4">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-60">
                    <input
                      type="text"
                      placeholder="بحث في المنتجات..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-[#16223a] border border-[#27405f] text-xs text-white rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-[#00a3ff]"
                    />
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-[#16223a] border border-[#27405f] text-xs font-bold text-[#00a3ff] rounded-xl px-3 py-2 focus:outline-none focus:border-[#00a3ff]"
                  >
                    <option value="all">كل الأقسام</option>
                    {CATEGORIES_META.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-gray-400 font-mono">
                  إجمالي المنتجات المعروضة: <span className="text-[#00a3ff] font-bold">{filteredList.length}</span>
                </div>
              </div>

              <div className="space-y-2.5 max-h-96 overflow-y-auto">
                {filteredList.length > 0 ? (
                  filteredList.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 rounded-xl bg-[#16223a]/60 border border-[#27405f] flex items-center justify-between gap-3 hover:border-[#00a3ff]/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-lg bg-black/50 border border-[#27405f] overflow-hidden flex-shrink-0">
                          <Image src={prod.image} alt={prod.title} fill className="object-contain p-1" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[10px] font-tech text-[#00a3ff] uppercase tracking-wider">{prod.brand}</div>
                          <h5 className="text-xs font-bold text-white truncate font-['Cairo']">{prod.title}</h5>
                          <div className="text-[11px] font-mono text-gray-400">
                            {prod.price} ₪ {prod.originalPrice ? <span className="line-through text-gray-500 mr-1">{prod.originalPrice} ₪</span> : null}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => startEditProduct(prod)}
                          className="px-3 py-1.5 rounded-lg bg-[#00a3ff]/15 hover:bg-[#00a3ff] hover:text-black text-[#00a3ff] text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id, prod.title)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500 hover:text-white text-rose-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-xs text-gray-400">لا توجد منتجات مطابقة للبحث</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
