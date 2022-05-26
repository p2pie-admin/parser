
import db from "../../db";
import { DirRates, Rate } from "../../types/rates.json";


const findUniqueDirRates = (dirRates: DirRates): {[key: string]: DirRates | null} => {
  const filterOptions = db.getObject(
    ".parser_setting.filter_options"
  ) as string;

  // const dirRatesWithoutFees = Object.fromEntries(Object.entries(dirRates).filter(
  //   ([_, rate]) => !rate.from_fee && !rate.to_fee && !rate.min_fee
  // ));

  const uniqueDirRates = filterOptions.split("\n").reduce(
    (res: { [key: string]: DirRates | null }, option) => {
      switch (option) {
        case "optimal":
          const optimalProperty = (rate: Rate) => rate.course ** 20 * rate.min.give;
          res[option] = findUnique(dirRates, optimalProperty);
          break;
        case "best_course":
          const courseProperty = (rate: Rate) => rate.course;
          res[option] = findUnique(dirRates, courseProperty);
          break;
        case "lowest_min":
          const minProperty = (rate: Rate) => rate.min.give;
          res[option] = findUnique(dirRates, minProperty);
          break;
        case "top_max":
          const maxProperty = (rate: Rate) => rate.max.give;
          res[option] = findUnique(dirRates, maxProperty, false);
          break;
        default:
          return res;
      }
      return res;
    },
    {}
  );

  return uniqueDirRates;
};

const findUnique = (dirRates: DirRates, getProperty: Function, needLowest = true): DirRates => {
  //[...Object.entries(dirRates)].sort((r1, r2) => r1[1].course - r2[1].course);
  const sorted = [...Object.entries(dirRates)].sort((r1, r2) => getProperty(r1[1]) - getProperty(r2[1]));
  const [exchangerId, rate] = needLowest ? sorted[0] : sorted.reverse()[0];
  return {[exchangerId]: rate}
};

export default findUniqueDirRates;
