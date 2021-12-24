import transformRateStringsToRates from "./rateTransformer";
import { applyFunctionToObjectValues } from "../helper";
import { AllRates, Rate } from "../../types";
//import filterBestRates from "./filterBestRates";

const _convertDirRates = (dirRateStrings: string[]): Rate[] => {
  // several steps to transform, sort and filter rates
  const transformedRates = transformRateStringsToRates(dirRateStrings);
  //const bestRates = filterBestRates(transformedRates);

  return transformedRates;
};

const convertAllRates = (allRates: { [key: string]: string[] }): AllRates => {
  return applyFunctionToObjectValues(_convertDirRates, allRates);
};

export default convertAllRates;
