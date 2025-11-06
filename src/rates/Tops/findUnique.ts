import { mylog } from "../../utils/logger";
import { getData } from "../../utils/redis";
import { IRate } from "../../types/rates";

type RatesMap = { [key: string]: IRate };

const addTopParameter = (
  prevUniqueRates: RatesMap,
  topParameter: string,
  [exchId, rate]: [string, IRate]
): RatesMap => {
  const parameterCodes = [
    ...new Set([
      ...(prevUniqueRates[exchId]?.parameterCodes || []),
      topParameter,
    ]),
  ];
  return {
    ...prevUniqueRates,
    [exchId]: {
      ...rate,
      parameterCodes,
    },
  };
};

const findUniqueRates = async (dirRates: RatesMap): Promise<RatesMap> => {
  if (!Object.keys(dirRates).length) return {};

  try {
    const topCodes = (await getData("top_codes")) as string[];
    return topCodes.reduce<RatesMap>((acc, code) => {
      let selector: ((rate: IRate) => number) | null = null;
      let needLowest = true;
      let eligibleEntries: [string, IRate][] = Object.entries(dirRates);

      switch (code) {
        case "optimal":
          selector = (rate: IRate) => rate.course ** 20 * rate.min.give;
          break;
        case "low_min":
          selector = (rate: IRate) => rate.min.give;
          break;
        case "top_reserve":
          selector = (rate: IRate) => rate.reserve.give;
          needLowest = false;
          break;
        case "top_rating":
          eligibleEntries = eligibleEntries.filter(
            ([, rate]) => rate.admin_rating !== null && rate.admin_rating !== undefined
          );
          selector = (rate: IRate) => rate.admin_rating as number;
          needLowest = false;
          break;
        default:
          return acc; // skip unknown code
      }

      if (!selector || !eligibleEntries.length) return acc;

      const unique = findUniqueRate(eligibleEntries, selector, needLowest);
      return addTopParameter(acc, code, unique);
    }, {});
  } catch (err) {
    mylog(`Error in uniqueRates: ${err}`);
    return {};
  }
};

const findUniqueRate = (
  entries: [string, IRate][],
  selector: (rate: IRate) => number,
  needLowest = true
): [string, IRate] => {
  const sorted = [...entries].sort((a, b) => selector(a[1]) - selector(b[1]));
  if (!sorted.length) {
    throw new Error("Cannot determine unique rate from empty entries");
  }
  const [exchangerId, rate] = needLowest ? sorted[0] : sorted.at(-1)!;
  return [exchangerId, rate];
};

export default findUniqueRates;
