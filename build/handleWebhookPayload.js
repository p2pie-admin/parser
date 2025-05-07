"use strict";
// import db from "./db";
// import reload from "./reload";
// import getAllRates from "./rates/getAllRates";
// import { Exchanger } from "./types/exchanger";
Object.defineProperty(exports, "__esModule", { value: true });
async function handleWebhookPayload({ model }) {
    if (model === "parser_setting" ||
        model === "exchanger"
    //entity_triggered === "exchanger"
    ) {
        // const exchangers = await db.getData(".exchangers") as {[key: string]: Exchanger}
        // // останавливаем все опросники
        // await db.push(".exchangers", Object.entries(exchangers).reduce((res: {[key: string]: Exchanger}, [exchangerId, exchangerData]) => ({...res, [exchangerId]:  {...exchangerData, stopInterval: true}}), {}))
        // // запускаем заново
        //await reload();
        // getAllRates()
    }
}
exports.default = handleWebhookPayload;
