import ExcelJS from "exceljs";
import type { GeneratedCopy, CopyContext } from "./templates";

const TAB_COLORS = {
  ANUNCIOS_SEARCH_RSA: "1F4E79",
  CALLOUTS:            "375623",
  SITELINKS:           "7B2C2C",
  SNIPPETS:            "614A19",
  PROMOCOES:           "4A235A",
} as const;

function styleHeader(cell: ExcelJS.Cell, aux = false) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: aux ? "FF2E75B6" : "FF1F4E79" } };
  cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  cell.alignment = { horizontal: "center", vertical: "middle" };
  cell.border = {
    top:    { style: "thin", color: { argb: "FFCCCCCC" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    left:   { style: "thin", color: { argb: "FFCCCCCC" } },
    right:  { style: "thin", color: { argb: "FFCCCCCC" } },
  };
}

function styleData(cell: ExcelJS.Cell) {
  cell.font = { size: 10 };
  cell.alignment = { horizontal: "left", vertical: "middle" };
  cell.border = {
    top:    { style: "thin", color: { argb: "FFCCCCCC" } },
    bottom: { style: "thin", color: { argb: "FFCCCCCC" } },
    left:   { style: "thin", color: { argb: "FFCCCCCC" } },
    right:  { style: "thin", color: { argb: "FFCCCCCC" } },
  };
}

function autoWidth(ws: ExcelJS.Worksheet, min = 12, max = 45) {
  ws.columns.forEach(col => {
    let maxLen = min;
    col.eachCell?.({ includeEmpty: true }, cell => {
      const len = String(cell.value ?? "").length + 2;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen, max);
  });
}

export async function generateXlsx(
  copy: GeneratedCopy,
  ctx: CopyContext,
  lang: string,
  finalUrl: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();

  // ── ABA 1: ANUNCIOS_SEARCH_RSA
  const ws1 = wb.addWorksheet("ANUNCIOS_SEARCH_RSA");
  ws1.properties.tabColor = { argb: `FF${TAB_COLORS.ANUNCIOS_SEARCH_RSA}` };
  ws1.getRow(1).height = 22;

  const officialHeaders = [
    "Campaign", "Ad group", "Final URL",
    ...Array.from({ length: 15 }, (_, i) => `Headline ${i + 1}`),
    ...Array.from({ length: 4 }, (_, i) => `Description ${i + 1}`),
    "Path 1", "Path 2", "Status",
  ];
  const auxHeaders = [
    "Product_Name", "Country", "Language",
    "Discount_Value", "Guarantee_Days",
    "Has_Free_Shipping", "Free_Ship_Min", "Currency", "Price",
  ];
  const allHeaders = [...officialHeaders, ...auxHeaders];

  allHeaders.forEach((h, i) => {
    const cell = ws1.getRow(1).getCell(i + 1);
    cell.value = h;
    styleHeader(cell, i >= officialHeaders.length);
  });

  const dataRow = [
    copy.campaign, copy.adGroup, finalUrl,
    ...copy.headlines,
    ...copy.descriptions,
    copy.path1, copy.path2, "Enabled",
    ctx.product, ctx.country, lang,
    ctx.discount, ctx.guarantee, "Yes", ctx.ship_min, ctx.currency, ctx.price,
  ];
  dataRow.forEach((v, i) => {
    const cell = ws1.getRow(2).getCell(i + 1);
    cell.value = v;
    styleData(cell);
  });
  ws1.views = [{ state: "frozen", ySplit: 1 }];
  autoWidth(ws1);

  // ── ABA 2: CALLOUTS
  const ws2 = wb.addWorksheet("CALLOUTS");
  ws2.properties.tabColor = { argb: `FF${TAB_COLORS.CALLOUTS}` };
  ws2.getRow(1).height = 22;
  ["Campaign", "Callout text", "Status"].forEach((h, i) => {
    const cell = ws2.getRow(1).getCell(i + 1);
    cell.value = h;
    styleHeader(cell);
  });
  copy.callouts.forEach((text, r) => {
    [copy.campaign, text, "Enabled"].forEach((v, i) => {
      const cell = ws2.getRow(r + 2).getCell(i + 1);
      cell.value = v;
      styleData(cell);
    });
  });
  ws2.views = [{ state: "frozen", ySplit: 1 }];
  autoWidth(ws2);

  // ── ABA 3: SITELINKS
  const ws3 = wb.addWorksheet("SITELINKS");
  ws3.properties.tabColor = { argb: `FF${TAB_COLORS.SITELINKS}` };
  ws3.getRow(1).height = 22;
  ["Campaign", "Sitelink text", "Final URL", "Description line 1", "Description line 2", "Status"].forEach((h, i) => {
    const cell = ws3.getRow(1).getCell(i + 1);
    cell.value = h;
    styleHeader(cell);
  });
  copy.sitelinks.forEach((sl, r) => {
    [copy.campaign, sl.text, sl.url, sl.d1, sl.d2, "Enabled"].forEach((v, i) => {
      const cell = ws3.getRow(r + 2).getCell(i + 1);
      cell.value = v;
      styleData(cell);
    });
  });
  ws3.views = [{ state: "frozen", ySplit: 1 }];
  autoWidth(ws3);

  // ── ABA 4: SNIPPETS
  const ws4 = wb.addWorksheet("SNIPPETS");
  ws4.properties.tabColor = { argb: `FF${TAB_COLORS.SNIPPETS}` };
  ws4.getRow(1).height = 22;
  ["Campaign", "Structured snippet header", "Value 1", "Value 2", "Value 3", "Value 4"].forEach((h, i) => {
    const cell = ws4.getRow(1).getCell(i + 1);
    cell.value = h;
    styleHeader(cell);
  });
  [copy.campaign, copy.snippetHeader, ...copy.snippetValues].forEach((v, i) => {
    const cell = ws4.getRow(2).getCell(i + 1);
    cell.value = v;
    styleData(cell);
  });
  ws4.views = [{ state: "frozen", ySplit: 1 }];
  autoWidth(ws4);

  // ── ABA 5: PROMOCOES
  const ws5 = wb.addWorksheet("PROMOCOES");
  ws5.properties.tabColor = { argb: `FF${TAB_COLORS.PROMOCOES}` };
  ws5.getRow(1).height = 22;
  ["Campaign", "Occasion", "Discount type", "Percent off", "Promotion code", "Final URL", "Start date", "End date"].forEach((h, i) => {
    const cell = ws5.getRow(1).getCell(i + 1);
    cell.value = h;
    styleHeader(cell);
  });
  [
    copy.campaign, copy.promo.occasion, copy.promo.discountType,
    copy.promo.percentOff, copy.promo.promoCode, copy.promo.finalUrl, "", "",
  ].forEach((v, i) => {
    const cell = ws5.getRow(2).getCell(i + 1);
    cell.value = v;
    styleData(cell);
  });
  ws5.views = [{ state: "frozen", ySplit: 1 }];
  autoWidth(ws5);

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
