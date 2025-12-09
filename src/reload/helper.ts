import callStrapi from "../gql/callStrapi";
import { ExchangersQuery } from "../gql/queries";
import { mylog } from "../utils/logger";
import net from "net";
import { getData, setData, setObject } from "../utils/redis";
import { IExchanger } from "../types/exchanger";
import { IRateData, RateField } from "../types/exchangerResp";
import { XMLParser } from "fast-xml-parser";
import zlib from "zlib";
import { bigTTL } from "../utils/settings";
import { IPopularDirs } from "../types/pms";
import { IPm } from "../types/selector";

const convertExchangers = (
  exchangers: IExchanger[]
): { [key: string]: IExchanger } => {
  return exchangers.reduce((res: { [key: string]: IExchanger }, exchanger) => {
    return { ...res, [exchanger.id]: exchanger };
  }, {});
};

export const preCleanXml = (data: any): string => {
  const raw =
    typeof data === "string"
      ? data
      : Buffer.isBuffer(data)
      ? data.toString("utf8")
      : String(data ?? "");

  const withoutBom = raw.replace(/^\uFEFF/, "");

  // Drop control chars that break XML parsing.
  const withoutControlChars = withoutBom.replace(
    /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
    ""
  );

  // Remove processing instructions (even if not closed, e.g., "<?xml ...").
  const withoutPi = withoutControlChars
    .replace(/<\?[^<]*(?=<)/g, "")
    .replace(/<\?[^>]*\?>?/g, "");

  // Remove any junk before the first tag and after the last closing angle bracket.
  const firstTag = withoutPi.indexOf("<");
  const lastTag = withoutPi.lastIndexOf(">");
  if (firstTag !== -1 && lastTag !== -1 && lastTag > firstTag) {
    return withoutPi.slice(firstTag, lastTag + 1).trim();
  }

  return withoutPi.trim();
};

const looksLikeXml = (text: string): boolean => /<\s*[\w!?]/.test(text);

const toBuffer = (data: any): Buffer | null => {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (ArrayBuffer.isView(data)) return Buffer.from(data.buffer);
  return null;
};

const decodeCompressed = (
  buffer: Buffer,
  errors: string[]
): string | undefined => {
  const binaryScore =
    buffer.reduce(
      (score, byte) =>
        byte === 9 || byte === 10 || byte === 13 || (byte >= 32 && byte <= 126)
          ? score
          : score + 1,
      0
    ) / Math.max(buffer.length, 1);

  const probablyCompressed =
    buffer.length >= 2 &&
    (buffer[0] === 0x1f ||
      buffer[0] === 0x78 ||
      buffer[0] === 0x8b ||
      binaryScore > 0.2);

  if (!probablyCompressed) return undefined;

  const attempts: Array<[string, (input: Buffer) => Buffer]> = [
    ["gzip", zlib.gunzipSync],
    ["deflate", zlib.inflateSync],
    ["deflate-raw", zlib.inflateRawSync],
    ["brotli", zlib.brotliDecompressSync],
  ];

  const attemptErrors: string[] = [];
  for (const [name, fn] of attempts) {
    try {
      const decoded = fn(buffer).toString("utf8");
      if (looksLikeXml(decoded)) {
        return decoded;
      }
    } catch (err: any) {
      attemptErrors.push(`${name}: ${err?.message || String(err)}`);
    }
  }

  if (attemptErrors.length) {
    errors.push(
      `Не удалось распаковать ответ (gzip/deflate/br): ${attemptErrors.join(
        " | "
      )}`
    );
  }

  return undefined;
};

const toXmlText = (data: any, errors: string[]): string => {
  if (typeof data === "string") return data;

  const buffer = toBuffer(data);
  if (buffer) {
    const direct = buffer.toString("utf8");
    if (looksLikeXml(direct)) {
      return direct;
    }

    const decoded = decodeCompressed(buffer, errors);
    if (decoded) {
      return decoded;
    }

    return direct;
  }

  return String(data ?? "");
};

const parser = new XMLParser({
  ignoreAttributes: true,
  allowBooleanAttributes: true,
  parseTagValue: false,
  parseAttributeValue: false,
  trimValues: false,
});

const toRateField = (value: any): RateField => ({ _text: String(value ?? "") });

const normalizeItem = (data: any): IRateData | null => {
  const root = data?.root ?? data;
  const item = root?.item ?? root;
  if (!item) return null;

  return {
    from: toRateField(item.from?._text ?? item.from),
    to: toRateField(item.to?._text ?? item.to),
    in: toRateField(item.in?._text ?? item.in),
    out: toRateField(item.out?._text ?? item.out),
    amount: toRateField(item.amount?._text ?? item.amount),
    minamount: toRateField(item.minamount?._text ?? item.minamount),
    maxamount: toRateField(item.maxamount?._text ?? item.maxamount),
    ...(item.minfee !== undefined
      ? { minfee: toRateField(item.minfee?._text ?? item.minfee) }
      : {}),
    ...(item.fromfee !== undefined
      ? { fromfee: toRateField(item.fromfee?._text ?? item.fromfee) }
      : {}),
    ...(item.tofee !== undefined
      ? { tofee: toRateField(item.tofee?._text ?? item.tofee) }
      : {}),
    ...(item.param !== undefined
      ? { param: toRateField(item.param?._text ?? item.param) }
      : {}),
  };
};

