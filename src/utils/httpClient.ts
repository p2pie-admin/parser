import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const DEFAULT_TIMEOUT_MS = Number(process.env.RATES_TIMEOUT ?? 12_000);
const RETRY_COUNT = 2;
const RETRY_DELAY_BASE_MS = Number(process.env.HTTP_RETRY_DELAY_MS ?? 400);

const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    process.env.HTTP_USER_AGENT ||
    "Mozilla/5.0 (compatible; P2PParser/1.0; +https://parser.local)",
  Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
};

const timeoutErrorCodes = new Set<string>(["ECONNABORTED", "ETIMEDOUT"]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const client = axios.create({
  timeout: DEFAULT_TIMEOUT_MS,
  headers: DEFAULT_HEADERS,
  decompress: true,
  validateStatus: () => true,
});

const shouldRetry = (error: any): boolean => {
  if (!error) return false;

  const code = error.code ? String(error.code) : "";
  return timeoutErrorCodes.has(code);
};

export async function httpGet<T = any>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> {
  const maxAttempts = Math.max(RETRY_COUNT + 1, 1);
  const timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;

  let attempt = 0;
  let lastError: any;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      return await client.get<T>(url, {
        ...config,
        timeout,
        headers: {
          ...DEFAULT_HEADERS,
          ...(config.headers || {}),
        },
      });
    } catch (error) {
      lastError = error;

      if (attempt >= maxAttempts || !shouldRetry(error)) {
        break;
      }

      const delay = RETRY_DELAY_BASE_MS * attempt;
      await sleep(delay);
    }
  }

  throw lastError;
}

export const setDefaultHeader = (name: string, value: string) => {
  client.defaults.headers.common[name] = value;
};
