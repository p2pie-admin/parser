import db from "../../db";
import { AllDirsRates } from "../../types/rates";
import dbRates from "../../dbRates";

const dirsExistHandler = () => {
  const allDirsRates = dbRates.getData(".allDirsRates") as AllDirsRates;
  const allPmCodesThatExist = db.getData(
    ".all_pm_codes_that_exist"
  ) as string[];

  const possibleDirs = allPmCodesThatExist.reduce(
    (res: string[], leftCode) => [
      ...res,
      ...allPmCodesThatExist.map((rightCode) => `${leftCode}_${rightCode}`),
    ],
    []
  ); // getting all possible pairs [A]_[B]

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
};

export default dirsExistHandler;
