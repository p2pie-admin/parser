import db from "../db";
import getAllRates from "../rates/getAllRates";
import { removeSame } from "./helper";
import { DB, AllConvertedRates, ConvertedDirRates } from "../types";

async function handleDirRequest(
  dir: string
): Promise<ConvertedDirRates | null> {
  const { dirs, snapshot, counter, preferences } = db.getObject<DB>(".");
  //const dirExists = dirs && Object.keys(dirs).find((d) => d === dir);

  db.push(`.dirs.${dir}`, 1 + (dirs[dir] ?? 0)); // increase dir or initialize dir

  if (
    counter >
    Object.keys(dirs).length * (preferences.dirs_cleaning_coefficient || 10)
  ) {
    // если настала пора чистить dirs
    db.push(".counter", 0); // обнуляем счетчик запросов
    const newSnapshot = removeSame(snapshot, dirs);
    // если есть snapshot, то убираем из dirs все пассивные dirs
    db.push(".dirs", { ...newSnapshot });
    db.push(".snapshot", { ...newSnapshot });
    db.save();
  } else {
    db.push(".counter", counter + 1);
    db.save();
  }
  console.log(`${dir} requested`);
  const allConvertedRates = await getAllRates();
  return allConvertedRates && allConvertedRates[dir];
}

export default handleDirRequest;
