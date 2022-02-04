"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const verifyRate = (rate) => {
    const { name, reserve, min_amount, max_amount, give, get } = rate;
    const rateErrors = [];
    const rateWarnings = [];
    const errors = [
        [name.length > 20 || name.length < 3, "bad exchanger name"],
        [reserve.give < min_amount.give, "reserve is lower than min amount"],
        [min_amount.give > max_amount.give, "inappropriate limits"],
        [give <= 0 || get <= 0, "incorrect course"],
        [reserve.give < 0, "negative reserve"],
    ];
    const warnings = [
        [reserve.give === 0, "reserve is null"],
        [max_amount.give === 0, "max amount is null"],
    ];
    for (let error of errors) {
        const [errorCondition, message] = error;
        if (errorCondition) {
            rateErrors.push(message);
        }
    }
    for (let warning of warnings) {
        const [warningCondition, message] = warning;
        if (warningCondition) {
            rateWarnings.push(message);
        }
    }
    return {
        rateErrors,
        rateWarnings,
    };
};
exports.default = verifyRate;
//# sourceMappingURL=verification.js.map