import { AllDirsRates } from "../../types/rates";
import { getData, setData } from "../../redis";

const dirsExistHandler = async () => {
  const allDirsRates = (await getData("allDirsRates")) as AllDirsRates;
  const allPmCodesThatExist = (await getData(
    "all_pm_codes_that_exist"
  )) as string[];

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
  console.log("possiblePairs", possiblePairs);
  setData("possible_pairs", possiblePairs);
};

export default dirsExistHandler;
