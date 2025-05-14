import { getObject, getData, setObject } from "../redis";
import { mylog, logMemoryUsage } from "../helper";
import { splitObjectToNChunks } from "../loops/helper";
import getAllRates from "./Tops";
import { IDirtyRates } from "../types/rates";
import { IParserSetting } from "../types";

/**
 * Calculates top rates per CPU chunk
 */
export const calculateTops = async (idx: number, numCPUs: number) => {
  if (!idx) logMemoryUsage();

  const dirtyRates = (await getObject("dirtyRates")) as IDirtyRates;
  const setting = (await getData("parser_setting")) as IParserSetting;

  if (!setting) {
    mylog("Error loading parser settings", "error");
    return;
  }

  if (!dirtyRates || !Object.keys(dirtyRates).length) {
    mylog("No rates found to calculate tops", "hidden");
    return;
  }

  const chunks = splitObjectToNChunks(dirtyRates, numCPUs);
  const currentChunk = chunks[idx];

  mylog(`#${idx} Total dirs: ${Object.keys(currentChunk).length}`, "important");
  mylog("Calculating top rates...", "important");

  const tops = await getAllRates(currentChunk, setting);
  //   const prevTops = !idx ? {} : ((await getObject("allRates")) as any);
  await setObject("allRates", tops);
  mylog("Top rates calculated and stored successfully", "important");
};
