"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const helper_1 = require("./rates/Statistics/helper");
const getCodes = (pm_group) => {
    // ПОНАДОБИТСЯ НА ФРОНТЕ ТОЖЕ
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
function initialLoader() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const [parserSettingsData, exchangersData, pmGroupsData, topsData, popularPms,] = yield Promise.all([
            queries_1.ParserSettingQuery,
            queries_1.ExchangersQuery,
            queries_1.PmGroupsQuery,
            queries_1.TopsQuery,
            queries_1.PopularPmsQuery,
        ].map((query) => __awaiter(this, void 0, void 0, function* () {
            return yield (0, callStrapi_1.default)(query);
        })));
        if (!parserSettingsData || !exchangersData || !pmGroupsData || !topsData) {
            console.log(`📕 \u001b[1;31m Strapi initial data error!`);
            return;
        }
        console.log("📗 \u001b[1;32m The initial data was received...");
        db_1.default.push(".topCodes", topsData.topParameters.map((p) => p.code));
        db_1.default.push(".parser_setting", parserSettingsData.parserSetting);
        const pointers = popularPms.pms;
        const pms = pointers.map((pointer) => (0, helper_1.pmPointerToPm)(pointer));
        const popularDirs = (0, helper_1.pmsToDirs)(pms);
        db_1.default.push(".popular_dirs", popularDirs);
        const exchangersWithId = exchangersData.exchangers;
        const exchangersWithLoop = exchangersWithId.reduce((res, ex) => {
            const { id } = ex, rest = __rest(ex, ["id"]);
            return Object.assign(Object.assign({}, res), { [id]: Object.assign({}, rest) });
        }, {});
        db_1.default.push(".exchangers", exchangersWithLoop);
        const sections = (_a = pmGroupsData === null || pmGroupsData === void 0 ? void 0 : pmGroupsData.selector) === null || _a === void 0 ? void 0 : _a.sections;
        db_1.default.push(".possible_pm_codes", getPossiblePmCodesFromSections(sections));
        db_1.default.save();
    });
}
exports.default = initialLoader;
