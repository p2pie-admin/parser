import callStrapi from "../gql/callStrapi";
import { ExchangersQuery } from "../gql/queries";
import { mylog } from "../helper";
import net from "net";
import { getData, setData } from "../redis";
import { IExchanger } from "../types/exchanger";
import { ExchangerResponse } from "../types/exchangerResp";
import XML2JSON from "xml-js";

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
  const exchangers = (await callStrapi(ExchangersQuery))
    ?.exchangers as IExchanger[];
  if (!exchangers) {
    mylog("Couldn't load exchangers!", "error");
    return;
  }
  await setData("exchangers", exchangers);
};

export const wait = (seconds: number) => {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};

export const splitToNChunks = (arr: any[], n: number): any[][] => {
  const chunkSize = Math.ceil(arr.length / n);
  const chunks = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunks.push(arr.slice(i, i + chunkSize));
  }
  return chunks;
};

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
