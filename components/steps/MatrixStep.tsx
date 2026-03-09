"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MatrixItem } from "@/lib/excel";

// ─── Script Google Ads ────────────────────────────────────────────────────────

const GOOGLE_ADS_SCRIPT = `// ============================================================
//  UPADSFAST — Google Ads Script V4
//  Documentação: developers.google.com/google-ads/scripts
// ============================================================

// ─── PASSO 1: Cole aqui a URL da sua Planilha Google ─────────
var SPREADSHEET_URL = 'COLE_A_URL_DA_SUA_PLANILHA_AQUI';

// ─── PASSO 2: Modo de execução ───────────────────────────────
// true  = apenas visualiza, não cria nada (recomendado primeiro)
// false = cria as campanhas de verdade no Google Ads
var PREVIEW_MODE = true;

// ─── NÃO ALTERE ABAIXO DESTA LINHA ──────────────────────────

var UPLOAD_OPTIONS = {
  fileLocale:    'en_US',
  moneyInMicros: false
};

var SHEETS_EM_ORDEM = [
  'CAMPANHAS',
  'GRUPOS_ANUNCIOS',
  'ANUNCIOS_SEARCH_RSA',
  'CALLOUTS',
  'SITELINKS',
  'SNIPPETS',
  'PROMOCOES'
];

function main() {
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);
  Logger.log('UPADSFAST — Planilha: ' + ss.getName());
  Logger.log('Modo: ' + (PREVIEW_MODE
    ? 'PREVIEW — nenhuma alteração será feita'
    : 'APLICAR — criando campanhas agora'));
  Logger.log('-------------------------------------------');

  for (var i = 0; i < SHEETS_EM_ORDEM.length; i++) {
    processarAba(ss, SHEETS_EM_ORDEM[i]);
  }

  Logger.log('-------------------------------------------');
  Logger.log('Processamento concluído.');
}

function processarAba(ss, nomeAba) {
  var sheet = ss.getSheetByName(nomeAba);

  if (!sheet) {
    Logger.log('[PULAR] "' + nomeAba + '" — aba não encontrada.');
    return;
  }

  if (sheet.getLastRow() <= 1) {
    Logger.log('[PULAR] "' + nomeAba + '" — sem dados.');
    return;
  }

  try {
    var upload = AdsApp.bulkUploads().newFileUpload(sheet, UPLOAD_OPTIONS);
    upload.forCampaignManagement();

    if (PREVIEW_MODE) {
      upload.preview();
      Logger.log('[PREVIEW] "' + nomeAba + '" — enviado para visualização.');
    } else {
      upload.apply();
      Logger.log('[OK]      "' + nomeAba + '" — aplicado com sucesso.');
    }
  } catch (e) {
    Logger.log('[ERRO]    "' + nomeAba + '" — ' + e.message);
  }
}`;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  items: MatrixItem[];
  onRemove: (index: number) => void;
  onClear: () => void;
  onBack: () => void;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function MatrixStep({ items, onRemove, onClear, onBack }: Props) {
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

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

  async function handleCopyScript() {
    await navigator.clipboard.writeText(GOOGLE_ADS_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Cabeçalho ── */}
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

      {/* ── Tabela ── */}
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
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Botões de exportação ── */}
      <div className="flex gap-3">
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

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ── Próximo Passo: Script Google Ads ── */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="rounded-xl border border-blue-900/40 bg-blue-950/10 overflow-hidden">

        {/* Título da seção */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-900/30 bg-blue-950/20">
          <span className="text-blue-400 text-lg">⚡</span>
          <div>
            <p className="text-white font-semibold text-sm">Próximo Passo — Importar no Google Ads</p>
            <p className="text-blue-400/70 text-xs">Use o script abaixo para criar as campanhas automaticamente</p>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-5">

          {/* Passo a passo */}
          <div className="flex flex-col gap-3">
            {[
              {
                n: "1",
                title: "Exporte o .xlsx",
                desc: 'Clique em "Exportar Campanhas" acima e salve o arquivo.',
              },
              {
                n: "2",
                title: "Converta para Google Sheets",
                desc: "Abra o Google Drive → arraste o .xlsx → clique com botão direito → Abrir com → Planilhas Google → Arquivo → Salvar como Planilhas Google.",
              },
              {
                n: "3",
                title: "Copie a URL da planilha",
                desc: 'Na barra do navegador, copie a URL completa da planilha Google (começa com docs.google.com/spreadsheets/...).',
              },
              {
                n: "4",
                title: "Abra o Google Ads Scripts",
                desc: "No Google Ads → Ferramentas → Scripts → clique em + para criar novo script → apague o conteúdo existente.",
              },
              {
                n: "5",
                title: "Cole o script abaixo",
                desc: 'Clique em "Copiar Script" abaixo → cole no editor de scripts → substitua COLE_A_URL_DA_SUA_PLANILHA_AQUI pela URL copiada no passo 3.',
              },
              {
                n: "6",
                title: "Teste primeiro (PREVIEW_MODE = true)",
                desc: "Execute com PREVIEW_MODE = true para validar sem criar nada. Confira o log em busca de erros.",
              },
              {
                n: "7",
                title: "Aplique de verdade (PREVIEW_MODE = false)",
                desc: "Mude PREVIEW_MODE para false → execute novamente → as campanhas serão criadas no Google Ads.",
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600/20 border border-blue-600/40 text-blue-400 text-xs font-bold flex items-center justify-center mt-0.5">
                  {step.n}
                </span>
                <div>
                  <p className="text-zinc-200 text-sm font-medium">{step.title}</p>
                  <p className="text-zinc-500 text-xs leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Aviso importante */}
          <div className="rounded-lg bg-amber-950/30 border border-amber-800/40 px-4 py-3 flex gap-2">
            <span className="text-amber-400 text-sm flex-shrink-0">⚠</span>
            <p className="text-amber-300/80 text-xs leading-relaxed">
              <strong className="text-amber-300">Atenção:</strong> após importar, configure <strong>targeting de dispositivos</strong> manualmente em cada campanha:
              Google Ads → Campanha → Configurações → Dispositivos → Computadores: −100% · Tablets: −100%
            </p>
          </div>

          {/* Script com botão de copiar */}
          <div className="rounded-lg border border-white/8 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900 border-b border-white/8">
              <span className="text-zinc-400 text-xs font-mono uppercase tracking-wider">Google Ads Script</span>
              <button
                onClick={handleCopyScript}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  copied
                    ? "bg-emerald-600/20 text-emerald-400 border border-emerald-600/40"
                    : "bg-zinc-800 text-zinc-300 border border-white/10 hover:bg-zinc-700 hover:text-white"
                }`}
              >
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    Copiado!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>
                    Copiar Script
                  </>
                )}
              </button>
            </div>
            <pre className="text-xs text-zinc-400 p-4 overflow-x-auto leading-relaxed max-h-64 overflow-y-auto font-mono bg-zinc-950/50">
              <code>{GOOGLE_ADS_SCRIPT}</code>
            </pre>
          </div>

        </div>
      </div>

    </div>
  );
}
