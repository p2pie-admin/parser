import {
  AllDirsRates,
  AllDirsTops,
  DirRates,
  DirTops,
} from "../../types/rates";
import { DirRatesVerificator } from "./DirRatesVerificator";
import findBestDirRates from "./findBest";
import findUniqueDirRates from "./findUnique";

const getDirTops = (allDirsRates: AllDirsRates): AllDirsTops => {
  return Object.keys(allDirsRates).reduce((allDirTops: AllDirsTops, dir) => {
    allDirTops[dir] = _getDirTop(allDirsRates[dir], dir);
    return allDirTops;
  }, {});
};

const _getDirTop = (dirRates: DirRates, dir: string): DirTops => {
  // several steps to transform, sort and filter rates
  const dirRatesVerificator = new DirRatesVerificator(dir);
  const verifiedRates = dirRatesVerificator.getVerified(dirRates);
  const bestRates = findBestDirRates(verifiedRates);
  const uniqueRates = findUniqueDirRates(verifiedRates);

  const dirTops: DirTops = {
    uniqueRates,
    bestRates,
  };
  return dirTops;
};

export default getDirTops;