export const parseRatesFromXml = (
  data: any
): { rates: IRateData[]; errors: string[] } => {
  const errors: string[] = [];
  const cleaned = preCleanXml(toXmlText(data, errors));
  const itemsRegex = /<item[\s\S]*?<\/item>/gi;
  const rates: IRateData[] = [];

  const matches = cleaned.match(itemsRegex) || [];

  matches.forEach((itemXml, index) => {
    try {
      const wrapped = `<root>${itemXml}</root>`;
      const parsed = parser.parse(wrapped);
      const normalized = normalizeItem(parsed);
      if (!normalized) {
        throw new Error("Не удалось извлечь данные item");
      }
      rates.push(normalized);
    } catch (err: any) {
      errors.push(
        `item #${index + 1}: ${err?.message || String(err) || "parse error"}`
      );
    }
  });

  return { rates, errors };
};

export const reloadExchangers = async () => {
  while (true) {
    // это чтобы пытаться пока не загрузятся
    try {
      const exchangers = (await callStrapi(ExchangersQuery))?.exchangers.slice(
        0,
        process.env.LIMIT_EXCHANGERS || 100000
      ) as IExchanger[];

      mylog(`Loaded exchangers ${exchangers?.length}`, "important");

      await setObject("exchangers", convertExchangers(exchangers), bigTTL); // устаревает через BIG_TTL

      break;
    } catch (error: any) {
      mylog(`Error loading exchangers: ${error?.message}`, "error");
      mylog("Retrying in 1 minute...", "warning");
      await new Promise((resolve) => setTimeout(resolve, 60000));
    }
  }
};

export const waitSec = (seconds: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};
export const splitArrayToNChunks = <T>(arr: T[], n: number): T[][] => {
  if (n <= 0) return [arr];
  const result: T[][] = Array.from({ length: n }, () => []);
  arr.forEach((item, index) => {
    result[index % n].push(item);
  });
  return result;
};

export function splitArrayToNChunksAdaptive<T>(
  array: T[],
  n: number,
  weights: number[]
): T[][] {
  if (n <= 0) return [array];

  const safeWeights = Array.from({ length: n }, (_, i) => {
    const weight = weights?.[i];
    if (!Number.isFinite(weight) || (weight ?? 0) <= 0) {
      return 1;
    }
    return weight as number;
  });

  const chunks: T[][] = Array.from({ length: n }, () => []);
  const loads: number[] = Array.from({ length: n }, () => 0);

  array.forEach((item) => {
    let targetIndex = 0;
    let minLoad = loads[0];

    for (let i = 1; i < n; i++) {
      if (loads[i] < minLoad) {
        minLoad = loads[i];
        targetIndex = i;
      }
    }

    chunks[targetIndex].push(item);
    loads[targetIndex] += 1 / safeWeights[targetIndex];
  });

  return chunks;
}

export function splitObjectToNChunks<T>(obj: T, n: number): T[] {
  const entries = Object.entries(obj as any); // Convert object to an array of [key, value] pairs
  const chunkSize = Math.ceil(entries.length / n); // Determine the size of each chunk
  const chunks: T[] = [];

  for (let i = 0; i < n; i++) {
    const chunkEntries = entries.slice(i * chunkSize, (i + 1) * chunkSize); // Get the current chunk
    chunks.push(Object.fromEntries(chunkEntries) as T); // Convert chunk back to an object and add it to chunks
  }

  return chunks;
}

export const findAvailablePort = (startPort: number) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on("error", () => {
      resolve(findAvailablePort(startPort + 1)); // Try the next port
    });

    server.listen(startPort, () => {
      server.close(() => {
        resolve(startPort); // Return the available port
      });
    });
  });
};

export const pmsToPopularDirs = (pms: (IPm | undefined)[]): IPopularDirs => {
  if (!pms || !pms.length || pms.find((pm) => !pm)) return {};
  const cryptoCodes = pms
    .filter((pm) => pm?.popular_as === "crypto")
    .map((pm) => pm?.code);
  const fiatCodes = pms
    .filter((pm) => pm?.popular_as === "fiat")
    .map((pm) => pm?.code);
  return cryptoCodes.reduce((dirs: IPopularDirs, cryptoCode) => {
    const c2f = fiatCodes.map((fiatCode) => `${cryptoCode}_${fiatCode}`);
    const f2c = fiatCodes.map((fiatCode) => `${fiatCode}_${cryptoCode}`);
    if (!cryptoCode) return dirs;
    return { ...dirs, [cryptoCode]: { buy: [...f2c], sell: [...c2f] } };
  }, {});
};

// export const updateExchangersList = async () => {
//   const newExchangers = (await callStrapi(ExchangersQuery))
//     ?.exchangers as IExchanger[];
//   if (!newExchangers) {
//     mylog("Couldn't load exchangers!", "error");
//     return;
//   }

//   const oldExchangers = (await getData("exchangers")) as IExchanger[];
//   if (!oldExchangers) {
//     mylog(
//       `No exchangers cache found, loaded from strapi: ${newExchangers.length}`,
//       "info"
//     );
//     await setData("exchangers", newExchangers);
//     return;
//   }
//   const exchangerIds = new Set(oldExchangers.map((ex) => ex.id));
//   const exchangersToAdd = newExchangers.filter(
//     (ex) => !exchangerIds.has(ex.id)
//   );
//   const allExchangers = [...oldExchangers, ...exchangersToAdd];
//   mylog(`New exchangers added: ${newExchangers.length}`, "info");
//   await setData("exchangers", allExchangers);
// };
