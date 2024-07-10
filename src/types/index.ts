import { IExchangerWithId } from "./exchanger";
import { ExchangerErrors } from "./exchangerResp";
import { DirRates, FullRate } from "./rates";

export interface ICity {
  codes: string[];
  en_name: string;
  ru_name: string;
  population: number;
  coordinates: number[];
  preposition: string;
  closest_cities: string[];
  en_country_name: string;
  ru_country_name: string;
}

export interface ParserSetting {
  dirs_disabled: string;
  cities: { [key: string]: string };
  filter_options: string;
  SD_applied_from: number;
  SD_best_rates: number;
  SD_worst_rates: number;
}

export type Timeouts = {
  getRatesIn: number;
  expireIn: number;
  restartRatesHandlerIn: number;
};

export interface DirData {
  errors: { [key: string]: string[] };
  warnings: { [key: string]: string[] };
  times_visited: number;
}

export interface DB {
  jwt: string;
  dirs: { [key: string]: DirData }; // отслеживаем какие направления популярны
  topCodes: string[];
  parser_setting: ParserSetting;
  exchangers: IExchangerWithId[];
  errors: ExchangerErrors;
  all_pm_codes_that_exist: string[][];
  alternative_pm_codes: string[];
  possible_pairs: { [key: string]: string[] };
}

export type Violation = [boolean, string];

export interface VerificationResult {
  rateErrors: string[];
  rateWarnings: string[];
}

export type ErrorTypes = "errors" | "warnings" | "rate_errors";

export interface DBRATES {
  allDirsRates: { [key: string]: DirRates };
  allDirsTops: { [key: string]: FullRate[] };
}
