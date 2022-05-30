
import { ExchangerError } from 'src/types/exchangerResp';

export type Sides = "give" | "get";
export type Limit = { [key in Sides]: number };

export interface Errors {
    [key: string]: ExchangerError;
  }
  
export interface LinkAndID {
  exchangerId: string;
  ratesLink: string;
}

export interface DirRates {
    [key: string]: Rate
}

export interface Rate  {
  course: number;
  min_fee: string;
  from_fee: string;
  to_fee: string;
  min: Limit;
  max: Limit;
  reserve: Limit;
  param: string;
  cities?: {[key: string]: string[]};
}

export type ExchangerId = string

export interface DirTops {
  uniqueRates: { [key: string]: DirRates }; // это уникальные свойства
  bestRates: DirRates; // это задачка с дождем, чтобы в зависимости от суммы выдавался результат
}


export type AllDirsRates = {[key: string]: DirRates}
export type AllDirsTops = {[key: string]: DirTops}
