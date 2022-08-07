import { Exchanger } from "./exchanger";
import { ExchangerErrors } from "./exchangerResp";
import { DirRates, DirTops } from "./rates";

interface ParserSetting {
  dirs_disabled: string;
  cities: { [key: string]: string };
  filter_options: string;
  SD_applied_from: number;
  SD_best_rates: number;
  SD_worst_rates: number;
}

type Top = {
  id: string;
  code: string;
};

type Timeouts = {
  getRatesIn: number;
  expireIn: number;
  restartRatesHandlerIn: number;
};

interface DirData {
  errors: { [key: string]: string[] };
  warnings: { [key: string]: string[] };
}

interface DB {
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

type Violation = [boolean, string];

interface VerificationResult {
  rateErrors: string[];
  rateWarnings: string[];
}

type ErrorTypes = "errors" | "warnings" | "rate_errors";

interface DBRATES {
  allDirsRates: { [key: string]: DirRates };
  allDirsTops: { [key: string]: DirTops };
}

export {
  DB,
  DBRATES,
  ParserSetting,
  Violation,
  VerificationResult,
  Top,
  ErrorTypes,
};
