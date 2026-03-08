// ─── TYPES ─────────────────────────────────────────────────────────────────

export interface CopyContext {
  product: string;
  country: string;
  discount: string;
  guarantee: string;
  price: string;
  currency: string;
  ship_min: string;
  has_free_shipping: string; // "yes" | "no"
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

/**
 * Strips Google Ads macro wrappers to get the text Google actually measures.
 * {KeyWord:Slimanol}          → "Slimanol"
 * {LOCATION(City):Miami}      → "Miami"
 */
export function effectiveText(text: string): string {
  return text
    .replace(/\{KeyWord:([^}]+)\}/gi, "$1")
    .replace(/\{LOCATION\([^)]+\):([^}]+)\}/gi, "$1");
}

export function effectiveLength(text: string): number {
  return effectiveText(text).length;
}

/**
 * Truncates at word boundary so effectiveLength(result) <= limit.
 * Treats Google macro tags ({KeyWord:...}, {LOCATION...:...}) as atomic tokens —
 * they are never split mid-tag.
 */
export function trunc(text: string, limit: number): string {
  if (effectiveLength(text) <= limit) return text;
  // Tokenize: each tag or whitespace-separated word is one token
  const tokens = text.match(/\{[^}]+\}|[^\s]+/g) ?? [];
  let result = "";
  for (const token of tokens) {
    const candidate = result ? result + " " + token : token;
    if (effectiveLength(candidate) > limit) break;
    result = candidate;
  }
  return result;
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
    // H1–H13: DKI (87% ≈ 90%) | H14–H15: Location (shipping/scarcity focus)
    h: [
      "{KeyWord:{product}} Official Site",
      "{KeyWord:{product}} {discount}% Off",
      "{KeyWord:{product}} Risk-Free Trial",
      "{KeyWord:{product}} Bundle Deal",
      "{KeyWord:{product}} {guarantee}-Day",
      "Order {KeyWord:{product}} Now",
      "{discount}% Off {KeyWord:{product}}",
      "{KeyWord:{product}} Sale Today",
      "{KeyWord:{product}} {currency}{price}",
      "Try {KeyWord:{product}} Today",
      "{KeyWord:{product}} Free Shipping",
      "{KeyWord:{product}} Exclusive Offer",
      "{KeyWord:{product}} Near You",
      "Ship to {LOCATION(City):Miami}",
      "Near {LOCATION(City):Miami}? Order Now",
    ],
    // D1+D3: DKI + Location (50%) | D2+D4: DKI only (100% DKI total)
    d: [
      "{KeyWord:{product}} {discount}% off. Free delivery to {LOCATION(City):Miami}. {guarantee}-day money-back guarantee.",
      "Try {KeyWord:{product}} risk-free with our {guarantee}-day guarantee. Order now from {currency}{price}.",
      "{discount}% off {KeyWord:{product}} bundles. Fast shipping to {LOCATION(City):Miami} and beyond.",
      "Buy {KeyWord:{product}} for {currency}{price}. Enjoy a {guarantee}-day guarantee and {discount}% off today.",
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
      ["Official {product} Store",   "Buy from the verified official store.",      "Secure checkout guaranteed."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Discount", "Free {country} Shipping", "{guarantee}-Day Guarantee", "Bundles From {currency}{price}"],
  },

  pt: {
    // H1–H13: DKI (87% ≈ 90%) | H14–H15: Localização (frete/escassez)
    h: [
      "{KeyWord:{product}} Site Oficial",
      "{KeyWord:{product}} {discount}% OFF Hoje",
      "Kit {KeyWord:{product}} {discount}% OFF",
      "{KeyWord:{product}} Sem Risco",
      "{KeyWord:{product}} {guarantee} Dias",
      "Peça {KeyWord:{product}} Agora",
      "{discount}% OFF {KeyWord:{product}}",
      "{KeyWord:{product}} Oferta Hoje",
      "{KeyWord:{product}} {currency}{price}",
      "Experimente {KeyWord:{product}}",
      "{KeyWord:{product}} Frete Grátis",
      "{KeyWord:{product}} Oferta Exclusiva",
      "{KeyWord:{product}} Perto de Você",
      "Entrega em {LOCATION(City):São Paulo}",
      "Perto de {LOCATION(City):Rio}? Peça Já",
    ],
    d: [
      "{KeyWord:{product}} {discount}% OFF agora. Entrega em {LOCATION(City):São Paulo} e todo o Brasil. Garantia de {guarantee} dias.",
      "Experimente {KeyWord:{product}} sem risco com garantia de {guarantee} dias. Compre agora por {currency}{price}.",
      "{discount}% OFF em kits {KeyWord:{product}} hoje. Envio rápido para {LOCATION(City):São Paulo} e todo o país.",
      "Compre {KeyWord:{product}} por {currency}{price}. Garantia de {guarantee} dias e até {discount}% de desconto.",
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
      ["Site Oficial {product}",    "Compre no site oficial verificado.",          "Pagamento 100% seguro."],
    ],
    snippetHeader: "Tipos",
    snippetValues: ["{discount}% de Desconto", "Frete Grátis", "Garantia {guarantee} Dias", "Kits a Partir {currency}{price}"],
  },

  es: {
    // H1–H13: DKI | H14–H15: Localización (envío/escasez)
    h: [
      "{KeyWord:{product}} Sitio Oficial",
      "{KeyWord:{product}} {discount}% Off",
      "Bundle {KeyWord:{product}} {discount}%",
      "{KeyWord:{product}} Sin Riesgo",
      "{KeyWord:{product}} {guarantee} Días",
      "Pide {KeyWord:{product}} Ya",
      "{discount}% Off {KeyWord:{product}}",
      "{KeyWord:{product}} Oferta Hoy",
      "{KeyWord:{product}} {currency}{price}",
      "Prueba {KeyWord:{product}} Hoy",
      "{KeyWord:{product}} Envío Gratis",
      "{KeyWord:{product}} Oferta Exclusiva",
      "{KeyWord:{product}} Cerca de Ti",
      "Envío a {LOCATION(City):Madrid}",
      "¿En {LOCATION(City):Madrid}? Pide Ya",
    ],
    d: [
      "{KeyWord:{product}} {discount}% off hoy. Envío a {LOCATION(City):Madrid} y toda España. Garantía {guarantee} días.",
      "Prueba {KeyWord:{product}} sin riesgo con garantía de {guarantee} días. Pide desde {currency}{price}.",
      "¡Oferta limitada! {discount}% off {KeyWord:{product}}. Envío rápido a {LOCATION(City):Madrid} y más ciudades.",
      "Compra {KeyWord:{product}} por {currency}{price}. Garantía {guarantee} días y hasta {discount}% de descuento.",
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
      ["Tienda Oficial {product}",   "Compra en la tienda oficial verificada.",     "Pago 100% seguro garantizado."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Descuento", "Envío Gratis", "Garantía {guarantee} Días", "Bundles Desde {currency}{price}"],
  },

  de: {
    // H1–H13: DKI | H14–H15: Standort (Versand/lokale Knappheit)
    h: [
      "{KeyWord:{product}} Offiziell",
      "{KeyWord:{product}} {discount}% Rabatt",
      "Bundle {KeyWord:{product}} {discount}%",
      "{KeyWord:{product}} Risikofrei",
      "{KeyWord:{product}} {guarantee} Tage",
      "Jetzt {KeyWord:{product}} Bestellen",
      "{discount}% Auf {KeyWord:{product}}",
      "{KeyWord:{product}} Angebot Heute",
      "{KeyWord:{product}} Ab {currency}{price}",
      "{KeyWord:{product}} Testen",
      "{KeyWord:{product}} Gratis Versand",
      "{KeyWord:{product}} Exklusiv",
      "{KeyWord:{product}} In Ihrer Nähe",
      "{LOCATION(City):Berlin} Lieferung",
      "Angebot In {LOCATION(City):Berlin}",
    ],
    d: [
      "{KeyWord:{product}} {discount}% Rabatt. Schnelle Lieferung nach {LOCATION(City):Berlin}. {guarantee} Tage Geld-zurück.",
      "{KeyWord:{product}} risikofrei testen – {guarantee} Tage Garantie. Jetzt ab {currency}{price} bestellen.",
      "{discount}% Rabatt auf {KeyWord:{product}} Bundles. Versand nach {LOCATION(City):Berlin} und ganz Deutschland.",
      "{KeyWord:{product}} für {currency}{price}. {guarantee} Tage Garantie und {discount}% Rabatt heute sichern.",
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
      ["Offizieller {product} Shop",   "Im verifizierten offiziellen Shop kaufen.",  "100% sicherer Checkout."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Rabatt", "Kostenloser Versand", "{guarantee} Tage Garantie", "Bundles ab {currency}{price}"],
  },

  da: {
    // H1–H13: DKI | H14–H15: Placering (levering/lokal knaphed)
    h: [
      "{KeyWord:{product}} Officielt Site",
      "{KeyWord:{product}} {discount}% Rabat",
      "Bundle {KeyWord:{product}} {discount}%",
      "{KeyWord:{product}} Risikofrit",
      "{KeyWord:{product}} {guarantee} Dage",
      "Bestil {KeyWord:{product}} Nu",
      "{discount}% På {KeyWord:{product}}",
      "{KeyWord:{product}} Tilbud I Dag",
      "{KeyWord:{product}} Fra {currency}{price}",
      "Prøv {KeyWord:{product}} I Dag",
      "{KeyWord:{product}} Gratis Levering",
      "{KeyWord:{product}} Eksklusivt",
      "{KeyWord:{product}} Nær Dig",
      "Levering til {LOCATION(City):Aarhus}",
      "Tilbud i {LOCATION(City):Aarhus} Nu",
    ],
    d: [
      "{KeyWord:{product}} {discount}% rabat nu. Hurtig levering til {LOCATION(City):København}. {guarantee}-dages garanti.",
      "Prøv {KeyWord:{product}} risikofrit med {guarantee}-dages pengene-tilbage. Bestil fra {currency}{price}.",
      "{discount}% rabat på {KeyWord:{product}} i dag. Levering til {LOCATION(City):København} og hele Danmark.",
      "Køb {KeyWord:{product}} for {currency}{price}. {guarantee}-dages garanti og op til {discount}% rabat i dag.",
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
      ["Officielt {product} Site",    "Køb fra det verificerede officielle site.",  "100% sikker betaling garanteret."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Rabat", "Gratis EU Levering", "{guarantee}-Dages Garanti", "Fra {currency}{price}"],
  },

  fr: {
    // H1–H13: DKI | H14–H15: Localisation (livraison/urgence locale)
    h: [
      "{KeyWord:{product}} Site Officiel",
      "{KeyWord:{product}} {discount}% Remise",
      "Pack {KeyWord:{product}} {discount}%",
      "{KeyWord:{product}} Sans Risque",
      "{KeyWord:{product}} {guarantee} Jours",
      "Commander {KeyWord:{product}}",
      "{discount}% Sur {KeyWord:{product}}",
      "{KeyWord:{product}} Offre Du Jour",
      "{KeyWord:{product}} Dès {currency}{price}",
      "Testez {KeyWord:{product}}",
      "{KeyWord:{product}} Livraison Offerte",
      "{KeyWord:{product}} Offre Exclusive",
      "{KeyWord:{product}} Près De Vous",
      "Livraison à {LOCATION(City):Paris}",
      "Offre à {LOCATION(City):Paris} Vite",
    ],
    d: [
      "{KeyWord:{product}} {discount}% de remise. Livraison rapide à {LOCATION(City):Paris}. Garantie {guarantee} jours remboursé.",
      "Testez {KeyWord:{product}} sans risque grâce à la garantie {guarantee} jours. Commandez dès {currency}{price}.",
      "{discount}% de remise sur {KeyWord:{product}}. Livraison express à {LOCATION(City):Paris} et toute la France.",
      "Achetez {KeyWord:{product}} pour {currency}{price}. Garantie {guarantee} jours et {discount}% de remise aujourd'hui.",
    ],
    callouts: [
      "Jusqu'à {discount}% de Remise",
      "Livraison Offerte Dès {currency}{ship_min}",
      "Garantie {guarantee} Jours",
      "Pack {discount}% OFF",
      "Dès {currency}{price}",
    ],
    sitelinks: [
      ["{discount}% de Remise",        "Pack avec {discount}% de remise.",            "Offres exclusives sur les packs."],
      ["Livraison Gratuite",            "Livraison offerte dès {currency}{ship_min}.", "Livraison rapide en France."],
      ["Garantie {guarantee} Jours",   "Testez {product} sans aucun risque.",         "Remboursement garanti {guarantee}j."],
      ["Commander {product}",          "Dès {currency}{price} par unité.",            "Commandez sur le site officiel."],
      ["Prix Pack",                    "Économisez plus avec nos packs.",             "Remise appliquée automatiquement."],
      ["Offre Limitée",                "Ne ratez pas {discount}% de remise.",         "Commandez aujourd'hui et économisez."],
      ["Site Officiel {product}",      "Achetez sur le site officiel vérifié.",       "Paiement 100% sécurisé garanti."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Remise", "Livraison Gratuite", "Garantie {guarantee} Jours", "Packs Dès {currency}{price}"],
  },

  fi: {
    // H1–H13: DKI | H14–H15: Sijainti (toimitus/paikallisuus)
    h: [
      "{KeyWord:{product}} Virallinen",
      "{KeyWord:{product}} {discount}% Alennus",
      "Paketti {KeyWord:{product}} {discount}%",
      "{KeyWord:{product}} Riskittä",
      "{KeyWord:{product}} {guarantee} Pv",
      "Tilaa {KeyWord:{product}} Nyt",
      "{discount}% Alennus {KeyWord:{product}}",
      "{KeyWord:{product}} Tarjous Nyt",
      "{KeyWord:{product}} Vain {currency}{price}",
      "Kokeile {KeyWord:{product}}",
      "{KeyWord:{product}} Ilmainen Toimitus",
      "{KeyWord:{product}} Erikoishinta",
      "{KeyWord:{product}} Lähellä Sinua",
      "Toimitus {LOCATION(City):Tampere}",
      "Tarjous {LOCATION(City):Tampere} Nyt",
    ],
    d: [
      "{KeyWord:{product}} {discount}% alennuksella. Toimitus {LOCATION(City):Helsinki} ja koko Suomeen. {guarantee} pv takuu.",
      "Kokeile {KeyWord:{product}} täysin riskittä. {guarantee} pv rahat takaisin. Tilaa alkaen {currency}{price}.",
      "{discount}% alennus {KeyWord:{product}} paketeista. Nopea toimitus {LOCATION(City):Helsinki} ja muualle Suomeen.",
      "Osta {KeyWord:{product}} vain {currency}{price}. {guarantee} päivän takuu ja {discount}% alennus tänään.",
    ],
    callouts: [
      "Jopa {discount}% Alennus",
      "Ilmainen Toimitus Yli {currency}{ship_min}",
      "{guarantee} Pv Takuu",
      "Paketti {discount}% Off",
      "Alkaen {currency}{price}",
    ],
    sitelinks: [
      ["{discount}% Alennus Nyt",      "{discount}% alennus {product} paketeista.",   "Parhaat pakettitarjoukset."],
      ["Ilmainen Toimitus",             "Ilmainen toimitus yli {currency}{ship_min}.", "Nopea toimitus Suomeen."],
      ["{guarantee} Pv Takuu",          "Kokeile {product} täysin riskittä.",          "Rahat takaisin {guarantee} pv."],
      ["Tilaa {product} Nyt",           "Tuotteet alkaen {currency}{price}.",          "Tilaa virallisesta kaupasta."],
      ["Pakettihinta",                  "Säästä enemmän paketeilla.",                  "Alennus lisätään automaattisesti."],
      ["Rajoitettu Tarjous",            "Älä missaa {discount}% alennusta.",           "Tilaa tänään ja säästä heti."],
      ["Virallinen {product} Kauppa",   "Osta virallisesta vahvistetusta kaupasta.",   "100% turvallinen maksu."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Alennus", "Ilmainen Toimitus", "{guarantee} Pv Takuu", "Alkaen {currency}{price}"],
  },

  ro: {
    // H1–H13: DKI | H14–H15: Localizare (livrare/urgență locală)
    h: [
      "{KeyWord:{product}} Site Oficial",
      "{KeyWord:{product}} {discount}% Reducere",
      "Pachet {KeyWord:{product}} {discount}%",
      "{KeyWord:{product}} Fără Risc",
      "{KeyWord:{product}} {guarantee} Zile",
      "Comandă {KeyWord:{product}} Acum",
      "{discount}% Off {KeyWord:{product}}",
      "{KeyWord:{product}} Ofertă Azi",
      "{KeyWord:{product}} De La {currency}{price}",
      "Testează {KeyWord:{product}}",
      "{KeyWord:{product}} Transport Gratuit",
      "{KeyWord:{product}} Exclusiv",
      "{KeyWord:{product}} Lângă Tine",
      "Livrare în {LOCATION(City):Cluj}",
      "Ofertă în {LOCATION(City):Cluj} Acum",
    ],
    d: [
      "{KeyWord:{product}} {discount}% reducere. Livrare rapidă în {LOCATION(City):București}. Garanție {guarantee} zile.",
      "Testează {KeyWord:{product}} fără risc cu garanția de {guarantee} zile. Comandă de la {currency}{price}.",
      "{discount}% reducere la {KeyWord:{product}}. Livrare rapidă în {LOCATION(City):București} și toată România.",
      "Cumpără {KeyWord:{product}} pentru {currency}{price}. Garanție {guarantee} zile și {discount}% reducere azi.",
    ],
    callouts: [
      "Până la {discount}% Reducere",
      "Transport Gratuit Peste {currency}{ship_min}",
      "Garanție {guarantee} Zile",
      "Pachet {discount}% OFF",
      "De La {currency}{price}",
    ],
    sitelinks: [
      ["{discount}% Reducere Acum",    "Pachet cu {discount}% reducere astăzi.",      "Oferte exclusive la pachete."],
      ["Transport Gratuit",             "Gratuit la comenzi peste {currency}{ship_min}.", "Livrare rapidă în România."],
      ["Garanție {guarantee} Zile",    "Testează {product} complet fără risc.",        "Ramburs garantat {guarantee} zile."],
      ["Comandă {product} Acum",       "Produse de la {currency}{price}.",             "Comandă de pe site-ul oficial."],
      ["Preț Pachet",                  "Economisești mai mult cu pachete.",            "Reducere aplicată automat."],
      ["Ofertă Limitată",              "Nu rata {discount}% reducere.",                "Comandă azi și economisești."],
      ["Site Oficial {product}",       "Cumpără de pe site-ul oficial verificat.",     "Plată 100% securizată garantată."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Reducere", "Transport Gratuit", "Garanție {guarantee} Zile", "De La {currency}{price}"],
  },

  bg: {
    // H1–H13: DKI (87% ≈ 90%) | H14–H15: Локация (доставка/оскъдност)
    h: [
      "{KeyWord:{product}} Официален Сайт",
      "{KeyWord:{product}} {discount}% Отстъпка",
      "Пакет {KeyWord:{product}} {discount}%",
      "{KeyWord:{product}} Без Риск",
      "{KeyWord:{product}} {guarantee} Дни",
      "Поръчай {KeyWord:{product}} Сега",
      "{discount}% На {KeyWord:{product}}",
      "{KeyWord:{product}} Оферта Днес",
      "{KeyWord:{product}} От {currency}{price}",
      "Изпробвай {KeyWord:{product}}",
      "{KeyWord:{product}} Безплатна Доставка",
      "{KeyWord:{product}} Ексклузивно",
      "{KeyWord:{product}} До Вас",
      "Доставка до {LOCATION(City):София}",
      "Оферта в {LOCATION(City):София} Сега",
    ],
    d: [
      "{KeyWord:{product}} {discount}% отстъпка. Бърза доставка до {LOCATION(City):София}. Гаранция {guarantee} дни.",
      "Изпробвайте {KeyWord:{product}} без риск. Гаранция {guarantee} дни. Поръчайте от {currency}{price}.",
      "{discount}% отстъпка на {KeyWord:{product}}. Доставка до {LOCATION(City):София} и цяла България.",
      "Купете {KeyWord:{product}} за {currency}{price}. Гаранция {guarantee} дни и {discount}% отстъпка днес.",
    ],
    callouts: [
      "До {discount}% Отстъпка",
      "Безплатна Доставка",
      "Гаранция {guarantee} Дни",
      "Пакет {discount}% Отстъпка",
      "От {currency}{price}",
    ],
    sitelinks: [
      ["{discount}% Отстъпка Сега",   "Пакет с {discount}% отстъпка днес.",          "Ексклузивни пакетни оферти."],
      ["Безплатна Доставка",           "Безплатна доставка над {currency}{ship_min}.", "Бърза доставка в България."],
      ["Гаранция {guarantee} Дни",    "Изпробвайте без никакъв риск.",               "Връщане за {guarantee} дни."],
      ["Поръчай Сега",                 "Продукти от {currency}{price}.",              "Поръчайте от официалния сайт."],
      ["Пакетна Цена",                 "Спестете повече с пакети.",                   "Отстъпката се прилага автоматично."],
      ["Ограничена Оферта",            "Не пропускайте {discount}% отстъпка.",        "Поръчайте днес и спестете."],
      ["Официален Сайт {product}",     "Купете от официалния верифициран сайт.",       "100% сигурно плащане гарантирано."],
    ],
    snippetHeader: "Types",
    snippetValues: ["{discount}% Отстъпка", "Безплатна Доставка", "Гаранция {guarantee} Дни", "От {currency}{price}"],
  },
};

// ─── GENERATOR ─────────────────────────────────────────────────────────────

// Returns true if the template uses a variable that is empty in ctx
function usesEmptyVar(template: string, ctx: CopyContext): boolean {
  const checks: [string, string][] = [
    ["{guarantee}", ctx.guarantee],
    ["{price}",     ctx.price],
    ["{discount}",  ctx.discount],
    ["{ship_min}",  ctx.ship_min],
    ["{currency}",  ctx.currency],
  ];
  return checks.some(([placeholder, value]) =>
    template.includes(placeholder) && (!value || value === "0")
  );
}

// Keywords that indicate a shipping-related template (multilingual)
const SHIPPING_WORDS = [
  "ship", "shipping", "delivery", "deliver",      // en
  "frete", "entrega",                              // pt
  "envío", "envio",                                // es
  "versand", "lieferung",                          // de
  "livraison", "envoi",                            // fr
  "toimitus",                                      // fi
  "levering",                                      // da
  "transport", "livrare",                          // ro
  "доставка",                                      // bg
];

function hasShippingRef(text: string): boolean {
  const lower = text.toLowerCase();
  return SHIPPING_WORDS.some(w => lower.includes(w));
}

export function generateAllCopy(ctx: CopyContext, lang: string, finalUrl: string): GeneratedCopy {
  const tmpl = COPY[lang] ?? COPY["en"];
  const noShip = ctx.has_free_shipping !== "yes";

  const campaign = `Search - ${ctx.product} - ${ctx.country}`;
  const adGroup  = `${ctx.product} - Offer`;
  const path1    = trunc(ctx.product, 15);
  const path2    = ctx.discount ? trunc(`${ctx.discount}-Off`, 15) : trunc(ctx.product, 15);

  // Filter: skip templates with empty vars OR shipping refs when no free shipping
  const skip = (t: string) => usesEmptyVar(t, ctx) || (noShip && hasShippingRef(t));

  const validH = tmpl.h.filter(t => !skip(t));
  const validD = tmpl.d.filter(t => !skip(t));

  const headlines    = validH.slice(0, 15).map(t => renderTrunc(t, ctx, 30));
  const descriptions = validD.slice(0, 4).map(t => renderTrunc(t, ctx, 90));
  const callouts     = tmpl.callouts.filter(t => !skip(t)).map(t => renderTrunc(t, ctx, 25));

  // Google rejects identical URLs across sitelinks — generate small variations
  const base = finalUrl.replace(/\/+$/, "");
  const urlVariants = [
    base + "/",
    base + "//",
    base + "/?",
    base + "/#",
    base + "/?ref=1",
    base + "/?src=2",
    base + "/?v=3",
  ];
  const sitelinks: SitelinkEntry[] = tmpl.sitelinks
    .filter(([txt, d1, d2]) => !skip(txt + d1 + d2))
    .map(([txt, d1, d2], i) => ({
      text: renderTrunc(txt, ctx, 25),
      url:  urlVariants[i] ?? finalUrl,
      d1:   renderTrunc(d1, ctx, 35),
      d2:   renderTrunc(d2, ctx, 35),
    }));
  const snippetHeader = tmpl.snippetHeader;
  const snippetValues = tmpl.snippetValues
    .filter(v => !usesEmptyVar(v, ctx))
    .map(v => renderTrunc(v, ctx, 25));

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
  // Use effectiveLength: Google counts fallback text, not macro syntax
  copy.headlines.forEach((h, i) => {
    const len = effectiveLength(h);
    if (len > 30) errors.push(`H${i+1} excede 30 chars [${len}]`);
  });
  copy.descriptions.forEach((d, i) => {
    const len = effectiveLength(d);
    if (len > 90) errors.push(`D${i+1} excede 90 chars [${len}]`);
  });
  copy.callouts.forEach((c, i) => {
    if (effectiveLength(c) > 25) errors.push(`Callout ${i+1} excede 25 chars`);
  });
  copy.sitelinks.forEach((s, i) => {
    if (effectiveLength(s.text) > 25) errors.push(`Sitelink ${i+1} text excede 25 chars`);
    if (effectiveLength(s.d1)   > 35) errors.push(`Sitelink ${i+1} D1 excede 35 chars`);
    if (effectiveLength(s.d2)   > 35) errors.push(`Sitelink ${i+1} D2 excede 35 chars`);
  });
  return { valid: errors.length === 0, errors };
}
