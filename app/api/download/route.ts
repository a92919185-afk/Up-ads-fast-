import { NextRequest, NextResponse } from "next/server";
import { generateXlsx } from "@/lib/excel";
import type { GeneratedCopy, CopyContext } from "@/lib/templates";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
      return NextResponse.json({ error: "Nenhum item para exportar" }, { status: 400 });
    }

    const buffer = await generateXlsx(items);

    let filename = "MATRIX_BulkUpload.xlsx";
    if (items.length === 1) {
      const { ctx } = items[0];
      filename = `${ctx.product.toUpperCase()}_${ctx.country.toUpperCase()}_BulkUpload.xlsx`;
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
