"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("graphql-request");
const normalizer_1 = __importDefault(require("./normalizer"));
const dotenv_1 = __importDefault(require("dotenv"));
const helper_1 = require("../helper");
const redis_1 = require("../redis");
dotenv_1.default.config();
const env = process.env.NODE_ENV || "development";
const strapiLink = env === "production" ? process.env.STRAPI : process.env.DEV_STRAPI;
if (!strapiLink)
    (0, helper_1.mylog)(`strapiLink is:  ${strapiLink}`, "info");
const callStrapi = async (query, variables) => {
    const jwt = await (0, redis_1.getData)("parser_jwt");
    const headers = jwt
        ? {
            authorization: `Bearer ${jwt}`,
        }
        : {};
    const graphQLClient = new graphql_request_1.GraphQLClient(strapiLink || "", {
        headers,
    });
    try {
        const data = await graphQLClient.request(query, variables);
        const res = (0, normalizer_1.default)(data);
        return res;
    }
    catch (err) {
        (0, helper_1.mylog)("-- GQL ERROR --", "error");
        (0, helper_1.mylog)(`${err}`, "error");
        jwt && jwt.length > 5 && (0, helper_1.mylog)("JWT exists", "warning");
        jwt && jwt.length > 5 && (0, helper_1.mylog)(err, "error");
    }
};
exports.default = callStrapi;
