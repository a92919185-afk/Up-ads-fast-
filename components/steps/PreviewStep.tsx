"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { GeneratedCopy, CopyContext } from "@/lib/templates";
import { effectiveLength } from "@/lib/templates";

interface Props {
  copy: GeneratedCopy;
  ctx: CopyContext;
  language: string;
  url: string;
  onBack: () => void;
}

// ─── Character badge ──────────────────────────────────────────────────────────

function CharBadge({ value, limit }: { value: string; limit: number }) {
  const len = effectiveLength(value);
  const pct = len / limit;
  const color =
    len > limit  ? "bg-red-900/50 text-red-400" :
    pct < 0.70   ? "bg-amber-900/50 text-amber-400" :
                   "bg-emerald-900/50 text-emerald-400";
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded shrink-0 ${color}`}>
      {len}/{limit}
    </span>
  );
}

// ─── Inline editable cell ─────────────────────────────────────────────────────

function EditCell({
  value, limit, onChange, mono = false,
}: {
  value: string; limit: number; onChange: (v: string) => void; mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 w-full">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={1}
        className={`flex-1 bg-transparent text-zinc-200 text-sm resize-none outline-none border-b border-transparent hover:border-white/20 focus:border-blue-500 transition-colors py-0.5 leading-snug ${mono ? "font-mono text-xs" : ""}`}
        style={{ minHeight: "1.4rem" }}
        onInput={e => {
          const el = e.currentTarget;
          el.style.height = "auto";
          el.style.height = el.scrollHeight + "px";
        }}
      />
      <CharBadge value={value} limit={limit} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PreviewStep({ copy: initialCopy, ctx, language, url, onBack }: Props) {
  const [copy, setCopy] = useState<GeneratedCopy>(initialCopy);
  const [downloading, setDownloading] = useState(false);

  const setHeadline = (i: number, v: string) =>
    setCopy(c => ({ ...c, headlines: c.headlines.map((h, j) => j === i ? v : h) }));

  const setDescription = (i: number, v: string) =>
    setCopy(c => ({ ...c, descriptions: c.descriptions.map((d, j) => j === i ? v : d) }));

  const setCallout = (i: number, v: string) =>
    setCopy(c => ({ ...c, callouts: c.callouts.map((x, j) => j === i ? v : x) }));

  const setSitelinkField = (i: number, field: "text" | "d1" | "d2" | "url", v: string) =>
    setCopy(c => ({
      ...c,
      sitelinks: c.sitelinks.map((sl, j) => j === i ? { ...sl, [field]: v } : sl),
    }));

  const setSnippetValue = (i: number, v: string) =>
    setCopy(c => ({ ...c, snippetValues: c.snippetValues.map((x, j) => j === i ? v : x) }));

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
      <div>
        <h2 className="text-xl font-semibold text-white">Preview da Campanha</h2>
        <p className="text-zinc-500 text-sm">
          {copy.campaign}
          <span className="text-zinc-600 text-xs ml-2">· clique em qualquer campo para editar</span>
        </p>
      </div>

      <Tabs defaultValue="rsa" className="w-full">
        <TabsList className="w-full bg-zinc-900 border border-white/8 flex">
          {[
            { value: "rsa",       label: "RSA" },
            { value: "callouts",  label: "Callouts" },
            { value: "sitelinks", label: "Sitelinks" },
            { value: "snippets",  label: "Snippets" },
            { value: "promo",     label: "Promoção" },
          ].map(t => (
            <TabsTrigger key={t.value} value={t.value} className="flex-1 text-xs data-[state=active]:bg-zinc-700">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── RSA ── */}
        <TabsContent value="rsa" className="mt-3">
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="bg-zinc-900 border-b border-white/8">
                <th className="py-2 px-3 text-left text-zinc-500 text-xs w-10">#</th>
                <th className="py-2 px-3 text-left text-zinc-500 text-xs">Texto</th>
              </tr></thead>
              <tbody>
                {copy.headlines.map((h, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-zinc-500 text-xs font-mono">{`H${i+1}`}</td>
                    <td className="py-2 px-3"><EditCell value={h} limit={30} onChange={v => setHeadline(i, v)} /></td>
                  </tr>
                ))}
                {copy.descriptions.map((d, i) => (
                  <tr key={`d${i}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-zinc-500 text-xs font-mono">{`D${i+1}`}</td>
                    <td className="py-2 px-3"><EditCell value={d} limit={90} onChange={v => setDescription(i, v)} /></td>
                  </tr>
                ))}
                <tr className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="py-2 px-3 text-zinc-500 text-xs font-mono">P1</td>
                  <td className="py-2 px-3">
                    <EditCell value={copy.path1} limit={15} onChange={v => setCopy(c => ({ ...c, path1: v }))} mono />
                  </td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="py-2 px-3 text-zinc-500 text-xs font-mono">P2</td>
                  <td className="py-2 px-3">
                    <EditCell value={copy.path2} limit={15} onChange={v => setCopy(c => ({ ...c, path2: v }))} mono />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Callouts ── */}
        <TabsContent value="callouts" className="mt-3">
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <table className="w-full">
              <thead><tr className="bg-zinc-900 border-b border-white/8">
                <th className="py-2 px-3 text-left text-zinc-500 text-xs w-10">#</th>
                <th className="py-2 px-3 text-left text-zinc-500 text-xs">Texto</th>
              </tr></thead>
              <tbody>
                {copy.callouts.map((c, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-zinc-500 text-xs font-mono">{i+1}</td>
                    <td className="py-2 px-3"><EditCell value={c} limit={25} onChange={v => setCallout(i, v)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Sitelinks ── */}
        <TabsContent value="sitelinks" className="mt-3">
          <div className="rounded-lg border border-white/8 overflow-x-auto">
            <table className="min-w-[760px] w-full text-sm">
              <thead><tr className="bg-zinc-900 border-b border-white/8">
                <th className="py-2 px-3 text-left text-zinc-500 text-xs w-6 shrink-0">#</th>
                <th className="py-2 px-3 text-left text-zinc-500 text-xs min-w-[160px]">Texto (25)</th>
                <th className="py-2 px-3 text-left text-zinc-500 text-xs min-w-[200px]">Desc 1 (35)</th>
                <th className="py-2 px-3 text-left text-zinc-500 text-xs min-w-[200px]">Desc 2 (35)</th>
                <th className="py-2 px-3 text-left text-zinc-500 text-xs min-w-[180px]">URL</th>
              </tr></thead>
              <tbody>
                {copy.sitelinks.map((sl, i) => (
                  <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02] align-top">
                    <td className="py-2 px-3 text-zinc-500 text-xs font-mono pt-3 shrink-0">{i+1}</td>
                    <td className="py-2 px-3"><EditCell value={sl.text} limit={25} onChange={v => setSitelinkField(i, "text", v)} /></td>
                    <td className="py-2 px-3"><EditCell value={sl.d1}   limit={35} onChange={v => setSitelinkField(i, "d1",   v)} /></td>
                    <td className="py-2 px-3"><EditCell value={sl.d2}   limit={35} onChange={v => setSitelinkField(i, "d2",   v)} /></td>
                    <td className="py-2 px-3">
                      <EditCell value={sl.url} limit={2048} onChange={v => setSitelinkField(i, "url", v)} mono />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-zinc-600 text-xs mt-2">URLs com pequenas variações — necessário para o Google aceitar sitelinks sem rejeitar links idênticos</p>
        </TabsContent>

        {/* ── Snippets ── */}
        <TabsContent value="snippets" className="mt-3">
          <div className="rounded-lg border border-white/8 p-4 space-y-3">
            <p className="text-zinc-400 text-xs uppercase tracking-wide">Header</p>
            <p className="text-white font-medium">{copy.snippetHeader}</p>
            <p className="text-zinc-400 text-xs uppercase tracking-wide mt-3">Valores</p>
            <div className="flex flex-col gap-2">
              {copy.snippetValues.map((v, i) => (
                <EditCell key={i} value={v} limit={25} onChange={val => setSnippetValue(i, val)} />
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Promoção ── */}
        <TabsContent value="promo" className="mt-3">
          <div className="rounded-lg border border-white/8 p-4 space-y-3">
            {([
              ["Campanha", copy.campaign],
              ["Occasion", copy.promo.occasion],
              ["Discount type", copy.promo.discountType],
              ["Percent off", String(copy.promo.percentOff)],
            ] as [string, string][]).map(([k, v]) => (
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
