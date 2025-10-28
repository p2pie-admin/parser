import callStrapi from "../gql/callStrapi";
import { ExchangersQuery } from "../gql/queries";
import { mylog } from "../utils/logger.ts";
import net from "net";
import { getData, setData, setObject } from "../utils/redis";
import { IExchanger } from "../types/exchanger";
import { ExchangerResponse } from "../types/exchangerResp";
import XML2JSON from "xml-js";

const convertExchangers = (
  exchangers: IExchanger[]
): { [key: string]: IExchanger } => {
  return exchangers.reduce((res: { [key: string]: IExchanger }, exchanger) => {
    return { ...res, [exchanger.id]: exchanger };
  }, {});
};

export const xmlToJson = (data: any): ExchangerResponse | null => {
  const options = {
    compact: true,
    ignoreComment: true,
    alwaysChildren: true,
  };
  let res = {} as ExchangerResponse;
  try {
    res = JSON.parse(XML2JSON.xml2json(data, options)) as ExchangerResponse;
  } catch (e) {
    return null;
  }
  return res;
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

      const big_loop =
        ((await getData("parser_setting:big_loop")) as number) || 10;

      setObject("exchangers", convertExchangers(exchangers)); // устаревает через big_loop + 2

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
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const total = array.length;
  const chunks: T[][] = [];
  let start = 0;

  for (let i = 0; i < n; i++) {
    const portion = Math.floor((weights[i] / totalWeight) * total);
    const end = i === n - 1 ? total : start + portion;
    chunks.push(array.slice(start, end));
    start = end;
  }

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
