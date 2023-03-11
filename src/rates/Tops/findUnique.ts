import { Top } from "../../types";
import db from "../../db";
import { DirRates, Rate } from "../../types/rates";

const addTag = (
  prevUniqueDirRates: DirRates,
  tag: string,
  [exchId, rate]: [exchId: string, rate: Rate]
) => {
  return {
    ...prevUniqueDirRates,
    [exchId]: {
      ...rate,
      tags: [...(prevUniqueDirRates[exchId]?.tags || []), tag],
    },
  };
};

const findUniqueDirRates = (dirRates: DirRates): DirRates => {
  if (!Object.keys(dirRates).length) return {};
  try {
    const filterOptions = db.getObject(".tops") as Top[];

    // const dirRatesWithoutFees = Object.fromEntries(Object.entries(dirRates).filter(
    //   ([_, rate]) => !rate.from_fee && !rate.to_fee && !rate.min_fee
    // ));

    const uniqueDirRates = filterOptions.reduce((res: DirRates, { code }) => {
      switch (code) {
        case "optimal":
          const optimalSelector = (rate: Rate) =>
            rate.course ** 20 * rate.min.give;
          res = addTag(
            res,
            "optimal",
            findUniqueDirRate(dirRates, optimalSelector)
          );
          break;
        case "best_course":
          const courseSelector = (rate: Rate) => rate.course;
          res = addTag(
            res,
            "best_course",
            findUniqueDirRate(dirRates, courseSelector)
          );
          break;
        case "low_min":
          const minSelector = (rate: Rate) => rate.min.give;
          res = addTag(
            res,
            "low_min",
            findUniqueDirRate(dirRates, minSelector)
          );
          break;
        case "top_max":
          const maxSelector = (rate: Rate) => rate.max.give;
          res = addTag(
            res,
            "top_max",
            findUniqueDirRate(dirRates, maxSelector)
          );
          break;
        case "top_rating":
          const topRatingSelector = (rate: Rate) => rate.admin_rating;
          res = addTag(
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
