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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const callStrapi_1 = __importDefault(require("./gql/callStrapi"));
const queries_1 = require("./gql/queries");
function statusChange(fromStatus, toStatus, exchangerId) {
    return __awaiter(this, void 0, void 0, function* () {
        let exchangerIds = [];
        if (exchangerId) {
            exchangerIds = [exchangerId];
            console.log(`📘 \u001b[1;34m ${exchangerId} wants to be active again`);
        }
        else {
            // апдейтим всех
            const data = yield (0, callStrapi_1.default)(queries_1.getAllExchangerIds, {
                status: fromStatus,
            });
            !data &&
                console.error(`📙 \u001b[1;33m No exchangers received! fromStatus: ${fromStatus} / toStatus: ${toStatus} / exchangerId: ${exchangerId}. JWT token might be outdated!`);
            exchangerIds = data.exchangers.map(({ id }) => id);
            exchangerIds.length
                ? console.log(`📘 \u001b[1;34m Changed statuses from ${fromStatus} to ${toStatus} for exhangers: ${exchangerIds}`)
                : console.error(`📙 \u001b[1;33m No exchanger statuses to be changed! `);
        }
        exchangerIds.map((exchangerId) => __awaiter(this, void 0, void 0, function* () {
            return yield (0, callStrapi_1.default)(queries_1.updateExchangerStatus, {
                exchangerId,
                status: toStatus,
            });
        }));
    });
}
exports.default = statusChange;
