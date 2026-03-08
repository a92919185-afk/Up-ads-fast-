"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const LANGUAGES = [
  { value: "en", label: "🇺🇸 English (en)" },
  { value: "pt", label: "🇧🇷 Português (pt)" },
  { value: "es", label: "🇪🇸 Español (es)" },
  { value: "de", label: "🇩🇪 Deutsch (de)" },
  { value: "fr", label: "🇫🇷 Français (fr)" },
  { value: "fi", label: "🇫🇮 Suomi (fi)" },
  { value: "da", label: "🇩🇰 Dansk (da)" },
  { value: "ro", label: "🇷🇴 Română (ro)" },
];

interface Props {
  initialData: Record<string, string>;
  onConfirm: (data: Record<string, string>) => void;
  onBack: () => void;
  loading: boolean;
}

export default function EditStep({ initialData, onConfirm, onBack, loading }: Props) {
  const [form, setForm] = useState({
    product:          initialData.product         ?? "",
    country:          initialData.country         ?? "",
    language:         LANGUAGES.find(l => l.value === initialData.language) ? initialData.language : "",
    price:            initialData.price           ?? "",
    currency:         initialData.currency        ?? "$",
    discount:         initialData.discount        ?? "",
    guarantee:        initialData.guarantee       ?? "30",
    ship_min:         initialData.ship_min        ?? "0",
    has_free_shipping:initialData.has_free_shipping ?? "yes",
    url:              initialData.url             ?? "",
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const field = (label: string, key: string, placeholder = "") => (
    <div className="space-y-1.5">
      <Label className="text-zinc-400 text-xs uppercase tracking-wide">{label}</Label>
      <Input
        value={form[key as keyof typeof form]}
        onChange={set(key)}
        placeholder={placeholder}
        className="bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 h-10"
      />
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-white">Confirmar Variáveis</h2>
        <p className="text-zinc-500 text-sm">A IA extraiu esses dados. Edite o que precisar antes de gerar.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {field("Produto", "product", "CAPNOS")}
        {field("País", "country", "US")}

        <div className="space-y-1.5">
          <Label className={`text-xs uppercase tracking-wide ${!form.language ? "text-amber-400" : "text-zinc-400"}`}>
            Idioma {!form.language && "⚠ selecione"}
          </Label>
          <Select value={form.language} onValueChange={(v) => setForm(f => ({ ...f, language: v ?? f.language }))}>
            <SelectTrigger className={`bg-zinc-900 text-white h-10 ${!form.language ? "border-amber-500/60" : "border-white/10"}`}>
              <SelectValue placeholder="Selecione o idioma" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-white/10">
              {LANGUAGES.map(l => (
                <SelectItem key={l.value} value={l.value} className="text-white hover:bg-zinc-800">
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {field("Moeda", "currency", "$")}
        {field("Preço", "price", "37")}
        {field("Desconto (%)", "discount", "50")}
        {field("Garantia (dias)", "guarantee", "30")}
        {field("Frete grátis acima de", "ship_min", "74")}
      </div>

      <div className="space-y-1.5">
        <Label className="text-zinc-400 text-xs uppercase tracking-wide">URL Final do Anúncio</Label>
        <Input
          value={form.url}
          onChange={set("url")}
          placeholder="https://seusite.com/oferta"
          className="bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 h-10"
        />
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
        >
          ← Voltar
        </Button>
        <Button
          onClick={() => onConfirm(form)}
          disabled={!form.product || !form.url || !form.language || loading}
          className="flex-1 h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold"
        >
          {loading ? "Gerando..." : "Gerar Planilha →"}
        </Button>
      </div>
    </div>
  );
}
