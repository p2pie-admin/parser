import db from "../../db";
import { DirRates, Rate } from "../../types/rates";

const addTopParameter = (
  prevUniqueDirRates: DirRates,
  topParameter: string,
  [exchId, rate]: [exchId: string, rate: Rate]
) => {
  return {
    ...prevUniqueDirRates,
    [exchId]: {
      ...rate,
      parameterCodes: [
        ...(prevUniqueDirRates[exchId]?.parameterCodes || []),
        topParameter,
      ],
    },
  };
};

const findUniqueDirRates = async (dirRates: DirRates): Promise<DirRates> => {
  if (!Object.keys(dirRates).length) return {};
  try {
    const filterOptions = (await db.getObject(".topCodes")) as string[];

    // const dirRatesWithoutFees = Object.fromEntries(Object.entries(dirRates).filter(
    //   ([_, rate]) => !rate.from_fee && !rate.to_fee && !rate.min_fee
    // ));

    const uniqueDirRates = filterOptions.reduce((res: DirRates, code) => {
      switch (code) {
        case "optimal":
          const optimalSelector = (rate: Rate) =>
            rate.course ** 20 * rate.min.give;
          res = addTopParameter(
            res,
            "optimal",
            findUniqueDirRate(dirRates, optimalSelector)
          );
          break;
        case "best_course":
          const courseSelector = (rate: Rate) => rate.course;
          res = addTopParameter(
            res,
            "best_course",
            findUniqueDirRate(dirRates, courseSelector)
          );
          break;
        case "low_min":
          const minSelector = (rate: Rate) => rate.min.give;
          res = addTopParameter(
            res,
            "low_min",
            findUniqueDirRate(dirRates, minSelector)
          );
          break;
        case "top_max":
          const maxSelector = (rate: Rate) => rate.max.give;
          res = addTopParameter(
            res,
            "top_max",
            findUniqueDirRate(dirRates, maxSelector, false)
          );
          break;
        case "top_rating":
          const topRatingSelector = (rate: Rate) => rate.admin_rating;
          res = addTopParameter(
            res,
            "top_rating",
            findUniqueDirRate(dirRates, topRatingSelector)
          );
          break;
        default:
          return res;
      }
      return res;
    }, {});

    return uniqueDirRates;
  } catch (err) {
    console.log(err);
    return {};
  }
};

const findUniqueDirRate = (
  dirRates: DirRates,
  selector: Function,
  needLowest = true
): [string, Rate] => {
  //[...Object.entries(dirRates)].sort((r1, r2) => r1[1].course - r2[1].course);
  const sorted = [...Object.entries(dirRates)].sort(
    (r1, r2) => selector(r1[1]) - selector(r2[1])
  );
  const [exchangerId, rate] = needLowest ? sorted[0] : sorted.reverse()[0];
  return [exchangerId, rate];
};

export default findUniqueDirRates;
