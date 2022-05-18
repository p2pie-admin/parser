import { IExchanger } from "./exchanger.json";
import { AllConvertedRates, Errors } from "./rates.json";

type FilterOption = { [key in "name"]: string };

interface ParserSetting {
  dirs_disabled: string;
  update_time_sec: number;
  cities: { [key: string]: string };
  filter_options: FilterOption[];
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
  allConvertedRates: AllConvertedRates;
}



export {
  DB,
  DBRATES,
  ParserSetting,
  Violation,
  VerificationResult,
  FilterOption,
};
