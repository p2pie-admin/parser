import db from "../db";

import callStrapi from "../gql/callStrapi";
import {
  ParserSettingQuery,
  PmGroupsQuery,
  TopsQuery,
  PopularPmsQuery,
  ExchangersQuery,
} from "../gql/queries";
import { mylog } from "../helper";
import dirsExistHandler from "../rates/ParserHandlers/DirsExistHandler";
import { pmPointerToPm, pmsToDirs } from "../rates/Statistics/helper";
import { setData } from "../redis";

import { IPmPointer } from "../types/pms";
import { ISection, IPmGroup } from "../types/selector";
import { updateExchangersList } from "./helper";

async function reload() {
  mylog("Reloading data...", "info");
  mylog("Transfering: Suspended, Disabled -> Active", "info");

  // await statusChange("suspended", "active");
  // await statusChange("disabled", "active");
  await updateExchangersList();

  const [parserSettingsData, pmGroupsData, topsData, popularPms] =
    await Promise.all(
      [ParserSettingQuery, PmGroupsQuery, TopsQuery, PopularPmsQuery].map(
        async (query) => {
          return await callStrapi(query);
        }
      ) as any[]
    );

  if (!parserSettingsData || !pmGroupsData || !topsData) {
    mylog("Strapi initial data error!", "error");
    return;
  }
  setData(
    "topCodes",
    topsData.topParameters.map((p: any) => p.code)
  );
  // await db.push(
  //   ".topCodes",
  //   topsData.topParameters.map((p: any) => p.code),
  //   true
  // );
  setData("parser_setting", parserSettingsData.parserSetting);
  // await db.push(".parser_setting", parserSettingsData.parserSetting, true);

  const pointers = popularPms.pms as IPmPointer[];
  const pms = pointers.map((pointer) => pmPointerToPm(pointer));
  const popularDirs = pmsToDirs(pms);
  setData("popular_dirs", popularDirs);
  // await db.push(".popular_dirs", popularDirs, true);

  const sections = pmGroupsData?.selector?.sections as ISection[];
  setData(
    "all_pm_codes_that_exist",
    _getAllPmCodesThatExistFromSections(sections)
  );
  setData("alternative_pm_codes", _getAlternativePmCodes(sections));
  // await db.push(
  //   ".all_pm_codes_that_exist",
  //   _getAllPmCodesThatExistFromSections(sections),
  //   true
  // );
  // await db.push(
  //   ".alternative_pm_codes",
  //   _getAlternativePmCodes(sections),
  //   true
  // );

  dirsExistHandler();
  // await db.save();
  mylog("Reload finished!", "info");
  return;
}

const _getCodes = (pm_group: IPmGroup): string[] => {
  // ПОНАДОБИТСЯ НА ФРОНТЕ ТОЖЕ
  return pm_group.options.map((option) =>
    (
      option?.code ||
      (pm_group.prefix &&
        pm_group.prefix !== option?.currency.code &&
        pm_group.prefix + option?.currency.code) ||
      option?.currency.code
    ).toUpperCase()
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

const _getAlternativePmCodes = (sections: ISection[]): string[][] => {
  // Привести к одному USDTTRC20 и USDTTRC
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
