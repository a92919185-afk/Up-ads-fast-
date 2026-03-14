import ExcelJS from "exceljs";
import type { GeneratedCopy, CopyContext } from "./templates";

// ─── COLOURS ────────────────────────────────────────────────────────────────

const TAB_COLORS = {
  CAMPAIGNS: "1A3A6B",
  AD_GROUPS: "2E5E2E",
  ADS: "1F4E79",
  KEYWORDS: "375623",
  SITELINKS: "7B3F00",
  CALLOUTS: "4A235A",
  SNIPPETS: "1B4F72",
} as const;

// ─── STYLE HELPERS ───────────────────────────────────────────────────────────

function styleHeader(cell: ExcelJS.Cell) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
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

function addHeaders(ws: ExcelJS.Worksheet, headers: string[]) {
  ws.getRow(1).height = 22;
  headers.forEach((h, i) => {
    const cell = ws.getRow(1).getCell(i + 1);
    cell.value = h;
    styleHeader(cell);
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

// ─── LANGUAGE CODE MAP ───────────────────────────────────────────────────────
// Coluna Language: código aceito pelo Google Ads (ex: "de", "en", "pt")

const LANG_MAP: Record<string, string> = {
  en: "en", pt: "pt", es: "es", de: "de", fr: "fr",
  fi: "fi", da: "da", ro: "ro", bg: "bg",
};

// ─── COUNTRY CODE → FULL NAME ────────────────────────────────────────────────
// Coluna Location: Google Ads exige nome completo do país (ex: "Germany", não "DE")

const COUNTRY_MAP: Record<string, string> = {
  DE: "Germany",       AT: "Austria",        CH: "Switzerland",
  US: "United States", GB: "United Kingdom", AU: "Australia",
  CA: "Canada",        NZ: "New Zealand",    IE: "Ireland",
  BR: "Brazil",        PT: "Portugal",
  ES: "Spain",         MX: "Mexico",         AR: "Argentina",
  CO: "Colombia",      CL: "Chile",          PE: "Peru",
  FR: "France",        BE: "Belgium",        LU: "Luxembourg",
  IT: "Italy",         NL: "Netherlands",    PL: "Poland",
  SE: "Sweden",        NO: "Norway",         DK: "Denmark",
  FI: "Finland",       RO: "Romania",        BG: "Bulgaria",
  CZ: "Czech Republic", HU: "Hungary",       SK: "Slovakia",
  HR: "Croatia",       GR: "Greece",         TR: "Turkey",
  ZA: "South Africa",  NG: "Nigeria",        KE: "Kenya",
  IN: "India",         PH: "Philippines",    SG: "Singapore",
  MY: "Malaysia",      TH: "Thailand",       ID: "Indonesia",
  JP: "Japan",         KR: "South Korea",    TW: "Taiwan",
  HK: "Hong Kong",     AE: "United Arab Emirates",
};

function resolveCountry(country: string): string {
  const upper = country.toUpperCase().trim();
  return COUNTRY_MAP[upper] ?? country;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
// Gera planilha com 7 abas no formato EXATO dos templates oficiais do Google Ads:
//   1. Campaigns               (33 colunas — campaign_template.xlsx)
//   2. Ad groups               (21 colunas — ad_group_template.xlsx)
//   3. Ads                     (55 colunas — responsive_search_ad_template.xlsx)
//   4. Keywords                (18 colunas — keyword_template.xlsx)
//   5. Sitelinks_upload        (24 colunas — sitelink_template.csv)
//   6. Callouts_upload         (5 colunas  — callout-template.csv)
//   7. Structured-snippets_upload (5 colunas — structured-snippet-template.csv)

export async function generateXlsx(items: MatrixItem[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // ── ABA 1: Campaigns_upload ────────────────────────────────────────────────
  // 33 colunas — idêntico ao campaign_template.xlsx do Google Ads
  {
    const ws = wb.addWorksheet("Campaigns");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.CAMPAIGNS}` };

    // Cabeçalhos EXATOS do template oficial (33 colunas)
    addHeaders(ws, [
      "Row Type", "Action", "Campaign status", "Campaign ID", "Campaign",
      "Campaign type", "Networks", "Budget", "Delivery method", "Budget type",
      "Bid strategy type", "Bid strategy", "Campaign start date", "Campaign end date",
      "Language", "Location", "Exclusion", "Devices", "Label",
      "Target CPA", "Target ROAS", "Display URL option", "Website description",
      "Target Impression Share", "Max CPC Bid Limit for Target IS",
      "Location Goal for Target IS", "Tracking template", "Final URL suffix",
      "Custom parameter", "Inventory type", "Campaign subtype", "Video ad formats",
      "EU political ads",
    ]);

    const seenCampaigns = new Set<string>();
    let r = 2;
    items.forEach(({ copy, ctx, language }) => {
      if (!seenCampaigns.has(copy.campaign)) {
        seenCampaigns.add(copy.campaign);
        addRow(ws, r++, [
          "Campaign",                        // Row Type
          "Add",                             // Action
          "Enabled",                         // Campaign status
          "",                                // Campaign ID (vazio para novas)
          copy.campaign,                     // Campaign
          "Search",                          // Campaign type
          "Google search",                   // Networks
          Number(ctx.budget) || 10,          // Budget
          "Standard",                        // Delivery method
          "Daily",                           // Budget type
          "Manual CPC",                      // Bid strategy type
          "",                                // Bid strategy (portfolio — vazio)
          "",                                // Campaign start date
          "",                                // Campaign end date
          LANG_MAP[language] || language,     // Language
          resolveCountry(ctx.country),       // Location (nome completo, ex: "Germany")
          "",                                // Exclusion
          "",                                // Devices
          "",                                // Label
          "",                                // Target CPA (vazio — Manual CPC não usa)
          "",                                // Target ROAS
          "",                                // Display URL option
          "",                                // Website description
          "",                                // Target Impression Share
          "",                                // Max CPC Bid Limit for Target IS
          "",                                // Location Goal for Target IS
          "",                                // Tracking template
          "",                                // Final URL suffix
          "",                                // Custom parameter
          "",                                // Inventory type
          "",                                // Campaign subtype
          "",                                // Video ad formats
          "No",                              // EU political ads
        ]);
      }
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 2: AdGroups_upload ─────────────────────────────────────────────────
  // 21 colunas — idêntico ao ad_group_template.xlsx do Google Ads
  {
    const ws = wb.addWorksheet("Ad groups");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.AD_GROUPS}` };

    addHeaders(ws, [
      "Row Type", "Action", "Ad group status", "Campaign ID", "Campaign",
      "Ad group ID", "Ad group", "Ad group type", "Ad rotation",
      "Default max. CPC", "CPC%", "Max. CPM", "Max. CPV",
      "Target CPA", "Target CPM", "TrueView target CPV", "Label",
      "Tracking template", "Final URL suffix", "Custom parameter", "Target ROAS",
    ]);

    const seenGroups = new Set<string>();
    let r = 2;
    items.forEach(({ copy }) => {
      const key = `${copy.campaign}|${copy.adGroup}`;
      if (!seenGroups.has(key)) {
        seenGroups.add(key);
        addRow(ws, r++, [
          "Ad group",                        // Row Type
          "Add",                             // Action
          "Enabled",                         // Ad group status
          "",                                // Campaign ID
          copy.campaign,                     // Campaign
          "",                                // Ad group ID
          copy.adGroup,                      // Ad group
          "",                                // Ad group type
          "",                                // Ad rotation
          "",                                // Default max. CPC
          "",                                // CPC%
          "",                                // Max. CPM
          "",                                // Max. CPV
          "",                                // Target CPA
          "",                                // Target CPM
          "",                                // TrueView target CPV
          "",                                // Label
          "",                                // Tracking template
          "",                                // Final URL suffix
          "",                                // Custom parameter
          "",                                // Target ROAS
        ]);
      }
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 3: Ads_upload ──────────────────────────────────────────────────────
  // 55 colunas — idêntico ao responsive_search_ad_template.xlsx do Google Ads
  {
    const ws = wb.addWorksheet("Ads");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.ADS}` };

    addHeaders(ws, [
      "Row Type", "Action", "Ad status", "Campaign ID", "Campaign",
      "Ad group ID", "Ad group", "Ad ID", "Ad type", "Label",
      ...Array.from({ length: 15 }, (_, i) => `Headline ${i + 1}`),
      ...Array.from({ length: 4 }, (_, i) => `Description ${i + 1}`),
      ...Array.from({ length: 15 }, (_, i) => `Headline ${i + 1} position`),
      ...Array.from({ length: 4 }, (_, i) => `Description ${i + 1} position`),
      "Path 1", "Path 2", "Final URL", "Mobile final URL",
      "Tracking template", "Final URL suffix", "Custom parameter",
    ]);

    let r = 2;
    items.forEach(({ copy, url }) => {
      // Preencher headlines (até 15), pad com vazios
      const headlines: string[] = [...copy.headlines];
      while (headlines.length < 15) headlines.push("");

      // Preencher descriptions (até 4), pad com vazios
      const descriptions: string[] = [...copy.descriptions];
      while (descriptions.length < 4) descriptions.push("");

      // Positions vazias (15 headlines + 4 descriptions)
      const positions = Array(19).fill("");

      addRow(ws, r++, [
        "Ad",                              // Row Type
        "Add",                             // Action
        "Enabled",                         // Ad status
        "",                                // Campaign ID
        copy.campaign,                     // Campaign
        "",                                // Ad group ID
        copy.adGroup,                      // Ad group
        "",                                // Ad ID
        "Responsive search ad",            // Ad type
        "",                                // Label
        ...headlines,                      // Headline 1-15
        ...descriptions,                   // Description 1-4
        ...positions,                      // Headline 1-15 position + Description 1-4 position
        copy.path1,                        // Path 1
        copy.path2,                        // Path 2
        url,                               // Final URL
        "",                                // Mobile final URL
        "",                                // Tracking template
        "",                                // Final URL suffix
        "",                                // Custom parameter
      ]);
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 4: Keywords_upload ─────────────────────────────────────────────────
  // 18 colunas — idêntico ao keyword_template.xlsx do Google Ads
  {
    const ws = wb.addWorksheet("Keywords");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.KEYWORDS}` };

    addHeaders(ws, [
      "Row Type", "Action", "Keyword status", "Campaign ID", "Campaign",
      "Ad group ID", "Ad group", "Keyword ID", "Keyword", "Type",
      "Label", "Default max. CPC", "Max. CPV", "Final URL",
      "Mobile final URL", "Final URL suffix", "Tracking template", "Custom parameter",
    ]);

    // Gerar keywords baseadas no nome do produto
    const seenKeywords = new Set<string>();
    let r = 2;
    items.forEach(({ copy, ctx }) => {
      const product = ctx.product.toLowerCase();
      const keywords = [
        { keyword: product, type: "Broad match" },
        { keyword: `${product} buy`, type: "Broad match" },
        { keyword: `${product} order`, type: "Phrase match" },
        { keyword: product, type: "Exact match" },
        { keyword: `${product} official`, type: "Broad match" },
      ];

      keywords.forEach(({ keyword, type }) => {
        const key = `${copy.campaign}|${copy.adGroup}|${keyword}|${type}`;
        if (seenKeywords.has(key)) return;
        seenKeywords.add(key);

        addRow(ws, r++, [
          "Keyword",                         // Row Type
          "Add",                             // Action
          "Enabled",                         // Keyword status
          "",                                // Campaign ID
          copy.campaign,                     // Campaign
          "",                                // Ad group ID
          copy.adGroup,                      // Ad group
          "",                                // Keyword ID
          keyword,                           // Keyword
          type,                              // Type
          "",                                // Label
          "",                                // Default max. CPC
          "",                                // Max. CPV
          "",                                // Final URL
          "",                                // Mobile final URL
          "",                                // Final URL suffix
          "",                                // Tracking template
          "",                                // Custom parameter
        ]);
      });
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 5: Sitelinks_upload ───────────────────────────────────────────────
  // 24 colunas — idêntico ao sitelink_template.csv do Google Ads
  {
    const ws = wb.addWorksheet("Sitelinks_upload");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.SITELINKS}` };

    addHeaders(ws, [
      "Row Type", "Action", "Asset action", "Customer ID", "Level",
      "Campaign ID", "Campaign", "Ad group ID", "Ad group", "Item ID",
      "Sitelink text", "Final URL", "Mobile final URL", "Final URL suffix",
      "Description", "Description 2", "Tracking template", "Custom parameter",
      "Schedules", "Start date", "End date", "Scheduling",
      "Device preference type", "Row tag",
    ]);

    let r = 2;
    items.forEach(({ copy }) => {
      copy.sitelinks.forEach(s => {
        addRow(ws, r++, [
          "Sitelink",                        // Row Type
          "Add",                             // Action
          "Create new",                      // Asset action
          "",                                // Customer ID
          "Campaign",                        // Level
          "",                                // Campaign ID
          copy.campaign,                     // Campaign
          "",                                // Ad group ID
          "",                                // Ad group (campaign-level)
          "",                                // Item ID (novo)
          s.text,                            // Sitelink text
          s.url,                             // Final URL
          "",                                // Mobile final URL
          "",                                // Final URL suffix
          s.d1,                              // Description
          s.d2,                              // Description 2
          "",                                // Tracking template
          "",                                // Custom parameter
          "",                                // Schedules
          "",                                // Start date
          "",                                // End date
          "",                                // Scheduling
          "",                                // Device preference type
          "",                                // Row tag
        ]);
      });
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 6: Callouts_upload ────────────────────────────────────────────────
  // 5 colunas — idêntico ao callout-template.csv do Google Ads
  {
    const ws = wb.addWorksheet("Callouts_upload");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.CALLOUTS}` };

    addHeaders(ws, [
      "Row type", "Action", "Campaign", "Ad group", "Callout text",
    ]);

    let r = 2;
    items.forEach(({ copy }) => {
      copy.callouts.forEach(callout => {
        addRow(ws, r++, [
          "Callout extension",               // Row type
          "add",                             // Action (lowercase per template)
          copy.campaign,                     // Campaign
          "",                                // Ad group (campaign-level)
          callout,                           // Callout text
        ]);
      });
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  // ── ABA 7: Structured-snippets_upload ─────────────────────────────────────
  // 5 colunas — idêntico ao structured-snippet-template.csv do Google Ads
  {
    const ws = wb.addWorksheet("Structured-snippets_upload");
    ws.properties.tabColor = { argb: `FF${TAB_COLORS.SNIPPETS}` };

    addHeaders(ws, [
      "Action", "Campaign", "Ad group",
      "Structured snippet header", "Structured snippet values",
    ]);

    const seenSnippets = new Set<string>();
    let r = 2;
    items.forEach(({ copy }) => {
      const key = `${copy.campaign}|${copy.snippetHeader}`;
      if (seenSnippets.has(key)) return;
      seenSnippets.add(key);

      addRow(ws, r++, [
        "add",                               // Action (lowercase per template)
        copy.campaign,                       // Campaign
        "",                                  // Ad group (campaign-level)
        copy.snippetHeader,                  // Structured snippet header (ex: "Types")
        copy.snippetValues.join(";"),        // Structured snippet values (separados por ;)
      ]);
    });
    ws.views = [{ state: "frozen", ySplit: 1 }];
    autoWidth(ws);
  }

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
