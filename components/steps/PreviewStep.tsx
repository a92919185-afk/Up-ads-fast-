"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GeneratedCopy, CopyContext } from "@/lib/templates";

interface Props {
  copy: GeneratedCopy;
  ctx: CopyContext;
  language: string;
  url: string;
  onBack: () => void;
}

function CharBadge({ value, limit }: { value: string; limit: number }) {
  const len = value.length;
  const ok = len <= limit;
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${ok ? "bg-emerald-900/50 text-emerald-400" : "bg-red-900/50 text-red-400"}`}>
      {len}/{limit}
    </span>
  );
}

function Row({ label, value, limit }: { label: string; value: string; limit: number }) {
  return (
    <tr className="border-b border-white/5 hover:bg-white/2">
      <td className="py-2 px-3 text-zinc-500 text-xs font-mono w-12">{label}</td>
      <td className="py-2 px-3 text-zinc-200 text-sm">{value}</td>
      <td className="py-2 px-3 text-right"><CharBadge value={value} limit={limit} /></td>
    </tr>
  );
}

export default function PreviewStep({ copy, ctx, language, url, onBack }: Props) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copy, ctx, language, url }),
      });
      if (!res.ok) { alert("Erro ao gerar arquivo."); return; }
      const blob = await res.blob();
      const filename = `${ctx.product.toUpperCase()}_${ctx.country.toUpperCase()}_BulkUpload.xlsx`;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Preview da Campanha</h2>
          <p className="text-zinc-500 text-sm">{copy.campaign}</p>
        </div>
        <Badge className="bg-emerald-900/40 text-emerald-400 border-emerald-800">✓ Limites OK</Badge>
      </div>

      <Tabs defaultValue="rsa" className="w-full">
        <TabsList className="w-full bg-zinc-900 border border-white/8 flex">
          {[
            { value: "rsa",      label: "RSA" },
            { value: "callouts", label: "Callouts" },
            { value: "sitelinks",label: "Sitelinks" },
            { value: "snippets", label: "Snippets" },
            { value: "promo",    label: "Promoção" },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1 text-xs data-[state=active]:bg-zinc-700">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="rsa" className="mt-3">
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-900 border-b border-white/8">
                <th className="py-2 px-3 text-left text-zinc-500 text-xs w-12">#</th>
                <th className="py-2 px-3 text-left text-zinc-500 text-xs">Texto</th>
                <th className="py-2 px-3 text-right text-zinc-500 text-xs">Chars</th>
              </tr></thead>
              <tbody>
                {copy.headlines.map((h, i) => <Row key={i} label={`H${i+1}`} value={h} limit={30} />)}
                {copy.descriptions.map((d, i) => <Row key={i} label={`D${i+1}`} value={d} limit={90} />)}
                <tr className="border-b border-white/5">
                  <td className="py-2 px-3 text-zinc-500 text-xs">P1</td>
                  <td className="py-2 px-3 text-zinc-200 text-sm">{copy.path1}</td>
                  <td className="py-2 px-3 text-right"><CharBadge value={copy.path1} limit={15} /></td>
                </tr>
                <tr>
                  <td className="py-2 px-3 text-zinc-500 text-xs">P2</td>
                  <td className="py-2 px-3 text-zinc-200 text-sm">{copy.path2}</td>
                  <td className="py-2 px-3 text-right"><CharBadge value={copy.path2} limit={15} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="callouts" className="mt-3">
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-zinc-900 border-b border-white/8">
                <th className="py-2 px-3 text-left text-zinc-500 text-xs">Texto</th>
                <th className="py-2 px-3 text-right text-zinc-500 text-xs">Chars</th>
              </tr></thead>
              <tbody>
                {copy.callouts.map((c, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-2 px-3 text-zinc-200 text-sm">{c}</td>
                    <td className="py-2 px-3 text-right"><CharBadge value={c} limit={25} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="sitelinks" className="mt-3">
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-900 border-b border-white/8">
                <th className="py-2 px-3 text-left text-zinc-500 text-xs">Text</th>
                <th className="py-2 px-3 text-left text-zinc-500 text-xs">Desc 1</th>
                <th className="py-2 px-3 text-left text-zinc-500 text-xs">Desc 2</th>
              </tr></thead>
              <tbody>
                {copy.sitelinks.map((sl, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0">
                    <td className="py-2 px-3">
                      <div className="text-zinc-200">{sl.text}</div>
                      <CharBadge value={sl.text} limit={25} />
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-zinc-300 text-xs">{sl.d1}</div>
                      <CharBadge value={sl.d1} limit={35} />
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-zinc-300 text-xs">{sl.d2}</div>
                      <CharBadge value={sl.d2} limit={35} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="snippets" className="mt-3">
          <div className="rounded-lg border border-white/8 p-4 space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wide">Header</p>
            <p className="text-white font-medium">{copy.snippetHeader}</p>
            <p className="text-zinc-400 text-xs uppercase tracking-wide mt-3">Valores</p>
            <div className="flex flex-wrap gap-2">
              {copy.snippetValues.map((v, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="text-zinc-200 text-sm">{v}</span>
                  <CharBadge value={v} limit={25} />
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="promo" className="mt-3">
          <div className="rounded-lg border border-white/8 p-4 space-y-3">
            {[
              ["Campanha", copy.campaign],
              ["Occasion", copy.promo.occasion],
              ["Discount type", copy.promo.discountType],
              ["Percent off", String(copy.promo.percentOff)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-zinc-500 text-sm">{k}</span>
                <span className="text-zinc-200 text-sm font-mono">{v}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          ← Voltar
        </Button>
        <Button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base"
        >
          {downloading ? "Gerando arquivo..." : "⬇ Baixar .xlsx para Upload"}
        </Button>
      </div>
    </div>
  );
}
