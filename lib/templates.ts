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
      "Get {KeyWord:{product}} with {discount}% off today. Fast free delivery to {LOCATION(City):City}. Includes {guarantee}-day guarantee.",
      "Try {KeyWord:{product}} absolutely risk-free with our {guarantee}-day money-back guarantee. Order today from {currency}{price}.",
      "Claim your {discount}% off {KeyWord:{product}} exclusive bundles. Fast reliable shipping to {LOCATION(City):City} and beyond.",
      "Secure {KeyWord:{product}} for just {currency}{price}. Full {guarantee}-day money-back guarantee and a {discount}% instant discount.",
    ],
    callouts: [
      "Save Up To {discount}% Off Today",
      "Free Shipping On All Orders Now",
      "Full {guarantee}-Day Money-Back Guarantee",
      "Buy 1 Get 1 {discount}% Off Bundles",
      "Shop From Just {currency}{price} Today",
    ],
    sitelinks: [
      ["Claim {discount}% Off Today", "Buy 1 get 1 {discount}% off — limited time.", "Access exclusive bundle discounts now."],
      ["Free {country} Shipping Today", "Free shipping on orders over {currency}{ship_min}.", "Fast delivery across the entire {country}."],
      ["{guarantee}-Day Risk-Free Trial", "Try {product} completely risk-free today.", "Full {guarantee}-day money-back guarantee."],
      ["Get Your {product} Today", "Order {product} from just {currency}{price}.", "Order directly from the official site."],
      ["Best Bundle Deals Today", "Save more with our exclusive bundles now.", "Special discount applied at checkout."],
      ["Flash Sale Ending Tonight", "Don't miss out on {discount}% off today.", "Order today and save instantly online."],
      ["Visit The Official Store", "Trusted official store — shop securely now.", "Verified secure checkout guaranteed."],
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
      "{KeyWord:{product}} com {discount}% OFF aplicado. Entrega expressa na sua {LOCATION(City):cidade} e em todo Brasil. Garantia absoluta de {guarantee} dias.",
      "Experimente {KeyWord:{product}} de forma 100% segura com a garantia de {guarantee} dias. Peça imediatamente a partir de apenas {currency}{price}.",
      "Enorme desconto de {discount}% nos kits de {KeyWord:{product}} somente hoje. Envio super rápido focado em {LOCATION(City):cidade} e no país.",
      "Compre já {KeyWord:{product}} por incríveis {currency}{price}. Garantia total de {guarantee} dias com generosos {discount}% de desconto.",
    ],
    callouts: [
      "Economize Até {discount}% OFF Agora",
      "Frete Grátis Acima de {currency}{ship_min}",
      "Garantia Total de {guarantee} Dias",
      "Kit com {discount}% de Desconto Hoje",
      "Produtos A Partir de {currency}{price}",
    ],
    sitelinks: [
      ["Garanta {discount}% de Desconto", "Kit com {discount}% de desconto hoje.", "Acesse ofertas exclusivas de kit agora."],
      ["Frete Grátis Para Você", "Frete grátis acima de {currency}{ship_min}.", "Entrega rápida para todo o Brasil."],
      ["Garantia {guarantee} Dias Grátis", "Experimente sem risco absolutamente algum.", "Devolução garantida em {guarantee} dias."],
      ["Peça {product} Hoje Mesmo", "A partir de {currency}{price} por unidade.", "Compre direto no site oficial agora."],
      ["Melhores Preços em Kits", "Economize mais com nossos kits exclusivos.", "Desconto aplicado automaticamente aqui."],
      ["Oferta Por Tempo Limitado", "Não perca {discount}% de desconto hoje.", "Peça hoje e economize na hora."],
      ["Compre No Site Oficial Agora", "Site verificado com pagamento 100% seguro.", "Checkout seguro e confiável garantido."],
    ],
    snippetHeader: "Tipos",
    snippetValues: [
      "Produto Oficial Autorizado", "Compra Blindada Sem Risco", "Entrega Imediata e Rápida", "Seu Pagamento 100% Seguro",
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
      "Adquiere {KeyWord:{product}} con un enorme {discount}% off hoy. Envío muy rápido a {LOCATION(City):ciudad} y a toda España. Incluye garantía de {guarantee} días.",
      "Prueba {KeyWord:{product}} totalmente libre de riegos con la fuerte garantía de {guarantee} días. Ordena a partir de {currency}{price}.",
      "¡Fuerte oferta limitada! Super {discount}% off en {KeyWord:{product}}. Hacemos envíos rápidos a la {LOCATION(City):ciudad} y otras ciudades.",
      "Compra inteligentemente {KeyWord:{product}} por {currency}{price}. Cuentas con garantía de {guarantee} días y un ahorro de {discount}%.",
    ],
    callouts: [
      "Ahorra Hasta {discount}% OFF",
      "Envío Gratis Desde {currency}{ship_min}",
      "Garantía Completa {guarantee} Días",
      "Bundle 2x1 Con {discount}% OFF",
      "Precios Desde Solo {currency}{price}",
    ],
    sitelinks: [
      ["Obtén {discount}% de Descuento", "Bundle con {discount}% off — solo hoy.", "Accede a ofertas exclusivas de bundle."],
      ["Envío Gratis Hoy Mismo", "Envío gratis en pedidos sobre {currency}{ship_min}.", "Entrega rápida a {country} garantizada."],
      ["Garantía {guarantee} Días Total", "Prueba {product} completamente sin riesgo.", "Reembolso 100% garantizado siempre."],
      ["Pide Tu {product} Hoy", "Desde solo {currency}{price} por unidad.", "Compra directo en el sitio oficial."],
      ["Los Mejores Packs Hoy", "Ahorra más con nuestros bundles exclusivos.", "Descuento aplicado automáticamente aquí."],
      ["Oferta Flash Por Tiempo", "No pierdas el {discount}% off de hoy.", "Ordena hoy y ahorra al instante ya."],
      ["Visita La Tienda Oficial", "Tienda oficial verificada — compra segura.", "Pago 100% seguro garantizado siempre."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "El Único Producto Oficial", "Compras Seguras Sin Riesgo", "Tiempos De Entrega Rápidos", "Tu Pago Está 100% Protegido",
      "Disfruta Del {discount}% De Descuento", "Garantía Absoluta De {guarantee} Días", "Tus Bundles Parten De {currency}{price}",
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
      "{KeyWord:{product}} mit {discount}% Rabatt sichern. Ultraschnelle Lieferung direkt nach {LOCATION(City):Stadt}. Absolute {guarantee}-Tage Geld-zurück-Garantie.",
      "{KeyWord:{product}} komplett risikofrei testen – abgesichert mit {guarantee}-Tage Garantie. Sofort ab nur {currency}{price} online bestellen.",
      "Fantastische {discount}% Rabatt auf {KeyWord:{product}} Bundles. Sehr schneller und versicherter Versand nach {LOCATION(City):Stadt} und DE.",
      "Kaufen Sie noch heute {KeyWord:{product}} für günstige {currency}{price}. Volle {guarantee} Tage Garantie und satte {discount}% Rabatt heute sichern.",
    ],
    callouts: [
      "Bis Zu {discount}% Rabatt Sichern",
      "Gratis Versand Ab {currency}{ship_min} Gilt",
      "Volle {guarantee} Tage Zurück-Garantie",
      "Bundle Deals Mit {discount}% Rabatt",
      "Angebote Schon Ab {currency}{price}",
    ],
    sitelinks: [
      ["Heute {discount}% Rabatt Sichern", "Hol dir das Bundle mit {discount}% Rabatt heute.", "Entdecke exklusive Premium-Gutscheine."],
      ["100% Kostenloser Versand Heute", "Versandkostenfrei ab Bestellwert {currency}{ship_min}.", "Rasante und sichere Lieferung nach {country}."],
      ["Über {guarantee} Tage Risikofrei Testen", "{product} völlig ohne Risiko ausprobieren.", "Sie erhalten {guarantee} Tage Geld-zurück-Garantie."],
      ["Dein {product} Jetzt Ordern", "Produkte starten unglaublich ab {currency}{price}.", "Sichere Bestellung direkt aus dem Shop."],
      ["Sichere Dir Beste Bundle Deals", "Das absolute Sparpaket lohnt sich ab heute.", "Dein Preisnachlass wird sofort verbucht."],
      ["Der Flash-Sale Endet Sehr Bald", "Sichere dir satte {discount}% unglaublichen Rabatt.", "Noch heute bestellen und bare Münze sparen."],
      ["Zum Offiziellen Original-Store", "Zertifizierter originaler Anbieter kaufen.", "Du zahlst 100% sicher und streng geprüft."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Offizielles Premium-Produkt", "Ohne Risiko Schnell Testen", "Superschnelle Blitz-Lieferung", "Der Kauf Ist 100% Zertifiziert",
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
      "Få {KeyWord:{product}} med {discount}% rabat i dag. Hurtig levering til {LOCATION(City):by} og Danmark. Fuld {guarantee}-dages garanti.",
      "Prøv {KeyWord:{product}} uden risiko med vores stærke {guarantee}-dages fulde garanti. Bestil trygt fra {currency}{price}.",
      "Enorm {discount}% rabat på {KeyWord:{product}} premium bundles. Vi sender hurtigt til {LOCATION(City):by} og hele landet.",
      "Køb {KeyWord:{product}} for kun {currency}{price}. Du får en stærk {guarantee}-dages garanti og hele {discount}% rabat i dag.",
    ],
    callouts: [
      "Få Op Til {discount}% Rabat Lige Nu",
      "Gratis Fragt Fra {currency}{ship_min}",
      "Fuld Garanti På Hele {guarantee} Dage",
      "Bundle Deal Med {discount}% Rabat",
      "Bestil Nu Fra Kun {currency}{price}",
    ],
    sitelinks: [
      ["Sikr Dig {discount}% Rabat I Dag Nu", "Eksklusiv bundle med {discount}% rabat i dag.", "Opdag vores fantastiske bundle tilbud nu."],
      ["Fuldstændig Gratis Fragt I Dag Nu", "Gratis fragt ved køb på over {currency}{ship_min}.", "Ekspres levering direkte til hele {country}."],
      ["{guarantee} Dages 100% Sikker Returret", "Prøv {product} komplet uden risiko i dag.", "Vi giver en stærk {guarantee}-dages fuld garanti."],
      ["Bestil Din Originale {product} Nu", "Priserne starter fra kun {currency}{price} i dag.", "Køb direkte fra den officielle webshop nu."],
      ["De Bedste Bundle Tilbud Lige Her", "Spar utrolig mange penge på vores bundles.", "Din enorme rabat bliver fratrukket straks."],
      ["Dagens Stærke Flash Udsalg", "Sikr dig hurtigt en rabat på hele {discount}%.", "Bestil sikkert direkte i dag og spar penge."],
      ["Til Den Officielle Webshop Nu", "Køb trygt fra en verificeret forhandler nu.", "Alle dine betalinger er garanteret sikre her."],
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
      "Obtenez {KeyWord:{product}} avec {discount}% de réduction aujourd'hui. Livraison très rapide sur {LOCATION(City):ville} et la France. Inclut {guarantee} jours garantis.",
      "Essayez {KeyWord:{product}} avec grande certitude grâce à notre puissante garantie de {guarantee} jours. Commandez dès {currency}{price}.",
      "Profitez d'une énorme {discount}% de remise sur nos packs {KeyWord:{product}}. Livraison express vers {LOCATION(City):ville} et le pays.",
      "Achetez {KeyWord:{product}} pour seulement {currency}{price}. Forte garantie de {guarantee} jours et une fantastique réduction immédiate de {discount}%.",
    ],
    callouts: [
      "Gagnez Jusqu'à {discount}% De Remise",
      "Livraison Gratuite Dès {currency}{ship_min}",
      "Garantie Totale Sur {guarantee} Jours",
      "Pack Avec {discount}% De Réduction",
      "Prix Fixés Dès Seulement {currency}{price}",
    ],
    sitelinks: [
      ["Réclamez Vos {discount}% De Remise", "Offrez-vous un grand pack avec {discount}% de remise.", "Découvrez ces offres exclusives de packs."],
      ["Livraison Entièrement Gratuite", "Livraison offerte sur les commandes de {currency}{ship_min}.", "Bénéficiez d'une livraison express en France."],
      ["Garantie Absolue De {guarantee} Jours", "Testez {product} de manière très très sûre.", "Votre remboursement est strictement garanti."],
      ["Commandez Rapidement {product}", "Les prix commencent à partir de {currency}{price} ici.", "Commandez à présent sur le store officiel."],
      ["Nos Meilleures Offres De Packs", "Économisez énormément avec nos superbes packs.", "Votre très grosse réduction sera appliquée."],
      ["La Vente Flash Se Termine Vite", "Ne ratez pas du tout vos superbes {discount}% de remise.", "Commandez sans plus tarder et économisez."],
      ["Visitez La Boutique Officielle", "Achetez auprès des seuls vrais vendeurs vérifiés.", "Sécurité maximale pour tous vos paiements ici."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Le Véritable Produit Certifié", "Essayez Totalement Sans Risque", "Expédition Extrêmement Rapide", "Votre Paiement Est Super Sécurisé",
      "Grosse Remise Inédite De {discount}% Off", "Garantie Impeccable De {guarantee} Jours", "Des Packs Incroyables Dès {currency}{price}",
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
      "Hanki {KeyWord:{product}} ja hyödynnä {discount}% alennus tänään. Erittäin nopea toimitus {LOCATION(City):kaupunki} ja koko maahan. Täysi {guarantee} pv takuu.",
      "Kokeile {KeyWord:{product}} täysin riskittä mahtavalla {guarantee} päivän rahat takaisin -takuulla. Tilaa luotettavasti nyt alkaen {currency}{price}.",
      "Hyödynnä valtava {discount}% alennus premium {KeyWord:{product}} erikoispaketeista. Mahtavan nopea toimitus turvallisesti {LOCATION(City):kaupunki} ja muualle Suomeen.",
      "Osta oma {KeyWord:{product}} luotettavasti vain {currency}{price}. Saat vahvan {guarantee} päivän takuun ja huikean {discount}% alennuksen heti.",
    ],
    callouts: [
      "Jopa {discount}% Alennus Juuri Nyt",
      "Ilmainen Toimitus Yli {currency}{ship_min}",
      "Täysi {guarantee} Päivän Rahat Takaisin",
      "Hanki Paketti Suurella {discount}% Alennuksella",
      "Kaikki Tuotteet Alkaen Vain {currency}{price}",
    ],
    sitelinks: [
      ["Säästä Huimat {discount}% Heti Tänään Nyt", "Mahtava {discount}% alennus paketeista nyt.", "Löydä parhaat ja halvimmat pakettihinnat täältä."],
      ["Ilmainen Toimitus Koko Maahan Nyt", "Ilmainen toimitus tilauksille yli {currency}{ship_min}.", "Erittäin nopea toimitus kaikkialle {country}."],
      ["Täysi {guarantee} Päivän Takuu Nyt Heti", "Kokeile omaa {product} täysin riskittä tänään.", "Rahat takaisin takuuvarmasti turvallisesti {guarantee} päivässä."],
      ["Tilaa Uusi {product} Nyt Välittömästi", "Useat premium tuotteet alkaen vain {currency}{price} huikeasti.", "Tilaa erittäin turvallisesti viralliselta verkkokaupalta."],
      ["Aivan Parhaat Pakettitarjoukset Nyt", "Säästä paljon enemmän parhailla eksklusiivisilla.", "Valtava alennus lisätään tilaukseesi kätevästi automaattisesti."],
      ["Tämä Rajoitettu Tarjous Päättyy Nyt", "Älä todellakaan missaa arvokasta {discount}% alennusta tänään.", "Tilaa suojatusti tänään ja säästä suoraan heti verkossa nyt."],
      ["Meidän Virallinen {product} Verkkokauppa", "Osta turvallisesti vahvistetusta virallisesta kaupasta netissä.", "Meillä 100% varmennettu ja turvallinen maksu taattu aina."],
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
      "{KeyWord:{product}} cu {discount}% reducere astăzi. Livrare rapidă în {LOCATION(City):oraș} și ramburs garantat {guarantee} zile.",
      "Testează {KeyWord:{product}} fără niciun risc cu garanția completă de {guarantee} zile. Comandă acum de la {currency}{price}.",
      "Beneficiază de {discount}% reducere la {KeyWord:{product}}. Livrare express în {LOCATION(City):oraș} și în toată România.",
      "Achiziționează {KeyWord:{product}} pentru doar {currency}{price}. Garanție {guarantee} zile și {discount}% reducere excelentă azi.",
    ],
    callouts: [
      "Până La {discount}% Reducere Astăzi",
      "Transport Gratuit Peste {currency}{ship_min}",
      "Garanție Completă De {guarantee} Zile",
      "Ofertă Pachet {discount}% OFF Acum",
      "Prețuri Reduse De La {currency}{price}",
    ],
    sitelinks: [
      ["Până La {discount}% Reducere Azi", "Alege pachetul cu {discount}% reducere absolută.", "Descoperă ofertele exclusive la pachete."],
      ["Transport Gratuit În România", "Transport gratuit la comenzi de peste {currency}{ship_min}.", "Bucură-te de livrare rapidă și sigură."],
      ["Ramburs Garantat În {guarantee} Zile", "Testează {product} complet sigur și fără risc.", "Primești ramburs garantat integral mereu."],
      ["Comandă {product} Direct Aici", "Găsește produse excepționale de la {currency}{price}.", "Comandă ușor e pe site-ul oficial autorizat."],
      ["Pachetele Noastre Cele Mai Bune", "Economisește masiv cu pachetele noastre.", "Reducerea ta se va aplica automat online."],
      ["Ofertă Specială Cu Timp Limitat", "Nu rata o incredibilă reducere de {discount}%.", "Asigură-ți produsul azi și economisești."],
      ["Verifică Site-ul Oficial Aici", "Cumpără mereu de pe site-ul oficial verificat.", "Tranzacțiile beneficiază de plată securizată."],
    ],
    snippetHeader: "Types",
    snippetValues: [
      "Produs Pe Site Oficial", "Comandă Sigură Fără Risc", "Livrare Extrem De Rapidă", "Plata Este 100% Securizată",
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
      "Вземете {KeyWord:{product}} с невероятна {discount}% отстъпка днес. Изключително бърза доставка до {LOCATION(City):град} и областта. Пълна {guarantee}-дневна гаранция.",
      "Опитайте {KeyWord:{product}} напълно без никакъв риск с нашата {guarantee}-дневна пълна гаранция. Поръчайте напълно сигурно от {currency}{price}.",
      "Възползвайте се от {discount}% отстъпка на премиум {KeyWord:{product}} пакети. Много бърза доставка до {LOCATION(City):град} и цялата страна.",
      "Закупете умно {KeyWord:{product}} само за {currency}{price}. Получавате сигурна {guarantee} дневна гаранция и масивна {discount}% отстъпка днес.",
    ],
    callouts: [
      "До {discount}% Огромна Отстъпка Сега",
      "Безплатна Доставка Над {currency}{ship_min}",
      "Пълна Гаранция За Цели {guarantee} Дни",
      "Вземете Пакет С {discount}% Отстъпка",
      "Продуктите Започват От {currency}{price}",
    ],
    sitelinks: [
      ["Вземи Своята {discount}% Отстъпка Днес", "Пакет с {discount}% отстъпка — само днес тук.", "Ексклузивни пакетни оферти само за вас тук."],
      ["Безплатна Експресна Доставка Общо", "Безплатна доставка за поръчки над {currency}{ship_min}.", "Бърза доставка в цяла {country} 100% сигурно."],
      ["Гаранция За Връщане В {guarantee} Дни", "Опитайте {product} без абсолютно никакъв възможен риск.", "Сигурно връщане на парите за {guarantee} дни открито."],
      ["Поръчай Своя {product} Сега Днес Бързо", "Продукти започващи от само {currency}{price} на малък брой.", "Поръчайте много сигурно директно от официалния."],
      ["Най-Добрите Пакетни Оферти Тук Сега", "Спестете много повече с различни ексклузивни пакети.", "Голямата отстъпката се прилага много автоматично."],
      ["Ограничената Оферта Свършва Днес", "Не пропускайте невероятната си {discount}% огромна отстъпка.", "Поръчайте ексклузивно днес и спестете толкова."],
      ["Официален И Сигурен Уебсайт Тук Онлайн", "Купете сигурно от нашия официалния верифициран сайт.", "Изключително 100% сигурно плащане само тук."],
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
