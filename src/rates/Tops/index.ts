import { mylog } from "../../helper";
import { getData } from "../../redis";
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
  allDirsRates: IAllDirsRates
): Promise<AllDirsTops> => {
  return Object.keys(allDirsRates).reduce(
    async (allDirTopsPromise: Promise<AllDirsTops>, dir) => {
      const allDirTops = await allDirTopsPromise;
      allDirTops[dir] = await getDirTop(allDirsRates[dir], dir);
      return allDirTops;
    },
    Promise.resolve({} as AllDirsTops)
  );
};

export const getDirTop = async (
  rates: { [key: string]: IRate },
  dir: string
): Promise<IRate[]> => {
  // several steps to transform, sort and filter rates
  const { SD_applied_from, SD_best, SD_worst } = (await getData(
    "parser_setting"
  )) as any;
  const ratesVerificator = new DirRatesVerificator(
    dir,
    SD_applied_from,
    SD_best,
    SD_worst
  );

  const verifiedRates = ratesVerificator.getVerified(rates);

  const uniqueRates = await findUniqueDirRates(verifiedRates);
  const ratesWithoutUnique = deleteProps(
    verifiedRates,
    Object.keys(uniqueRates)
  );
  const bestRates = findBestDirRates(ratesWithoutUnique);
  console.log("found best: ", Object.keys(bestRates).length);

  //   mylog(
  //     `Without unique rates: ${Object.keys(ratesWithoutUnique.length)}`,
  //     "info"
  //   );
  //mylog(`Best rates: ${Object.keys(bestRates.length)}`, "info");

  const dirTops: IRate[] = [
    ...dirRatesIntoArray(uniqueRates),
    ...dirRatesIntoArray(bestRates),
  ].sort((a, b) => a.course - b.course);
  return dirTops;
};

export default getAllDirTops;
