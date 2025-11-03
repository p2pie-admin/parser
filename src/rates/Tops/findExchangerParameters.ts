import { IRate } from "../../types/rates";

type RatesMap = { [key: string]: IRate };

export const findExchangerParameters = (verifiedRates: RatesMap): RatesMap => {
  return verifiedRates;
};
