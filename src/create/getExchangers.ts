import { gql } from "graphql-request";
import callStrapi from "../gql/callStrapi";
import links from "./newlinks";
import { createExchangers, isAlmostMatching } from "./helper";
import { capitalize } from "../rates/Statistics/helper";
import { IDataForExchangerCreation } from "../types/exchanger";
import {
  getAllExchangersRatesLinksQuery,
  getImmutableExchangersRatesLinksQuery,
} from "./queries";
import path from "path";
import fs from "fs";
import { mylog } from "../utils/logger";

const makeRefLink = (link: string) => {
  return link
    .replace(/https?:\/\/(www\.)?/i, "___")
    .split("/")[0]
    .replace("api.", "")
    .replace("___", "https://");
};

const makeName = (refLink: string) => {
  return capitalize(
    refLink.replace("https://", "").split(".")[0].replace("-", " ")
  ).replace(" ", "-");
};

export const getExchangersRatesLinks = async () => {
  const allExchangers = (await callStrapi(
    getAllExchangersRatesLinksQuery
  )) as any;
  const immutableExchangers = (await callStrapi(
    getImmutableExchangersRatesLinksQuery
  )) as any;
  const allLinks = allExchangers.exchangers.map(
    (l: any) => l.rates_link.split("?")[0]
  );
  const immutableLinks = immutableExchangers.exchangers.map(
    (l: any) => l.rates_link.split("?")[0]
  );
  const newLinks = links.map((l: any) => l.split("?")[0]);
  const totalLinks = [...allLinks, ...newLinks].filter(
    (l) => !immutableLinks.includes(l)
  );

  const exchangers = totalLinks.reduce((res: any[], link: string) => {
    if (res.find((l) => isAlmostMatching(link, l.rates_link))) {
      return res; // Skip adding duplicate-like links
    }
    return [
      ...res,
      {
        rates_link: link,
        ref_link: makeRefLink(link),
        name: makeName(makeRefLink(link)),
        admin_rating: +(Math.random() * (5 - 3.4) + 3.4).toFixed(2),
        admin_comment: "v1",
      },
    ];
  }, []) as IDataForExchangerCreation[];

  const filePath = path.join(__dirname, "data.json");
  console.log("total: ", totalLinks.length);
  console.log("immutable: ", immutableLinks.length, " of ", allLinks.length);
  console.log("new: ", newLinks.length);

  // Convert object to JSON and write to file
  fs.writeFileSync(filePath, JSON.stringify(exchangers, null, 2), "utf8");
  await createExchangers(exchangers);
  mylog("-- EXCHANGERS CREATED --", "success");
};
