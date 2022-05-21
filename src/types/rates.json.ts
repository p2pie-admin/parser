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

export interface DirRate  {
  id: string;
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

export interface DirTops {
  uniqueRates: { [key: string]: DirRate | null }; // это уникальные свойства
  bestRates: DirRate[]; // это задачка с дождем, чтобы в зависимости от суммы выдавался результат
}
