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
const callStrapi_1 = __importDefault(require("../../gql/callStrapi"));
const addP2PDirs_1 = __importDefault(require("./addP2PDirs"));
const queries_1 = require("./queries");
const dbRates_1 = __importDefault(require("../../dbRates"));
const addP2PRates = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield (0, callStrapi_1.default)(queries_1.ordersQuery);
    const orders = data === null || data === void 0 ? void 0 : data.p2Ps;
    dbRates_1.default.push(".allDirsP2P", {}); // чистим, затем заполняем с нуля
    if (orders && orders.length) {
        orders.map((order) => (0, addP2PDirs_1.default)(order));
        //dbRates.save();
        console.log("📗 \u001b[1;32m Added P2P rates");
        return;
    }
    console.log("📕 \u001b[1;31m Failed to load or no active orders");
});
exports.default = addP2PRates;
