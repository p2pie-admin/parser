import { DB } from "../types";

const initialDB: DB = {
  dirs: {},
  snapshot: {},
  counter: 1,
  allConvertedRates: {},
  warnings: {},
  errors: {},
  preferences: {
    dirs_disabled: "",
    update_time_sec: 100,
    dirs_cleaning_coefficient: 10,
    cities: {},
    filter_options: [],
    SD_applied_from: 8,
    SD_best_rates: 4,
    SD_worst_rates: 5,
  },
  exchangers: [],
};

export default initialDB;
