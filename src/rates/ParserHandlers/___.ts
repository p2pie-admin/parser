//  находит только лучшие из лучших курсов у популярных направлений

// const allDirsTops = dbRates.getData(".allDirsTops") as AllDirsTops;
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
