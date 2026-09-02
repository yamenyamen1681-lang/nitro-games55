import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { ensureDbReady } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/settings?key=showcase
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { success: false, message: "المفتاح (key) مطلوب" },
        { status: 400 }
      );
    }

    await ensureDbReady();

    const [row] = await db.select().from(settings).where(eq(settings.key, key));

    return NextResponse.json({
      success: true,
      value: row ? row.value : null,
    });
  } catch (error) {
    console.error("Settings API GET error:", error);
    return NextResponse.json({ success: true, value: null });
  }
}

// PUT /api/settings  { key, value }
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, message: "المفتاح (key) والقيمة (value) مطلوبان" },
        { status: 400 }
      );
    }

    await ensureDbReady();

    await db
      .insert(settings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value, updatedAt: new Date() },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings API PUT error:", error);
    return NextResponse.json(
      { success: false, message: "تعذر حفظ الإعدادات في قاعدة البيانات" },
      { status: 500 }
    );
  }
}
