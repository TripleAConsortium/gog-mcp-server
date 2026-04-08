type QueryValue = string | number | boolean | Array<string | number | boolean>;
type QueryParams = Record<string, QueryValue | undefined | null>;

export interface GogApiClientOptions {
  apiBaseUrl?: string;
  gogBaseUrl?: string;
}

export class GogApiClient {
  readonly apiBaseUrl: string;
  readonly gogBaseUrl: string;
  private readonly requestTimeoutMs = 30000;
  private readonly maxGetRetries = 2;

  constructor(options: GogApiClientOptions = {}) {
    this.apiBaseUrl = (options.apiBaseUrl ?? "https://api.gog.com").replace(/\/+$/, "");
    this.gogBaseUrl = (options.gogBaseUrl ?? "https://www.gog.com").replace(/\/+$/, "");
  }

  async get<T>(path: string, query?: QueryParams): Promise<T> {
    const url = this.buildUrl(this.apiBaseUrl, path, query);
    return this.fetchJson<T>(url);
  }

  async getHtml(url: string, headers?: Record<string, string>): Promise<string> {
    for (let attempt = 0; attempt <= this.maxGetRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            ...headers,
          },
          signal: AbortSignal.timeout(this.requestTimeoutMs),
        });

        if (!response.ok) {
          if (attempt < this.maxGetRetries && [502, 503, 504].includes(response.status)) {
            await this.wait(300 * (attempt + 1));
            continue;
          }
          throw new Error(`GOG request failed (${response.status}): ${url}`);
        }

        return await response.text();
      } catch (error) {
        if (attempt < this.maxGetRetries && this.isRetryableError(error)) {
          await this.wait(300 * (attempt + 1));
          continue;
        }
        throw error;
      }
    }
    throw new Error(`GOG request failed after retries: ${url}`);
  }

  private async fetchJson<T>(url: string): Promise<T> {
    for (let attempt = 0; attempt <= this.maxGetRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(this.requestTimeoutMs),
        });

        if (!response.ok) {
          if (attempt < this.maxGetRetries && [502, 503, 504].includes(response.status)) {
            await this.wait(300 * (attempt + 1));
            continue;
          }
          const text = await response.text();
          throw new Error(`GOG API GET ${url} failed (${response.status}): ${text}`);
        }

        return (await response.json()) as T;
      } catch (error) {
        if (attempt < this.maxGetRetries && this.isRetryableError(error)) {
          await this.wait(300 * (attempt + 1));
          continue;
        }
        throw error;
      }
    }
    throw new Error(`GOG API GET ${url} failed after retries.`);
  }

  private buildUrl(base: string, path: string, query?: QueryParams): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${base}${normalizedPath}`);

    if (!query) {
      return url.toString();
    }

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item));
        }
      } else {
        url.searchParams.append(key, String(value));
      }
    }

    return url.toString();
  }

  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const lower = error.message.toLowerCase();
    return (
      lower.includes("fetch failed") ||
      lower.includes("timed out") ||
      lower.includes("econnreset") ||
      lower.includes("eai_again")
    );
  }

  private async wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
}
