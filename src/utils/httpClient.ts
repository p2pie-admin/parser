import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

const DEFAULT_TIMEOUT_MS = Number(process.env.RATES_TIMEOUT ?? 10) * 1000;
const RETRY_COUNT = Number(process.env.HTTP_RETRY_COUNT ?? 1);
const RETRY_DELAY_BASE_MS = Number(process.env.HTTP_RETRY_DELAY_MS ?? 400);

const DEFAULT_HEADERS: Record<string, string> = {
  "User-Agent":
    process.env.HTTP_USER_AGENT ||
    "Mozilla/5.0 (compatible; P2PParser/1.0; +https://parser.local)",
  Accept: "application/xml,text/xml;q=0.9,*/*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  Connection: "keep-alive",
};

const RETRYABLE_ERROR_CODES = new Set<string>([
  "ECONNABORTED",
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "EAI_AGAIN",
  "ENOTFOUND",
]);

const RETRYABLE_STATUS_CODES = new Set<number>([
  408, // Request Timeout
  425, // Too Early
  429, // Too Many Requests
  500,
  502,
  503,
  504,
  522,
]);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const client = axios.create({
  timeout: DEFAULT_TIMEOUT_MS,
  headers: DEFAULT_HEADERS,
  decompress: true,
});

const shouldRetry = (error: any): boolean => {
  if (!error) return false;

  const code = error.code ? String(error.code) : "";
  if (RETRYABLE_ERROR_CODES.has(code)) {
    return true;
  }

  const status = error?.response?.status;
  if (typeof status === "number" && RETRYABLE_STATUS_CODES.has(status)) {
    return true;
  }

  // Axios sets isAxiosError=true when it cannot reach the server at all (no response)
  if (error.isAxiosError && !error.response) {
    return true;
  }

  return false;
};

export async function httpGet<T = any>(
  url: string,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> {
  const maxAttempts = Math.max(RETRY_COUNT + 1, 1);
  const timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  const responseType = config.responseType ?? "arraybuffer";

  let attempt = 0;
  let lastError: any;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      return await client.get<T>(url, {
        ...config,
        timeout,
        responseType,
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

      const backoff = RETRY_DELAY_BASE_MS * Math.pow(2, attempt - 1);
      const jitter = Math.random() * RETRY_DELAY_BASE_MS;
      const delay = backoff + jitter;
      await sleep(delay);
    }
  }

  throw lastError;
}

export const setDefaultHeader = (name: string, value: string) => {
  client.defaults.headers.common[name] = value;
};
