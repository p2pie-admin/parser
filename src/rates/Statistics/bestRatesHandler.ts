import db from "../../db";
import { IBuySell } from "src/types/pms";
import { ICurrency, IPm } from "src/types/selector";
import { getPmByCode } from "./helper";

const getBuySellsRates = () => {
  const buySells = db.getData(".buySells") as IBuySell[];
  const formattedBuySells = buySells //  превращаем указатели на pmGroup в реальные pm
    .reduce(
      (formattedBuySells: { pm: IPm; currencies: ICurrency[] }[], buySell) => {
        const pointer = buySell.pm;
        const pm = getPmByCode(pointer);
        return pm
          ? [...formattedBuySells, { pm, currencies: buySell.currencies }]
          : formattedBuySells;
      },
      []
    );

  //   const dirs = pms.reduce(
  //     (res: string[], leftCode) => [
  //       ...res,
  //       ...cryptoCodes
  //         .map((rightCode) => `${leftCode}_${rightCode}`)
  //         .filter((dir) => dir.split("_")[0] !== dir.split("_")[1]),
  //     ],
  //     []
  //   );
  return formattedBuySells;
};
export default getBuySellsRates;
//const allDirsTops = dbRates.getData(".allDirsTops") as AllDirsTops;
// const popularDirTops =  Object.keys(allDirsTops)
// .filter(key => popularPms.includes(key))
// .reduce((obj, key) => {
//   obj[key] = raw[key];
//   return obj;
// }, {});
// const best = Object.entries(allDirsTops).reduce(
//   (
//     res: AllDirsTops,
//     [dirCode, dirTops]: [dirCode: string, dirTops: FullRate[]]
//   ) => {
//     const bestCourse = Math.max(...dirTops.map((t) => t.course));
//     const bestTop = dirTops.find((top) => top.course == bestCourse);
//     return {
//       ...res,
//       [dirCode]: bestTop,
//     }; //{ ...res, dirCode: dirTop.find((top) => top.course == bestCourse) };
//   },
//   {}
// );
