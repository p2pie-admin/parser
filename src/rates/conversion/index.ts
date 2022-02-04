import transformRateStringsToRates from "./rateTransformer";
import { AllConvertedRates, ConvertedDirRates } from "../../types";
import verifyRates from "./verification";
import findUniqueRates from "./findUniqueRates";
import findBestRates from "./findBestRates";

const _convertDirRates = (
  dirRateStrings: string[],
  dir: string
): ConvertedDirRates => {
  // several steps to transform, sort and filter rates
  const transformedRates = transformRateStringsToRates(dirRateStrings, dir);
  const verifiedRates = verifyRates(transformedRates, dir);
  const uniqueRates = findUniqueRates(verifiedRates);
  const bestRates = findBestRates(verifiedRates);
  const convertedDirRates: ConvertedDirRates = {
    rates: verifiedRates,
    uniqueRates,
    bestRates,
  };
  return convertedDirRates;
};

const convertAllRates = (allRateStrings: {
  [key: string]: string[];
}): AllConvertedRates => {
  return Object.keys(allRateStrings).reduce(
    (convertedRates: AllConvertedRates, dir) => {
      convertedRates[dir] = _convertDirRates(allRateStrings[dir], dir);
      return convertedRates;
    },
    {}
  );
};

export default convertAllRates;

// тестирование правильности отработки bestRatesWithAmount

// const amounts = [0.0001, 0.00005, 0.002, 0.02, 0.5, 1, 2, 2.3, 5, 100, 200];
// const test = (rates: Rate[], amounts: number[]) => {
//   const bestCoursesAsc = [...rates].sort((r1, r2) => r1.course - r2.course);
//   return amounts.map((amount) => {
//     const bestRate = bestCoursesAsc.find(
//       (rate) =>
//         rate.min_amount.give <= amount && rate.max_amount.give >= amount
//     );
//     console.log(`test for ${amount} is ${bestRate?.id}`);
//     return bestRate;
//   });
// };
// test(verifiedRates, amounts);
