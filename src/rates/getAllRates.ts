import db from "../db";
import fetch from "node-fetch";
import { DB, Rate } from "../types";
import { RATES_PROVIDER } from "../config.json";
import convertAllRates from "./convertation";
// import bindRatesToExchangers from "../exchangers/bindRates.js";

async function getAllRates(dir: string): Promise<Rate[] | null> {
  const { dirs, preferences } = db.getObject<DB>(".");

  const dirsToRequest = preferences.dirs_disabled
    ? Object.keys(dirs).filter(
        (dir) =>
          !preferences.dirs_disabled
            .split("\n")
            .find((d) => d.toUpperCase() === dir)
      )
    : Object.keys(dirs);

  db.push(".lastDir", dir);

  try {
    const response = await fetch(RATES_PROVIDER + dirsToRequest);
    const allRateStrings = (await response.json()) as {
      [key: string]: string[];
    };

    if (Object.keys(allRateStrings).length) {
      //console.log(`received ${Object.keys(allRateStrings).length} rates`);
      const allFilteredRates = convertAllRates(allRateStrings);

      //const ratesWithExchangerData = bindRatesToExchangers(allFilteredRates);
      db.push(".all_rates", allFilteredRates);
      db.save();
      return allFilteredRates[dir];
    }
  } catch (err) {
    console.log(err);
  }

  return null;
  // do smth if AC is not responding !!!
}

export default getAllRates;
