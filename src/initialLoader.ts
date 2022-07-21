import { ExchangerWithId, Exchanger } from "./types/exchanger";
import { GraphQLClient } from "graphql-request";
import {
  ParserSettingQuery,
  ExchangersQuery,
  PmGroupsQuery,
  TopsQuery,
} from "./queries";
import config from "./config.json";
import db from "./db";
import normalizer from "./normalizer";
import { Section, PmGroup } from "./types/section.json";

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
  const graphQLClient = new GraphQLClient(
    process.env.PORT ? config.STRAPI : config.LOCAL_STRAPI
  );

  const [
    parserSettingsData,
    exchangersData,
    pmGroupsData,
    topsData,
  ] = await Promise.all(
    [ParserSettingQuery, ExchangersQuery, PmGroupsQuery, TopsQuery].map(
      async (query) => {
        try {
          return await graphQLClient
            .request(query)
            .catch((e) => console.error("start strapi first! ", e));
        } catch (err) {
          console.error(err);
          return null;
        }
      }
    ) as any[]
  );

  db.push(".tops", normalizer(topsData.tops));
  db.push(".parser_setting", normalizer(parserSettingsData.parserSetting));

  const exchangersWithId = normalizer(
    exchangersData.exchangers
  ) as ExchangerWithId[];

  const exchangersWithLoop = exchangersWithId.reduce(
    (res: { [key: string]: Exchanger }, ex: ExchangerWithId) => {
      const { id, ...rest } = ex;
      return { ...res, [id]: { ...rest } };
    },
    {}
  );
  db.push(".exchangers", exchangersWithLoop);

  const sections = normalizer(pmGroupsData).selector.sections as Section[];
  db.push(".possible_pm_codes", getPossiblePmCodesFromSections(sections));

  db.save();
  console.log("-= Parser settings and exchangers were updated! =-");
}

export default initialLoader;
