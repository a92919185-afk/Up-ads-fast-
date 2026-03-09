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
  budget: string;      // daily budget in account currency
  target_cpa: string;  // target CPA in account currency
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
      "{KeyWord:{product}} Official Store Online",
      "Save Up To {discount}% Off {KeyWord:{product}}",
      "Exclusive {KeyWord:{product}} Bundle Deals",
      "Try {KeyWord:{product}} 100% Risk-Free",
      "{KeyWord:{product}} {guarantee}-Day Guarantee",
      "Order {KeyWord:{product}} Right Now",
      "Get {discount}% Off {KeyWord:{product}} Today",
      "{KeyWord:{product}} Flash Sale Online",
      "{KeyWord:{product}} Starts At {currency}{price}",
      "Try {KeyWord:{product}} Securely",
      "{KeyWord:{product}} With Free Shipping",
      "{KeyWord:{product}} Exclusive Online Offer",
      "Get {KeyWord:{product}} Near Your Area",
      "Fast Shipping To {LOCATION(City):City}",
      "Flash Sale Near {LOCATION(City):City} Now",
    ],
    d: [
      "Get {KeyWord:{product}} with a {discount}% special discount today. Fast reliable shipping to {LOCATION(City):City}.",
      "Try {KeyWord:{product}} absolutely risk-free via our {guarantee}-day total guarantee. Order now from {currency}{price}.",
      "Claim your {discount}% off {KeyWord:{product}} bundles. Fast delivery to {LOCATION(City):City} and nationwide.",
      "Secure {KeyWord:{product}} for just {currency}{price}. Full {guarantee}-day money-back guarantee and {discount}% off today.",
    ],
    callouts: [
      "Save Up To {discount}% Off Today",
      "Free Shipping On All Orders Now",
      "Full {guarantee}-Day Money-Back Guarantee",
      "Buy 1 Get 1 {discount}% Off Bundles",
      "Shop From Just {currency}{price} Today",
    ],
    sitelinks: [
      ["Get Your {product} Today",    "Shop {product} at our official store.",     "Genuine product. Full satisfaction."],
      ["Free {country} Shipping Now", "Free shipping on qualifying orders now.",   "Fast delivery across the {country}."],
      ["Risk-Free Trial Today",       "Try {product} completely risk-free.",        "Full money-back guarantee included."],
      ["Best Bundle Deals Now",       "Save more with our exclusive deals.",        "Discount applied automatically here."],
      ["Limited Time Sale Now",       "Do not miss our best limited offer.",        "Order today and save instantly here."],
      ["Official {product} Store",    "Our trusted official store is here.",        "Secure checkout guaranteed always."],
      ["Customers Love Us Here",      "Trusted by thousands of happy customers.",   "Join satisfied customers today now."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Official Verified Product", "100% Risk-Free Trial Today", "Fast Worldwide Delivery", "100% Secure Safe Checkout",
      "Up To {discount}% Discount Now", "Full {guarantee}-Day Guarantee", "Exclusive Bundles From {currency}{price}",
    ],
  },

  pt: {
    // H1–H13: DKI (87% ≈ 90%) | H14–H15: Localização (frete/escassez)
    h: [
      "{KeyWord:{product}} Site Oficial Exclusivo",
      "{KeyWord:{product}} E {discount}% OFF Hoje",
      "Kit {KeyWord:{product}} Com {discount}% OFF",
      "Compre {KeyWord:{product}} Totalmente Seguro",
      "{KeyWord:{product}} Garantia De {guarantee} Dias",
      "Garanta {KeyWord:{product}} Agora Mesmo",
      "Desconto De {discount}% Em {KeyWord:{product}}",
      "{KeyWord:{product}} Super Oferta de Hoje",
      "Acesse {KeyWord:{product}} Por {currency}{price}",
      "Experimente {KeyWord:{product}} 100% Seguro",
      "{KeyWord:{product}} Com Entrega Rápida",
      "{KeyWord:{product}} Oferta Limitada",
      "Pegue {KeyWord:{product}} Mais Perto De Você",
      "Entrega Agilizada Em {LOCATION(City):cidade}",
      "Super Oferta Em {LOCATION(City):cidade} Hoje",
    ],
    d: [
      "Adquira {KeyWord:{product}} com um desconto de {discount}% hoje mesmo. Entrega rápida para {LOCATION(City):cidade}.",
      "Teste {KeyWord:{product}} sem riscos na garantia de {guarantee} dias. Peça agora mesmo a partir de {currency}{price}.",
      "Aproveite {discount}% OFF em {KeyWord:{product}} somente agora. Envio agilizado para {LOCATION(City):cidade} hoje.",
      "Compre {KeyWord:{product}} por apenas {currency}{price}. Garantia total de {guarantee} dias com {discount}% de desconto.",
    ],
    callouts: [
      "Economize Até {discount}% OFF Agora",
      "Frete Grátis Acima de {currency}{ship_min}",
      "Garantia Total de {guarantee} Dias",
      "Kit com {discount}% de Desconto Hoje",
      "Produtos A Partir de {currency}{price}",
    ],
    sitelinks: [
      ["Peça {product} Hoje Mesmo",   "Compre {product} direto do site oficial.",   "Produto genuíno com total satisfação."],
      ["Frete Grátis Para Você",      "Frete grátis em pedidos qualificados.",      "Entrega rápida para todo o Brasil."],
      ["Experimente Sem Risco",       "Teste {product} completamente sem risco.",    "Garantia de devolução inclusa sempre."],
      ["Melhores Kits Exclusivos",    "Economize mais com nossos kits exclusivos.",  "Desconto aplicado automaticamente."],
      ["Oferta Por Tempo Limitado",   "Não perca nossa melhor oferta limitada.",     "Peça hoje e economize agora online."],
      ["Site Oficial {product}",      "Site verificado e oficial totalmente seguro.","Checkout seguro e confiável garantido."],
      ["Favorito Dos Clientes",       "Confiado por milhares de clientes no Brasil.","Junte-se aos clientes satisfeitos."],
    ],
    snippetHeader: "Tipos",
    snippetValues: [
      "Produto Oficial Verificado", "Compra Blindada Sem Risco", "Entrega Imediata e Rápida", "Seu Pagamento 100% Seguro",
      "Até {discount}% de Desconto", "Garantia Total de {guarantee} Dias", "Melhores Kits a Partir {currency}{price}",
    ],
  },

  es: {
    // H1–H13: DKI | H14–H15: Localización (envío/escasez)
    h: [
      "{KeyWord:{product}} Sitio Web Oficial",
      "Llévate {KeyWord:{product}} Con {discount}% Off",
      "Bundle De {KeyWord:{product}} Y {discount}% OFF",
      "Ordena {KeyWord:{product}} Sin Riesgos",
      "{KeyWord:{product}} Con {guarantee} Días De Garantía",
      "Pide Tu {KeyWord:{product}} Hoy Mismo",
      "Dile Sí Al {discount}% Off En {KeyWord:{product}}",
      "{KeyWord:{product}} Super Oferta De Hoy",
      "{KeyWord:{product}} Inicia En {currency}{price}",
      "Prueba {KeyWord:{product}} Totalmente Seguro",
      "{KeyWord:{product}} Con Envío Rápido",
      "{KeyWord:{product}} Oferta Muy Exclusiva",
      "Acerca {KeyWord:{product}} Cerca De Ti",
      "Envío Expreso A La {LOCATION(City):ciudad}",
      "Gran Oferta En Su {LOCATION(City):ciudad} Ya",
    ],
    d: [
      "Obtén {KeyWord:{product}} con un {discount}% de descuento especial hoy. Envío muy rápido a {LOCATION(City):ciudad}.",
      "Prueba {KeyWord:{product}} sin riesgos con la garantía de {guarantee} días. Ordena a partir de solo {currency}{price}.",
      "¡Gran oferta de {discount}% en {KeyWord:{product}}! Hacemos envíos rápidos a {LOCATION(City):ciudad} y a todo el país.",
      "Compra {KeyWord:{product}} por solo {currency}{price}. Tienes garantía de {guarantee} días y un ahorro de {discount}% ya.",
    ],
    callouts: [
      "Ahorra Hasta {discount}% OFF",
      "Envío Gratis Desde {currency}{ship_min}",
      "Garantía Completa {guarantee} Días",
      "Bundle 2x1 Con {discount}% OFF",
      "Precios Desde Solo {currency}{price}",
    ],
    sitelinks: [
      ["Pide Tu {product} Hoy",       "Compra {product} en el sitio oficial ya.",   "Producto genuino con plena satisfacción."],
      ["Envío Gratis Hoy Mismo",      "Envío gratis en todos los pedidos hoy.",     "Entrega rápida a {country} garantizada."],
      ["Prueba Sin Riesgo Hoy",       "Prueba {product} completamente sin riesgo.",  "Reembolso total garantizado siempre."],
      ["Los Mejores Packs Hoy",       "Ahorra más con nuestros bundles exclusivos.", "Descuento aplicado automáticamente."],
      ["Oferta Flash Por Tiempo",     "No te pierdas nuestra mejor oferta hoy.",    "Ordena hoy y ahorra al instante ya."],
      ["Tienda Oficial {product}",    "Tienda verificada y oficial 100% segura.",   "Pago seguro garantizado siempre aquí."],
      ["Favorito De Clientes",        "Confiado por miles de clientes en {country}.","Únete a nuestros clientes satisfechos."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "El Único Produto Oficial", "Compras Seguras Sin Riesgo", "Entrega Muy Rápida Ya", "Pago 100% Protegido",
      "Disfruta Del {discount}% De Descuento", "Garantia Absoluta De {guarantee} Días", "Tus Bundles Parten De {currency}{price}",
    ],
  },

  de: {
    // H1–H13: DKI | H14–H15: Standort (Versand/lokale Knappheit)
    h: [
      "{KeyWord:{product}} Offizieller Shop Online",
      "Sichere Dir {discount}% Rabatt Auf {KeyWord:{product}}",
      "Das Beliebte {KeyWord:{product}} Bundle Ist Da",
      "Jetzt {KeyWord:{product}} Risikofrei Testen",
      "{KeyWord:{product}} Mit Einer {guarantee}-Tage Garantie",
      "Bestellen Sie {KeyWord:{product}} Sofort Hier",
      "Sichere {discount}% Rabatt Auf Dein {KeyWord:{product}}",
      "Die {KeyWord:{product}} Sonderaktion Von Heute",
      "Zugang Zu {KeyWord:{product}} Ab {currency}{price}",
      "Das Original {KeyWord:{product}} Risikofrei",
      "{KeyWord:{product}} Mit Kostenlosem Versand",
      "Ein Exklusives {KeyWord:{product}} Angebot",
      "Finde {KeyWord:{product}} Direkt In Deiner Nähe",
      "Express Lieferung Direkt In Deine {LOCATION(City):Stadt}",
      "Sonderangebot Direkt Für Die {LOCATION(City):Stadt}",
    ],
    d: [
      "Sichern Sie {KeyWord:{product}} mit {discount}% Rabatt heute. Ultraschnelle Lieferung nach {LOCATION(City):Stadt}.",
      "Jetzt {KeyWord:{product}} risikofrei testen mit {guarantee}-Tage Garantie. Bestellen Sie ab nur {currency}{price}.",
      "Nutzen Sie {discount}% Rabatt auf {KeyWord:{product}} Bundles. Schneller Versand nach {LOCATION(City):Stadt} und DE.",
      "Kaufen Sie {KeyWord:{product}} für {currency}{price}. Volle {guarantee} Tage Garantie und satte {discount}% Rabatt heute.",
    ],
    callouts: [
      "Bis Zu {discount}% Rabatt Sichern",
      "Gratis Versand Ab {currency}{ship_min} Gilt",
      "Volle {guarantee} Tage Zurück-Garantie",
      "Bundle Deals Mit {discount}% Rabatt",
      "Angebote Schon Ab {currency}{price}",
    ],
    sitelinks: [
      ["{product} Jetzt Bestellen",   "Kauf {product} im offiziellen Shop online.",  "Echtes Produkt. Volle Zufriedenheit."],
      ["Kostenloser Versand Heute",   "Gratisversand auf alle Bestellungen heute.",  "Schnelle Lieferung nach ganz {country}."],
      ["Risikofrei Testen Jetzt",     "{product} komplett ohne Risiko testen.",      "Volle Geld-zurück-Garantie inklusive."],
      ["Beste Bundle-Deals Heute",    "Mit Bundles noch mehr Geld sparen jetzt.",    "Rabatt wird automatisch abgezogen."],
      ["Flash-Sale Endet Bald",       "Verpasse nicht unser bestes Angebot jetzt.",  "Heute bestellen und sofort sparen."],
      ["Offizieller {product} Shop",  "Zertifizierter offizieller Shop online.",     "100% sicherer und geprüfter Checkout."],
      ["Kundenfavorit Hier Jetzt",    "Von tausenden Kunden in {country} geliebt.",  "Werden Sie jetzt unser Stammkunde."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Echtes Premium-Produkt", "Sicher Und Schnell Testen", "Superschnelle Blitz-Lieferung", "Sicherer 100% Kauf",
      "Direkt {discount}% Gutschein Nutzen", "{guarantee} Tage Totale Absicherung", "Alle Bundles Starten Ab {currency}{price}",
    ],
  },

  da: {
    // H1–H13: DKI | H14–H15: Placering (levering/lokal knaphed)
    h: [
      "{KeyWord:{product}} Officielt Websted",
      "Få {KeyWord:{product}} Med {discount}% Rabat",
      "{KeyWord:{product}} Exklusiv Bundle",
      "Prøv {KeyWord:{product}} Uden Risiko",
      "{KeyWord:{product}} Med {guarantee} Dages Garanti",
      "Bestil Din {KeyWord:{product}} Nu",
      "Få {discount}% Rabat På {KeyWord:{product}}",
      "{KeyWord:{product}} Flash Tilbud I Dag",
      "{KeyWord:{product}} Fra Kun {currency}{price}",
      "Prøv {KeyWord:{product}} Helt Sikkert",
      "{KeyWord:{product}} Med Gratis Fragt",
      "{KeyWord:{product}} Eksklusivt Tilbud",
      "Køb {KeyWord:{product}} Tæt På Dig Nu",
      "Hurtig Levering Direkte Til {LOCATION(City):by}",
      "Særligt Tilbud I {LOCATION(City):by} Nu",
    ],
    d: [
      "Få {KeyWord:{product}} med {discount}% rabat i dag. Hurtig levering til {LOCATION(City):by}.",
      "Prøv {KeyWord:{product}} uden risiko med {guarantee}-dages garanti. Bestil sikkert fra {currency}{price}.",
      "Spar {discount}% på {KeyWord:{product}} premium bundles. Vi sender hurtigt til {LOCATION(City):by}.",
      "Køb {KeyWord:{product}} for {currency}{price}. Du får {guarantee}-dages garanti og {discount}% rabat nu.",
    ],
    callouts: [
      "Få Op Til {discount}% Rabat Lige Nu",
      "Gratis Fragt Fra {currency}{ship_min}",
      "Fuld Garanti På Hele {guarantee} Dage",
      "Bundle Deal Med {discount}% Rabat",
      "Bestil Nu Fra Kun {currency}{price}",
    ],
    sitelinks: [
      ["Bestil {product} Nu",         "Køb {product} fra den officielle shop.",      "Ægte produkt. Fuld tilfredshed her."],
      ["Gratis Fragt I Dag Nu",       "Gratis fragt på alle kvalificerede ordrer.",  "Hurtig levering til hele {country}."],
      ["Risikofrit Køb I Dag",        "Prøv {product} helt risikofrit i dag.",       "Fuld pengene-tilbage garanti gives."],
      ["Bedste Bundle Tilbud Nu",     "Spar mer med vores eksklusive bundles nu.",   "Din rabat aktiveres automatisk straks."],
      ["Flash Udsalg Ender Snart",    "Gå ikke glip af vores bedste tilbud nu.",     "Bestil i dag og spar straks online."],
      ["Officiel {product} Butik Nu", "Verificeret officiel butik online sikkert.",  "Garanteret sikkert checkout altid her."],
      ["Kundernes Favorit Her Nu",    "Elsket af tusinder af kunder i {country}.",   "Bliv en tilfreds kunde hos os nu."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Officielt Forhandler Produkt", "Risikofrit Og Sikkert Køb Nu", "Hurtig Levering Fra Vores Lager", "Din Betaling Er 100% Sikret Her",
      "Udnyt Stor {discount}% Rabat I Dag", "Tilbyder {guarantee} Dages Kæmpe Garanti", "Bedste Bundles Fra Kun {currency}{price}",
    ],
  },

  fr: {
    // H1–H13: DKI | H14–H15: Localisation (livraison/urgence locale)
    h: [
      "{KeyWord:{product}} Site Web Officiel",
      "Profitez De {discount}% Sur {KeyWord:{product}}",
      "Pack Exclusif {KeyWord:{product}} {discount}%",
      "Essayez {KeyWord:{product}} Sans Risque",
      "{KeyWord:{product}} Garantie De {guarantee} Jours",
      "Commandez {KeyWord:{product}} Maintenant",
      "Remise De {discount}% Sur {KeyWord:{product}}",
      "{KeyWord:{product}} Offre Spéciale Du Jour",
      "{KeyWord:{product}} Commence À {currency}{price}",
      "Testez {KeyWord:{product}} En Sécurité",
      "{KeyWord:{product}} Avec Livraison Gratuite",
      "{KeyWord:{product}} Offre Très Exclusive",
      "Obtenez {KeyWord:{product}} Près De Chez Vous",
      "Livraison Rapide Directement Sur {LOCATION(City):ville}",
      "Superbe Offre Flash Dans Votre {LOCATION(City):ville}",
    ],
    d: [
      "Obtenez {KeyWord:{product}} avec {discount}% de remise aujourd'hui. Livraison rapide sur {LOCATION(City):ville}.",
      "Essayez {KeyWord:{product}} sans risque avec la garantie de {guarantee} jours. Commandez dès {currency}{price}.",
      "Profitez de {discount}% de remise sur {KeyWord:{product}}. Livraison express vers {LOCATION(City):ville} et pays.",
      "Achetez {KeyWord:{product}} pour {currency}{price}. Garantie de {guarantee} jours et une réduction de {discount}%.",
    ],
    callouts: [
      "Gagnez Jusqu'à {discount}% De Remise",
      "Livraison Gratuite Dès {currency}{ship_min}",
      "Garantie Totale Sur {guarantee} Jours",
      "Pack Avec {discount}% De Réduction",
      "Prix Fixés Dès Seulement {currency}{price}",
    ],
    sitelinks: [
      ["Commandez {product} Vite",    "Achetez {product} sur le store officiel.",    "Produit authentique. Satisfaction totale."],
      ["Livraison Offerte Partout",   "Livraison gratuite sur toutes commandes.",    "Livraison rapide partout en France."],
      ["Essai Sans Risque Du Jour",   "Testez {product} sans aucun risque ici.",     "Remboursement total garanti toujours."],
      ["Meilleures Offres En Pack",   "Économisez plus avec nos superbes packs.",    "Votre réduction sera bien appliquée."],
      ["Vente Flash Exclusive Ici",   "Ne ratez pas notre meilleure offre du jour.", "Commandez et économisez immédiatement."],
      ["Boutique Officielle {product}","Boutique vérifiée et officielle en ligne.",   "Paiement sécurisé garanti à 100%."],
      ["Favori Des Clients Ici",      "Adoré par des milliers de clients en France.", "Rejoignez nos clients satisfaits."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Produit Vrai Et Certifié", "Essayez Totalement Sans Risque", "Livraison Trés Rapide", "Paiement Super Sécurisé",
      "Grosse Remise Inédite De {discount}% Off", "Garantia Impeccable De {guarantee} Jours", "Des Packs Incroyables Dès {currency}{price}",
    ],
  },

  fi: {
    // H1–H13: DKI | H14–H15: Sijainti (toimitus/paikallisuus)
    h: [
      "{KeyWord:{product}} Virallinen Verkkokauppa",
      "Säästä {discount}% Ostaessasi {KeyWord:{product}}",
      "{KeyWord:{product}} Eksklusiivinen Pakettitarjous",
      "Kokeile {KeyWord:{product}} Täysin Riskittä",
      "{KeyWord:{product}} Turvallinen {guarantee} Pv Takuu",
      "Tilaa Oma {KeyWord:{product}} Nyt Heti",
      "Hanki {discount}% Alennus {KeyWord:{product}} Tänään",
      "{KeyWord:{product}} Päivän Erikoistarjous",
      "{KeyWord:{product}} Hinnat Alkaen {currency}{price}",
      "Kokeile {KeyWord:{product}} Hyvin Turvallisesti",
      "{KeyWord:{product}} Ilmaisella Toimituksella",
      "{KeyWord:{product}} Erittäin Eksklusiivinen",
      "Hanki {KeyWord:{product}} Lähistöltäsi Nyt",
      "Nopea Toimitus Suoraan {LOCATION(City):kaupunki}",
      "Erikoistarjous {LOCATION(City):kaupunki} Alueella",
    ],
    d: [
      "Hanki {KeyWord:{product}} ja hyödynnä {discount}% alennus tänään. Nopea toimitus {LOCATION(City):kaupunki} alueelle.",
      "Kokeile {KeyWord:{product}} riskittä {guarantee} päivän takuulla. Tilaa luotettavasti alkaen vain {currency}{price}.",
      "Hyödynnä {discount}% alennus {KeyWord:{product}} paketeista. Nopea toimitus {LOCATION(City):kaupunki} ja Suomeen.",
      "Osta {KeyWord:{product}} vain {currency}{price}. Saat vahvan {guarantee} päivän takuun ja {discount}% alennuksen.",
    ],
    callouts: [
      "Jopa {discount}% Alennus Juuri Nyt",
      "Ilmainen Toimitus Yli {currency}{ship_min}",
      "Täysi {guarantee} Päivän Rahat Takaisin",
      "Hanki Paketti Suurella {discount}% Alennuksella",
      "Kaikki Tuotteet Alkaen Vain {currency}{price}",
    ],
    sitelinks: [
      ["Tilaa {product} Nyt Heti",    "Osta {product} virallisesta kaupasta nyt.",   "Aito tuote. Täysi tyytyväisyys takuu."],
      ["Ilmainen Toimitus Nyt",       "Ilmainen toimitus kaikille tilauksille.",      "Nopea toimitus kaikkialle Suomeen."],
      ["Riskitön Kokeilu Nyt",        "Kokeile {product} täysin riskittä tänään.",   "Rahat takaisin -takuu sisältyy aina."],
      ["Parhaat Pakettitarjoukset",   "Säästä enemmän eksklusiivisilla paketeilla.", "Alennus lisätään automaattisesti nyt."],
      ["Rajoitettu Tarjous Tänään",   "Älä missaa parasta rajoitettua tarjoustamme.","Tilaa tänään ja säästä heti verkossa."],
      ["Virallinen {product} Kauppa", "Varmennettu virallinen kauppa verkossa.",      "100% turvallinen maksu taattu aina."],
      ["Asiakkaiden Suosikki",        "Rakastettu tuhansien asiakkaiden valinta.",    "Liity tyytyväisten asiakkaidemme joukkoon."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Täysin Virallinen Tuote", "Erittäin Riskitön Kokeilu", "Super Nopeaa Toimitusta", "Turvallinen Maksaminen",
      "Huikea {discount}% Alennus Nyt", "Täysi {guarantee} Pv Takuu Sinulle", "Paketit Alkaen Vain {currency}{price}",
    ],
  },

  ro: {
    // H1–H13: DKI | H14–H15: Localizare (livrare/urgență locală)
    h: [
      "{KeyWord:{product}} Site Oficial Exclusiv",
      "Până La {discount}% Reducere {KeyWord:{product}}",
      "Ofertă Pachet {KeyWord:{product}} {discount}% OFF",
      "Comandă {KeyWord:{product}} 100% Fără Risc",
      "{KeyWord:{product}} Garanție {guarantee} Zile Inclusă",
      "Comandă {KeyWord:{product}} Cu Ofertă Acum",
      "Reducere {discount}% La {KeyWord:{product}} Azi",
      "Ofertă Specială {KeyWord:{product}} Azi",
      "Alege {KeyWord:{product}} De La {currency}{price}",
      "Testează {KeyWord:{product}} În Siguranță",
      "{KeyWord:{product}} Cu Transport Gratuit",
      "Ofertă Exclusivă {KeyWord:{product}} Aici",
      "Alege {KeyWord:{product}} Lângă Tine",
      "Livrare Rapidă În {LOCATION(City):oraș}",
      "Ofertă Specială În {LOCATION(City):oraș} Acum",
    ],
    d: [
      "Obține {KeyWord:{product}} cu {discount}% reducere astăzi. Livrare rapidă în {LOCATION(City):oraș} și România.",
      "Testează {KeyWord:{product}} fără risc cu garanția de {guarantee} zile. Comandă acum de la doar {currency}{price}.",
      "Profită de {discount}% reducere la {KeyWord:{product}}. Livrare express în {LOCATION(City):oraș} și în toată țara.",
      "Cumpără {KeyWord:{product}} cu {currency}{price}. Garanție {guarantee} zile și {discount}% reducere excelentă azi.",
    ],
    callouts: [
      "Până La {discount}% Reducere Astăzi",
      "Transport Gratuit Peste {currency}{ship_min}",
      "Garanție Completă De {guarantee} Zile",
      "Ofertă Pachet {discount}% OFF Acum",
      "Prețuri Reduse De La {currency}{price}",
    ],
    sitelinks: [
      ["Comandă {product} Acum Azi",  "Cumpără {product} de pe site-ul oficial.",    "Produs autentic. Satisfacție totală."],
      ["Transport Gratuit Acum",      "Transport gratuit pe toate comenzile tale.",   "Livrare rapidă în toată România."],
      ["Comandă Fără Niciun Risc",    "Testează {product} complet fără niciun risc.", "Ramburs garantat complet mereu."],
      ["Cele Mai Bune Pachete Azi",   "Economisește mai mult cu pachete exclusive.",  "Reducerea ta se aplică automat online."],
      ["Ofertă Limitată De Azi",      "Nu rata cea mai bună ofertă disponibilă.",    "Comandă azi și economisești instant."],
      ["Site Oficial Verificat",      "Site verificat și oficial 100% sigur.",        "Plată securizată garantată mereu."],
      ["Favoritul Clienților",        "Adorat de mii de clienți din România.",        "Alătură-te clienților noștri mulțumiți."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Produse Pe Site Oficial", "Comandă Sigură Fără Risc", "Livrare Extrem De Rapidă", "Plată 100% Securizată",
      "Până La {discount}% Reducere", "Garanție Totală {guarantee} Zile", "Prețuri Încep De La {currency}{price}",
    ],
  },

  bg: {
    // H1–H13: DKI (87% ≈ 90%) | H14–H15: Локация (доставка/оскъдност)
    h: [
      "{KeyWord:{product}} Официален Уебсайт В България",
      "Вземете {KeyWord:{product}} С {discount}% Отстъпка",
      "Ексклузивен Пакет {KeyWord:{product}} {discount}%",
      "Опитайте {KeyWord:{product}} Напълно Без Риск",
      "{KeyWord:{product}} С Гаранция От {guarantee} Дни",
      "Поръчайте {KeyWord:{product}} Точно Сега Днес",
      "Само Днес {discount}% Отстъпка На {KeyWord:{product}}",
      "{KeyWord:{product}} Специална Оферта За Деня",
      "{KeyWord:{product}} Цени Започващи От {currency}{price}",
      "Тествайте {KeyWord:{product}} Много Сигурно",
      "{KeyWord:{product}} Предлага Безплатна Доставка",
      "{KeyWord:{product}} Много Ексклузивно Предложение",
      "Вземете {KeyWord:{product}} Много Близо До Вас",
      "Изключително Бърза Доставка В {LOCATION(City):град}",
      "Страхотна Оферта За {LOCATION(City):град} Днес",
    ],
    d: [
      "Вземете {KeyWord:{product}} с {discount}% отстъпка днес. Бърза доставка до {LOCATION(City):град} и областта.",
      "Опитайте {KeyWord:{product}} без риск с {guarantee}-дневна гаранция. Поръчайте сигурно от {currency}{price}.",
      "Възползвайте се от {discount}% на {KeyWord:{product}} пакети. Бърза доставка до {LOCATION(City):град} и страната.",
      "Купете {KeyWord:{product}} само за {currency}{price}. Имате {guarantee} дни гаранция и {discount}% отстъпка днес.",
    ],
    callouts: [
      "До {discount}% Огромна Отстъпка Сега",
      "Безплатна Доставка Над {currency}{ship_min}",
      "Пълна Гаранция За Цели {guarantee} Дни",
      "Вземете Пакет С {discount}% Отстъпка",
      "Продуктите Започват От {currency}{price}",
    ],
    sitelinks: [
      ["Поръчай {product} Сега",      "Купи {product} от официалния магазин.",       "Автентичен продукт. Пълно удовлетворение."],
      ["Безплатна Доставка Сега",     "Безплатна доставка за всички поръчки.",       "Бърза доставка в цяла България."],
      ["Изпробвай Без Риск",          "Изпробвай {product} напълно без риск.",        "Гаранция за връщане на парите."],
      ["Най-Добри Пакетни Оферти",    "Спести повече с ексклузивни пакети сега.",    "Отстъпката се прилага автоматично."],
      ["Ограничена Оферта Тук",       "Не пропускай най-добрата ни оферта.",         "Поръчай днес и спести веднага."],
      ["Официален Магазин {product}", "Верифициран официален онлайн магазин.",        "100% сигурно плащане гарантирано."],
      ["Любимец На Клиентите",        "Обичан от хиляди клиенти в България.",        "Присъедини се към доволните клиенти."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Официален И Сигурен Продукт", "Напълно Сигурно И Без Риск", "Изключително Бърза Доставка", "Плащането Е 100% Защитено Тук",
      "Вземете {discount}% Отстъпка Сега", "Гаранция В Рамките На {guarantee} Дни", "Цените Започват От {currency}{price}",
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
  const path1 = trunc(ctx.product.replace(/\s+/g, "-") + "-Oficial", 15);
  const path2 = ctx.discount ? trunc("Off-" + ctx.discount + "-Hoje", 15) : trunc(ctx.product.replace(/\s+/g, "-") + "-Agora", 15);

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
