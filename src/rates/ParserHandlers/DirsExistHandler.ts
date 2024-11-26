import { IAllDirsRates } from "../../types/rates";
import { getData, getObject, setData } from "../../redis";
import { mylog } from "../../helper";

const dirsExistHandler = async () => {
  const allDirRates = (await getObject("allDirRates")) as IAllDirsRates;

  const allPmCodesThatExist = (await getData(
    "all_pm_codes_that_exist"
  )) as string[];
  if (!allDirRates || !allPmCodesThatExist) {
    mylog("No dirs exist yet!", "warning");
    return;
  }
  const possibleDirs = allPmCodesThatExist.reduce(
    (res: string[], leftCode) => [
      ...res,
      ...allPmCodesThatExist.map((rightCode) => `${leftCode}_${rightCode}`),
    ],
    []
  ); // getting all possible pairs [A]_[B]

  const possiblePairs = possibleDirs.reduce(
    // for showing on selector if dirs exist
    (pps: { [key: string]: string[] }, possibleDir) => {
      const dirRates = allDirRates[possibleDir];
      if (!dirRates || !Object.keys(dirRates).length) return pps;
      const [leftPm, rightPm] = possibleDir.split("_");
      pps[leftPm] = pps[leftPm] ? [...pps[leftPm], rightPm] : [rightPm];
      return pps;
    },
    {}
  )

  setData("possible_pairs", possiblePairs);
};

export default dirsExistHandler;
