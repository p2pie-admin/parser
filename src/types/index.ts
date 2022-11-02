import { Exchanger } from "./exchanger";
import { ExchangerErrors } from "./exchangerResp";
import { DirRates, DirTops } from "./rates";

export interface ParserSetting {
  dirs_disabled: string;
  cities: { [key: string]: string };
  filter_options: string;
  SD_applied_from: number;
  SD_best_rates: number;
  SD_worst_rates: number;
}

export type Top = {
  id: string;
  code: string;
};

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
  looped: { [key: string]: boolean };
  timeouts: Timeouts;
  dirs: { [key: string]: DirData }; // отслеживаем какие направления популярны
  tops: Top[];
  parser_setting: ParserSetting;
  exchangers: { [key: string]: Exchanger };
  errors: ExchangerErrors;
  possible_pm_codes: string[];
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
  allDirsTops: { [key: string]: DirTops };
}
