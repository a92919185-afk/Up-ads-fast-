// ─── TYPES ─────────────────────────────────────────────────────────────────

export interface CopyContext {
  product: string;
  country: string;
  discount: string;
  guarantee: string;
  price: string;
  currency: string;
  ship_min: string;
}

export interface SitelinkEntry {
  text: string;
  url: string;
  d1: string;
  d2: string;
}

export interface GeneratedCopy {
  campaign: string;
  adGroup: string;
  path1: string;
  path2: string;
  headlines: string[];
  descriptions: string[];
  callouts: string[];
  sitelinks: SitelinkEntry[];
  snippetHeader: string;
  snippetValues: string[];
  promo: {
    occasion: string;
    discountType: string;
    percentOff: number;
    promoCode: string;
    finalUrl: string;
  };
}

// ─── HELPERS ───────────────────────────────────────────────────────────────

export function render(template: string, ctx: CopyContext): string {
  return template
    .replace(/\{product\}/g, ctx.product)
    .replace(/\{country\}/g, ctx.country)
    .replace(/\{discount\}/g, ctx.discount)
    .replace(/\{guarantee\}/g, ctx.guarantee)
    .replace(/\{price\}/g, ctx.price)
    .replace(/\{currency\}/g, ctx.currency)
    .replace(/\{ship_min\}/g, ctx.ship_min);
}

export function trunc(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const truncated = text.slice(0, limit);
  const lastSpace = truncated.lastIndexOf(" ");
  return lastSpace > 0 ? truncated.slice(0, lastSpace).trimEnd() : truncated;
}

export function renderTrunc(template: string, ctx: CopyContext, limit: number): string {
  return trunc(render(template, ctx), limit);
}

// ─── TEMPLATES POR IDIOMA ──────────────────────────────────────────────────

interface LangTemplates {
  h: string[];
  d: string[];
  callouts: string[];
  sitelinks: [string, string, string][];
  snippetHeader: string;
  snippetValues: string[];
}

