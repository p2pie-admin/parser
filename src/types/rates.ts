export type Sides = "give" | "get";
export type Limit = { [key in Sides]: number };

export interface IGeneralData {
  dirsDisabled: string;
  allPmCodesThatExist: string[];
  alternativePmCodes: string[][];
}

export interface LinkAndID {
  exchangerId: string;
  ratesLink: string;
}

export interface DirRates {
  [key: string]: Rate;
}

export interface Rate {
  name: string;
  tag: string;
  admin_rating: number | null;
  course: number;
  p2pRatio?: number;
  min_fee?: string;
  from_fee?: string;
  to_fee?: string;
  min: Limit;
  max: Limit;
  reserve: Limit;
  parameterCodes?: string[];
  cities?: { [key: string]: string[] };
  ref_link?: string;
  last_time_updated?: number;
}

export interface FullRate extends Rate {
  exchangerId: string;
}

export type ExchangerId = string;

export type AllDirsRates = { [key: string]: DirRates };
export type AllDirsTops = { [key: string]: FullRate[] };
