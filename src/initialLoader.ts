import { ExchangerWithId, Exchanger } from "./types/exchanger";
import {
  ParserSettingQuery,
  ExchangersQuery,
  PmGroupsQuery,
  TopsQuery,
} from "./gql/queries";
import db from "./db";
import normalizer from "./gql/normalizer";
import { Section, PmGroup } from "./types/section.json";
import callStrapi from "./gql/callStrapi";

const getCodes = (pm_group: PmGroup): string[] => {
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

const getPossiblePmCodesFromSections = (sections: Section[]): string[] => {
  const pmGroups = sections.reduce(
    (res: PmGroup[], section) => [...res, ...section.pm_groups],
    []
  );
  return pmGroups.reduce(
    (allPmCodes: string[], pmGroup) => [...allPmCodes, ...getCodes(pmGroup)],
    []
  );
};

async function initialLoader() {
  const [
    parserSettingsData,
    exchangersData,
    pmGroupsData,
    topsData,
  ] = await Promise.all(
    [ParserSettingQuery, ExchangersQuery, PmGroupsQuery, TopsQuery].map(
      async (query) => {
        return await callStrapi(query);
      }
    ) as any[]
  );

  if (!parserSettingsData || !exchangersData || !pmGroupsData || !topsData) {
    console.log(`📕 \u001b[1;31m Strapi initial data error!`);

    return;
  }
  console.log("📗 \u001b[1;32m The initial data was received...");

  db.push(".tops", topsData.tops);
  db.push(".parser_setting", parserSettingsData.parserSetting);

  const exchangersWithId = exchangersData.exchangers;

  const exchangersWithLoop = exchangersWithId.reduce(
    (res: { [key: string]: Exchanger }, ex: ExchangerWithId) => {
      const { id, ...rest } = ex;
      return { ...res, [id]: { ...rest } };
    },
    {}
  );
  db.push(".exchangers", exchangersWithLoop);

  const sections = pmGroupsData?.selector?.sections as Section[];
  db.push(".possible_pm_codes", getPossiblePmCodesFromSections(sections));

  db.save();
}

export default initialLoader;
