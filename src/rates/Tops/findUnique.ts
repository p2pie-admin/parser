import { mylog } from "../../helper";
import { getData } from "../../redis";
import { IRate } from "../../types/rates";

const addTopParameter = (
  prevUniqueRates: { [key: string]: IRate },
  topParameter: string,
  [exchId, rate]: [exchId: string, rate: IRate]
) => {
  return {
    ...prevUniqueRates,
    [exchId]: {
      ...rate,
      parameterCodes: [
        ...(prevUniqueRates[exchId]?.parameterCodes || []),
        topParameter,
      ],
    },
  };
};

const findUniqueRates = async (dirIRates: {
  [key: string]: IRate;
}): Promise<{ [key: string]: IRate }> => {
  if (!Object.keys(dirIRates).length) return {};
  try {
    const topCodes = (await getData("top_codes")) as string[];

    const uniqueRates = topCodes.reduce(
      (res: { [key: string]: IRate }, code) => {
        switch (code) {
          case "optimal":
            const optimalSelector = (rate: IRate) =>
              rate.course ** 20 * rate.min.give;
            res = addTopParameter(
              res,
              "optimal",
              findUniqueRate(dirIRates, optimalSelector)
            );
            break;
          case "best_course":
            const courseSelector = (rate: IRate) => rate.course;
            res = addTopParameter(
              res,
              "best_course",
              findUniqueRate(dirIRates, courseSelector)
            );
            break;
          case "low_min":
            const minSelector = (rate: IRate) => rate.min.give;
            res = addTopParameter(
              res,
              "low_min",
              findUniqueRate(dirIRates, minSelector)
            );
            break;
          case "top_max":
            const maxSelector = (rate: IRate) => rate.max.give;
            res = addTopParameter(
              res,
              "top_max",
              findUniqueRate(dirIRates, maxSelector, false)
            );
            break;
          case "top_rating":
            const topRatingSelector = (rate: IRate) => rate.admin_rating;
            res = addTopParameter(
              res,
              "top_rating",
              findUniqueRate(dirIRates, topRatingSelector)
            );
            break;
          default:
            return res;
        }
        return res;
      },
      {}
    );

    return uniqueRates;
  } catch (err) {
    mylog(`Error in uniqueRates: ${err}`);
    return {};
  }
};

const findUniqueRate = (
  dirRates: { [key: string]: IRate },
  selector: Function,
  needLowest = true
): [string, IRate] => {
  //[...Object.entries(dirIRates)].sort((r1, r2) => r1[1].course - r2[1].course);
  const sorted = [...Object.entries(dirRates)].sort(
    (r1, r2) => selector(r1[1]) - selector(r2[1])
  );
  const [exchangerId, rate] = needLowest ? sorted[0] : sorted.reverse()[0];
  return [exchangerId, rate];
};

export default findUniqueRates;
