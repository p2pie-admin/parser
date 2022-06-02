
import db from "../../db";
import { DirRates, Rate } from "../../types/rates";


const findUniqueDirRates = (dirRates: DirRates): {[key: string]: DirRates} => {
  try{
  const filterOptions = db.getObject(
    ".parser_setting.filter_options"
  ) as string;

  // const dirRatesWithoutFees = Object.fromEntries(Object.entries(dirRates).filter(
  //   ([_, rate]) => !rate.from_fee && !rate.to_fee && !rate.min_fee
  // ));

  const uniqueDirRates = filterOptions.split("\n").reduce(
    (res: { [key: string]: DirRates }, option) => {
      switch (option) {
        case "optimal":
          const optimalSelector = (rate: Rate) => rate.course ** 20 * rate.min.give;
          res[option] = findUniqueDirRate(dirRates, optimalSelector);
          break;
        case "best_course":
          const courseSelector = (rate: Rate) => rate.course;
          res[option] = findUniqueDirRate(dirRates, courseSelector);
          break;
        case "lowest_min":
          const minSelector = (rate: Rate) => rate.min.give;
          res[option] = findUniqueDirRate(dirRates, minSelector);
          break;
        case "top_max":
          const maxSelector = (rate: Rate) => rate.max.give;
          res[option] = findUniqueDirRate(dirRates, maxSelector, false);
          break;
        default:
          return res;
      }
      return res;
    },
    {}
  );

  return uniqueDirRates;
  } catch(err){
    console.log(err)
    return {}
  }
};

const findUniqueDirRate = (dirRates: DirRates, selector: Function, needLowest = true): DirRates => {
  //[...Object.entries(dirRates)].sort((r1, r2) => r1[1].course - r2[1].course);
  const sorted = [...Object.entries(dirRates)].sort((r1, r2) => selector(r1[1]) - selector(r2[1]));
  const [exchangerId, rate] = needLowest ? sorted[0] : sorted.reverse()[0];
  return {[exchangerId]: rate}
};

export default findUniqueDirRates;
