"use client";

import { useState } from "react";
import InputStep from "@/components/steps/InputStep";
import EditStep from "@/components/steps/EditStep";
import PreviewStep from "@/components/steps/PreviewStep";
import type { GeneratedCopy, CopyContext } from "@/lib/templates";

type Step = 1 | 2 | 3;

const STEPS = [
  { n: 1, label: "Input" },
  { n: 2, label: "Confirmar" },
  { n: 3, label: "Preview" },
];

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [extracted, setExtracted] = useState<Record<string, string>>({});
  const [copy, setCopy] = useState<GeneratedCopy | null>(null);
  const [ctx, setCtx] = useState<CopyContext | null>(null);
  const [language, setLanguage] = useState("en");
  const [url, setUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleConfirm(formData: Record<string, string>) {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao gerar."); return; }
      setCopy(data.copy);
      setCtx(data.ctx);
      setLanguage(data.language);
      setUrl(data.url);
      setStep(3);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start py-12 px-4">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-10">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              step === s.n
                ? "bg-blue-600 text-white"
                : step > s.n
                ? "bg-emerald-900/50 text-emerald-400"
                : "bg-zinc-800 text-zinc-500"
            }`}>
              <span>{step > s.n ? "✓" : s.n}</span>
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 h-px ${step > s.n ? "bg-emerald-700" : "bg-zinc-700"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl bg-zinc-950 border border-white/8 rounded-2xl p-8 shadow-2xl">
        {step === 1 && (
          <InputStep
            onExtracted={(data) => {
              setExtracted(data);
              setStep(2);
            }}
          />
        )}

        {step === 2 && (
          <EditStep
            initialData={extracted}
            onConfirm={handleConfirm}
            onBack={() => setStep(1)}
            loading={generating}
          />
        )}

        {step === 3 && copy && ctx && (
          <PreviewStep
            copy={copy}
            ctx={ctx}
            language={language}
            url={url}
            onBack={() => setStep(2)}
          />
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}
      </div>

      <p className="mt-8 text-zinc-600 text-xs">
        Upadsfast — Google Ads Bulk Upload Generator
      </p>
    </main>
  );
}
