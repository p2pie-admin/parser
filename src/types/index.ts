type FilterOption = { [key in "name"]: string };

interface RatesFilterPreferences {
  dirs_disabled: string;
  update_time_sec: number;
  dirs_cleaning_coefficient: number;
  cities: { [key: string]: string };
  filter_options: FilterOption[];
  SD_applied_from: number;
  SD_best_rates: number;
  SD_worst_rates: number;
}

type Sides = "give" | "get";
type Limit = { [key in Sides]: number };

interface Rate {
  id: string;
  exchanger: Exchanger;
  min_fee: string;
  from_fee: string;
  to_fee: string;
  course: number;
  min_amount: Limit;
  max_amount: Limit;
  reserve: Limit;
  paramIds: number[];
  cities: { [key: string]: string[] };
}

interface ProblematicRates {
  [key: string]: { [key: string]: object };
}

interface Exchanger {
  name: string;
  our_rating: number;
  logo?: string;
  tag?: string;
  date_listed?: string;
}

interface DB {
  dirs: { [key: string]: number };
  snapshot: { [key: string]: number };
  counter: number;
  allConvertedRates: AllConvertedRates;
  warnings: ProblematicRates;
  errors: ProblematicRates;
  preferences: RatesFilterPreferences;
  exchangers: Exchanger[];
}

type Violation = [boolean, string];

interface VerificationResult {
  rateErrors: string[];
  rateWarnings: string[];
}

interface ConvertedDirRates {
  rates: Rate[];
  uniqueRates: { [key: string]: Rate | null };
  bestRates: Rate[];
}

interface AllConvertedRates {
  [key: string]: ConvertedDirRates;
}

export {
  DB,
  Rate,
  RatesFilterPreferences,
  ProblematicRates,
  Limit,
  Violation,
  VerificationResult,
  Exchanger,
  FilterOption,
  ConvertedDirRates,
  AllConvertedRates,
};
