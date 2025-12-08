import callStrapi from "../gql/callStrapi";
import { ExchangersQuery } from "../gql/queries";
import { mylog } from "../utils/logger";
import net from "net";
import { getData, setData, setObject } from "../utils/redis";
import { IExchanger } from "../types/exchanger";
import { ExchangerResponse } from "../types/exchangerResp";
import XML2JSON from "xml-js";
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

export type XmlToJsonResult = {
  parsed: ExchangerResponse | null;
  error?: string;
};

export const xmlToJson = (data: any): XmlToJsonResult => {
  const options = {
    compact: true,
    ignoreComment: true,
    alwaysChildren: true,
  };
  let parsed = {} as ExchangerResponse;
  try {
    parsed = JSON.parse(XML2JSON.xml2json(data, options)) as ExchangerResponse;
  } catch (e) {
    return {
      parsed: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
  return { parsed };
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
