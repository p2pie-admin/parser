"use strict";
// import { handmadeBestRates, handmadeWrongRates } from "./handmadeExamples";
// import { DirRates, Rate } from "src/types/rates";
// const isBestRate = (rates: Rate[], testedRate: Rate): boolean => {
//   if (!rates.length) {
//     console.log("no rates received!");
//     return false;
//   }
//   // курс один из лучших, если выходит за пределы всех
//   const testedRateCourseBest = rates.find(
//     //чем меньше курс, тем он выгоднее
//     (rate) => rate.course <= testedRate.course
//   );
//   // если нет такого курса, который бы был меньше по минималке
//   if (testedRateCourseBest || testedRateMinBest || testedRateMaxBest)
//     return true;
//   return false;
// };
// const testBestRates = (bestRates: DirRates) => {
//   const trulyBest = Object.entries(bestRates).reduce(
//     (checked: Rate[], [exchId, rate]) => {
//       if (isBestRate(Object.values(bestRates), rate)) return [...checked, rate];
//       console.log(`_______________`);
//       console.log(`\u001b[1;31m ˟ ${exchId}, is not valid!`);
//       console.log(`${rate.name}`);
//       console.log(`min: ${rate.min.give}`);
//       console.log(`max: ${rate.max.give}`);
//       console.log(`course: ${rate.course}`);
//       return checked;
//     },
//     []
//   );
//   console.log(
//     trulyBest.length,
//     " / ",
//     Object.keys(bestRates).length,
//     " passed!"
//   );
// };
// // testBestRates(bestExample);
// // testBestRates(notBestExample);
// console.log("handmadeBestRates");
// testBestRates(handmadeBestRates);
// console.log("handmadeWrongRates");
// testBestRates(handmadeWrongRates);
