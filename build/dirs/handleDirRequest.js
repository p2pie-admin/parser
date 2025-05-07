"use strict";
// import db from "../db";
// import getAllRates from "../rates/_getAllRates";
// import { removeSame } from "./helper";
// import { DB, ConvertedDirRates } from "../types";
// async function handleDirRequest(
//   dirId: string
// ): Promise<ConvertedDirRates | null> {
// const { dirs, snapshot, counter, parser_setting } = await db.getObject<DB>(".");
//const dirExists = dirs && Object.keys(dirs).find((d) => d === dir);
// await db.push(`.dirs.${dirId}`, 1 + (dirs[dirId] ?? 0)); // increase dir or initialize dir
// if (
//   counter >
//   Object.keys(dirs).length * (parser_setting.dirs_cleaning_coefficient || 10)
// ) {
//   // если настала пора чистить dirs
//   await db.push(".counter", 0); // обнуляем счетчик запросов
//   const newSnapshot = removeSame(snapshot, dirs);
//   // если есть snapshot, то убираем из dirs все пассивные dirs
//   await db.push(".dirs", { ...newSnapshot });
//   await db.push(".snapshot", { ...newSnapshot });
//   await db.save();
// } else {
//   await db.push(".counter", counter + 1);
//   await db.save();
// }
// console.log(`${dirId} requested`);
// const alreadyExistingRate = await db.getData(".allConvertedRates")[dirId];
// if (alreadyExistingRate) return alreadyExistingRate;
// const allConvertedRates = await getAllRates();
// return allConvertedRates && allConvertedRates[dirId];
// }
// export default handleDirRequest;
