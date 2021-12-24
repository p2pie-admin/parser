"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const initialDB = {
    dirs: {},
    lastDir: "",
    snapshot: {},
    counter: 1,
    all_rates: {},
    problematicRates: {},
    preferences: {
        dirs_disabled: "",
        update_time_sec: 100,
        dirs_cleaning_coefficient: 10,
        cities: {},
        best_rating: false,
        optimal: true,
        lowest_min: false,
        best_course: false,
        most_popular: false,
        fast: false,
        top_reserve: false,
    },
};
exports.default = initialDB;
//# sourceMappingURL=initialDB.js.map