import db from "../../db";
import { AllDirsRates } from "../../types/rates";
import dbRates from "../../dbRates";

const dirsExistHandler = () => {
  const allDirsRates = dbRates.getData(".allDirsRates") as AllDirsRates;
  const possiblePmCodes = db.getData(".possible_pm_codes") as string[];

  const possibleDirs = possiblePmCodes.reduce(
    (res: string[], leftPm) => [
      ...res,
      ...possiblePmCodes.map((rightPm) => `${leftPm}_${rightPm}`),
    ],
    []
  );

  const possiblePairs = possibleDirs.reduce(
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
