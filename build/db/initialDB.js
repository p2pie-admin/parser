"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const initialDB = {
    jwt: "",
    looped: {},
    timeouts: {
        getRatesIn: 20000,
        expireIn: 18000,
        restartRatesHandlerIn: 22000,
    },
    dirs: {},
    topCodes: [],
    parser_setting: {
        dirs_disabled: "",
        cities: {},
        filter_options: "",
        SD_applied_from: 8,
        SD_best_rates: 4,
        SD_worst_rates: 5,
    },
    exchangers: {},
    errors: {},
    possible_pm_codes: [],
    possible_pairs: {},
};
exports.default = initialDB;
//# sourceMappingURL=initialDB.js.map