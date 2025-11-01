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

const getRefreshIntervalSeconds = () => {
  const raw = process.env.ALL_RATES_ID_INTERVAL_SEC;
  const parsed = raw ? Number(raw) : 60;
  return Number.isFinite(parsed) ? parsed : 60;
};

let refreshTimer: NodeJS.Timeout | null = null;
let refreshInProgress = false;

export const refreshAllRatesIDCache = async () => {
  const allDirtyRates = (await getObject("allDirtyRates")) as IAllDirtyRates;
  if (!allDirtyRates || !Object.keys(allDirtyRates).length) {
    mylog("No rates found to refresh allRatesID cache", "hidden");
    return;
  }

  const setting = (await getData("parser_setting")) as IParserSetting;
  if (!setting) {
    mylog("Cannot refresh allRatesID cache without parser settings", "error");
    return;
  }

  const allRatesID = await getAllRatesID(allDirtyRates, setting);
  await setObject("allRatesID", allRatesID, smallTTL);
  mylog(
    `Refreshed allRatesID cache (${Object.keys(allRatesID).length} dirs)`,
    "hidden"
  );
};

export const scheduleAllRatesIDRefresh = () => {
  const intervalSeconds = getRefreshIntervalSeconds();
  if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) {
    mylog(
      `allRatesID refresh scheduler disabled (interval=${intervalSeconds})`,
      "warning"
    );
    return;
  }

  const run = async () => {
    if (refreshInProgress) {
      mylog("Skipping allRatesID refresh — previous run still active", "hidden");
      return;
    }
    refreshInProgress = true;
    try {
      await refreshAllRatesIDCache();
    } catch (err) {
      mylog(`Failed to refresh allRatesID cache: ${err}`, "error");
    } finally {
      refreshInProgress = false;
    }
  };

  if (refreshTimer) {
    clearInterval(refreshTimer);
  }

  run();

  refreshTimer = setInterval(() => {
    run().catch((err) =>
      mylog(`Unhandled error in allRatesID refresh: ${err}`, "error")
    );
  }, Math.max(intervalSeconds * 1000, 1000));

  mylog(
    `allRatesID refresh scheduler started (every ${intervalSeconds}s)`,
    "info"
  );
};
