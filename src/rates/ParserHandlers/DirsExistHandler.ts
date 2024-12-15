import { IAllDirsRates } from "../../types/rates";
import { getData, getObject, setData } from "../../redis";
import { mylog } from "../../helper";

const dirsExistHandler = async () => {
  const allDirTops = (await getObject("allDirTops")) as IAllDirsRates;

  const allPmCodesThatExist = (await getData(
    "all_pm_codes_that_exist"
  )) as string[];
  if (!allDirTops || !allPmCodesThatExist) {
    mylog("No dirs exist yet!", "warning");
    return;
  }
  const possibleEverDirs = allPmCodesThatExist.reduce(
    (res: string[], leftCode) => [
      ...res,
      ...allPmCodesThatExist.map((rightCode) => `${leftCode}_${rightCode}`),
    ],
    []
  ); // getting all possible pairs [A]_[B]

  const possiblePairs = possibleEverDirs.reduce(
    (pairs: { [key: string]: string[] }, directionKey) => {
      const directionRates = allDirTops[directionKey];
      // возможно такое, что при билде фронта курсов нет, а потом он появится
      // и потом в селекторе его можно будет выбрать, а при билде его не было значит 404
      // поэтому сделаем хотя бы 2 курса чтобы было для минимизации таких кейсов
      if (!directionRates || Object.keys(directionRates).length < 3)
        return pairs;

      const [leftPm, rightPm] = directionKey.split("_");
      if (!leftPm || !rightPm) return pairs; // Handle malformed strings

      pairs[leftPm] = pairs[leftPm] ? [...pairs[leftPm], rightPm] : [rightPm];
      return pairs;
    },
    {}
  );

  setData("possible_pairs", possiblePairs);
};

export default dirsExistHandler;
