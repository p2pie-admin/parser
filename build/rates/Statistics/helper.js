"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pmsToDirs = exports.pmPointerToPm = exports.getPmsFromPmGroup = exports.singlePmHasUnmetPairs = exports.allPmsHaveUnmetPairs = exports.capitalize = void 0;
const capitalize = (s) => {
    if (typeof s !== "string")
        return "";
    return s.charAt(0).toUpperCase() + s.slice(1);
};
exports.capitalize = capitalize;
const getOptionCode = (option, prefix) => {
    var _a, _b, _c;
    return (((option === null || option === void 0 ? void 0 : option.code) && (option === null || option === void 0 ? void 0 : option.code.toUpperCase())) || // USDTERC
        (prefix &&
            prefix.toUpperCase() !== ((_a = option === null || option === void 0 ? void 0 : option.currency) === null || _a === void 0 ? void 0 : _a.code.toUpperCase()) &&
            prefix.toUpperCase() + ((_b = option === null || option === void 0 ? void 0 : option.currency) === null || _b === void 0 ? void 0 : _b.code.toUpperCase())) || // SBERRUB
        ((_c = option === null || option === void 0 ? void 0 : option.currency) === null || _c === void 0 ? void 0 : _c.code.toUpperCase())); // BTC
};
const allPmsHaveUnmetPairs = (pms, possiblePairs) => {
    if (!possiblePairs || !possiblePairs.length)
        return false;
    if (pms.find((pm) => possiblePairs.find((pair) => pm.code === pair)))
        return false;
    return true;
};
exports.allPmsHaveUnmetPairs = allPmsHaveUnmetPairs;
const singlePmHasUnmetPairs = (pm, possiblePairs) => {
    if (!possiblePairs || !possiblePairs.length)
        return false;
    if (possiblePairs.find((pair) => pm.code === pair))
        return false;
    return true;
};
exports.singlePmHasUnmetPairs = singlePmHasUnmetPairs;
const getPmsFromPmGroup = (pm_group, popular_as) => {
    return pm_group.options.map((option) => {
        var _a, _b, _c;
        const code = getOptionCode(option, pm_group === null || pm_group === void 0 ? void 0 : pm_group.prefix);
        const subgroup_name = option.name && option.name.toUpperCase();
        const tag = pm_group.options.length > 1
            ? ((_a = option.code) === null || _a === void 0 ? void 0 : _a.toLocaleUpperCase()) || option.currency.code.toUpperCase()
            : undefined;
        const en_name = pm_group.en_name + " " + ((_b = option === null || option === void 0 ? void 0 : option.currency) === null || _b === void 0 ? void 0 : _b.code);
        const ru_name = pm_group.ru_name
            ? pm_group.ru_name + " " + ((_c = option === null || option === void 0 ? void 0 : option.currency) === null || _c === void 0 ? void 0 : _c.code)
            : "";
        return {
            code,
            en_name,
            ru_name,
            subgroup_name,
            currency: option === null || option === void 0 ? void 0 : option.currency,
            icon: pm_group.icon,
            color: pm_group.color,
            tag,
            popular_as,
        };
    });
};
exports.getPmsFromPmGroup = getPmsFromPmGroup;
const pmPointerToPm = (pointer) => {
    // from frontend
    const { code, pm_group, popular_as } = pointer;
    if (!(pm_group === null || pm_group === void 0 ? void 0 : pm_group.options))
        return;
    const pms = (0, exports.getPmsFromPmGroup)(pm_group, popular_as);
    if (!code)
        return pms[0];
    return pms.find((pm) => pm.code.toLowerCase() == code.toLowerCase());
};
exports.pmPointerToPm = pmPointerToPm;
const pmsToDirs = (pms) => {
    if (!pms || !pms.length || pms.find((pm) => !pm))
        return {};
    const cryptoCodes = pms
        .filter((pm) => pm.popular_as === "crypto")
        .map((pm) => pm.code);
    const fiatCodes = pms
        .filter((pm) => pm.popular_as === "fiat")
        .map((pm) => pm.code);
    return cryptoCodes.reduce((dirs, cryptoCode) => {
        const c2f = fiatCodes.map((fiatCode) => `${cryptoCode}_${fiatCode}`);
        const f2c = fiatCodes.map((fiatCode) => `${fiatCode}_${cryptoCode}`);
        return Object.assign(Object.assign({}, dirs), { [cryptoCode]: { buy: [...f2c], sell: [...c2f] } });
    }, {});
};
exports.pmsToDirs = pmsToDirs;
