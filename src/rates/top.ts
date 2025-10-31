import { getObject, getData, setObject } from "../utils/redis";
import { emoji, mylog } from "../utils/logger";
import { splitObjectToNChunks } from "../reload/helper";

import { IAllDirtyRates } from "../types/rates";
import { IParserSetting } from "../types";
import { getAllRatesID } from "./Tops";
import { smallTTL } from "../utils/settings";

/**
 * Calculates top rates per CPU chunk
 */
export const filterRates = async (idx: number, numCPUs: number) => {
  const allDirtyRates = (await getObject("allDirtyRates")) as IAllDirtyRates;
  const setting = (await getData("parser_setting")) as IParserSetting;

  if (!setting) {
    mylog("Error loading parser settings", "error");
    return;
  }

  if (!allDirtyRates || !Object.keys(allDirtyRates).length) {
    mylog("No rates found to calculate tops", "hidden");
    return;
  }

  const chunks = splitObjectToNChunks(allDirtyRates, numCPUs);
  const currentChunk = chunks[idx];

  const allRatesID = await getAllRatesID(currentChunk, setting);

  await setObject("allRatesID", allRatesID, smallTTL); // Updated to use topIDs

  mylog(
    `${emoji(idx)} Dirs: ${Object.keys(currentChunk).length}, added rates ${
      Object.keys(allRatesID).length
    }`,
    "important"
  );
};
