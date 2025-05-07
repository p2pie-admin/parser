"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_1 = require("../../helper");
const redis_1 = require("../../redis");
const addTopParameter = (prevUniqueRates, topParameter, [exchId, rate]) => {
    return {
        ...prevUniqueRates,
        [exchId]: {
            ...rate,
            parameterCodes: [
                ...(prevUniqueRates[exchId]?.parameterCodes || []),
                topParameter,
            ],
        },
    };
};
const findUniqueRates = async (dirRates) => {
    if (!Object.keys(dirRates).length)
        return {};
    try {
        const topCodes = (await (0, redis_1.getData)("top_codes"));
        const uniqueRates = topCodes.reduce((res, code) => {
            switch (code) {
                case "optimal":
                    const optimalSelector = (rate) => rate.course ** 20 * rate.min.give;
                    res = addTopParameter(res, "optimal", findUniqueRate(dirRates, optimalSelector));
                    break;
                case "best_course":
                    const courseSelector = (rate) => rate.course;
                    res = addTopParameter(res, "best_course", findUniqueRate(dirRates, courseSelector));
                    break;
                case "low_min":
                    const minSelector = (rate) => rate.min.give;
                    res = addTopParameter(res, "low_min", findUniqueRate(dirRates, minSelector));
                    break;
                case "top_max":
                    const maxSelector = (rate) => rate.max.give;
                    res = addTopParameter(res, "top_max", findUniqueRate(dirRates, maxSelector, false));
                    break;
                case "top_rating":
                    const topRatingSelector = (rate) => rate.admin_rating;
                    res = addTopParameter(res, "top_rating", findUniqueRate(dirRates, topRatingSelector));
                    break;
                default:
                    return res;
            }
            return res;
        }, {});
        return uniqueRates;
    }
    catch (err) {
        (0, helper_1.mylog)(`Error in uniqueRates: ${err}`);
        return {};
    }
};
const findUniqueRate = (dirRates, selector, needLowest = true) => {
    //[...Object.entries(dirRates)].sort((r1, r2) => r1[1].course - r2[1].course);
    const sorted = [...Object.entries(dirRates)].sort((r1, r2) => selector(r1[1]) - selector(r2[1]));
    const [exchangerId, rate] = needLowest ? sorted[0] : sorted.reverse()[0];
    return [exchangerId, rate];
};
exports.default = findUniqueRates;
