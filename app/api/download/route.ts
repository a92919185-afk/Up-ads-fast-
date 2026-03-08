import { NextRequest, NextResponse } from "next/server";
import { generateXlsx } from "@/lib/excel";
import type { GeneratedCopy, CopyContext } from "@/lib/templates";

export async function POST(req: NextRequest) {
  try {
    const { copy, ctx, language, url } = await req.json() as {
      copy: GeneratedCopy;
      ctx: CopyContext;
      language: string;
      url: string;
    };

    const buffer = await generateXlsx(copy, ctx, language, url);
    const filename = `${ctx.product.toUpperCase()}_${ctx.country.toUpperCase()}_BulkUpload.xlsx`;

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
