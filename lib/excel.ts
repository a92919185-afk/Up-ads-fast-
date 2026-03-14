import ExcelJS from "exceljs";
import type { GeneratedCopy, CopyContext } from "./templates";

// ─── COLOURS ────────────────────────────────────────────────────────────────

const TAB_COLORS = {
  CAMPAIGNS: "1A3A6B",
  AD_GROUPS: "2E5E2E",
  ADS: "1F4E79",
  CALLOUTS: "375623",
  SITELINKS: "7B2C2C",
  SNIPPETS: "614A19",
  PROMOTIONS: "4A235A",
} as const;

// ─── STYLE HELPERS ───────────────────────────────────────────────────────────

function styleHeader(cell: ExcelJS.Cell, aux = false) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: aux ? "FF2E75B6" : "FF1F4E79" } };
  cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = {
    top: { style: "thin", color: { argb: "FFCCCCCC" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    left: { style: "thin", color: { argb: "FFCCCCCC" } },
    right: { style: "thin", color: { argb: "FFCCCCCC" } },
  };
}

function styleData(cell: ExcelJS.Cell) {
  cell.font = { size: 10 };
  cell.alignment = { horizontal: "left", vertical: "middle", wrapText: false };
  cell.border = {
    top: { style: "thin", color: { argb: "FFCCCCCC" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    left: { style: "thin", color: { argb: "FFCCCCCC" } },
    right: { style: "thin", color: { argb: "FFCCCCCC" } },
  };
}

function addRow(ws: ExcelJS.Worksheet, rowIndex: number, values: (string | number)[]) {
  values.forEach((v, i) => {
    const cell = ws.getRow(rowIndex).getCell(i + 1);
    cell.value = v;
    styleData(cell);
  });
}

function addHeaders(ws: ExcelJS.Worksheet, headers: string[], auxStart?: number) {
  ws.getRow(1).height = 22;
  headers.forEach((h, i) => {
    const cell = ws.getRow(1).getCell(i + 1);
    cell.value = h;
    styleHeader(cell, auxStart !== undefined && i >= auxStart);
  });
}

function autoWidth(ws: ExcelJS.Worksheet, min = 12, max = 50) {
  ws.columns.forEach(col => {
    let maxLen = min;
    col.eachCell?.({ includeEmpty: true }, cell => {
      const len = String(cell.value ?? "").length + 2;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen, max);
  });
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface MatrixItem {
  copy: GeneratedCopy;
  ctx: CopyContext;
  language: string;
  url: string;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export async function generateXlsx(items: MatrixItem[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // ── ABA 1: CAMPANHAS ─────────────────────────────────────────────────────
  // Cria as campanhas com todos os campos obrigatórios do Google Ads Editor.
  // Sem essa aba, as outras abas geram "Nenhuma entidade corresponde a Campanha".
  {
    const ws = wb.addWorksheet("Campaigns");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.CAMPAIGNS}` };
    addHeaders(ws, [
      "Action",
      "Campaign",
      "Campaign type",
      "Status",
      "Budget",
      "Budget type",
      "Bid Strategy type",
      "Target CPA",
      "Search Network",
      "Search Partners",
      "Display Network",
      "EU political advertising",
    ]);

    const seenCampaigns = new Set<string>();
    let r = 2;
    items.forEach(({ copy, ctx }) => {
      if (!seenCampaigns.has(copy.campaign)) {
        seenCampaigns.add(copy.campaign);
        addRow(ws, r++, [
          "Add",
          copy.campaign,
          "Search",
          "Enabled",
          Number(ctx.budget) || 10,
          "Daily",
          "Target CPA",
          Number(ctx.target_cpa) || 5,
          "Yes",
          "No",
          "No",
          "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
        ]);
      }
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 2: GRUPOS_ANUNCIOS ───────────────────────────────────────────────
  // Cria os grupos de anúncios antes de inserir anúncios e extensões.
  {
    const ws = wb.addWorksheet("Ad groups");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.AD_GROUPS}` };
    addHeaders(ws, [
      "Action",
      "Campaign",
      "Ad group",
      "Status",
    ]);

    const seenGroups = new Set<string>();
    let r = 2;
    items.forEach(({ copy }) => {
      const key = `${copy.campaign}|${copy.adGroup}`;
      if (!seenGroups.has(key)) {
        seenGroups.add(key);
        addRow(ws, r++, ["Add", copy.campaign, copy.adGroup, "Enabled"]);
      }
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 3: ANUNCIOS_SEARCH_RSA ───────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Ads");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.ADS}` };

    const headers = [
      "Action",
      "Campaign",
      "Ad group",
      "Ad type",
      "Final URL",
      ...Array.from({ length: 15 }, (_, i) => `Headline ${i + 1}`),
      ...Array.from({ length: 4 }, (_, i) => `Description ${i + 1}`),
      "Path 1", "Path 2", "Status",
    ];
    addHeaders(ws, headers);

    let r = 2;
    items.forEach(({ copy, url }) => {
      addRow(ws, r++, [
        "Add",
        copy.campaign,
        copy.adGroup,
        "Responsive search ad",
        url,
        ...copy.headlines,
        ...copy.descriptions,
        copy.path1, copy.path2, "Enabled",
      ]);
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 4: CALLOUTS ──────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Callouts");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.CALLOUTS}` };
    addHeaders(ws, [
      "Asset action",
      "Campaign",
      "Callout text",
      "Status",
    ]);

    let r = 2;
    items.forEach(({ copy }) => {
      copy.callouts.forEach(text => {
        addRow(ws, r++, ["Add", copy.campaign, text, "Enabled"]);
      });
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 5: SITELINKS ─────────────────────────────────────────────────────
  // "Action: Add" resolve "Ação do recurso: Usar existente / ID do item: null"
  {
    const ws = wb.addWorksheet("Sitelinks");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.SITELINKS}` };
    addHeaders(ws, [
      "Asset action",
      "Campaign",
      "Sitelink text",
      "Final URL",
      "Description line 1",
      "Description line 2",
      "Status",
    ]);

    let r = 2;
    items.forEach(({ copy }) => {
      copy.sitelinks.forEach(sl => {
        addRow(ws, r++, ["Add", copy.campaign, sl.text, sl.url, sl.d1, sl.d2, "Enabled"]);
      });
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 6: SNIPPETS ──────────────────────────────────────────────────────
  // Bulk Upload via AdsApp.bulkUploads() exige coluna unica "Structured snippet values"
  // com valores separados por ponto-e-virgula (;). Colunas individuais "Value 1"..."Value N"
  // sao formato do Google Ads Editor e causam "Missing value in Structured snippet values".
  {
    const ws = wb.addWorksheet("Structured snippets");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.SNIPPETS}` };
    addHeaders(ws, [
      "Asset action",
      "Campaign",
      "Structured snippet header",
      "Structured snippet values",
    ]);

    let r = 2;
    items.forEach(({ copy }) => {
      const joinedValues = copy.snippetValues.filter(v => v && v.trim() !== "").join(";");
      addRow(ws, r++, ["Add", copy.campaign, copy.snippetHeader, joinedValues]);
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 7: PROMOCOES ─────────────────────────────────────────────────────
  {
    const ws = wb.addWorksheet("Promotions");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.PROMOTIONS}` };
    addHeaders(ws, [
      "Asset action", "Campaign", "Occasion", "Discount type",
      "Percent off", "Promotion code", "Final URL", "Start date", "End date",
    ]);

    let r = 2;
    items.forEach(({ copy }) => {
      addRow(ws, r++, [
        "Add",
        copy.campaign,
        copy.promo.occasion,
        copy.promo.discountType,
        copy.promo.percentOff,
        copy.promo.promoCode,
        copy.promo.finalUrl,
        "", "",
      ]);
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
