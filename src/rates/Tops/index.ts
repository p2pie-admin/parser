import { DirRate, DirTops } from "../../types/rates.json";
import findBestRates from "./getBest";
import findUniqueRates from "./getUnique";
import getVerified from "./getVerified";

type AllDirRates = {[key: string]: DirRate[]}
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


const _getDirTop = (dirRates: DirRate[], dir: string): DirTops => {
  // several steps to transform, sort and filter rates
  const verifiedRates = getVerified(dirRates, dir);
  const uniqueRates = findUniqueRates(verifiedRates);
  const bestRates = findBestRates(verifiedRates);
  const dirTops: DirTops = {
    uniqueRates,
    bestRates,
  };
  return dirTops;
}




export default getDirTops;
