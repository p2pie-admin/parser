// import db from "./db";
// import initialLoader from "./initialLoader";
// import getAllRates from "./rates/getAllRates";
// import { Exchanger } from "./types/exchanger";

async function handleWebhookPayload({ model }: any) {
  if (
    model === "parser_setting" ||
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
}

export default handleWebhookPayload;
