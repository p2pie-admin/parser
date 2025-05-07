"use strict";
// import { DirRates } from "src/types/rates";
// // направильно работает
// export const testBest = (dirRates: DirRates, dir: string) => {
//   const sorted = Object.values(dirRates).sort((a, b) => a.course - b.course);
//   let failed = 0;
//   let ids = [] as string[];
//   for (let i in sorted) {
//     const current = sorted[+i];
//     const worse = sorted[+i + 1];
//     if (current && worse) {
//       const conditionToPass =
//         current.min.give >= worse.min.give ||
//         current.max.give <= worse.max.give;
//       if (conditionToPass) continue;
//       failed += 1;
//       const id = Object.entries(dirRates).find(
//         ([_, rate]) => rate.name === current.name
//       )?.[0];
//       ids = id ? [...ids, `${id}: ${current.name}`] : ids;
//     }
//   }
//   if (!failed) console.log("All tests passed: ", dir);
//   if (failed) {
//     console.log(
//       "Best rates have a few extra rates.. The total amount: ",
//       Object.keys(dirRates).length,
//       "failed to pass test: ",
//       failed,
//       " dir: ",
//       dir,
//       " ids: ",
//       ids
//     );
//   }
// };
