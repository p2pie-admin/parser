import { AllDirsRates, AllDirsTops, DirRates, Rate } from "../../types/rates";
import { DirRatesVerificator } from "./DirRatesVerificator";
import findBestDirRates from "./findBest";
import findUniqueDirRates from "./findUnique";

interface FullRate extends Rate {
  exchangerId: string;
}

const dirRatesIntoArray = (dirRates: DirRates): FullRate[] => {
  return Object.entries(dirRates).map(([exchangerId, rate]) => ({
    exchangerId,
    ...rate,
  }));
};

const deleteProps = (obj: DirRates, prop: string[]): DirRates => {
  for (const p of prop) {
    delete obj[p];
  }
  return obj;
};

export const getDirTop = (dirRates: DirRates, dir: string): FullRate[] => {
  // several steps to transform, sort and filter rates
  const dirRatesVerificator = new DirRatesVerificator(dir);
  const verifiedRates = dirRatesVerificator.getVerified(dirRates);
  const uniqueRates = findUniqueDirRates(verifiedRates);
  const ratesWithoutUnique = deleteProps(
    verifiedRates,
    Object.keys(uniqueRates)
  );
  const bestRates = findBestDirRates(ratesWithoutUnique);


  const dirTops: FullRate[] = [
    ...dirRatesIntoArray(uniqueRates),
    ...dirRatesIntoArray(bestRates),
  ].sort((a, b) => a.course - b.course);
  return dirTops;
};

const getDirTops = (allDirsRates: AllDirsRates): AllDirsTops => {
  return Object.keys(allDirsRates).reduce((allDirTops: AllDirsTops, dir) => {
    allDirTops[dir] = getDirTop(allDirsRates[dir], dir);
    return allDirTops;
  }, {});
};

export default getDirTops;
