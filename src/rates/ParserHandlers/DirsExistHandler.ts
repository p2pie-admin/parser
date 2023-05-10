import db from "../../db";
import { AllDirsRates } from "../../types/rates";
import dbRates from "../../dbRates";

const dirsExistHandler = () => {
  const allDirsRates = dbRates.getData(".allDirsRates") as AllDirsRates;
  const possiblePmCodes = db.getData(".possible_pm_codes") as string[];

  const possibleDirs = possiblePmCodes.reduce(
    (res: string[], leftCode) => [
      ...res,
      ...possiblePmCodes.map((rightCode) => `${leftCode}_${rightCode}`),
    ],
    []
  );

  const possiblePairs = possibleDirs.reduce(
    // for showing on selector if dirs exist
    (possiblePairs: { [key: string]: string[] }, possibleDir) => {
      const dirRates = allDirsRates[possibleDir];
      if (!dirRates || !Object.keys(dirRates).length) return possiblePairs;
      const [leftPm, rightPm] = possibleDir.split("_");
      possiblePairs[leftPm] = possiblePairs[leftPm]
        ? [...possiblePairs[leftPm], rightPm]
        : [rightPm];
      return possiblePairs;
    },
    {}
  );
  db.push(".possible_pairs", possiblePairs);
  db.save();
  console.log(possiblePairs);
};

export default dirsExistHandler;
