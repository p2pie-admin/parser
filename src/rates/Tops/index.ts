import { dir } from "console";
import { mylog } from "../../helper";
import { getData } from "../../redis";
import { IParserSetting } from "../../types";
import { IAllDirsRates, AllDirsTops, IRate } from "../../types/rates";
import { DirRatesVerificator } from "./DirRatesVerificator";
import findBestDirRates from "./findBest";
import findUniqueDirRates from "./findUnique";

const dirRatesIntoArray = (dirRates: { [key: string]: IRate }): IRate[] => {
  return Object.entries(dirRates).map(([exchangerId, rate]) => ({
    exchangerId,
    ...rate,
  }));
};

const deleteProps = (
  obj: { [key: string]: IRate },
  prop: string[]
): { [key: string]: IRate } => {
  for (const p of prop) {
    delete obj[p];
  }
  return obj;
};

const getAllDirTops = async (
  allDirsRates: IAllDirsRates,
  parserSetting: IParserSetting
): Promise<AllDirsTops> => {
  return Object.keys(allDirsRates).reduce(
    async (allDirTopsPromise: Promise<AllDirsTops>, dir) => {
      const allDirTops = await allDirTopsPromise;
      allDirTops[dir] = await getDirTop(allDirsRates[dir], parserSetting, dir);
      return allDirTops;
    },
    Promise.resolve({} as AllDirsTops)
  );
};

export const getDirTop = async (
  rates: { [key: string]: IRate },
  parserSetting: IParserSetting,
  dir: string
): Promise<IRate[]> => {
  // several steps to transform, sort and filter rates

  const { SD_applied_from, SD_best, SD_worst } = parserSetting;

  const ratesVerificator = new DirRatesVerificator(
    dir,
    SD_applied_from,
    SD_best,
    SD_worst
  );

  const verifiedRates = ratesVerificator.getVerified(rates);

  const uniqueRates = await findUniqueDirRates(verifiedRates);
  // // const ratesWithoutUnique = deleteProps(
  // //   verifiedRates,
  // //   Object.keys(uniqueRates)
  // // );
  const bestRates = findBestDirRates(verifiedRates);
  // mylog(
  //   `Without unique rates: ${Object.keys(ratesWithoutUnique.length)}`,
  //   "info"
  // );
  //mylog(`Best rates: ${Object.keys(bestRates.length)}`, "info");

  const allRates = {
    ...bestRates,
    ...uniqueRates,
  };

  const dirTops: IRate[] = Object.values(allRates).sort(
    (a, b) => a.course - b.course
  );
  return dirTops;
};

export default getAllDirTops;
