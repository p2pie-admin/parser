"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("graphql-request");
const queries_1 = require("./queries");
const config_json_1 = __importDefault(require("./config.json"));
const db_1 = __importDefault(require("./db"));
const normalizer_1 = __importDefault(require("./normalizer"));
const getCodes = (pm_group) => {
    return pm_group.options.map(option => ((option === null || option === void 0 ? void 0 : option.code) ||
        (pm_group.prefix && pm_group.prefix !== (option === null || option === void 0 ? void 0 : option.currency.code) && pm_group.prefix + (option === null || option === void 0 ? void 0 : option.currency.code)) ||
        (option === null || option === void 0 ? void 0 : option.currency.code)).toUpperCase());
};
const getPossiblePmCodesFromSections = (sections) => {
    const pmGroups = sections.reduce((res, section) => [...res, ...section.pm_groups], []);
    return pmGroups.reduce((allPmCodes, pmGroup) => [...allPmCodes, ...getCodes(pmGroup)], []);
};
async function initialLoader() {
    const graphQLClient = new graphql_request_1.GraphQLClient(process.env.PORT ? config_json_1.default.STRAPI : config_json_1.default.LOCAL_STRAPI);
    const [parserData, exchangersData, pmGroupsData] = await Promise.all([queries_1.ParserSettingQuery, queries_1.ExchangersQuery, queries_1.PmGroupsQuery].map(async (query) => {
        try {
            return await graphQLClient.request(query);
        }
        catch (err) {
            console.error(err);
            return null;
        }
    }));
    db_1.default.push(".parser_setting", (0, normalizer_1.default)(parserData.parserSetting));
    const allExchangers = (0, normalizer_1.default)(exchangersData.exchangers);
    db_1.default.push(".exchangers.active", allExchangers.filter((exch) => exch.status === "active"));
    db_1.default.push(".exchangers.suspended", allExchangers.filter((exch) => exch.status === "suspended"));
    const sections = (0, normalizer_1.default)(pmGroupsData).selector.sections;
    db_1.default.push(".possible_pm_codes", getPossiblePmCodesFromSections(sections));
    db_1.default.save();
    console.log("-= Parser settings and exchangers were updated! =-");
}
exports.default = initialLoader;
//# sourceMappingURL=initialLoader.js.map