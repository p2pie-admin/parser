import { IRate } from "../../types/rates";

type RatesMap = { [key: string]: IRate };

type SpecialRule = {
  code: string;
  predicate: (rate: IRate) => boolean;
};

const specialRules: SpecialRule[] = [
  {
    code: "from_fee",
    predicate: (rate: IRate) => Boolean(rate.from_fee),
  },
];

const dedupeParameters = (codes: string[] = []): string[] => [
  ...new Set(codes.filter(Boolean)),
];

const collectParameters = (rate: IRate, additional: string[]): string[] =>
  dedupeParameters([...(rate.parameterCodes || []), ...additional]);

const findSpecialRates = (dirRates: RatesMap): RatesMap => {
  return Object.entries(dirRates).reduce<RatesMap>(
    (acc, [exchangerId, rate]) => {
      const matchedCodes = specialRules
        .filter(({ predicate }) => predicate(rate))
        .map(({ code }) => code);

      if (!matchedCodes.length) return acc;

      acc[exchangerId] = {
        ...rate,
        parameterCodes: collectParameters(rate, matchedCodes),
      };

      return acc;
    },
    {}
  );
};

export default findSpecialRates;