const COPY: Record<string, LangTemplates> = {
  en: {
    h: [
      "{product} Official Site",
      "Up To {discount}% Off Today",
      "Buy 1 Get 1 {discount}% Off",
      "Free {country} Shipping",
      "{guarantee}-Day Money-Back",
      "Order {product} For {currency}{price}",
      "Limited Time {discount}% Sale",
      "Claim Your {discount}% Off",
      "Special Offer: {discount}% Off",
      "{product} - {discount}% Off Sale",
      "Try {product} Risk-Free",
      "Free Shipping Over {currency}{ship_min}",
      "Exclusive Bundle Price",
      "Secure Your Order Now",
      "Order Today Save {discount}%",
    ],
    d: [
      "Get up to {discount}% off {product} today. Buy 1 get 1 {discount}% off. Free {country} shipping on orders over {currency}{ship_min}.",
      "Try {product} risk-free with our {guarantee}-day money-back guarantee. Order now starting at just {currency}{price}.",
      "Limited time offer! Claim your {discount}% discount on {product} bundles today. Delivery to the {country}.",
      "Buy {product} for only {currency}{price}. Enjoy a {guarantee}-day guarantee and up to {discount}% off today.",
    ],
    callouts: [
      "Up To {discount}% Off",
      "Free Shipping Over {currency}{ship_min}",
      "{guarantee}-Day Guarantee",
      "Buy 1 Get 1 {discount}% Off",
      "Starting At {currency}{price}",
    ],
    sitelinks: [
      ["Claim {discount}% Off",      "Buy 1 get 1 {discount}% off today.",        "Exclusive bundle deals."],
      ["Free {country} Shipping",    "Free shipping on orders over {currency}{ship_min}.", "Fast delivery across the {country}."],
      ["{guarantee}-Day Guarantee",  "Try {product} completely risk-free.",        "100% money-back guarantee."],
      ["Order {product} Now",        "Devices starting at just {currency}{price}.", "Order from the official site."],
      ["Bundle Pricing",             "Save big with our bundles.",                 "Special discount applied."],
      ["Limited Time Sale",          "Don't miss out on {discount}% off.",         "Order today to save instantly."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Discount", "Free {country} Shipping", "{guarantee}-Day Guarantee", "Bundles From {currency}{price}"],
  },

  pt: {
    h: [
      "{product} Site Oficial",
      "Até {discount}% OFF Hoje",
      "Compre 1 Leve 2 c/{discount}% OFF",
      "Frete Grátis no Brasil",
      "Garantia de {guarantee} Dias",
      "{product} Por {currency}{price}",
      "Oferta Limitada {discount}% OFF",
      "Garanta {discount}% de Desconto",
      "Oferta Especial: {discount}% OFF",
      "{product} {discount}% Desconto",
      "Experimente Sem Risco",
      "Frete Grátis Acima {currency}{ship_min}",
      "Preço de Kit Exclusivo",
      "Compre com Segurança",
      "Peça Hoje, Economize {discount}%",
    ],
    d: [
      "Até {discount}% OFF em {product} hoje. Frete grátis acima de {currency}{ship_min}. Garantia de {guarantee} dias.",
      "Experimente {product} sem risco — {guarantee} dias de garantia. Compre agora por {currency}{price}.",
      "Oferta limitada! {discount}% OFF em kits de {product} hoje. Entrega para todo o Brasil.",
      "{product} por {currency}{price}. Garantia de {guarantee} dias e até {discount}% de desconto hoje.",
    ],
    callouts: [
      "Até {discount}% OFF",
      "Frete Grátis Acima {currency}{ship_min}",
      "Garantia {guarantee} Dias",
      "Kit com {discount}% Desconto",
      "A Partir de {currency}{price}",
    ],
    sitelinks: [
      ["Desconto de {discount}%",   "Kit com {discount}% de desconto hoje.",      "Ofertas exclusivas de kit."],
      ["Frete Grátis",              "Frete grátis acima de {currency}{ship_min}.", "Entrega rápida no Brasil."],
      ["Garantia {guarantee} Dias", "Experimente sem risco algum.",               "Devolução em {guarantee} dias."],
      ["Comprar {product}",         "A partir de {currency}{price} por unidade.",  "Compre no site oficial."],
      ["Preço de Kit",              "Economize mais com nossos kits.",             "Desconto aplicado automaticamente."],
      ["Oferta Tempo Limitado",     "Não perca {discount}% de desconto.",          "Peça hoje e economize."],
    ],
    snippetHeader: "Tipos",
    snippetValues: ["{discount}% de Desconto", "Frete Grátis", "Garantia {guarantee} Dias", "Kits a Partir {currency}{price}"],
  },

  es: {
    h: [
      "{product} Sitio Oficial",
      "Hasta {discount}% de Descuento",
      "2x1 con {discount}% OFF",
      "Envío Gratis a {country}",
      "Garantía de {guarantee} Días",
      "{product} Por Solo {currency}{price}",
      "Oferta Limitada {discount}% OFF",
      "Reclama tu {discount}% de Dto.",
      "Oferta Especial: {discount}% OFF",
      "{product} {discount}% Descuento",
      "Prueba {product} Sin Riesgo",
      "Envío Gratis Desde {currency}{ship_min}",
      "Precio Bundle Exclusivo",
      "Asegura tu Pedido Ahora",
      "Ordena Hoy, Ahorra {discount}%",
    ],
    d: [
      "Hasta {discount}% off en {product} hoy. Envío gratis en pedidos sobre {currency}{ship_min}. Garantía {guarantee} días.",
      "Prueba {product} sin riesgo con garantía de {guarantee} días. Ordena desde {currency}{price}.",
      "¡Tiempo limitado! {discount}% de descuento en bundles de {product}. Envío a {country}.",
      "Compra {product} por {currency}{price}. Garantía {guarantee} días y hasta {discount}% de descuento hoy.",
    ],
    callouts: [
      "Hasta {discount}% Descuento",
      "Envío Gratis Desde {currency}{ship_min}",
      "Garantía {guarantee} Días",
      "Bundle 2x1 {discount}% OFF",
      "Desde Solo {currency}{price}",
    ],
    sitelinks: [
      ["Descuento {discount}%",      "Bundle con {discount}% off hoy.",            "Ofertas exclusivas de bundle."],
      ["Envío Gratis",               "Envío gratis en pedidos sobre {currency}{ship_min}.", "Entrega rápida a {country}."],
      ["Garantía {guarantee} Días",  "Prueba {product} completamente gratis.",      "Reembolso 100% garantizado."],
      ["Ordenar {product} Ya",       "Dispositivos desde solo {currency}{price}.",  "Compra en el sitio oficial."],
      ["Precios Bundle",             "Ahorra más con nuestros bundles.",            "Descuento aplicado al instante."],
      ["Oferta Tiempo Limitado",     "No pierdas el {discount}% off.",              "Ordena hoy y ahorra al instante."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Descuento", "Envío Gratis", "Garantía {guarantee} Días", "Bundles Desde {currency}{price}"],
  },

  de: {
    h: [
      "{product} Offizieller Shop",
      "Bis zu {discount}% Rabatt Heute",
      "2 Kaufen, 1 mit {discount}% Off",
      "Kostenloser Versand",
      "{guarantee} Tage Geld-zurück",
      "{product} Ab {currency}{price}",
      "Zeitlich begrenzt {discount}% Off",
      "{discount}% Rabatt Jetzt Sichern",
      "Sonderangebot: {discount}% Rabatt",
      "{product} {discount}% Sparen",
      "{product} Risikofrei Testen",
      "Gratis Versand ab {currency}{ship_min}",
      "Exklusiver Bundle-Preis",
      "Jetzt Sicher Bestellen",
      "Heute Bestellen, {discount}% Sparen",
    ],
    d: [
      "Bis zu {discount}% auf {product}. Gratis Versand ab {currency}{ship_min}. {guarantee} Tage Garantie.",
      "{product} risikofrei testen – {guarantee} Tage Geld-zurück. Jetzt ab {currency}{price} bestellen.",
      "Zeitlich begrenzt! {discount}% Rabatt auf {product} Bundles. Lieferung nach {country}.",
      "{product} für {currency}{price}. {guarantee} Tage Garantie und bis zu {discount}% Rabatt heute.",
    ],
    callouts: [
      "Bis {discount}% Rabatt",
      "Gratis Versand ab {currency}{ship_min}",
      "{guarantee} Tage Garantie",
      "Bundle {discount}% Rabatt",
      "Ab {currency}{price}",
    ],
    sitelinks: [
      ["{discount}% Rabatt Sichern",  "Bundle mit {discount}% Rabatt heute.",       "Exklusive Bundle-Angebote."],
      ["Kostenloser Versand",          "Gratis Versand ab {currency}{ship_min}.",    "Schnelle Lieferung nach {country}."],
      ["{guarantee}-Tage-Garantie",    "{product} komplett risikofrei testen.",      "100% Geld-zurück-Garantie."],
      ["{product} Jetzt Bestellen",    "Geräte ab {currency}{price}.",               "Im offiziellen Shop kaufen."],
      ["Bundle-Preise",                "Mit Bundles mehr sparen.",                   "Rabatt automatisch abgezogen."],
      ["Zeitlich Begrenzt",            "{discount}% Rabatt nicht verpassen.",         "Heute bestellen und sparen."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Rabatt", "Kostenloser Versand", "{guarantee} Tage Garantie", "Bundles ab {currency}{price}"],
  },

  da: {
    h: [
      "{product} Officielt Site",
      "Op til {discount}% Rabat I Dag",
      "60-Dages Pengene-Tilbage",
      "Hurtig Levering til EU",
      "Bestil Nu fra {currency}{price}",
      "Tidsbegrænset {discount}% Tilbud",
      "Spar {discount}% på {product}",
      "Særtilbud: {discount}% Rabat",
      "{product} - {discount}% Rabat",
      "Prøv {product} Risikofrit",
      "Gratis EU Levering",
      "{guarantee}-Dages Tilfredshed",
      "Eksklusiv Bundle Pris",
      "Sikker & Diskret Kasse",
      "Bestil I Dag, Spar {discount}%",
    ],
    d: [
      "Op til {discount}% rabat på {product} i dag. {guarantee}-dages pengene-tilbage garanti. Hurtig EU levering.",
      "Prøv {product} risikofrit med vores {guarantee}-dages tilfredshedsgaranti. Bestil fra {currency}{price}.",
      "Tidsbegrænset tilbud! {discount}% rabat på {product} i dag. Hurtig og diskret levering til {country}.",
      "Køb {product} for kun {currency}{price}. Nyd {guarantee}-dages garanti og op til {discount}% rabat i dag.",
    ],
    callouts: [
      "Op til {discount}% Rabat",
      "Gratis EU Levering",
      "{guarantee}-Dages Garanti",
      "Sikker & Diskret Kasse",
      "Fra {currency}{price}",
    ],
    sitelinks: [
      ["Spar {discount}% I Dag",     "Op til {discount}% rabat på {product}.",     "Eksklusivt bundle tilbud."],
      ["Gratis EU Levering",          "Hurtig levering til hele EU.",               "Diskret og sikker forsendelse."],
      ["{guarantee}-Dages Garanti",   "Prøv {product} helt risikofrit.",            "Fuld pengene-tilbage garanti."],
      ["Bestil {product} Nu",         "Kapsler fra kun {currency}{price}.",         "Bestil fra det officielle site."],
      ["Bundle Pris",                 "Spar mere med vores bundles.",               "Rabat aktiveres automatisk."],
      ["Tidsbegrænset Tilbud",        "Gå ikke glip af {discount}% rabat.",         "Bestil i dag og spar straks."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Rabat", "Gratis EU Levering", "{guarantee}-Dages Garanti", "Fra {currency}{price}"],
  },
};

// ─── GENERATOR ─────────────────────────────────────────────────────────────

export function generateAllCopy(ctx: CopyContext, lang: string, finalUrl: string): GeneratedCopy {
  const tmpl = COPY[lang] ?? COPY["en"];

  const campaign = `Search - ${ctx.product} - ${ctx.country}`;
  const adGroup  = `${ctx.product} - Offer`;
  const path1    = trunc(ctx.product, 15);
  const path2    = trunc(`${ctx.discount}-Off`, 15);

  const headlines    = tmpl.h.slice(0, 15).map(t => renderTrunc(t, ctx, 30));
  const descriptions = tmpl.d.slice(0, 4).map(t => renderTrunc(t, ctx, 90));
  const callouts     = tmpl.callouts.map(t => renderTrunc(t, ctx, 25));
  const sitelinks: SitelinkEntry[] = tmpl.sitelinks.map(([txt, d1, d2]) => ({
    text: renderTrunc(txt, ctx, 25),
    url:  finalUrl,
    d1:   renderTrunc(d1, ctx, 35),
    d2:   renderTrunc(d2, ctx, 35),
  }));
  const snippetHeader = tmpl.snippetHeader;
  const snippetValues = tmpl.snippetValues.map(v => renderTrunc(v, ctx, 25));

  return {
    campaign, adGroup, path1, path2,
    headlines, descriptions, callouts, sitelinks,
    snippetHeader, snippetValues,
    promo: {
      occasion: "None",
      discountType: "Percent",
      percentOff: parseInt(ctx.discount) || 0,
      promoCode: "",
      finalUrl,
    },
  };
}

// ─── VALIDATION ────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateCopy(copy: GeneratedCopy): ValidationResult {
  const errors: string[] = [];
  copy.headlines.forEach((h, i) => { if (h.length > 30) errors.push(`H${i+1} excede 30 chars [${h.length}]`); });
  copy.descriptions.forEach((d, i) => { if (d.length > 90) errors.push(`D${i+1} excede 90 chars [${d.length}]`); });
  copy.callouts.forEach((c, i) => { if (c.length > 25) errors.push(`Callout ${i+1} excede 25 chars [${c.length}]`); });
  copy.sitelinks.forEach((s, i) => {
    if (s.text.length > 25) errors.push(`Sitelink ${i+1} text excede 25 chars`);
    if (s.d1.length > 35)   errors.push(`Sitelink ${i+1} D1 excede 35 chars`);
    if (s.d2.length > 35)   errors.push(`Sitelink ${i+1} D2 excede 35 chars`);
  });
  return { valid: errors.length === 0, errors };
}
