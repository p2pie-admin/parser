import { ExchangerWithId, Exchanger } from "./types/exchanger";
import {
  ParserSettingQuery,
  ExchangersQuery,
  PmGroupsQuery,
  TopsQuery,
  PopularPmsQuery,
} from "./gql/queries";
import db from "./db";

import callStrapi from "./gql/callStrapi";
import { pmPointerToPm, pmsToDirs } from "./rates/Statistics/helper";
import { IPmPointer } from "./types/pms";
import dirsExistHandler from "./rates/ParserHandlers/DirsExistHandler";
import { IOption, IPmGroup, ISection } from "./types/selector";

const getCodes = (pm_group: IPmGroup): string[] => {
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

const getAlternativeCodes = (pm_group: IPmGroup): string[][] => {
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

const getAllPmCodesThatExistFromSections = (sections: ISection[]): string[] => {
  const pmGroups = sections.reduce(
    (res: IPmGroup[], section) => [...res, ...section.pm_groups],
    []
  );
  return pmGroups.reduce(
    (allPmCodes: string[], pmGroup) => [...allPmCodes, ...getCodes(pmGroup)],
    []
  );
};

const getAlternativePmCodes = (sections: ISection[]): string[][] => {
  const pmGroups = sections.reduce(
    (res: IPmGroup[], section) => [...res, ...section.pm_groups],
    []
  );
  return pmGroups.reduce(
    (allPmCodes: string[][], pmGroup) => [
      ...allPmCodes,
      ...getAlternativeCodes(pmGroup),
    ],
    []
  );
};

async function initialLoader() {
  const [
    parserSettingsData,
    exchangersData,
    pmGroupsData,
    topsData,
    popularPms,
  ] = await Promise.all(
    [
      ParserSettingQuery,
      ExchangersQuery,
      PmGroupsQuery,
      TopsQuery,
      PopularPmsQuery,
    ].map(async (query) => {
      return await callStrapi(query);
    }) as any[]
  );

  if (!parserSettingsData || !exchangersData || !pmGroupsData || !topsData) {
    console.log(`📕 \u001b[1;31m Strapi initial data error!`);
    return;
  }
  console.log("📗 \u001b[1;32m The initial data was received...");

  db.push(
    ".topCodes",
    topsData.topParameters.map((p: any) => p.code)
  );

  db.push(".parser_setting", parserSettingsData.parserSetting);

  const pointers = popularPms.pms as IPmPointer[];
  const pms = pointers.map((pointer) => pmPointerToPm(pointer));
  const popularDirs = pmsToDirs(pms);
  db.push(".popular_dirs", popularDirs);
  const exchangersWithId = exchangersData.exchangers;
  const exchangersWithLoop = exchangersWithId.reduce(
    (res: { [key: string]: Exchanger }, ex: ExchangerWithId) => {
      const { id, ...rest } = ex;
      return { ...res, [id]: { ...rest } };
    },
    {}
  );
  db.push(".exchangers", exchangersWithLoop);

  const sections = pmGroupsData?.selector?.sections as ISection[];
  db.push(
    ".all_pm_codes_that_exist",
    getAllPmCodesThatExistFromSections(sections)
  );
  db.push(".alternative_pm_codes", getAlternativePmCodes(sections));
  dirsExistHandler();
  db.save();
}

export default initialLoader;
