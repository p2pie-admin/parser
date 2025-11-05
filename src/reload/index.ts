import callStrapi from "../gql/callStrapi";
import {
  ParserSettingQuery,
  PmGroupsQuery,
  PopularPmsQuery,
  TopParametersQuery,
} from "../gql/queries";
import { setData, setObject } from "../utils/redis";
import { ISection, IPmGroup } from "../types/selector";
import { mylog } from "../utils/logger";
import { logMemoryUsage } from "./memoryUsage";
import { pmsToPopularDirs, reloadExchangers } from "./helper";
import { bigTTL, isPrimary } from "../utils/settings";
import { IPmPointer } from "../types/pms";
import { pmPointerToPm } from "../rates/Statistics/helper";

async function reload() {
  if (!isPrimary) return;
  await logMemoryUsage();

  //// 1️⃣ Reload exchangers list from Strapi
  await reloadExchangers(); // скипы не трогает, они хранятся сами по себе

  //// 2️⃣ Update parser settings, pm groups, etc.
  const [parserSettingsData, pmGroupsData, topsData, popularPms] =
    await Promise.all(
      [
        ParserSettingQuery,
        PmGroupsQuery,
        TopParametersQuery,
        PopularPmsQuery,
      ].map(async (query) => callStrapi(query)) as any[]
    );

  if (!parserSettingsData || !pmGroupsData || !topsData) {
    mylog("⚠️ Strapi data missing during reload!", "error");
    return;
  }

  await setData(
    "top_codes",
    topsData.topParameters.map((p: any) => p.code)
  );
  await setObject("parser_setting", parserSettingsData.parserSetting, bigTTL);

  const sections = pmGroupsData?.selector?.sections as ISection[];
  const pointers = popularPms.pms as IPmPointer[];
  const pms = pointers.map((pointer) => pmPointerToPm(pointer));

  await setData(
    "all_pm_codes_that_exist",
    _getAllPmCodesThatExistFromSections(sections),
    bigTTL
  );
  await setData(
    "alternative_pm_codes",
    _getAlternativePmCodes(sections),
    bigTTL
  );
  setData("parser_setting", parserSettingsData.parserSetting);

  await setData("popular_dirs", pmsToPopularDirs(pms), bigTTL);
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
