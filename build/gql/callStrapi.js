"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_request_1 = require("graphql-request");
const db_1 = __importDefault(require("../db"));
const normalizer_1 = __importDefault(require("./normalizer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jwt = db_1.default.getData(".jwt");
const headers = jwt
    ? {
        authorization: `Bearer ${jwt}`,
    }
    : {};
const strapiLink = process.env.DEV_STRAPI;
if (!strapiLink)
    console.log("📙 \u001b[1;33m strapiLink is: ", strapiLink);
const callStrapi = async (query, variables) => {
    const graphQLClient = new graphql_request_1.GraphQLClient(strapiLink || "", {
        headers,
    });
    try {
        const data = await graphQLClient.request(query, variables);
        const res = (0, normalizer_1.default)(data);
        return res;
    }
    catch (err) {
        console.error("📙 \u001b[1;33m -- GQL ERROR -- ", err);
        return null;
    }
};
exports.default = callStrapi;
//# sourceMappingURL=callStrapi.js.map