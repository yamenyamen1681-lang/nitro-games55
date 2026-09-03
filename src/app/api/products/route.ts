import { NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { ensureDbReady } from "@/db/schema";
import { INITIAL_PRODUCTS, Product, CategoryType } from "@/lib/data";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const query = searchParams.get("q")?.toLowerCase();

    // تهيئة الجداول تلقائياً عند أول تشغيل فقط
    await ensureDbReady();

    let dbProducts = await db.select().from(products);

    // التحقق فقط إذا كانت القاعدة فارغة تماماً لأول مرة
    if (!dbProducts || dbProducts.length === 0) {
      try {
        for (const item of INITIAL_PRODUCTS) {
          await db.insert(products).values({
            slug: item.slug,
            title: item.title,
            titleEn: item.titleEn,
            brand: item.brand,
            category: item.category,
            price: item.price,
            originalPrice: item.originalPrice ?? null,
            discountPercent: item.discountPercent ?? 0,
            image: item.image,
            inStock: item.inStock,
            stockQuantity: item.stockQuantity,
            rating: item.rating,
            reviewCount: item.reviewCount,
            badge: item.badge ?? null,
            description: item.description,
            specs: item.specs,
            isFeatured: item.isFeatured,
          });
        }
        dbProducts = await db.select().from(products);
      } catch (seedErr) {
        console.warn("DB seed warning:", seedErr);
      }
    }

    const validCategories = ["keyboards", "mice", "mousepads", "microphones", "headsets"];

    const items: Product[] = (dbProducts && dbProducts.length > 0)
      ? dbProducts
          .filter((p) => validCategories.includes(p.category))
          .map((p) => ({
            id: p.id,
            slug: p.slug,
            title: p.title,
            titleEn: p.titleEn,
            brand: p.brand,
            category: p.category as CategoryType,
            price: p.price,
            originalPrice: p.originalPrice ?? undefined,
            discountPercent: p.discountPercent ?? undefined,
            image: p.image,
            inStock: p.inStock,
            stockQuantity: p.stockQuantity,
            rating: p.rating,
            reviewCount: p.reviewCount,
            badge: p.badge ?? undefined,
            description: p.description,
            specs: (p.specs as string[]) ?? [],
            isFeatured: p.isFeatured,
          }))
      : [];

    let filtered = items;

    if (category && category !== "all") {
      filtered = filtered.filter((p) => p.category === category);
    }

    if (query) {
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.titleEn.toLowerCase().includes(query) ||
          p.brand.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query)
      );
    }

    return NextResponse.json(
      { success: true, products: filtered },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error) {
    console.error("Products API GET error:", error);
    return NextResponse.json({ success: false, products: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, price, description, image, brand, badge, originalPrice } = body;

    if (!title || !category || !price) {
      return NextResponse.json(
        { success: false, message: "يرجى تعبئة الحقول الإلزامية" },
        { status: 400 }
      );
    }

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const cleanPrice = Number(price);
    const cleanOrigPrice = originalPrice ? Number(originalPrice) : null;
    const discount = cleanOrigPrice && cleanOrigPrice > cleanPrice
      ? Math.round(((cleanOrigPrice - cleanPrice) / cleanOrigPrice) * 100)
      : 0;

    const [inserted] = await db
      .insert(products)
      .values({
        slug,
        title,
        titleEn: title,
        brand: brand || "Nitro Games",
        category,
        price: cleanPrice,
        originalPrice: cleanOrigPrice,
        discountPercent: discount,
        image: image || "/images/keyboard-custom-rgb.jpg",
        inStock: true,
        stockQuantity: 10,
        rating: 5.0,
        reviewCount: 1,
        badge: badge || "جديد في المتجر ⭐",
        description: description || "منتج قيمنق أصلي مكفول من NITRO GAMES",
        specs: ["ضمان لمدة سنة كاملة", "توصيل سريع لكافة المناطق والداخل"],
        isFeatured: true,
      })
      .returning();

    return NextResponse.json({
      success: true,
      product: inserted,
      message: "تمت إضافة المنتج بنجاح!",
    });
  } catch (error) {
    console.error("Products API POST error:", error);
    return NextResponse.json({ success: false, message: "تعذر حفظ المنتج" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, title, category, price, description, image, brand, badge, originalPrice } = body;

    if (!id || !title || !price) {
      return NextResponse.json({ success: false, message: "بيانات غير صالحة" }, { status: 400 });
    }

    const cleanPrice = Number(price);
    const cleanOrigPrice = originalPrice ? Number(originalPrice) : null;
    const discount = cleanOrigPrice && cleanOrigPrice > cleanPrice
      ? Math.round(((cleanOrigPrice - cleanPrice) / cleanOrigPrice) * 100)
      : 0;

    const [updated] = await db
      .update(products)
      .set({
        title,
        titleEn: title,
        brand: brand || "Nitro Games",
        category,
        price: cleanPrice,
        originalPrice: cleanOrigPrice,
        discountPercent: discount,
        image: image || "/images/keyboard-custom-rgb.jpg",
        badge: badge || null,
        description: description || "",
      })
      .where(eq(products.id, Number(id)))
      .returning();

    return NextResponse.json({ success: true, product: updated });
  } catch (error) {
    console.error("Products API PUT error:", error);
    return NextResponse.json({ success: false, message: "تعذر التحديث" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, message: "معرف المنتج مطلوب" }, { status: 400 });
    }

    const numericId = Number(id);

    const deletedRows = await db
      .delete(products)
      .where(eq(products.id, numericId))
      .returning();

    if (!deletedRows || deletedRows.length === 0) {
      return NextResponse.json({ success: false, message: "المنتج غير موجود" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "تم حذف المنتج بنجاح نهائياً من قاعدة البيانات",
    });
  } catch (error) {
    console.error("Products API DELETE error:", error);
    return NextResponse.json({ success: false, message: "تعذر الحذف" }, { status: 500 });
  }
}
