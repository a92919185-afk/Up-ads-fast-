"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MatrixItem } from "@/lib/excel";

interface Props {
    items: MatrixItem[];
    onRemove: (index: number) => void;
    onClear: () => void;
    onBack: () => void;
}

export default function MatrixStep({ items, onRemove, onClear, onBack }: Props) {
    const [exporting, setExporting] = useState(false);

    async function handleExport() {
        if (items.length === 0) return;
        setExporting(true);
        try {
            const res = await fetch("/api/download", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(items),
            });
            if (!res.ok) { alert("Erro ao gerar arquivo da matriz."); return; }
            const blob = await res.blob();
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = `MATRIX_BulkUpload_${new Date().toISOString().slice(0, 10)}.xlsx`;
            a.click();
            URL.revokeObjectURL(a.href);
        } finally {
            setExporting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-semibold text-white">Gerenciar Matriz</h2>
                    <p className="text-zinc-500 text-sm">
                        {items.length} {items.length === 1 ? "campanha acumulada" : "campanhas acumuladas"}
                    </p>
                </div>
                {items.length > 0 && (
                    <Button
                        variant="ghost"
                        onClick={onClear}
                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 text-xs h-8"
                    >
                        Limpar Tudo
                    </Button>
                )}
            </div>

            <div className="rounded-xl border border-white/8 bg-zinc-900/30 overflow-hidden">
                {items.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-zinc-600 text-sm italic">Sua matriz está vazia.</p>
                        <p className="text-zinc-700 text-xs mt-1">Gere uma campanha e clique em "Adicionar à Matriz".</p>
                    </div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-zinc-900/80 border-b border-white/8">
                                <th className="py-2.5 px-4 text-left text-zinc-500 text-xs font-medium uppercase tracking-wider">Campanha</th>
                                <th className="py-2.5 px-4 text-left text-zinc-500 text-xs font-medium uppercase tracking-wider">País</th>
                                <th className="py-2.5 px-4 text-left text-zinc-500 text-xs font-medium uppercase tracking-wider">Idioma</th>
                                <th className="py-2.5 px-4 text-right text-zinc-500 text-xs font-medium uppercase tracking-wider w-20">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {items.map((it, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="py-3 px-4 text-zinc-200 font-medium">{it.copy.campaign}</td>
                                    <td className="py-3 px-4 text-zinc-400 uppercase text-xs">{it.ctx.country}</td>
                                    <td className="py-3 px-4 text-zinc-400 uppercase text-xs">{it.language}</td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            onClick={() => onRemove(i)}
                                            className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                                            title="Remover"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="flex gap-3 mt-2">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                    ← Voltar
                </Button>
                <Button
                    onClick={handleExport}
                    disabled={exporting || items.length === 0}
                    className="flex-1 h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold text-base"
                >
                    {exporting ? "Gerando Matriz..." : `⬇ Exportar ${items.length} Campanhas (.xlsx)`}
                </Button>
            </div>
        </div>
    );
}
