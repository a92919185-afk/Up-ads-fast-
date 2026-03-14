"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MatrixItem } from "@/lib/excel";

// ─── Script Google Ads ────────────────────────────────────────────────────────

function buildScript(url: string) {
  const safeUrl = url.trim() || 'COLE_A_URL_DA_SUA_PLANILHA_AQUI';
  return `// ============================================================
//  UPADSFAST — Google Ads Bulk Upload Script V4
//  Formato: Templates oficiais do Google Ads
//  Metodo: newFileUpload com CSV blob
//
//  Abas (processadas nesta ordem):
//    1. Campaigns
//    2. Ad groups
//    3. Ads
//    4. Keywords
//
//  Baseado em:
//  - Templates oficiais: campaign_template.xlsx, ad_group_template.xlsx,
//    responsive_search_ad_template.xlsx, keyword_template.xlsx
//  - developers.google.com/google-ads/scripts/docs/features/bulk-upload
// ============================================================

// ─── PASSO 1: Cole aqui a URL da sua Planilha Google ─────────
var SPREADSHEET_URL = '${safeUrl}';

// ─── PASSO 2: Modo de execucao ───────────────────────────────
// true  = apenas visualiza, nao cria nada (recomendado primeiro)
// false = cria as campanhas de verdade no Google Ads
var PREVIEW_MODE = true;

// ─── NAO ALTERE ABAIXO DESTA LINHA ──────────────────────────

// Ordem de upload e pausa APOS cada aba (ms).
// Campanhas e Grupos precisam de mais tempo para o Google indexar
// a entidade pai antes de criar a entidade filha.
var UPLOAD_PIPELINE = [
  { sheet: 'Campaigns',                sleepAfter: 60000 },  // 60s — campanha precisa existir antes do grupo
  { sheet: 'Ad groups',                sleepAfter: 45000 },  // 45s — grupo precisa existir antes do anuncio
  { sheet: 'Ads',                      sleepAfter: 10000 },  // 10s
  { sheet: 'Keywords',                 sleepAfter: 10000 },  // 10s — antes das extensoes
  { sheet: 'Sitelinks_upload',         sleepAfter: 5000  },  // 5s
  { sheet: 'Callouts_upload',          sleepAfter: 5000  },  // 5s
  { sheet: 'Structured-snippets_upload', sleepAfter: 0   }   // ultima aba, sem pausa
];

// ============================================================

function main() {
  var ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);

  Logger.log('========================================');
  Logger.log('UPADSFAST — Bulk Upload (Templates Oficiais)');
  Logger.log('Planilha: ' + ss.getName());
  Logger.log('Modo: ' + (PREVIEW_MODE ? 'PREVIEW — nenhuma alteracao sera feita' : 'APLICAR — criando campanhas agora'));
  Logger.log('========================================');

  for (var i = 0; i < UPLOAD_PIPELINE.length; i++) {
    var step = UPLOAD_PIPELINE[i];
    Logger.log('');
    Logger.log('>>> Processando: ' + step.sheet + ' (' + (i + 1) + '/' + UPLOAD_PIPELINE.length + ')');
    uploadSheet(ss, step.sheet);

    if (step.sleepAfter > 0) {
      var secs = Math.round(step.sleepAfter / 1000);
      Logger.log('  Aguardando ' + secs + 's para indexacao antes da proxima aba...');
      Utilities.sleep(step.sleepAfter);
    }
  }

  Logger.log('');
  Logger.log('========================================');
  Logger.log('UPADSFAST: Finalizado.');
  Logger.log('Verifique em: Ferramentas > Acoes em massa > Uploads');
  Logger.log('========================================');
}

function uploadSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('  [PULAR] "' + sheetName + '" — aba nao encontrada.');
    return;
  }

  var values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    Logger.log('  [PULAR] "' + sheetName + '" — sem dados.');
    return;
  }

  // Montar CSV em memoria com o MESMO cabecalho do template
  var csvRows = [];
  for (var i = 0; i < values.length; i++) {
    var cells = [];
    for (var j = 0; j < values[i].length; j++) {
      cells.push(cleanCell(values[i][j]));
    }
    csvRows.push(cells.join(','));
  }
  var csv = csvRows.join('\\n');

  var blob = Utilities.newBlob(csv, 'text/csv', sheetName + '.csv');
  var upload = AdsApp.bulkUploads().newFileUpload(blob);
  upload.forCampaignManagement();

  try {
    if (PREVIEW_MODE) {
      upload.preview();
      Logger.log('  [PREVIEW] "' + sheetName + '": ' + (values.length - 1) + ' linha(s) enviada(s) para visualizacao.');
    } else {
      upload.apply();
      Logger.log('  [OK] "' + sheetName + '": ' + (values.length - 1) + ' linha(s) aplicada(s).');
    }
  } catch (e) {
    Logger.log('  [ERRO] "' + sheetName + '": ' + e.message);
  }
}

// Limpa celula para formato CSV valido
function cleanCell(value) {
  if (value == null || value === undefined) return '';

  var text = String(value).trim();

  // Remover string "None" (Google Ads rejeita)
  if (text.toLowerCase() === 'none') return '';

  // Escapar virgulas e aspas para CSV
  if (text.indexOf(',') > -1 || text.indexOf('"') > -1 || text.indexOf('\\n') > -1) {
    text = '"' + text.replace(/"/g, '""') + '"';
  }

  return text;
}`;
}

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
  const [sheetUrl, setSheetUrl] = useState("");

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
    await navigator.clipboard.writeText(buildScript(sheetUrl));
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

      {/* ── Link Google Drive ── */}
      <a
        href="https://sheets.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-lg border border-white/8 bg-zinc-900/40 hover:bg-zinc-900/80 hover:border-white/20 transition-all py-3 text-sm text-zinc-400 hover:text-white group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="13" viewBox="0 0 2048 2733" fill="none">
          <path d="M1241 0H293C190 0 107 83 107 186v2361c0 103 83 186 186 186h1462c103 0 186-83 186-186V682z" fill="#0F9D58"/>
          <path d="M1241 0l700 682h-700z" fill="#057642"/>
          <rect x="320" y="1196" width="1408" height="124" rx="62" fill="white" fillOpacity=".7"/>
          <rect x="320" y="1444" width="1408" height="124" rx="62" fill="white" fillOpacity=".7"/>
          <rect x="320" y="1692" width="1408" height="124" rx="62" fill="white" fillOpacity=".7"/>
          <rect x="320" y="1940" width="900" height="124" rx="62" fill="white" fillOpacity=".7"/>
        </svg>
        <span>Abrir Google Sheets para importar o arquivo</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-40 group-hover:opacity-100 transition-opacity"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>

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
          <div className="flex flex-col gap-2">

            {/* Bloco A — Exportar */}
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mt-1">Parte 1 — Exportar a planilha</p>

            {[
              {
                n: "1",
                color: "bg-blue-600/20 border-blue-600/40 text-blue-400",
                title: "Exporte a planilha aqui",
                desc: 'Clique no botão "Exportar Campanhas" acima. Um arquivo .xlsx será baixado para o seu computador.',
              },
              {
                n: "2",
                color: "bg-blue-600/20 border-blue-600/40 text-blue-400",
                title: "Abra o Google Sheets",
                desc: 'Clique no botão verde "Abrir Google Sheets" abaixo. Vai abrir em uma nova aba do navegador.',
              },
              {
                n: "3",
                color: "bg-blue-600/20 border-blue-600/40 text-blue-400",
                title: "Importe o arquivo no Google Sheets",
                desc: 'No Google Sheets: clique em "Arquivo" → "Importar" → "Fazer upload" → selecione o arquivo .xlsx que você baixou → clique em "Importar dados".',
              },
              {
                n: "4",
                color: "bg-blue-600/20 border-blue-600/40 text-blue-400",
                title: "Copie a URL da planilha",
                desc: 'Com a planilha aberta no Google Sheets, copie a URL completa que está na barra do navegador. Ela começa com: docs.google.com/spreadsheets/d/...',
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-3 py-2">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center mt-0.5 ${step.color}`}>
                  {step.n}
                </span>
                <div>
                  <p className="text-zinc-200 text-sm font-medium">{step.title}</p>
                  <p className="text-zinc-500 text-xs leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}

            {/* Divisor */}
            <div className="border-t border-white/5 my-1" />

            {/* Bloco B — Script */}
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mt-1">Parte 2 — Configurar o script no Google Ads</p>

            {[
              {
                n: "5",
                color: "bg-emerald-600/20 border-emerald-600/40 text-emerald-400",
                title: "Cole a URL da planilha no campo abaixo",
                desc: 'Logo abaixo existe um campo para colar a URL. Ao colar, o script é gerado automaticamente com sua planilha já configurada dentro dele.',
              },
              {
                n: "6",
                color: "bg-emerald-600/20 border-emerald-600/40 text-emerald-400",
                title: "Copie o script",
                desc: 'Clique em "Copiar Script". O script completo estará na área de transferência, pronto para colar.',
              },
              {
                n: "7",
                color: "bg-emerald-600/20 border-emerald-600/40 text-emerald-400",
                title: "Abra o Google Ads → Ferramentas → Scripts",
                desc: 'No Google Ads, clique em "Ferramentas e configurações" (ícone de chave) → "Scripts" → clique no botão "+" para criar um novo script → apague tudo que estiver lá → cole o script copiado.',
              },
              {
                n: "8",
                color: "bg-emerald-600/20 border-emerald-600/40 text-emerald-400",
                title: "Teste antes de criar (PREVIEW_MODE = true)",
                desc: 'O script vem com PREVIEW_MODE = true. Isso significa que ele vai apenas simular, sem criar nada de verdade. Clique em "Executar" e verifique o log abaixo — se aparecer [PREVIEW] em todas as abas, está funcionando.',
              },
              {
                n: "9",
                color: "bg-emerald-600/20 border-emerald-600/40 text-emerald-400",
                title: "Crie as campanhas de verdade (PREVIEW_MODE = false)",
                desc: 'Quando o teste estiver ok, mude a linha PREVIEW_MODE = true para PREVIEW_MODE = false → clique em "Executar" novamente → o script vai criar todas as campanhas automaticamente, uma por vez, com pausa entre cada uma.',
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-3 py-2">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center mt-0.5 ${step.color}`}>
                  {step.n}
                </span>
                <div>
                  <p className="text-zinc-200 text-sm font-medium">{step.title}</p>
                  <p className="text-zinc-500 text-xs leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}

            {/* Divisor */}
            <div className="border-t border-white/5 my-1" />

            {/* Bloco C — Pós-criação */}
            <p className="text-zinc-500 text-xs uppercase tracking-widest font-semibold mt-1">Parte 3 — Após criar as campanhas</p>

            {[
              {
                n: "10",
                color: "bg-amber-600/20 border-amber-600/40 text-amber-400",
                title: "Configure targeting de dispositivos (somente Mobile)",
                desc: 'No Google Ads → entre em cada campanha criada → "Configurações" → "Dispositivos" → defina Computadores: −100% e Tablets: −100%. Isso garante que os anúncios apareçam somente no celular.',
              },
            ].map((step) => (
              <div key={step.n} className="flex gap-3 py-2">
                <span className={`flex-shrink-0 w-6 h-6 rounded-full border text-xs font-bold flex items-center justify-center mt-0.5 ${step.color}`}>
                  {step.n}
                </span>
                <div>
                  <p className="text-zinc-200 text-sm font-medium">{step.title}</p>
                  <p className="text-zinc-500 text-xs leading-relaxed mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}

          </div>

          {/* Campo de URL da planilha */}
          <div className="rounded-lg border border-white/10 bg-zinc-900/60 p-4 flex flex-col gap-2">
            <label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <span className="text-blue-400">↳</span>
              Cole aqui a URL da sua Planilha Google
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 bg-zinc-950 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-blue-500 transition-colors font-mono"
              />
              {sheetUrl && (
                <button
                  onClick={() => setSheetUrl("")}
                  className="text-zinc-600 hover:text-zinc-400 px-2 text-xs"
                  title="Limpar"
                >
                  ✕
                </button>
              )}
            </div>
            {sheetUrl && (
              <p className="text-emerald-400 text-xs flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                URL inserida — o script abaixo já está pronto para copiar
              </p>
            )}
            {!sheetUrl && (
              <p className="text-zinc-600 text-xs">
                Cole a URL antes de copiar o script. Assim ele já vem com a URL preenchida automaticamente.
              </p>
            )}
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
              <code>{buildScript(sheetUrl)}</code>
            </pre>
          </div>

        </div>
      </div>

    </div>
  );
}
