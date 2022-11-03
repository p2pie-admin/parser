"use strict";
// import db from "./db";
// import initialLoader from "./initialLoader";
// import getAllRates from "./rates/getAllRates";
// import { Exchanger } from "./types/exchanger";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
function handleWebhookPayload({ model }) {
    return __awaiter(this, void 0, void 0, function* () {
        if (model === "parser_setting" ||
            model === "exchanger"
        //entity_triggered === "exchanger"
        ) {
            // const exchangers = db.getData(".exchangers") as {[key: string]: Exchanger}
            // // останавливаем все опросники
            // db.push(".exchangers", Object.entries(exchangers).reduce((res: {[key: string]: Exchanger}, [exchangerId, exchangerData]) => ({...res, [exchangerId]:  {...exchangerData, stopInterval: true}}), {}))
            // // запускаем заново
            //await initialLoader();
            // getAllRates()
        }
    });
}
exports.default = handleWebhookPayload;
