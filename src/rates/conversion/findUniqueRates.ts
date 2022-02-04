import { Rate, FilterOption } from "../../types";
import db from "../../db";

const findUniqueRates = (rates: Rate[]) => {
  const filterOptions = db.getObject(
    ".preferences.filter_options"
  ) as FilterOption[];

  const ratesWithoutFees = rates.filter(
    (r) => r.from_fee === "0" && r.to_fee === "0" && r.min_fee === "0"
  );

  const bestRates = filterOptions.reduce(
    (res: { [key: string]: Rate | null }, { name }: FilterOption) => {
      switch (name) {
        case "optimal":
          const optimalProperty = (rate: Rate) =>
            rate.course ** 20 * rate.min_amount.give;
          res[name] = findBest(ratesWithoutFees, optimalProperty);
          break;
        case "best_course":
          const courseProperty = (rate: Rate) => rate.course;
          res[name] = findBest(ratesWithoutFees, courseProperty);
          break;
        case "lowest_min":
          const minProperty = (rate: Rate) => rate.min_amount.give;
          res[name] = findBest(ratesWithoutFees, minProperty);
          break;
        case "top_max":
          const maxProperty = (rate: Rate) => rate.max_amount.give;
          res[name] = findBest(ratesWithoutFees, maxProperty, false);
          break;
        case "best_rating":
          const ratingProperty = (rate: Rate) => rate.exchanger.our_rating;
          res[name] = findBest(ratesWithoutFees, ratingProperty, false);
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

const findBest = (rates: Rate[], getProperty: Function, needLowest = true) => {
  const sorted = [...rates].sort((r1, r2) => getProperty(r1) - getProperty(r2));
  return needLowest ? sorted[0] : sorted.reverse()[0];
};

export default findUniqueRates;
