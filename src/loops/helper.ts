import db from "../db";
import callStrapi from "../gql/callStrapi";
import { ExchangersQuery } from "../gql/queries";
import { mylog } from "../helper";
import ErrorHandler from "../rates/ParserHandlers/ErrorHandler";
import { IExchangerWithId } from "../types/exchanger";
import { ExchangerResponse } from "../types/exchangerResp";
import XML2JSON from "xml-js";

export const xmlToJson = (
  errorHandler: ErrorHandler,
  data: any
): ExchangerResponse => {
  const options = {
    compact: true,
    ignoreComment: true,
    alwaysChildren: true,
  };
  let res = {} as ExchangerResponse;
  try {
    res = JSON.parse(XML2JSON.xml2json(data, options)) as ExchangerResponse;
  } catch (e) {
    errorHandler.saveError("json-parsing-error", (e as any) || "...");
  }
  return res;
};

export const updateExchangersList = async () => {
  const exchangers = (await db.getData(".exchangers")) as IExchangerWithId[];
  const exchangerIds = new Set(exchangers.map((ex) => ex.id));
  const newExchangers = (await callStrapi(ExchangersQuery))
    ?.exchangers as IExchangerWithId[];
  if (!newExchangers) {
    mylog("Couldn't load exchangers!", "error");
    return;
  }
  const exchangersToAdd = newExchangers.filter(
    (ex) => !exchangerIds.has(ex.id)
  );
  const allExchangers = [...exchangers, ...exchangersToAdd];
  mylog(`New exchangers added: ${newExchangers.length}`, "success");
  await db.push(".exchangers", allExchangers);
};
