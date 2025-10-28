import { cpus } from "os";
import callStrapi from "../gql/callStrapi";
import {
  ParserSettingQuery,
  PmGroupsQuery,
  TopsQuery,
  PopularPmsQuery,
} from "../gql/queries";
import { pmPointerToPm, pmsToDirs } from "../rates/Statistics/helper";
import { getData, getObject, setData, setObject } from "../utils/redis";
import { IPmPointer } from "../types/pms";
import { ISection, IPmGroup } from "../types/selector";

import { mylog } from "../utils/logger.ts";
import { logMemoryUsage } from "./memoryUsage";

import statusChange from "../utils/statusChange";
import { reloadExchangers } from "./helper";
import { measure } from "../utils/helper";
import { isPrimary } from "../utils/settings";
import { IExchanger } from "../types/exchanger";

async function reload(loopsDone?: number) {
  if (!isPrimary) return;
  logMemoryUsage();

  await measure(
    "reload",
    `Reloading on loop ${loopsDone || "initial"}`,
    async () => {
      //// 1️⃣ Reload exchangers list from Strapi
      await reloadExchangers(); // скипы не трогает, они хранятся сами по себе

      //// 2️⃣ Update parser settings, pm groups, etc.
      const [parserSettingsData, pmGroupsData, topsData, popularPms] =
        await Promise.all(
          [ParserSettingQuery, PmGroupsQuery, TopsQuery, PopularPmsQuery].map(
            async (query) => callStrapi(query)
          ) as any[]
        );

      if (!parserSettingsData || !pmGroupsData || !topsData) {
        mylog("⚠️ Strapi data missing during reload!", "error");
        return;
      }

      setData(
        "top_codes",
        topsData.topParameters.map((p: any) => p.code)
      );
      setObject("parser_setting", parserSettingsData.parserSetting);

      const pointers = popularPms.pms as IPmPointer[];
      const pms = pointers.map((pointer) => pmPointerToPm(pointer));
      const popularDirs = pmsToDirs(pms);
      setData("popular_dirs", popularDirs);

      const sections = pmGroupsData?.selector?.sections as ISection[];
      setData(
        "all_pm_codes_that_exist",
        _getAllPmCodesThatExistFromSections(sections)
      );
      setData("alternative_pm_codes", _getAlternativePmCodes(sections));
    }
  );
}

// --- helper: mass status sync based on skip ---

// --- unchanged helper functions below ---

export const _getCodes = (pm_group: IPmGroup): string[] => {
  return (
    pm_group?.options.map((option) =>
      (
        option?.code ||
        (pm_group.prefix &&
          pm_group.prefix !== option?.currency.code &&
          pm_group.prefix + option?.currency.code) ||
        option?.currency.code ||
        ""
      ).toUpperCase()
    ) || []
  );
};

const _getAllPmCodesThatExistFromSections = (
  sections: ISection[]
): string[] => {
  const pmGroups = sections.reduce(
    (res: IPmGroup[], section) => [...res, ...section.pm_groups],
    []
  );
  return pmGroups.reduce(
    (allPmCodes: string[], pmGroup) => [...allPmCodes, ..._getCodes(pmGroup)],
    []
  );
};

const _getAlternativeCodes = (pm_group: IPmGroup): string[][] => {
  return pm_group.options.reduce(
    (codes: string[][], option) => [
      ...codes,
      ...(option.code && option.alternative_codes
        ? [[option.code.toUpperCase(), option.alternative_codes.toUpperCase()]]
        : []),
    ],
    []
  );
};

const _getAlternativePmCodes = (sections: ISection[]): string[][] => {
  const pmGroups = sections.reduce(
    (res: IPmGroup[], section) => [...res, ...section.pm_groups],
    []
  );
  return pmGroups.reduce(
    (allPmCodes: string[][], pmGroup) => [
      ...allPmCodes,
      ..._getAlternativeCodes(pmGroup),
    ],
    []
  );
};

export default reload;
