"use client";

import { useState, useEffect } from "react";
import InputStep from "@/components/steps/InputStep";
import EditStep from "@/components/steps/EditStep";
import PreviewStep from "@/components/steps/PreviewStep";
import MatrixStep from "@/components/steps/MatrixStep";
import type { GeneratedCopy, CopyContext } from "@/lib/templates";
import type { MatrixItem } from "@/lib/excel";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: "Input" },
  { n: 2, label: "Confirmar" },
  { n: 3, label: "Preview" },
  { n: 4, label: "Matriz" },
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

  // Matrix State
  const [matrix, setMatrix] = useState<MatrixItem[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("upads_matrix");
    if (saved) {
      try {
        setMatrix(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load matrix", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem("upads_matrix", JSON.stringify(matrix));
  }, [matrix]);

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

  function handleAddToMatrix(item: MatrixItem) {
    setMatrix(prev => [...prev, item]);
    setStep(4); // Go to matrix view
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-start py-12 px-4 bg-black text-zinc-400">
      {/* Stepper */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto max-w-full pb-2">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (s.n === 4 || step > s.n || (s.n === 1)) setStep(s.n as Step);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${step === s.n
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : step > s.n
                    ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60"
                    : "bg-zinc-900/50 text-zinc-600 hover:bg-zinc-800"
                }`}
            >
              <span className="w-4 h-4 flex items-center justify-center rounded-full bg-black/20">
                {step > s.n ? "✓" : s.n}
              </span>
              <span>{s.label}</span>
              {s.n === 4 && matrix.length > 0 && (
                <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 animate-pulse">
                  {matrix.length}
                </span>
              )}
            </button>
            {i < STEPS.length - 1 && (
              <div className={`w-6 h-px ${step > s.n ? "bg-emerald-800" : "bg-zinc-800"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="w-full max-w-3xl bg-zinc-950 border border-white/8 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

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
            onAddToMatrix={handleAddToMatrix}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <MatrixStep
            items={matrix}
            onRemove={(i) => setMatrix(prev => prev.filter((_, j) => i !== j))}
            onClear={() => {
              if (confirm("Tem certeza que deseja apagar toda a matriz?")) setMatrix([]);
            }}
            onBack={() => setStep(copy ? 3 : 1)}
          />
        )}

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center bg-red-950/20 py-2 rounded-lg border border-red-900/30">
            {error}
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="text-zinc-600 text-xs">
          Upadsfast — Google Ads Bulk Upload Matrix Generator
        </p>
        <div className="flex gap-4 text-[10px] text-zinc-700 uppercase tracking-widest">
          <span>v2.0 Beta</span>
          <span>•</span>
          <span>70-90% Density Enforced</span>
        </div>
      </div>
    </main>
  );
}
