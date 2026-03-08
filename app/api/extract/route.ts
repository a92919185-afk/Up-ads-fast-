import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getApiKey(): string {
  // Primary: Next.js env loading
  if (process.env.OPENROUTER_API_KEY?.trim()) {
    return process.env.OPENROUTER_API_KEY.trim();
  }
  // Fallback: read .env.local directly
  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = fs.readFileSync(envPath, "utf8");
    const match = content.match(/OPENROUTER_API_KEY=(.+)/);
    if (match?.[1]?.trim()) return match[1].trim();
  } catch { /* ignore */ }
  return "";
}

const EXTRACT_PROMPT = `You are a data extraction assistant for Google Ads campaigns.
Extract the following fields from the offer page text and return ONLY valid JSON:

{
  "product": "Product name (short, no extra words)",
  "country": "Two-letter country code (US, BR, DK, DE, etc.)",
  "language": "Two-letter language code (en, pt, es, de, da, etc.)",
  "price": "Numeric price without currency symbol (e.g. 37 or 36.65)",
  "currency": "Currency symbol only (e.g. $, R$, €)",
  "discount": "Discount percentage as integer string (e.g. 50)",
  "guarantee": "Guarantee in days as string (e.g. 30 or 60)",
  "ship_min": "Minimum order value for free shipping as number string, or 0 if no minimum",
  "has_free_shipping": "yes or no",
  "url": "The final destination URL if found, otherwise empty string"
}

Rules:
- If a field is not found, use empty string or 0
- Return ONLY the JSON object, no markdown, no explanation
- For "discount": look for % off, sale %, etc.
- For "language": detect from the page content language
- For "country": infer from shipping info, prices, language, domain`;

async function extractFromText(text: string): Promise<Record<string, string>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Chave da API ausente! Crie o arquivo web/.env.local com: OPENROUTER_API_KEY=sk-or-v1-...");
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "Upadsfast Web App",
    },
    body: JSON.stringify({
      model: "minimax/minimax-m2.5",
      messages: [
        {
          role: "user",
          content: `${EXTRACT_PROMPT}\n\nOffer page content:\n${text.slice(0, 8000)}`,
        },
      ],
      response_format: { type: "json_object" }
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter API error: ${res.statusText} - ${errText}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content?.trim();

  if (!raw) throw new Error("No response content from OpenRouter");

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON found in response");

  return JSON.parse(jsonMatch[0]);
}

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Upadsfast/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    const html = await res.text();
    // Strip HTML tags and collapse whitespace
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, text } = body as { url?: string; text?: string };

    if (!url && !text) {
      return NextResponse.json({ error: "Forneça url ou text" }, { status: 400 });
    }

    let content = text ?? "";

    if (url && !content) {
      const fetched = await fetchPageText(url);
      content = fetched || "";
    }

    if (url && content.length < 100) {
      // Page likely JS-rendered — return a partial result asking user to paste text
      return NextResponse.json({
        error: "A página usa JavaScript e não pôde ser lida automaticamente. Cole o texto da página na aba 'Texto Completo'.",
        needsText: true,
      }, { status: 422 });
    }

    if (!content) {
      return NextResponse.json({ error: "Nenhum conteúdo para processar." }, { status: 400 });
    }

    const extracted = await extractFromText(content);

    // If URL was provided and extraction found no URL, use the provided URL
    if (url && !extracted.url) extracted.url = url;

    return NextResponse.json(extracted);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
