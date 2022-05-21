import { IExchanger } from "./exchanger.json";
import { DirRate, DirTops, Errors } from "./rates.json";


interface ParserSetting {
  dirs_disabled: string;
  restart_after_sec: number;
  cities: { [key: string]: string };
  filter_options: string;
  SD_applied_from: number;
  SD_best_rates: number;
  SD_worst_rates: number;
}


interface DB {
  dirs: { [key: string]: number }; // отслеживаем какие направления популярны
  parser_setting: ParserSetting;
  exchangers: {
    active: IExchanger[];
    suspended: IExchanger[];
  },
  warnings: Errors;
  errors: Errors;
  left_to_parse: number;
  times_rates_requested: number;
  possible_pm_codes: string[];
}

type Violation = [boolean, string];

interface VerificationResult {
  rateErrors: string[];
  rateWarnings: string[];
}

interface DBRATES {
  dirRates: {[key: string]: DirRate[]};
  dirTops: {[key: string]: DirTops};
}



export {
  DB,
  DBRATES,
  ParserSetting,
  Violation,
  VerificationResult,
};
