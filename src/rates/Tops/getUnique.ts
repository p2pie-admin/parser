
import db from "../../db";
import { DirRate } from "src/types/rates.json";

const findUniqueRates = (rates: DirRate[]) => {
  const filterOptions = db.getObject(
    ".parser_setting.filter_options"
  ) as string;

  const ratesWithoutFees = rates.filter(
    (r) => !r.from_fee && !r.to_fee && !r.min_fee
  );

  const bestRates = filterOptions.split("\n").reduce(
    (res: { [key: string]: DirRate | null }, option) => {
      switch (option) {
        case "optimal":
          const optimalProperty = (rate: DirRate) =>
            rate.course ** 20 * rate.min.give;
          res[option] = findUnique(ratesWithoutFees, optimalProperty);
          break;
        case "best_course":
          const courseProperty = (rate: DirRate) => rate.course;
          res[option] = findUnique(ratesWithoutFees, courseProperty);
          break;
        case "lowest_min":
          const minProperty = (rate: DirRate) => rate.min.give;
          res[option] = findUnique(ratesWithoutFees, minProperty);
          break;
        case "top_max":
          const maxProperty = (rate: DirRate) => rate.max.give;
          res[option] = findUnique(ratesWithoutFees, maxProperty, false);
          break;
        default:
          return res;
      }
      return res;
    },
    {}
  );

  return bestRates;
};

const findUnique = (rates: DirRate[], getProperty: Function, needLowest = true) => {
  const sorted = [...rates].sort((r1, r2) => getProperty(r1) - getProperty(r2));
  return needLowest ? sorted[0] : sorted.reverse()[0];
};

export default findUniqueRates;
