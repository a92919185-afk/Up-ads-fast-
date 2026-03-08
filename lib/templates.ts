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
      "Ship to {LOCATION(City):City}",
      "Near {LOCATION(City):City}? Order Now",
    ],
    // D1+D3: DKI + Location (50%) | D2+D4: DKI only (100% DKI total)
    d: [
      "{KeyWord:{product}} {discount}% off. Free delivery to {LOCATION(City):City}. {guarantee}-day money-back guarantee.",
      "Try {KeyWord:{product}} risk-free with our {guarantee}-day guarantee. Order now from {currency}{price}.",
      "{discount}% off {KeyWord:{product}} bundles. Fast shipping to {LOCATION(City):City} and beyond.",
      "Buy {KeyWord:{product}} for {currency}{price}. Enjoy a {guarantee}-day guarantee and {discount}% off today.",
    ],
    callouts: [
      "Save Up To {discount}% Off Today",
      "Free Shipping On All Orders Now",
      "Full {guarantee}-Day Money-Back Guarantee",
      "Buy 1 Get 1 {discount}% Off Bundles",
      "Shop From Just {currency}{price} Today",
    ],
    sitelinks: [
      ["Claim {discount}% Off Today",    "Buy 1 get 1 {discount}% off — limited time.",  "Access exclusive bundle discounts now."],
      ["Free {country} Shipping Today",  "Free shipping on orders over {currency}{ship_min}.", "Fast delivery across the entire {country}."],
      ["{guarantee}-Day Risk-Free Trial","Try {product} completely risk-free today.",   "Full {guarantee}-day money-back guarantee."],
      ["Get Your {product} Today",       "Order {product} from just {currency}{price}.", "Order directly from the official site."],
      ["Best Bundle Deals Today",        "Save more with our exclusive bundles now.",    "Special discount applied at checkout."],
      ["Flash Sale Ending Tonight",      "Don't miss out on {discount}% off today.",     "Order today and save instantly online."],
      ["Visit The Official Store",       "Trusted official store — shop securely now.",  "Verified secure checkout guaranteed."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Official Product", "Risk-Free Trial", "Fast Worldwide Delivery", "Secure Checkout",
      "{discount}% Discount", "{guarantee}-Day Guarantee", "Bundles From {currency}{price}",
    ],
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
      "Entrega em {LOCATION(City):cidade}",
      "Perto de {LOCATION(City):cidade}? Peça Já",
    ],
    d: [
      "{KeyWord:{product}} {discount}% OFF agora. Entrega em {LOCATION(City):cidade} e todo o Brasil. Garantia de {guarantee} dias.",
      "Experimente {KeyWord:{product}} sem risco com garantia de {guarantee} dias. Compre agora por {currency}{price}.",
      "{discount}% OFF em kits {KeyWord:{product}} hoje. Envio rápido para {LOCATION(City):cidade} e todo o país.",
      "Compre {KeyWord:{product}} por {currency}{price}. Garantia de {guarantee} dias e até {discount}% de desconto.",
    ],
    callouts: [
      "Economize Até {discount}% OFF Agora",
      "Frete Grátis Acima de {currency}{ship_min}",
      "Garantia Total de {guarantee} Dias",
      "Kit com {discount}% de Desconto Hoje",
      "Produtos A Partir de {currency}{price}",
    ],
    sitelinks: [
      ["Garanta {discount}% de Desconto",   "Kit com {discount}% de desconto hoje.",       "Acesse ofertas exclusivas de kit agora."],
      ["Frete Grátis Para Você",             "Frete grátis acima de {currency}{ship_min}.", "Entrega rápida para todo o Brasil."],
      ["Garantia {guarantee} Dias Grátis",   "Experimente sem risco absolutamente algum.",  "Devolução garantida em {guarantee} dias."],
      ["Peça {product} Hoje Mesmo",          "A partir de {currency}{price} por unidade.",  "Compre direto no site oficial agora."],
      ["Melhores Preços em Kits",            "Economize mais com nossos kits exclusivos.",  "Desconto aplicado automaticamente aqui."],
      ["Oferta Por Tempo Limitado",          "Não perca {discount}% de desconto hoje.",     "Peça hoje e economize na hora."],
      ["Compre No Site Oficial Agora",       "Site verificado com pagamento 100% seguro.",  "Checkout seguro e confiável garantido."],
    ],
    snippetHeader: "Tipos",
    snippetValues: [
      "Produto Oficial", "Sem Risco", "Entrega Rápida", "Pagamento Seguro",
      "{discount}% de Desconto", "Garantia {guarantee} Dias", "Kits a Partir {currency}{price}",
    ],
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
      "Envío a {LOCATION(City):ciudad}",
      "¿En {LOCATION(City):ciudad}? Pide Ya",
    ],
    d: [
      "{KeyWord:{product}} {discount}% off hoy. Envío a {LOCATION(City):ciudad} y toda España. Garantía {guarantee} días.",
      "Prueba {KeyWord:{product}} sin riesgo con garantía de {guarantee} días. Pide desde {currency}{price}.",
      "¡Oferta limitada! {discount}% off {KeyWord:{product}}. Envío rápido a {LOCATION(City):ciudad} y más ciudades.",
      "Compra {KeyWord:{product}} por {currency}{price}. Garantía {guarantee} días y hasta {discount}% de descuento.",
    ],
    callouts: [
      "Hasta {discount}% Descuento Hoy",
      "Envío Gratis Desde {currency}{ship_min}",
      "Garantía Completa {guarantee} Días",
      "Bundle 2x1 Con {discount}% OFF",
      "Precios Desde Solo {currency}{price}",
    ],
    sitelinks: [
      ["Obtén {discount}% de Descuento",  "Bundle con {discount}% off — solo hoy.",      "Accede a ofertas exclusivas de bundle."],
      ["Envío Gratis Hoy Mismo",           "Envío gratis en pedidos sobre {currency}{ship_min}.", "Entrega rápida a {country} garantizada."],
      ["Garantía {guarantee} Días Total",  "Prueba {product} completamente sin riesgo.",  "Reembolso 100% garantizado siempre."],
      ["Pide Tu {product} Hoy",           "Desde solo {currency}{price} por unidad.",    "Compra directo en el sitio oficial."],
      ["Los Mejores Packs Hoy",            "Ahorra más con nuestros bundles exclusivos.", "Descuento aplicado automáticamente aquí."],
      ["Oferta Flash Por Tiempo",          "No pierdas el {discount}% off de hoy.",       "Ordena hoy y ahorra al instante ya."],
      ["Visita La Tienda Oficial",         "Tienda oficial verificada — compra segura.",   "Pago 100% seguro garantizado siempre."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Producto Oficial", "Sin Riesgo", "Entrega Rápida", "Pago Seguro",
      "{discount}% Descuento", "Garantía {guarantee} Días", "Bundles Desde {currency}{price}",
    ],
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
      "{LOCATION(City):Stadt} Lieferung",
      "Angebot In {LOCATION(City):Stadt}",
    ],
    d: [
      "{KeyWord:{product}} {discount}% Rabatt. Schnelle Lieferung nach {LOCATION(City):Stadt}. {guarantee} Tage Geld-zurück.",
      "{KeyWord:{product}} risikofrei testen – {guarantee} Tage Garantie. Jetzt ab {currency}{price} bestellen.",
      "{discount}% Rabatt auf {KeyWord:{product}} Bundles. Versand nach {LOCATION(City):Stadt} und ganz Deutschland.",
      "{KeyWord:{product}} für {currency}{price}. {guarantee} Tage Garantie und {discount}% Rabatt heute sichern.",
    ],
    callouts: [
      "Bis Zu {discount}% Rabatt Jetzt",
      "Gratis Versand Ab {currency}{ship_min}",
      "{guarantee} Tage Geld-Zurück-Garantie",
      "Bundle Deal Mit {discount}% Rabatt",
      "Angebote Ab Nur {currency}{price}",
    ],
    sitelinks: [
      ["Jetzt {discount}% Rabatt Sichern",  "Bundle mit {discount}% Rabatt — nur heute.",    "Exklusive Bundle-Angebote entdecken."],
      ["Kostenloser Versand Heute",          "Gratis Versand ab {currency}{ship_min}.",        "Schnelle Lieferung nach ganz {country}."],
      ["{guarantee} Tage Risikofrei Testen", "{product} komplett risikofrei ausprobieren.",    "Volle {guarantee}-Tage Geld-zurück-Garantie."],
      ["{product} Jetzt Bestellen",          "Produkte ab nur {currency}{price} bestellen.",   "Direkt im offiziellen Shop kaufen."],
      ["Beste Bundle-Angebote Heute",        "Mit Bundles noch mehr Geld sparen jetzt.",       "Rabatt wird automatisch abgezogen."],
      ["Flash-Sale Nur Heute",               "{discount}% Rabatt nicht verpassen jetzt.",      "Heute bestellen und sofort sparen."],
      ["Offiziellen Shop Besuchen",          "Verifizierter offizieller Shop — sicher kaufen.", "100% sicherer und geprüfter Checkout."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Offizielles Produkt", "Risikofrei Testen", "Schnelle Lieferung", "Sicherer Kauf",
      "{discount}% Rabatt", "{guarantee} Tage Garantie", "Bundles ab {currency}{price}",
    ],
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
      "Levering til {LOCATION(City):by}",
      "Tilbud i {LOCATION(City):by} Nu",
    ],
    d: [
      "{KeyWord:{product}} {discount}% rabat nu. Hurtig levering til {LOCATION(City):by}. {guarantee}-dages garanti.",
      "Prøv {KeyWord:{product}} risikofrit med {guarantee}-dages pengene-tilbage. Bestil fra {currency}{price}.",
      "{discount}% rabat på {KeyWord:{product}} i dag. Levering til {LOCATION(City):by} og hele Danmark.",
      "Køb {KeyWord:{product}} for {currency}{price}. {guarantee}-dages garanti og op til {discount}% rabat i dag.",
    ],
    callouts: [
      "Op Til {discount}% Rabat I Dag",
      "Gratis EU Levering Inkluderet",
      "Fuld {guarantee}-Dages Garanti Gives",
      "Sikker Og Diskret Kasse Altid",
      "Prisgaranti På Alle Vores Varer",
    ],
    sitelinks: [
      ["Spar Op Til {discount}% I Dag",   "Op til {discount}% rabat på {product} nu.",    "Eksklusive bundle-tilbud venter dig her."],
      ["Gratis EU Levering I Dag",         "Hurtig levering til hele EU nu.",              "Diskret og sikker forsendelse garanteret."],
      ["{guarantee}-Dages Fuld Garanti",   "Prøv {product} helt risikofrit i dag.",        "Fuld pengene-tilbage garanti gives altid."],
      ["Bestil {product} I Dag Nu",        "Produkter fra kun {currency}{price} stykket.", "Bestil direkte fra det officielle site."],
      ["Bedste Bundle Tilbud Nu",          "Spar mere med vores eksklusive bundles nu.",   "Rabat aktiveres automatisk ved kassen."],
      ["Flash Udsalg Ender Snart",         "Gå ikke glip af {discount}% rabat i dag.",     "Bestil i dag og spar straks online."],
      ["Officiel {product} Butik Nu",      "Køb fra det verificerede officielle site nu.", "100% sikker betaling garanteret altid."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Officielt Produkt", "Risikofrit Køb", "Hurtig Levering", "Sikker Betaling",
      "{discount}% Rabat", "{guarantee}-Dages Garanti", "Fra {currency}{price}",
    ],
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
      "Livraison à {LOCATION(City):ville}",
      "Offre à {LOCATION(City):ville} Vite",
    ],
    d: [
      "{KeyWord:{product}} {discount}% de remise. Livraison rapide à {LOCATION(City):ville}. Garantie {guarantee} jours remboursé.",
      "Testez {KeyWord:{product}} sans risque grâce à la garantie {guarantee} jours. Commandez dès {currency}{price}.",
      "{discount}% de remise sur {KeyWord:{product}}. Livraison express à {LOCATION(City):ville} et toute la France.",
      "Achetez {KeyWord:{product}} pour {currency}{price}. Garantie {guarantee} jours et {discount}% de remise aujourd'hui.",
    ],
    callouts: [
      "Jusqu'à {discount}% de Remise Dès",
      "Livraison Offerte Dès {currency}{ship_min}",
      "Garantie Totale {guarantee} Jours Remboursé",
      "Pack Exclusif {discount}% OFF Aujourd'hui",
      "Prix Dès {currency}{price} Seulement",
    ],
    sitelinks: [
      ["Profitez De {discount}% De Remise", "Pack avec {discount}% de remise — ce soir.",  "Offres exclusives sur tous les packs."],
      ["Livraison Offerte Partout",          "Livraison offerte dès {currency}{ship_min}.", "Livraison rapide partout en France."],
      ["Garantie {guarantee} Jours Totale", "Testez {product} sans aucun risque du tout.", "Remboursement garanti sous {guarantee} jours."],
      ["Commandez {product} Vite",          "Dès {currency}{price} par unité seulement.",  "Commandez sur le site officiel certifié."],
      ["Meilleurs Offres En Pack Ici",      "Économisez plus avec nos packs exclusifs.",   "Remise appliquée automatiquement au panier."],
      ["Vente Flash Exclusive Du Jour",     "Ne ratez pas {discount}% de remise auj'hui.", "Commandez aujourd'hui et économisez vite."],
      ["Site Officiel Certifié {product}",  "Achetez sur le site officiel certifié ici.",  "Paiement 100% sécurisé et garanti."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Produit Officiel", "Sans Risque", "Livraison Rapide", "Paiement Sécurisé",
      "{discount}% Remise", "Garantie {guarantee} Jours", "Packs Dès {currency}{price}",
    ],
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
      "Toimitus {LOCATION(City):kaupunki}",
      "Tarjous {LOCATION(City):kaupunki} Nyt",
    ],
    d: [
      "{KeyWord:{product}} {discount}% alennuksella. Toimitus {LOCATION(City):kaupunki} ja koko Suomeen. {guarantee} pv takuu.",
      "Kokeile {KeyWord:{product}} täysin riskittä. {guarantee} pv rahat takaisin. Tilaa alkaen {currency}{price}.",
      "{discount}% alennus {KeyWord:{product}} paketeista. Nopea toimitus {LOCATION(City):kaupunki} ja muualle Suomeen.",
      "Osta {KeyWord:{product}} vain {currency}{price}. {guarantee} päivän takuu ja {discount}% alennus tänään.",
    ],
    callouts: [
      "Jopa {discount}% Alennus Nyt Heti",
      "Ilmainen Toimitus Yli {currency}{ship_min}",
      "{guarantee} Päivän Rahat Takaisin",
      "Paketti {discount}% Alennuksella Nyt",
      "Tuotteet Alkaen {currency}{price} Vain",
    ],
    sitelinks: [
      ["Säästä {discount}% Heti Tänään",   "{discount}% alennus {product} paketeista nyt.", "Parhaat pakettihinnat löydät täältä."],
      ["Ilmainen Toimitus Nyt",             "Ilmainen toimitus yli {currency}{ship_min}.",   "Nopea toimitus kaikkialle Suomeen."],
      ["{guarantee} Päivän Takuu Nyt",      "Kokeile {product} täysin riskittä tänään.",     "Rahat takaisin {guarantee} päivässä."],
      ["Tilaa {product} Nyt Heti",          "Tuotteet alkaen {currency}{price} vain.",        "Tilaa suoraan virallisesta kaupasta."],
      ["Parhaat Pakettitarjoukset",         "Säästä enemmän eksklusiivisilla paketeilla.",    "Alennus lisätään automaattisesti heti."],
      ["Rajoitettu Tarjous Nyt",            "Älä missaa {discount}% alennusta tänään.",       "Tilaa tänään ja säästä heti verkossa."],
      ["Virallinen {product} Kauppa",       "Osta vahvistetusta virallisesta kaupasta nyt.", "100% turvallinen maksu taattu aina."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Virallinen Tuote", "Riskitön Kokeilu", "Nopea Toimitus", "Turvallinen Maksu",
      "{discount}% Alennus", "{guarantee} Pv Takuu", "Alkaen {currency}{price}",
    ],
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
      "Livrare în {LOCATION(City):oraș}",
      "Ofertă în {LOCATION(City):oraș} Acum",
    ],
    d: [
      "{KeyWord:{product}} {discount}% reducere. Livrare rapidă în {LOCATION(City):oraș}. Garanție {guarantee} zile.",
      "Testează {KeyWord:{product}} fără risc cu garanția de {guarantee} zile. Comandă de la {currency}{price}.",
      "{discount}% reducere la {KeyWord:{product}}. Livrare rapidă în {LOCATION(City):oraș} și toată România.",
      "Cumpără {KeyWord:{product}} pentru {currency}{price}. Garanție {guarantee} zile și {discount}% reducere azi.",
    ],
    callouts: [
      "Până La {discount}% Reducere Azi",
      "Transport Gratuit Peste {currency}{ship_min}",
      "Garanție Completă {guarantee} Zile",
      "Pachet Reducere {discount}% OFF Acum",
      "Prețuri De La {currency}{price} Azi",
    ],
    sitelinks: [
      ["Reducere {discount}% Aplicată Azi",  "Pachet cu {discount}% reducere — azi.",       "Oferte exclusive la pachete acum."],
      ["Transport Gratuit Acum",              "Gratuit la comenzi peste {currency}{ship_min}.", "Livrare rapidă în toată România."],
      ["Garanție Completă {guarantee} Zile",  "Testează {product} complet fără niciun risc.", "Ramburs garantat în {guarantee} zile."],
      ["Comandă {product} Acum Azi",          "Produse de la {currency}{price} pe unitate.",  "Comandă direct de pe site-ul oficial."],
      ["Cele Mai Bune Pachete Azi",           "Economisești mai mult cu pachete exclusive.",  "Reducere aplicată automat la coș."],
      ["Ofertă Limitată De Azi",              "Nu rata {discount}% reducere disponibilă.",    "Comandă azi și economisești instant."],
      ["Site Oficial Verificat Acum",         "Cumpără de pe site-ul oficial verificat.",     "Plată 100% securizată garantată mereu."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Produs Oficial", "Fără Risc", "Livrare Rapidă", "Plată Securizată",
      "{discount}% Reducere", "Garanție {guarantee} Zile", "De La {currency}{price}",
    ],
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
      "Доставка до {LOCATION(City):град}",
      "Оферта в {LOCATION(City):град} Сега",
    ],
    d: [
      "{KeyWord:{product}} {discount}% отстъпка. Бърза доставка до {LOCATION(City):град}. Гаранция {guarantee} дни.",
      "Изпробвайте {KeyWord:{product}} без риск. Гаранция {guarantee} дни. Поръчайте от {currency}{price}.",
      "{discount}% отстъпка на {KeyWord:{product}}. Доставка до {LOCATION(City):град} и цяла България.",
      "Купете {KeyWord:{product}} за {currency}{price}. Гаранция {guarantee} дни и {discount}% отстъпка днес.",
    ],
    callouts: [
      "До {discount}% Отстъпка Сега",
      "Безплатна Доставка Навсякъде",
      "Гаранция Пълна {guarantee} Дни",
      "Пакет С {discount}% Отстъпка Днес",
      "Продукти От {currency}{price} Сега",
    ],
    sitelinks: [
      ["Вземи {discount}% Отстъпка Днес",  "Пакет с {discount}% отстъпка — само днес.",   "Ексклузивни пакетни оферти за вас."],
      ["Безплатна Доставка Сега",           "Безплатна доставка над {currency}{ship_min}.", "Бърза доставка в цяла България."],
      ["Гаранция {guarantee} Дни Пълна",   "Изпробвайте {product} без никакъв риск.",      "Връщане на парите за {guarantee} дни."],
      ["Поръчай {product} Сега Днес",       "Продукти от {currency}{price} на брой.",       "Поръчайте от официалния сайт сега."],
      ["Пакетни Оферти Сега За Вас",        "Спестете повече с ексклузивни пакети.",         "Отстъпката се прилага автоматично."],
      ["Ограничена Оферта Днес",            "Не пропускайте {discount}% отстъпка сега.",    "Поръчайте днес и спестете веднага."],
      ["Официален Сайт На {product}",       "Купете от официалния верифициран сайт.",       "100% сигурно плащане гарантирано."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Официален Продукт", "Без Риск", "Бърза Доставка", "Сигурно Плащане",
      "{discount}% Отстъпка", "Гаранция {guarantee} Дни", "От {currency}{price}",
    ],
  },
};

