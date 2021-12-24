interface RatesFilterPreferences {
  dirs_disabled: string;
  update_time_sec: number;
  dirs_cleaning_coefficient: number;
  cities: { [key: string]: string };
  best_rating: boolean;
  optimal: boolean;
  lowest_min: boolean;
  best_course: boolean;
  most_popular: boolean;
  fast: boolean;
  top_reserve: boolean;
}

interface Rate {
  id: number;
  name: string;
  course: number;
  reserve: number;
  give: number;
  get: number;
  min_amount: number;
  max_amount: number;
  paramIds: number[];
  cities: { [key: string]: string[] };
}

interface AllRates {
  [key: string]: Rate[];
}

interface ProblematicRates {
  [key: string]: { [key: string]: object };
}

interface DB {
  dirs: { [key: string]: number };
  lastDir: string;
  snapshot: { [key: string]: number };
  counter: number;
  all_rates: AllRates;
  problematicRates: ProblematicRates;
  preferences: RatesFilterPreferences;
}

export { DB, AllRates, Rate, RatesFilterPreferences, ProblematicRates };
