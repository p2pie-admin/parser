"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const callStrapi_1 = __importDefault(require("./gql/callStrapi"));
const queries_1 = require("./gql/queries");
async function statusChange(fromStatus, toStatus, exchangerId) {
    let exchangerIds = [];
    if (exchangerId) {
        exchangerIds = [exchangerId];
    }
    else {
        // апдейтим всех
        const data = await (0, callStrapi_1.default)(queries_1.getAllExchangerIds, {
            status: fromStatus,
        });
        !data &&
            console.error(`📙 \u001b[1;33m No exchangers received! fromStatus: ${fromStatus} / toStatus: ${toStatus} / exchangerId: ${exchangerId}. JWT token might be outdated!`);
        exchangerIds = data.exchangers.map(({ id }) => id);
        exchangerIds.length
            ? console.log(`📘 \u001b[1;34m Changed statuses from ${fromStatus} to ${toStatus} for exhangers: ${exchangerIds}`)
            : console.error(`📙 \u001b[1;33m No exchanger statuses to be changed! `);
    }
    exchangerIds.map(async (exchangerId) => {
        await (0, callStrapi_1.default)(queries_1.updateExchangerStatus, {
            exchangerId,
            status: toStatus,
        });
    });
}
exports.default = statusChange;
