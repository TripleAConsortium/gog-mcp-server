import { GogApiClient } from "../client.js";
import { COUNTRIES } from "../countries.js";

export interface WishlistEntry {
  productTitle: string;
  countryCode: string;
  countryName: string;
  price: string;
  currency: string;
}

export interface BestPriceEntry {
  countryCode: string;
  countryName: string;
  price: string;
  currency: string;
}

interface GogProduct {
  id?: number | string;
  title?: string;
  price?:
    | string
    | {
        amount?: string;
        currency?: string | { code?: string };
      };
}

interface GogData {
  products?: GogProduct[];
}

async function fetchWishlistHtml(
  client: GogApiClient,
  username: string,
  countryCode: string,
): Promise<string | null> {
  const url = `${client.gogBaseUrl}/u/${username}/wishlist`;
  try {
    return await client.getHtml(url, {
      Cookie: `gog_lc=${countryCode}_USD_en-US`,
    });
  } catch {
    return null;
  }
}

function extractGogData(htmlContent: string): GogData | null {
  const patterns = [
    /window\.gogData\s*=\s*(\{.*?\});\s*(?:window\.|var)/s,
    /var\s+gogData\s*=\s*(\{.*?\});/s,
    /<script>\s*var\s+gogData\s*=\s*(\{.*?\});\s*<\/script>/s,
    /<script>[^<]*window\.gogData\s*=\s*(\{.*?\});\s*<\/script>/s,
  ];

  for (const pattern of patterns) {
    const match = htmlContent.match(pattern);
    if (match) {
      try {
        return JSON.parse(match[1]) as GogData;
      } catch {
        continue;
      }
    }
  }

  return null;
}

async function fetchWishlistForCountry(
  client: GogApiClient,
  username: string,
  countryCode: string,
  countryName: string,
): Promise<WishlistEntry[]> {
  const html = await fetchWishlistHtml(client, username, countryCode);
  if (!html) return [];

  const gogData = extractGogData(html);
  if (!gogData?.products) return [];

  const results: WishlistEntry[] = [];

  for (const product of gogData.products) {
    const productTitle = product.title;
    if (!product.id || !productTitle) continue;

    const priceInfo = product.price;
    if (!priceInfo) continue;

    let amount: string | null = null;
    let currency = "USD";

    if (typeof priceInfo === "object") {
      amount = priceInfo.amount ?? null;
      const currInfo = priceInfo.currency;
      if (typeof currInfo === "object") {
        currency = currInfo.code ?? "USD";
      } else if (typeof currInfo === "string") {
        currency = currInfo;
      }
    } else if (typeof priceInfo === "string") {
      const parts = priceInfo.split(" ");
      if (parts.length >= 2) {
        amount = parts[0];
        currency = parts[1];
      }
    }

    if (amount === null) continue;

    results.push({ productTitle, countryCode, countryName, price: amount, currency });
  }

  return results;
}

export async function processWishlist(
  client: GogApiClient,
  username: string,
): Promise<Record<string, BestPriceEntry>> {
  const allResults = await Promise.all(
    Object.entries(COUNTRIES).map(([countryCode, countryName]) =>
      fetchWishlistForCountry(client, username, countryCode, countryName),
    ),
  );

  const productPrices: Record<string, Record<string, BestPriceEntry>> = {};

  for (const countryResults of allResults) {
    for (const { productTitle, countryCode, countryName, price, currency } of countryResults) {
      if (!(productTitle in productPrices)) {
        productPrices[productTitle] = {};
      }
      productPrices[productTitle][countryCode] = { countryCode, countryName, price, currency };
    }
  }

  const bestPrices: Record<string, BestPriceEntry> = {};

  for (const [productName, countryPrices] of Object.entries(productPrices)) {
    let lowestPrice: number | null = null;
    let lowestCountry: string | null = null;

    for (const [code, priceData] of Object.entries(countryPrices)) {
      const price = parseFloat(priceData.price);
      if (isNaN(price)) continue;

      if (lowestPrice === null || price < lowestPrice) {
        lowestPrice = price;
        lowestCountry = code;
      }
    }

    if (lowestCountry) {
      bestPrices[productName] = countryPrices[lowestCountry];
    }
  }

  return bestPrices;
}
