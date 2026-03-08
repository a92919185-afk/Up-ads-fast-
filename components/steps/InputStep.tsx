"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Props {
  onExtracted: (data: Record<string, string>) => void;
}

export default function InputStep({ onExtracted }: Props) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsText, setNeedsText] = useState(false);

  async function handleExtract(mode: "url" | "text") {
    setLoading(true);
    setError("");
    setNeedsText(false);
    try {
      const body = mode === "url" ? { url } : { text, url };
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsText) setNeedsText(true);
        setError(data.error ?? "Erro ao extrair dados.");
        return;
      }
      onExtracted({ ...data, url: url || data.url });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Upadsfast</h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          Cole a URL ou o texto da página de oferta. A IA extrai as variáveis automaticamente.
        </p>
      </div>

      <Tabs defaultValue="url" className="w-full">
        <TabsList className="w-full bg-zinc-900 border border-white/8">
          <TabsTrigger value="url" className="flex-1 data-[state=active]:bg-zinc-700">
            🔗 URL
          </TabsTrigger>
          <TabsTrigger value="text" className="flex-1 data-[state=active]:bg-zinc-700">
            📋 Texto Completo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-4 space-y-3">
          <Input
            placeholder="https://seusite.com/oferta"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="bg-zinc-900 border-white/10 text-white placeholder:text-zinc-500 h-12 text-base"
            onKeyDown={e => e.key === "Enter" && handleExtract("url")}
          />
          {needsText && (
            <p className="text-amber-400 text-xs">
              ⚠️ A página usa JavaScript. Cole o texto na aba "Texto Completo".
            </p>
          )}
          <Button
            onClick={() => handleExtract("url")}
            disabled={!url || loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base"
          >
            {loading ? "Extraindo..." : "Extrair Dados"}
          </Button>
        </TabsContent>

        <TabsContent value="text" className="mt-4 space-y-3">
          <Input
            placeholder="URL final do anúncio (opcional)"
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="bg-zinc-900 border-white/10 text-white placeholder:text-zinc-500"
          />
          <Textarea
            placeholder="Cole aqui o texto completo da página de oferta (Ctrl+A → Ctrl+C na página)..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={10}
            className="bg-zinc-900 border-white/10 text-white placeholder:text-zinc-500 resize-none text-sm"
          />
          <Button
            onClick={() => handleExtract("text")}
            disabled={!text || loading}
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-base"
          >
            {loading ? "Extraindo..." : "Extrair Dados"}
          </Button>
        </TabsContent>
      </Tabs>

      {error && !needsText && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
