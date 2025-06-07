import { IParserSetting } from "../../types";
import { IAllDirtyRates, IRate, IRatesID } from "../../types/rates";
import { DirRatesVerificator } from "./DirRatesVerificator";
import findBestDirRates from "./findBest";
import findUniqueDirRates from "./findUnique";

export const getAllRatesID = async (
  allDirtyRates: IAllDirtyRates,
  parserSetting: IParserSetting
): Promise<{ [key: string]: IRatesID }> => {
  return Object.keys(allDirtyRates).reduce(
    async (allRatesIDPromise: Promise<{ [key: string]: IRatesID }>, dir) => {
      const allRatesID = await allRatesIDPromise;
      allRatesID[dir] = await getDirRatesID(allDirtyRates[dir], parserSetting, dir);
      return allRatesID;
    },
    Promise.resolve({} as { [key: string]: IRatesID })
  );
};

export const getDirRatesID  = async (
  rates: { [key: string]: IRate },
  parserSetting: IParserSetting,
  dir: string
): Promise<IRatesID> => {
  // several steps to transform, sort and filter rates

  const { SD_applied_from, SD_best, SD_worst } = parserSetting;

  const ratesVerificator = new DirRatesVerificator(
    dir,
    SD_applied_from,
    SD_best,
    SD_worst
  );

  const verifiedRates = ratesVerificator.getVerified(rates);

  const uniqueRates = await findUniqueDirRates(verifiedRates); // added parameters

  const bestRates = findBestDirRates(verifiedRates);

  const sortedRates = Object.entries(verifiedRates).sort(
    ([, a], [, b]) => a.course - b.course
  );

  const topRates: { [key: string]: IRate } = {};
  for (const [key, value] of sortedRates.slice(0, 5)) {
    topRates[key] = value;
  }

  const partRates = {
    ...topRates, // верхушка 5шт
    ...bestRates, // покрывающие все возможные суммы
    ...uniqueRates, // уникальные по определенным качествам перепишут те, что без параметров
  };

  // const additionalRates = Object.values(fancyRates)
  //   .sort((a, b) => a.course - b.course)
  //   .slice(0, 10);
  const sortedPartRates = Object.values(partRates).sort(
    (a, b) => a.course - b.course
  );

  return {
    part: sortedPartRates.map((rate) => rate.exchangerId!),
    all: sortedRates.map((rate) => rate[1].exchangerId!),
  };
};
