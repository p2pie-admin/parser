import { getData } from "../utils/redis";
import { IGeneralData } from "../types/rates";
import { ICity } from "../types";

/**
 * Loads general data used for all exchangers
 */
export const prepareGeneralData = async (): Promise<IGeneralData> => {
  const setting = await getData("parser_setting");

  return {
    dirsDisabled: setting?.dirs_disabled || "",
    allPmCodesThatExist: (await getData("all_pm_codes_that_exist")) || [],
    alternativePmCodes: (await getData("alternative_pm_codes")) || [],
    cities: setting?.cities || [],
  };
};