// ─── GENERATOR ─────────────────────────────────────────────────────────────

// Returns true if the template uses a variable that is empty in ctx
function usesEmptyVar(template: string, ctx: CopyContext): boolean {
  const checks: [string, string][] = [
    ["{guarantee}", ctx.guarantee],
    ["{price}", ctx.price],
    ["{discount}", ctx.discount],
    ["{ship_min}", ctx.ship_min],
    ["{currency}", ctx.currency],
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
  const adGroup = `${ctx.product} - Offer`;
  const path1 = trunc(ctx.product, 15);
  const path2 = ctx.discount ? trunc(`${ctx.discount}-Off`, 15) : trunc(ctx.product, 15);

  // Filter: skip templates with empty vars OR shipping refs when no free shipping
  const skip = (t: string) => usesEmptyVar(t, ctx) || (noShip && hasShippingRef(t));

  const validH = tmpl.h.filter(t => !skip(t));
  const validD = tmpl.d.filter(t => !skip(t));

  const headlines = validH.slice(0, 15).map(t => renderTrunc(t, ctx, 30));
  const descriptions = validD.slice(0, 4).map(t => renderTrunc(t, ctx, 90));
  const callouts = tmpl.callouts.filter(t => !skip(t)).map(t => renderTrunc(t, ctx, 25));

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
      url: urlVariants[i] ?? finalUrl,
      d1: renderTrunc(d1, ctx, 35),
      d2: renderTrunc(d2, ctx, 35),
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
  warnings: string[];
}

export function validateCopy(copy: GeneratedCopy): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Max limits
  copy.headlines.forEach((h, i) => {
    const len = effectiveLength(h);
    if (len > 30) errors.push(`H${i + 1} excede 30 chars [${len}]`);
    else if (len < 21) warnings.push(`H${i + 1} curto [${len}/30 — mín. 70%]`);
  });
  copy.descriptions.forEach((d, i) => {
    const len = effectiveLength(d);
    if (len > 90) errors.push(`D${i + 1} excede 90 chars [${len}]`);
    else if (len < 63) warnings.push(`D${i + 1} curto [${len}/90 — mín. 70%]`);
  });
  copy.callouts.forEach((c, i) => {
    const len = effectiveLength(c);
    if (len > 25) errors.push(`Callout ${i + 1} excede 25 chars`);
    else if (len < 18) warnings.push(`Callout ${i + 1} curto [${len}/25 — mín. 70%]`);
  });
  copy.sitelinks.forEach((s, i) => {
    const tLen = effectiveLength(s.text);
    const d1Len = effectiveLength(s.d1);
    const d2Len = effectiveLength(s.d2);
    if (tLen > 25) errors.push(`Sitelink ${i + 1} texto excede 25 chars`);
    else if (tLen < 18) warnings.push(`Sitelink ${i + 1} texto curto [${tLen}/25]`);
    if (d1Len > 35) errors.push(`Sitelink ${i + 1} D1 excede 35 chars`);
    else if (d1Len < 25) warnings.push(`Sitelink ${i + 1} D1 curto [${d1Len}/35]`);
    if (d2Len > 35) errors.push(`Sitelink ${i + 1} D2 excede 35 chars`);
    else if (d2Len < 25) warnings.push(`Sitelink ${i + 1} D2 curto [${d2Len}/35]`);
  });

  return { valid: errors.length === 0, errors, warnings };
}
