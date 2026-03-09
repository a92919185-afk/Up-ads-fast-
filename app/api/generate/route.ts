import { NextRequest, NextResponse } from "next/server";
import { generateAllCopy, validateCopy, type CopyContext } from "@/lib/templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      product, country, language, price, currency,
      discount, guarantee, ship_min, has_free_shipping, url,
      budget, target_cpa,
    } = body as Record<string, string>;

    if (!product || !country || !language || !url) {
      return NextResponse.json({ error: "Campos obrigatórios: product, country, language, url" }, { status: 400 });
    }

    const ctx: CopyContext = {
      product: product.trim(),
      country: country.trim().toUpperCase(),
      discount: discount?.trim() || "0",
      guarantee: guarantee?.trim() || "",
      price: price?.trim() || "0",
      currency: currency?.trim() || "$",
      ship_min: ship_min?.trim() || "0",
      has_free_shipping: has_free_shipping?.trim() || "no",
      budget: budget?.trim() || "10",
      target_cpa: target_cpa?.trim() || "5",
    };

    const copy = generateAllCopy(ctx, language.toLowerCase(), url);
    const validation = validateCopy(copy);

    return NextResponse.json({ copy, validation, ctx, language, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
