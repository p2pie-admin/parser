import db from "../db";
import fetch from "node-fetch";
import { RatesFilterPreferences, AllConvertedRates } from "../types";

import { RATES_PROVIDER } from "../config.json";
import convertAllRates from "./conversion";
//import getRatesStatistics from "./convertation/getRatesStatistics";
// import bindRatesToExchangers from "../exchangers/bindRates.js";

async function getAllRates(): Promise<AllConvertedRates | null> {
  const dirs = db.getData(".dirs") as { [key: string]: number };
  const preferences = db.getData(".preferences") as RatesFilterPreferences;

  const dirsToRequest = preferences.dirs_disabled
    ? Object.keys(dirs).filter(
        (dir) =>
          !preferences.dirs_disabled
            .split("\n")
            .find((d) => d.toUpperCase() === dir)
      )
    : Object.keys(dirs);

  try {
    const response = await fetch(RATES_PROVIDER + dirsToRequest);
    const allRateStrings = (await response.json()) as {
      [key: string]: string[];
    };

    if (Object.keys(allRateStrings).length) {
      const allConvertedRates = convertAllRates(allRateStrings);
      db.push(".allConvertedRates", allConvertedRates);
      db.save();
      console.log(`rates for ${Object.keys(dirs)} requested`);
      return allConvertedRates; // return null if it was an auto update
    }
  } catch (err) {
    console.log(err);
  }
  console.log("no rates requested");
  return null;
  // do smth if AC is not responding !!!
}

export default getAllRates;
