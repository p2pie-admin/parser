import { AllDirsRates, AllDirsTops, DirRates, Rate } from "../../types/rates";
import { DirRatesVerificator } from "./DirRatesVerificator";
import findBestDirRates from "./findBest";
import findUniqueDirRates from "./findUnique";
import { testBest } from "./testBest";

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

const _getDirTop = (dirRates: DirRates, dir: string): FullRate[] => {
  // several steps to transform, sort and filter rates
  const dirRatesVerificator = new DirRatesVerificator(dir);
  const verifiedRates = dirRatesVerificator.getVerified(dirRates);
  const uniqueRates = findUniqueDirRates(verifiedRates);
  const ratesWithoutUnique = deleteProps(
    verifiedRates,
    Object.keys(uniqueRates)
  );
  const bestRates = findBestDirRates(ratesWithoutUnique);

  testBest(bestRates, dir);

  const dirTops: FullRate[] = [
    ...dirRatesIntoArray(uniqueRates),
    ...dirRatesIntoArray(bestRates),
  ];
  return dirTops;
};

const getDirTops = (allDirsRates: AllDirsRates): AllDirsTops => {
  return Object.keys(allDirsRates).reduce((allDirTops: AllDirsTops, dir) => {
    allDirTops[dir] = _getDirTop(allDirsRates[dir], dir);
    return allDirTops;
  }, {});
};

export default getDirTops;
