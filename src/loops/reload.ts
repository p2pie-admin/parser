import { cpus } from "os";
import callStrapi from "../gql/callStrapi";
import {
  ParserSettingQuery,
  PmGroupsQuery,
  TopsQuery,
  PopularPmsQuery,
  ExchangersQuery,
} from "../gql/queries";
import { logMemoryUsage, mylog } from "../helper";
import { pmPointerToPm, pmsToDirs } from "../rates/Statistics/helper";
import { setData } from "../redis";
import { IPmPointer } from "../types/pms";
import { ISection, IPmGroup } from "../types/selector";
import { reloadExchangers } from "./helper";

async function reload() {
  logMemoryUsage();
  // грузим все первичные данные
  // await statusChange("disabled", "active");
  mylog("Reloading data...", "info");
  await reloadExchangers();

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
    "top_codes",
    topsData.topParameters.map((p: any) => p.code)
  );
  setData("parser_setting", parserSettingsData.parserSetting);

  const pointers = popularPms.pms as IPmPointer[];
  const pms = pointers.map((pointer) => pmPointerToPm(pointer));
  const popularDirs = pmsToDirs(pms);
  setData("popular_dirs", popularDirs);
  // это все те направления у которых pmGroup популярная
  // нужны чтобы на главной засветиться/ Могут быть как крипта или как фиат

  const sections = pmGroupsData?.selector?.sections as ISection[];
  setData(
    "all_pm_codes_that_exist",
    _getAllPmCodesThatExistFromSections(sections)
  );
  setData("alternative_pm_codes", _getAlternativePmCodes(sections));
  //await createArticles(sections);

  mylog("Reload finished!", "info");
  return;
}

export const _getCodes = (pm_group: IPmGroup): string[] => {
  // ПОНАДОБИТСЯ НА ФРОНТЕ ТОЖЕ
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
