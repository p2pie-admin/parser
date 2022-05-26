import { DirRates, DirTops } from "../../types/rates.json";
import { DirRatesVerificator } from "./DirRatesVerificator";
import findBestDirRates from "./findBest";
import findUniqueDirRates from "./findUnique"


type AllDirRates = {[key: string]: DirRates}
type AllDirtops = {[key: string]: DirTops}


const getDirTops = (allDirRates: AllDirRates) : AllDirtops => {
  return Object.keys(allDirRates).reduce(
    (allDirTops: AllDirtops, dir) => { 
      allDirTops[dir] =  _getDirTop(allDirRates[dir], dir);
      return allDirTops;
    },
    {}
  );
};


const _getDirTop = (dirRates: DirRates, dir: string): DirTops => {
  // several steps to transform, sort and filter rates
  const dirRatesVerificator = new DirRatesVerificator(dir)
  const verifiedRates = dirRatesVerificator.getVerified(dirRates);
  const bestRates = findBestDirRates(verifiedRates);
  const uniqueRates = findUniqueDirRates(verifiedRates);
  const dirTops: DirTops = {
    uniqueRates,
    bestRates,
  };
  return dirTops;
}




export default getDirTops;
