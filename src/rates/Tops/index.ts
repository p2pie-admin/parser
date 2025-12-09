import { IParserSetting } from "../../types";
import {
  IAllDirtyRates,
  IRate,
  IRatesID,
  RateIdWithParameters,
} from "../../types/rates";
import { DirRatesVerificator } from "./DirRatesVerificator";
import findUniqueDirRates from "./findUnique";
import findSpecialRates from "./findSpecial";

const dedupeParameters = (codes?: string[]): string[] => [
  ...new Set((codes || []).filter(Boolean)),
];

const mergeRatesWithParameters = (
  target: { [key: string]: IRate },
  source: { [key: string]: IRate }
) => {
  Object.entries(source).forEach(([id, rate]) => {
    const existing = target[id];
    const combinedParameters = dedupeParameters([
      ...(existing?.parameterCodes || []),
      ...(rate.parameterCodes || []),
    ]);

    target[id] = {
      ...rate,
      parameterCodes: combinedParameters,
    };
  });
  return target;
};

const toRateIdWithParameters = ([id, rate]: [
  string,
  IRate
]): RateIdWithParameters => {
  return {
    [id]: dedupeParameters(rate.parameterCodes),
  };
};

export const getAllRatesID = async (
  allDirtyRates: IAllDirtyRates,
  parserSetting: IParserSetting
): Promise<{ [key: string]: IRatesID }> => {
  return Object.keys(allDirtyRates).reduce(
    async (allRatesIDPromise: Promise<{ [key: string]: IRatesID }>, dir) => {
      const allRatesID = await allRatesIDPromise;
      allRatesID[dir] = await getDirRatesID(
        allDirtyRates[dir],
        parserSetting,
        dir
      );
      return allRatesID;
    },
    Promise.resolve({} as { [key: string]: IRatesID })
  );
};

export const getDirRatesID = async (
  rates: { [key: string]: IRate },
  parserSetting: IParserSetting,
  dir: string
): Promise<IRatesID> => {
  const { SD_applied_from, SD_best, SD_worst } = parserSetting;

  const ratesVerificator = new DirRatesVerificator(
    dir,
    SD_applied_from,
    SD_best,
    SD_worst
  );

  const verifiedRates = ratesVerificator.getVerified(rates);

  const enrichedRates: { [key: string]: IRate } = Object.entries(
    verifiedRates
  ).reduce((acc, [id, rate]) => {
    acc[id] = {
      ...rate,
      parameterCodes: dedupeParameters(rate.parameterCodes),
    };
    return acc;
  }, {} as { [key: string]: IRate });

  const uniqueRates = await findUniqueDirRates(verifiedRates);
  const specialRates = findSpecialRates(verifiedRates);

  mergeRatesWithParameters(enrichedRates, uniqueRates);
  mergeRatesWithParameters(enrichedRates, specialRates);

  const sortedEntries = Object.entries(enrichedRates);

  return sortedEntries.map(toRateIdWithParameters);
};
