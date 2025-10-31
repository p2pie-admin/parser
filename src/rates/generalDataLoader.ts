import { getData, getObject } from "../utils/redis";
import { IGeneralData } from "../types/rates";
import { IParserSetting } from "../types";
import { mylog } from "../utils/logger";

/**
 * Loads general data used for all exchangers
 */
export const prepareGeneralData = async (): Promise<IGeneralData> => {
  const parserSetting = (await getObject("parser_setting")) as IParserSetting;
  const cities = parserSetting?.cities || [];
  const dirsDisabled = parserSetting?.dirs_disabled || "";
  const allPmCodesThatExist = (await getData("all_pm_codes_that_exist")) || [];
  const alternativePmCodes = (await getData("alternative_pm_codes")) || [];
  if (!allPmCodesThatExist.length) mylog("No pm codes exist!", "error");
  if (!cities.length) mylog("No cities!", "error");

  mylog(
    `Loaded general data. Cities: ${cities.length} Pm codes: ${allPmCodesThatExist.length}`,
    "success"
  );

  return {
    dirsDisabled,
    cities,
    allPmCodesThatExist,
    alternativePmCodes,
  };
};
