"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const queries_1 = require("./gql/queries");
const db_1 = __importDefault(require("./db"));
const callStrapi_1 = __importDefault(require("./gql/callStrapi"));
const getCodes = (pm_group) => {
    return pm_group.options.map((option) => ((option === null || option === void 0 ? void 0 : option.code) ||
        (pm_group.prefix &&
            pm_group.prefix !== (option === null || option === void 0 ? void 0 : option.currency.code) &&
            pm_group.prefix + (option === null || option === void 0 ? void 0 : option.currency.code)) ||
        (option === null || option === void 0 ? void 0 : option.currency.code)).toUpperCase());
};
const getPossiblePmCodesFromSections = (sections) => {
    const pmGroups = sections.reduce((res, section) => [...res, ...section.pm_groups], []);
    return pmGroups.reduce((allPmCodes, pmGroup) => [...allPmCodes, ...getCodes(pmGroup)], []);
};
async function initialLoader() {
    var _a;
    const [parserSettingsData, exchangersData, pmGroupsData, topsData,] = await Promise.all([queries_1.ParserSettingQuery, queries_1.ExchangersQuery, queries_1.PmGroupsQuery, queries_1.TopsQuery].map(async (query) => {
        return await (0, callStrapi_1.default)(query);
    }));
    if (!parserSettingsData || !exchangersData || !pmGroupsData || !topsData) {
        console.log(`📕 \u001b[1;31m Strapi initial data error!`);
        return;
    }
    console.log("📗 \u001b[1;32m The initial data was received...");
    db_1.default.push(".topCodes", topsData.topParameters.map((p) => p.code));
    db_1.default.push(".parser_setting", parserSettingsData.parserSetting);
    const exchangersWithId = exchangersData.exchangers;
    const exchangersWithLoop = exchangersWithId.reduce((res, ex) => {
        const { id } = ex, rest = __rest(ex, ["id"]);
        return Object.assign(Object.assign({}, res), { [id]: Object.assign({}, rest) });
    }, {});
    db_1.default.push(".exchangers", exchangersWithLoop);
    const sections = (_a = pmGroupsData === null || pmGroupsData === void 0 ? void 0 : pmGroupsData.selector) === null || _a === void 0 ? void 0 : _a.sections;
    db_1.default.push(".possible_pm_codes", getPossiblePmCodesFromSections(sections));
    db_1.default.save();
}
exports.default = initialLoader;
//# sourceMappingURL=initialLoader.js.map