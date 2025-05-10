import { getObject, getData, setObject } from "../redis";
import { mylog, logMemoryUsage } from "../helper";
import { splitObjectToNChunks } from "../loops/helper";
import getAllDirTops from "./Tops";
import { IAllDirsRates } from "../types/rates";
import { IParserSetting } from "../types";

/**
 * Calculates top rates per CPU chunk
 */
export const calculateTops = async (idx: number, numCPUs: number) => {
  if (!idx) logMemoryUsage();

  const allDirRates = (await getObject("allDirRates")) as IAllDirsRates;
  const setting = (await getData("parser_setting")) as IParserSetting;

  if (!setting) {
    mylog("Error loading parser settings", "error");
    return;
  }

  if (!allDirRates || !Object.keys(allDirRates).length) {
    mylog("No rates found to calculate tops", "hidden");
    return;
  }

  const chunks = splitObjectToNChunks(allDirRates, numCPUs);
  const currentChunk = chunks[idx];

  mylog(`#${idx} Total dirs: ${Object.keys(currentChunk).length}`, "important");
  mylog("Calculating top rates...", "important");

  const tops = await getAllDirTops(currentChunk, setting);
  //   const prevTops = !idx ? {} : ((await getObject("allDirTops")) as any);
  await setObject("allDirTops", tops);
  mylog("Top rates calculated and stored successfully", "important");
};
