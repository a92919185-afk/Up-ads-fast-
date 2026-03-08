"use client";

import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ─── Idiomas em Português ────────────────────────────────────────────────────

const LANGUAGES = [
  { value: "en", label: "🇺🇸 Inglês (en)" },
  { value: "pt", label: "🇧🇷 Português (pt)" },
  { value: "es", label: "🇪🇸 Espanhol (es)" },
  { value: "de", label: "🇩🇪 Alemão (de)" },
  { value: "fr", label: "🇫🇷 Francês (fr)" },
  { value: "fi", label: "🇫🇮 Finlandês (fi)" },
  { value: "da", label: "🇩🇰 Dinamarquês (da)" },
  { value: "ro", label: "🇷🇴 Romeno (ro)" },
  { value: "bg", label: "🇧🇬 Búlgaro (bg)" },
];

// ─── Países em Português ──────────────────────────────────────────────────────

const COUNTRIES = [
  { value: "US", label: "Estados Unidos" },
  { value: "BR", label: "Brasil" },
  { value: "PT", label: "Portugal" },
  { value: "ES", label: "Espanha" },
  { value: "FR", label: "França" },
  { value: "DE", label: "Alemanha" },
  { value: "IT", label: "Itália" },
  { value: "GB", label: "Reino Unido" },
  { value: "NL", label: "Holanda" },
  { value: "BE", label: "Bélgica" },
  { value: "AT", label: "Áustria" },
  { value: "CH", label: "Suíça" },
  { value: "SE", label: "Suécia" },
  { value: "NO", label: "Noruega" },
  { value: "DK", label: "Dinamarca" },
  { value: "FI", label: "Finlândia" },
  { value: "PL", label: "Polônia" },
  { value: "CZ", label: "República Tcheca" },
  { value: "SK", label: "Eslováquia" },
  { value: "HU", label: "Hungria" },
  { value: "RO", label: "Romênia" },
  { value: "BG", label: "Bulgária" },
  { value: "GR", label: "Grécia" },
  { value: "HR", label: "Croácia" },
  { value: "SI", label: "Eslovênia" },
  { value: "IE", label: "Irlanda" },
  { value: "LU", label: "Luxemburgo" },
  { value: "CA", label: "Canadá" },
  { value: "AU", label: "Austrália" },
  { value: "NZ", label: "Nova Zelândia" },
  { value: "MX", label: "México" },
  { value: "AR", label: "Argentina" },
  { value: "CO", label: "Colômbia" },
  { value: "CL", label: "Chile" },
  { value: "PE", label: "Peru" },
  { value: "EC", label: "Equador" },
  { value: "UY", label: "Uruguai" },
  { value: "PY", label: "Paraguai" },
  { value: "BO", label: "Bolívia" },
  { value: "VE", label: "Venezuela" },
  { value: "JP", label: "Japão" },
  { value: "KR", label: "Coreia do Sul" },
  { value: "IN", label: "Índia" },
  { value: "ZA", label: "África do Sul" },
  { value: "AE", label: "Emirados Árabes" },
  { value: "SA", label: "Arábia Saudita" },
  { value: "IL", label: "Israel" },
  { value: "TR", label: "Turquia" },
  { value: "UA", label: "Ucrânia" },
  { value: "RS", label: "Sérvia" },
];

// ─── Combobox de País ─────────────────────────────────────────────────────────

function CountrySelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = COUNTRIES.find(c => c.value === value);

  const filtered = COUNTRIES.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.value.toLowerCase().includes(query.toLowerCase())
  );

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Input
        value={open ? query : (selected ? `${selected.label} (${selected.value})` : value)}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => { setQuery(""); setOpen(true); }}
        placeholder="Digite para buscar país..."
        className="bg-zinc-900 border-white/10 text-white placeholder:text-zinc-600 h-10"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full mt-1 w-full bg-zinc-900 border border-white/10 rounded-md shadow-xl max-h-52 overflow-y-auto">
          {filtered.slice(0, 12).map(c => (
            <div
              key={c.value}
              onMouseDown={() => { onChange(c.value); setOpen(false); setQuery(""); }}
              className={`flex items-center justify-between px-3 py-2 cursor-pointer text-sm hover:bg-zinc-800 ${value === c.value ? "text-blue-400" : "text-zinc-200"}`}
            >
              <span>{c.label}</span>
              <span className="text-zinc-500 font-mono text-xs">{c.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── EditStep ─────────────────────────────────────────────────────────────────

interface Props {
  initialData: Record<string, string>;
  onConfirm: (data: Record<string, string>) => void;
  onBack: () => void;
  loading: boolean;
}

export default function EditStep({ initialData, onConfirm, onBack, loading }: Props) {
  const [form, setForm] = useState({
    product:          initialData.product          ?? "",
    country:          initialData.country          ?? "",
    language:         LANGUAGES.find(l => l.value === initialData.language) ? initialData.language : "",
    price:            initialData.price            ?? "",
    currency:         initialData.currency         ?? "$",
    discount:         initialData.discount         ?? "",
    guarantee:        initialData.guarantee        ?? "",
    has_free_shipping: initialData.has_free_shipping === "yes" ? "yes" : "no",
    url:              initialData.url              ?? "",
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

        {/* País buscável */}
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs uppercase tracking-wide">País</Label>
          <CountrySelect
            value={form.country}
            onChange={v => setForm(f => ({ ...f, country: v }))}
          />
        </div>

        {/* Idioma */}
        <div className="space-y-1.5">
          <Label className={`text-xs uppercase tracking-wide ${!form.language ? "text-amber-400" : "text-zinc-400"}`}>
            Idioma {!form.language && "⚠ selecione"}
          </Label>
          <Select value={form.language} onValueChange={v => setForm(f => ({ ...f, language: v ?? f.language }))}>
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

        {/* Frete grátis */}
        <div className="space-y-1.5">
          <Label className="text-zinc-400 text-xs uppercase tracking-wide">Frete Grátis</Label>
          <div className="flex gap-2 h-10">
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, has_free_shipping: "yes" }))}
              className={`flex-1 rounded-md text-sm font-medium border transition-colors ${
                form.has_free_shipping === "yes"
                  ? "bg-emerald-600 border-emerald-500 text-white"
                  : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setForm(f => ({ ...f, has_free_shipping: "no" }))}
              className={`flex-1 rounded-md text-sm font-medium border transition-colors ${
                form.has_free_shipping === "no"
                  ? "bg-red-900 border-red-700 text-white"
                  : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
              }`}
            >
              Não
            </button>
          </div>
        </div>
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
