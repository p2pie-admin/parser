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
const callStrapi_1 = __importDefault(require("./callStrapi"));
const queries_1 = require("./queries");
const exchangerLinks_json_1 = __importDefault(require("../dbRates/exchangerLinks.json"));
// чтобы не создавать обменники вручную, данная функция заполняет их сама из exchangerLinks.json
function createExchangers() {
    return __awaiter(this, void 0, void 0, function* () {
        Object.entries(exchangerLinks_json_1.default).map(([name, rates_link]) => __awaiter(this, void 0, void 0, function* () {
            yield (0, callStrapi_1.default)(queries_1.CreateExchangersMutation, {
                name,
                rates_link,
                status: "active",
            });
        }));
    });
}
exports.default = createExchangers;
