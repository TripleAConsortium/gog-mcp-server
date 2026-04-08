import { GogApiClient } from "../client.js";
import { COUNTRIES, COUNTRY_CODES } from "../countries.js";

export interface PriceResult {
  countryCode: string;
  countryName: string;
  currency: string | null;
  value: number | null;
  valueUsd: number | null;
}

interface GogPriceItem {
  finalPrice: string;
  currency: { code: string } | string;
}

interface GogPricesResponse {
  _embedded: {
    prices: GogPriceItem[];
  };
}

export async function extractProductId(client: GogApiClient, url: string): Promise<string> {
  const html = await client.getHtml(url);
  const cardMatch = html.match(/card-product="\d*"/);
  if (!cardMatch) {
    throw new Error("Could not find product ID on page. Check the URL.");
  }
  const idMatch = cardMatch[0].match(/(\d+)/);
  if (!idMatch) {
    throw new Error("Could not parse product ID from page.");
  }
  return idMatch[0];
}

export async function fetchPriceForCountry(
  client: GogApiClient,
  productId: string,
  countryCode: string,
  normalize = false,
): Promise<PriceResult> {
  const countryName = COUNTRIES[countryCode] ?? countryCode;
  const result: PriceResult = {
    countryCode,
    countryName,
    currency: null,
    value: null,
    valueUsd: null,
  };

  try {
    const query: Record<string, string> = { countryCode };
    if (normalize) {
      query.currency = "USD";
    }

    const data = await client.get<GogPricesResponse>(`/products/${productId}/prices`, query);

    for (let i = 0; i < data._embedded.prices.length; i++) {
      const item = data._embedded.prices[i];
      if (i === 0) {
        const parts = item.finalPrice.split(" ");
        result.value = parseFloat(parts[0]) / 100;
        result.currency = parts[1] ?? null;
      }
      const currencyCode =
        typeof item.currency === "object" ? item.currency.code : item.currency;
      if (currencyCode === "USD") {
        result.valueUsd = parseFloat(item.finalPrice.split(" ")[0]) / 100;
      }
    }
  } catch {
    // Country may not be available for this product; leave nulls
  }

  return result;
}

export async function fetchPricesAllCountries(
  client: GogApiClient,
  productId: string,
  normalize = false,
): Promise<PriceResult[]> {
  const results = await Promise.all(
    COUNTRY_CODES.map((code) => fetchPriceForCountry(client, productId, code, normalize)),
  );

  return results
    .filter((r) => r.value !== null)
    .sort((a, b) => {
      const aVal = a.valueUsd ?? a.value ?? Infinity;
      const bVal = b.valueUsd ?? b.value ?? Infinity;
      return aVal - bVal;
    });
}
