import callStrapi from "../gql/callStrapi";
import { ExchangersQuery, ExchangerStatusesQuery } from "../gql/queries";
import { mylog } from "../helper";
import net from "net";
import { getData, setData, setObject } from "../redis";
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
  const newExchangerStatuses = await callStrapi(ExchangerStatusesQuery);
  const oldExchangerStatuses = await getData("exchanger_statuses");
  if (
    JSON.stringify(newExchangerStatuses) !==
    JSON.stringify(oldExchangerStatuses)
  ) {
    mylog("Reloading exchangers", "warning");
    const exchangers = (await callStrapi(ExchangersQuery))
      ?.exchangers as IExchanger[];
    if (!exchangers) {
      mylog("Couldn't load exchangers!", "error");
      return;
    }
    await setObject("exchangers", convertExchangers(exchangers));
    await setData("exchanger_statuses", newExchangerStatuses);
    return;
  }
  mylog("Exchanger statuses are the same!", "warning");
};

export const waitSec = (seconds: number) => {
  mylog(`Waiting ${seconds} sec`);
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};

export const splitArrayToNChunks = (arr: any[], n: number): any[][] => {
  const chunkSize = Math.ceil(arr.length / n);
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

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
